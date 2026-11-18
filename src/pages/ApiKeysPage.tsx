import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Key, Trash2, Copy, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { getApiKeys, createApiKey, revokeApiKey } from '../api/admin.api';
import type { ApiKey, CreateApiKeyResponse } from '../api/admin.api';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../components/Notification';

function KeyRevealModal({
  keyData,
  onClose,
}: {
  keyData: CreateApiKeyResponse;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(keyData.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">API Key Created</h3>
            <p className="text-xs text-gray-500">"{keyData.name}"</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-amber-800 font-medium">
            ⚠ Copy this key now. It cannot be shown again.
          </p>
        </div>

        <div className="relative mb-4">
          <input
            type={show ? 'text' : 'password'}
            value={keyData.key}
            readOnly
            className="w-full font-mono text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 pr-20 select-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button
              onClick={() => setShow(!show)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
            >
              {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={copy}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
            >
              {copied ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-5 space-y-1">
          <div>
            Scopes: <span className="font-mono">{keyData.scopes.join(', ')}</span>
          </div>
          {keyData.expiresAt && (
            <div>Expires: {new Date(keyData.expiresAt).toLocaleDateString()}</div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          I've copied the key — close
        </button>
      </div>
    </div>
  );
}

export function ApiKeysPage() {
  const { csrf } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<CreateApiKeyResponse | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [form, setForm] = useState({
    name: '',
    scopes: { read: true, write: false },
    expiresInDays: '',
  });

  const fetchKeys = useCallback(async () => {
    if (!csrf) return;
    setLoading(true);
    try {
      setKeys(await getApiKeys(csrf));
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load API keys.',
      });
    } finally {
      setLoading(false);
    }
  }, [csrf]);

  useEffect(() => {
    if (csrf) fetchKeys();
  }, [csrf, fetchKeys]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csrf) return;
    setCreating(true);
    try {
      const scopes: ('memory:read' | 'memory:write')[] = [];
      if (form.scopes.read) scopes.push('memory:read');
      if (form.scopes.write) scopes.push('memory:write');
      if (!scopes.length) {
        setNotification({ type: 'error', message: 'Select at least one scope.' });
        setCreating(false);
        return;
      }
      const created = await createApiKey(
        {
          name: form.name,
          scopes,
          expiresInDays: form.expiresInDays ? parseInt(form.expiresInDays, 10) : null,
        },
        csrf
      );
      setNewKey(created);
      setShowCreate(false);
      setForm({ name: '', scopes: { read: true, write: false }, expiresInDays: '' });
      await fetchKeys();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to create key.',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!csrf || !window.confirm(`Revoke key "${name}"? This cannot be undone.`)) return;
    try {
      await revokeApiKey(id, csrf);
      setNotification({ type: 'success', message: `Key "${name}" revoked.` });
      await fetchKeys();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to revoke key.',
      });
    }
  };

  const now = new Date();
  const activeKeys = keys.filter(
    (k) => k.revokedAt === null && (!k.expiresAt || new Date(k.expiresAt) > now)
  );
  const inactiveKeys = keys.filter((k) => !activeKeys.includes(k));

  return (
    <div className="w-full max-w-4xl">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      {newKey && <KeyRevealModal keyData={newKey} onClose={() => setNewKey(null)} />}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-500 text-sm mt-1">Manage MCP client credentials</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Create Key
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">New API Key</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Key Name</label>
              <input
                type="text"
                required
                maxLength={80}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Claude Desktop, Cursor, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.scopes.read}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, scopes: { ...f.scopes, read: e.target.checked } }))
                    }
                    className="rounded"
                  />
                  memory:read
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.scopes.write}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, scopes: { ...f.scopes, write: e.target.checked } }))
                    }
                    className="rounded"
                  />
                  memory:write
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Expiry (days, optional)
              </label>
              <input
                type="number"
                min={1}
                max={3650}
                value={form.expiresInDays}
                onChange={(e) => setForm((f) => ({ ...f, expiresInDays: e.target.value }))}
                className="w-32 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="30"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Generate
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          Loading…
        </div>
      ) : (
        <>
          {/* Active Keys */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-green-600" />
              <h2 className="text-sm font-semibold text-gray-900">
                Active Keys ({activeKeys.length})
              </h2>
            </div>
            {activeKeys.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                No active API keys. Create one above.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activeKeys.map((key) => (
                  <div key={key.id} className="flex flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">{key.name}</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {key.scopes.map((s) => (
                          <span
                            key={s}
                            className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                          >
                            {s}
                          </span>
                        ))}
                        {key.expiresAt && (
                          <span className="text-xs text-gray-400">
                            Expires {new Date(key.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevoke(key.id, key.name)}
                      className="flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors sm:ml-4 sm:min-h-0 sm:py-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inactive Keys */}
          {inactiveKeys.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden opacity-60">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-500">
                  Revoked / Expired ({inactiveKeys.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {inactiveKeys.map((key) => (
                  <div key={key.id} className="flex items-center px-4 py-3.5 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-500 truncate line-through">{key.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {key.revokedAt
                          ? `Revoked ${new Date(key.revokedAt).toLocaleDateString()}`
                          : `Expired ${key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : ''}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
