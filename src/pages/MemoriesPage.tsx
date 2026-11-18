import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Trash2,
  Database,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { getMemories, deleteMemory } from '../api/admin.api';
import type { Memory } from '../api/admin.api';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../components/Notification';

export function MemoriesPage() {
  const { csrf } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchMemories = useCallback(async () => {
    if (!csrf) return;
    setLoading(true);
    try {
      const data = await getMemories(
        { page, limit, search: debouncedSearch || undefined },
        csrf
      );
      setMemories(data.memories);
      setTotal(data.total);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load memories.',
      });
    } finally {
      setLoading(false);
    }
  }, [csrf, page, debouncedSearch]);

  useEffect(() => {
    if (csrf) fetchMemories();
  }, [csrf, fetchMemories]);

  const handleDelete = async (id: string) => {
    if (!csrf || !window.confirm('Delete this memory? This cannot be undone.')) return;
    try {
      await deleteMemory(id, csrf);
      setNotification({ type: 'success', message: 'Memory deleted.' });
      await fetchMemories();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete memory.',
      });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="w-full max-w-4xl">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Memories</h1>
          <p className="text-gray-500 text-sm mt-1">{total} memories stored</p>
        </div>
        <button
          onClick={fetchMemories}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors sm:w-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          placeholder="Search memory content…"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
          </div>
        ) : memories.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {search ? 'No memories match your search.' : 'No memories stored yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="group flex items-start gap-3 px-4 py-4 hover:bg-gray-50 sm:gap-4 sm:px-5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                    {memory.content}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs font-mono text-gray-400">
                      {memory.id.slice(0, 8)}…
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(memory.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(memory.id)}
                  className="shrink-0 rounded-lg p-2 text-red-500 opacity-100 hover:bg-red-50 transition-all sm:p-1.5 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3.5 sm:px-5">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="min-h-10 min-w-10 rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="min-h-10 min-w-10 rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
