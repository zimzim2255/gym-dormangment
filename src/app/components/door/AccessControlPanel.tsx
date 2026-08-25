// ═══════════════════════════════════════════════════════════════════════════════
//  SenseFace 3A/3B Access Control Dashboard
//  ───────────────────────────────────────────────────────────────────────────────
//  Live dashboard showing:
//  1. Latest scan result (from access_logs)
//  2. Today's stats (from Supabase)
//  3. Recent access logs
//  4. Terminal online/offline status
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Clock, Users, CheckCircle, XCircle, AlertTriangle,
  Wifi, WifiOff, RefreshCw, Activity, Fingerprint, Scan, QrCode, Smartphone,
  Phone, CreditCard, Calendar, Mail, User as UserIcon, Wallet,
} from "lucide-react";
import { getDoorStats, getAccessLogs, getTerminals, getLatestScan } from "../../services/doorService";

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

function AuthIcon({ method }: { method: string }) {
  switch (method) {
    case "face": return <Scan className="w-4 h-4" />;
    case "fingerprint": return <Fingerprint className="w-4 h-4" />;
    case "rfid": return <Wifi className="w-4 h-4" />;
    case "qr": return <QrCode className="w-4 h-4" />;
    default: return <Smartphone className="w-4 h-4" />;
  }
}

export default function AccessControlPanel() {
  const [stats, setStats] = useState({ totalToday: 0, authorizedToday: 0, deniedToday: 0, pendingPaymentsToday: 0, activeTerminals: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    const [statsData, logsData, terminalsData, scanData] = await Promise.all([
      getDoorStats(),
      getAccessLogs({ limit: 50 }),
      getTerminals(),
      getLatestScan(),
    ]);
    if (statsData.stats) setStats(statsData.stats);
    if (logsData.logs) setLogs(logsData.logs);
    if (terminalsData.terminals) setTerminals(terminalsData.terminals);
    if (scanData.scan) setScan(scanData.scan);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  // Latest scan result (enriched via get-latest-scan, fallback to logs[0])
  const latest = scan?.log ?? logs[0];
  const member = scan?.member ?? null;
  const subscription = scan?.subscription ?? null;
  const sessionMsg = scan?.session?.decision_message ?? null;

  const statusColor = (s?: string) =>
    s === "Autorisé" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
    : s === "Paiement restant" ? "border-amber-500 bg-amber-500/10 text-amber-400"
    : "border-red-500 bg-red-500/10 text-red-400";
  const statusIcon = (s?: string) =>
    s === "Autorisé" ? <CheckCircle className="w-6 h-6" />
    : s === "Paiement restant" ? <AlertTriangle className="w-6 h-6" />
    : <XCircle className="w-6 h-6" />;
  const statusLabel = (s?: string) =>
    s === "Autorisé" ? "ACCÈS AUTORISÉ"
    : s === "Paiement restant" ? "Paiement requis"
    : "ACCÈS REFUSÉ";
  const paidPct = subscription && subscription.price > 0
    ? Math.min(100, Math.round((subscription.paid / subscription.price) * 100))
    : 0;

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
        {/* Latest Scan Result */}
        <div className="bg-card border border-white/5 rounded-lg p-6 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-white/30" />
              <h3 className="font-semibold text-white text-sm">Dernier scan</h3>
            </div>
            <span className="text-xs text-white/25 font-mono">
              {latest ? `${latest.date ?? ""} · ${latest.time ?? ""}` : "—"}
            </span>
          </div>

          {latest ? (
            <div className="flex-1 flex flex-col gap-6">
              {/* 1. DECISION */}
              <div className={`rounded-xl border px-5 py-4 flex items-center gap-4 ${statusColor(latest.status)}`}>
                {statusIcon(latest.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold tracking-wide">{statusLabel(latest.status)}</div>
                  {sessionMsg && (
                    <div className="text-xs opacity-90 mt-1 leading-relaxed">{sessionMsg}</div>
                  )}
                </div>
                <Badge s={latest.status} />
              </div>

              {/* 2. MEMBRE */}
              <div className="bg-white/[0.03] rounded-xl p-5 space-y-4">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                  Membre
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-[#0a0d14]">
                    {member?.photo ? (
                      <img
                        src={member.photo}
                        alt={member?.name || "avatar"}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-xl font-bold ${
                        latest.status === "Autorisé" ? "text-emerald-400"
                        : latest.status === "Paiement restant" ? "text-amber-400"
                        : "text-red-400"
                      }`}>
                        {(member?.name || latest.member_name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold text-white truncate">
                      {member?.name || latest.member_name || "Membre inconnu"}
                    </div>
                    <div className="text-xs text-white/35 font-mono">{latest.member_id}</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  {member?.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40 flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Téléphone</span>
                      <span className="text-sm text-white/90 font-mono">{member.phone}</span>
                    </div>
                  )}
                  {member?.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</span>
                      <span className="text-sm text-white/90 font-mono truncate ml-4">{member.email}</span>
                    </div>
                  )}
                  {member?.cin && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40 flex items-center gap-2"><UserIcon className="w-3.5 h-3.5" /> CIN</span>
                      <span className="text-sm text-white/90 font-mono">{member.cin}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. ABONNEMENT */}
              <div className="bg-white/[0.03] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                    Abonnement
                  </div>
                  {subscription && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                      subscription.sub_status === "Payé"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : subscription.sub_status === "Paiement partiel"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {subscription.sub_status}
                    </span>
                  )}
                </div>

                {subscription ? (
                  <>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40">Type</span>
                        <span className="text-sm text-white/90">{subscription.sub_type || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40">Période</span>
                        <span className="text-sm text-white/90 font-mono">{subscription.sub_start} → {subscription.sub_end}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40">Prix</span>
                        <span className="text-sm text-white/90 font-mono font-semibold">{subscription.price} DH</span>
                      </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40">Payé</span>
                        <span className="text-sm text-emerald-400 font-mono font-semibold">{subscription.paid} DH</span>
                      </div>
                      {Number(subscription.remaining) > 0 && (
                        <div className="flex items-center justify-between bg-red-500/10 rounded-lg px-3 py-2">
                          <span className="text-xs text-red-300 font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> Reste à payer
                          </span>
                          <span className="text-sm text-red-400 font-mono font-bold">{subscription.remaining} DH</span>
                        </div>
                      )}
                    </div>

                    {/* Payment progress bar */}
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${paidPct >= 100 ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${Math.max(4, paidPct)}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-white/25 font-mono">Aucun abonnement</div>
                )}
              </div>

              {/* 4. FOOTER */}
              <div className="flex items-center justify-between text-[11px] text-white/35 font-mono pt-1">
                <span className="flex items-center gap-1.5">
                  <AuthIcon method={latest.method} /> {latest.method}
                </span>
                <span className="truncate ml-3">{latest.device}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-white/15">
              <Fingerprint className="w-10 h-10" />
              <span className="text-xs font-mono">En attente</span>
              <span className="text-[10px] text-white/10">Aucun scan récent</span>
            </div>
          )}
        </div>

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
              {logs.slice(0, 15).map((log: any, i: number) => (
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
      </div>

      {/* Terminals Panel */}
      <div className="bg-card border border-white/5 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-white/30" />
          <h3 className="font-semibold text-white text-sm">Terminaux</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <div className="col-span-full text-center py-6 text-white/20 text-sm">Aucun terminal configuré</div>
          )}
        </div>
      </div>
    </div>
  );
}