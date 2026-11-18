import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Loader2, Server, AlertCircle } from 'lucide-react';
import { getConsentChallenge, submitConsent } from '../api/auth.api';
import type { ConsentChallenge } from '../api/auth.api';

const SCOPE_LABELS: Record<string, { label: string; description: string; danger?: boolean }> = {
  'memory:read': {
    label: 'Read memories',
    description: 'View all stored memories',
  },
  'memory:write': {
    label: 'Write memories',
    description: 'Create and permanently delete memories',
    danger: true,
  },
};

export function ConsentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const consentId = searchParams.get('consent_id') ?? '';

  const [challenge, setChallenge] = useState<ConsentChallenge | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState<'allow' | 'deny' | null>(null);

  useEffect(() => {
    if (!consentId) {
      setError('Missing consent_id parameter.');
      setPageLoading(false);
      return;
    }
    getConsentChallenge(consentId)
      .then(setChallenge)
      .catch((err: unknown) => {
        const status = (err as { status?: number }).status;
        if (status === 401) {
          navigate(
            `/login?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`,
            { replace: true }
          );
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load consent request.');
        }
      })
      .finally(() => setPageLoading(false));
  }, [consentId, navigate]);

  const handleDecision = async (decision: 'allow' | 'deny') => {
    if (!challenge) return;
    setSubmitting(decision);
    try {
      const { redirectTo } = await submitConsent(consentId, decision, challenge.csrf);
      window.location.href = redirectTo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit consent.');
      setSubmitting(null);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-sky-950">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-sky-950 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-2xl sm:p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Request Error</h2>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!challenge) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-sky-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 shadow-lg mb-3">
            <Server className="w-7 h-7 text-white" />
          </div>
          <p className="text-gray-400 text-sm">
            Signed in as{' '}
            <span className="text-white font-medium">{challenge.user.username}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-5 h-5 text-sky-600" />
              <h1 className="text-lg font-bold text-gray-900">Authorization Request</h1>
            </div>
            <p className="text-gray-600 text-sm">
              <span className="font-semibold text-gray-900">{challenge.clientName}</span>
              {' '}is requesting access to your MCP Memory Server.
            </p>
          </div>

          {/* Requested Scopes */}
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Requested Permissions
            </h2>
            <div className="space-y-2">
              {challenge.scope.map((scope) => {
                const info = SCOPE_LABELS[scope] ?? { label: scope, description: '' };
                return (
                  <div
                    key={scope}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      info.danger ? 'bg-orange-50' : 'bg-gray-50'
                    }`}
                  >
                    <CheckCircle
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        info.danger ? 'text-orange-500' : 'text-green-500'
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{info.label}</div>
                      <div className="text-xs text-gray-500">{info.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resource */}
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-4 sm:px-6">
            <p className="text-xs text-gray-500">
              Resource:{' '}
              <code className="text-xs font-mono text-gray-700 bg-gray-200 px-1 rounded">
                <span className="break-all">{challenge.resource}</span>
              </code>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 p-4 sm:flex-row sm:p-6">
            <button
              onClick={() => handleDecision('deny')}
              disabled={submitting !== null}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {submitting === 'deny' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Deny
            </button>
            <button
              onClick={() => handleDecision('allow')}
              disabled={submitting !== null}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {submitting === 'allow' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Allow Access
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          Only allow if you trust this application.
        </p>
      </div>
    </div>
  );
}
