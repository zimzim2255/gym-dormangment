// ═══════════════════════════════════════════════════════════════════════════════
//  SenseFace 3A/3B Access Control Dashboard
//  ───────────────────────────────────────────────────────────────────────────────
//  Live dashboard - read only. The SenseFace terminal handles scanning
//  automatically via the zkteco-webhook edge function.
//  This shows real-time logs and stats from Supabase.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Clock, Users, CheckCircle, XCircle, AlertTriangle,
  Wifi, WifiOff, RefreshCw, Activity,
} from "lucide-react";
import { getDoorStats, getAccessLogs, getTerminals } from "../../services/doorService";

const STATUS_STYLES: Record<string, string> = {
  "Autorisé": "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  "Expiré": "bg-red-500/15 text-red-400 border border-red-500/20",
  "Paiement restant": "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  "Refusé": "bg-red-500/15 text-red-400 border border-red-500/20",
};

function Badge({ s }: { s: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium font-mono ${STATUS_STYLES[s] ?? "bg-white/5 text-white/50 border border-white/10"}`}>
      {s}
    </span>
  );
}

export default function AccessControlPanel() {
  const [stats, setStats] = useState({ totalToday: 0, authorizedToday: 0, deniedToday: 0, pendingPaymentsToday: 0, activeTerminals: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    const [statsData, logsData, terminalsData] = await Promise.all([
      getDoorStats(),
      getAccessLogs({ limit: 50 }),
      getTerminals(),
    ]);
    if (statsData.stats) setStats(statsData.stats);
    if (logsData.logs) setLogs(logsData.logs);
    if (terminalsData.terminals) setTerminals(terminalsData.terminals);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Contrôle d'accès</h1>
          <p className="text-xs text-white/30 font-mono mt-0.5">
            Surveillance en temps réel — Dernière mise à jour : {lastRefresh.toLocaleTimeString("fr-FR")}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Entrées aujourd'hui", value: stats.totalToday, Icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Autorisées", value: stats.authorizedToday, Icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Refusées", value: stats.deniedToday, Icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
          { label: "Paiements en attente", value: stats.pendingPaymentsToday, Icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Terminaux actifs", value: stats.activeTerminals, Icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-white/5 rounded-lg p-4">
            <div className={`w-8 h-8 rounded-md ${s.bg} flex items-center justify-center mb-3`}>
              <s.Icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="font-mono text-lg font-bold text-white">{s.value}</div>
            <div className="text-xs text-white/35 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Access Logs Table */}
        <div className="lg:col-span-2 bg-card border border-white/5 rounded-lg overflow-x-auto">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/30" />
              <h3 className="font-semibold text-white text-sm">Derniers accès</h3>
            </div>
            <span className="text-xs text-white/25 font-mono">{logs.length} entrées</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Heure</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Membre</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Méthode</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Statut</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Terminal</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 20).map((log: any, i: number) => (
                <tr key={log.id || i} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${i % 2 !== 0 ? "bg-white/[0.01]" : ""}`}>
                  <td className="px-3 py-3 font-mono text-xs text-[#f04e23]">{log.time}</td>
                  <td className="px-3 py-3 text-sm text-white">{log.member_name}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-white/40 font-mono">{log.method}</span>
                  </td>
                  <td className="px-3 py-3"><Badge s={log.status} /></td>
                  <td className="px-3 py-3 text-xs text-white/40 font-mono">{log.device}</td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-white/20 text-sm">
                    Aucun accès enregistré aujourd'hui
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-white/20 text-sm">
                    Chargement...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Terminals Panel */}
        <div className="bg-card border border-white/5 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-white/30" />
            <h3 className="font-semibold text-white text-sm">Terminaux</h3>
          </div>
          <div className="space-y-3">
            {terminals.map((t: any) => (
              <div key={t.terminal_id} className="bg-white/3 rounded-lg p-3.5 flex items-start gap-3">
                {t.is_online ? (
                  <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm">{t.location}</div>
                  <div className="font-mono text-xs text-white/30">{t.terminal_id}</div>
                  <div className="text-xs text-white/25 mt-0.5">{t.model} — {t.ip_address}</div>
                  <div className={`text-xs font-mono mt-1 ${t.is_online ? "text-emerald-400" : "text-red-400"}`}>
                    {t.is_online ? "En ligne" : "Hors ligne"}
                  </div>
                </div>
              </div>
            ))}
            {terminals.length === 0 && !loading && (
              <div className="text-center py-6 text-white/20 text-sm">Aucun terminal configuré</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}