import React, { useEffect, useState } from 'react';
import { Database, Key, Activity, RefreshCw, Server } from 'lucide-react';
import { getStats } from '../api/admin.api';
import type { StatsResponse } from '../api/admin.api';
import { useAuth } from '../context/AuthContext';



function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${color} mb-4`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

export function DashboardPage() {
  const { csrf, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [healthStatus, setHealthStatus] = useState<'ok' | 'error' | 'loading'>('loading');

  const fetchStats = async () => {
    if (!csrf || !isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const data = await getStats(csrf);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats.');
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    setHealthStatus('loading');
    try {
      const res = await fetch('/health');
      setHealthStatus(res.ok ? 'ok' : 'error');
    } catch {
      setHealthStatus('error');
    }
  };

  useEffect(() => {
    if (csrf && isAdmin) {
      fetchStats();
    } else {
      setStats(null);
      setLoading(false);
    }
    checkHealth();
  }, [csrf, isAdmin]);

  const handleRefresh = () => {
    fetchStats();
    checkHealth();
  };

  const mcpEndpoint =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `${import.meta.env.VITE_BACKEND_URL}/mcp`
      : `${window.location.origin}/mcp`;

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">MCP Memory Server overview</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors sm:w-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Health Status */}
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-gray-200 bg-white p-4">
        <Server className="w-5 h-5 text-gray-400" />
        <span className="text-sm text-gray-600 font-medium">Server Status:</span>
        {healthStatus === 'loading' ? (
          <span className="text-sm text-gray-400">Checking…</span>
        ) : healthStatus === 'ok' ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
            <Activity className="w-4 h-4" /> Online
          </span>
        ) : (
          <span className="text-sm font-medium text-red-600">Unreachable</span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {!isAdmin && (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
          Admin statistics and management are available only to administrator accounts.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-gray-200 mb-4" />
              <div className="h-7 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={Database}
              label="Total Memories"
              value={stats.totalMemories}
              color="bg-sky-600"
            />
            <StatCard
              icon={Key}
              label="Active API Keys"
              value={stats.activeApiKeys}
              color="bg-green-600"
            />
            <StatCard
              icon={Activity}
              label="Total API Keys"
              value={stats.totalApiKeys}
              color="bg-purple-600"
            />
          </div>
        )
      )}

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">MCP Endpoint</h2>
        <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 break-all select-all">
          {mcpEndpoint}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Configure your AI client (Claude, Cursor, ChatGPT) to connect to the MCP endpoint above.
        </p>
      </div>
    </div>
  );
}
