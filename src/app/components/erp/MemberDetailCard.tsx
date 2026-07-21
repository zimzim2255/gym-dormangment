import { useState, useEffect } from "react";
import { User, Phone, CreditCard, Calendar, Mail, MapPin, AlertTriangle, Users, Package, Clock, CheckCircle, XCircle, TrendingUp, DollarSign } from "lucide-react";

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";

async function api(type: string, data?: any) {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/member-manager`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ type, ...data }),
    });
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

async function subApi(type: string, data?: any) {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/subscription-manager`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ type, ...data }),
    });
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

interface MemberDetailCardProps {
  member: any;
  onClose: () => void;
}

export default function MemberDetailCard({ member, onClose }: MemberDetailCardProps) {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"info" | "abos" | "acces">("info");

  useEffect(() => {
    (async () => {
      const [subData, histData] = await Promise.all([
        subApi("list"),
        api("subscription-history", { member_id: member.id }),
      ]);
      // Filter subscriptions for this member
      const memberSubs = (subData?.subscriptions || []).filter((s: any) => s.member === member.name || s.member_id === member.id);
      setSubscriptions(memberSubs);
      setHistory(histData?.history || []);
      setLoading(false);
    })();
  }, [member.id, member.name]);

  const activeSub = subscriptions.find((s: any) => s.status === "Payé" || s.status === "Paiement partiel");
  const totalPaid = subscriptions.reduce((s: number, sub: any) => s + (sub.paid || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#1A1D2E] border border-white/10 rounded-xl w-full max-w-5xl max-h-[95vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {member.photo ? (
              <img src={member.photo} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#f04e23]/20 flex items-center justify-center text-sm font-bold text-[#f04e23]">{member.name?.charAt(0)}</div>
            )}
            <div>
              <h3 className="font-semibold text-white text-lg">{member.name}</h3>
              <span className="text-xs text-white/30 font-mono">{member.id}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-lg cursor-pointer">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {[
            { id: "info", label: "Infos", icon: User },
            { id: "abos", label: "Abonnements", icon: Calendar, count: subscriptions.length },
            { id: "acces", label: "Accès", icon: Clock },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${tab === t.id ? "text-[#f04e23] border-b-2 border-[#f04e23]" : "text-white/40 hover:text-white/70"}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count !== undefined && <span className="text-xs text-white/30 font-mono">({t.count})</span>}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-130px)]">
          {/* TAB: Info */}
          {tab === "info" && (
            <div className="p-6">
              <table className="w-full">
                <tbody>
                  <TableRow label="Nom complet" value={member.name} />
                  <TableRow label="CIN" value={member.cin || "—"} />
                  <TableRow label="Téléphone" value={member.phone || "—"} />
                  <TableRow label="Email" value={member.email || "—"} />
                  <TableRow label="Adresse" value={member.address || "—"} />
                  <TableRow label="Sexe" value={member.gender || "—"} />
                  <TableRow label="Date naissance" value={member.dob || "—"} />
                  <TableRow label="Inscription" value={member.joined || "—"} />
                  <TableRow label="Contact urgence" value={member.emergencyContact || "—"} />
                  <TableRow label="Tél. urgence" value={member.emergencyPhone || "—"} />
                </tbody>
              </table>

              <div className="flex items-center gap-8 mt-6 pt-5 border-t border-white/5">
                <StatInline value={subscriptions.length} label="Abonnements" color="emerald" />
                <StatInline value={`${totalPaid} DH`} label="Total payé" color="blue" />
                <StatInline value={activeSub ? "Actif" : "Inactif"} label="Statut" color={activeSub ? "emerald" : "red"} />
              </div>
            </div>
          )}

          {/* TAB: Abonnements */}
          {tab === "abos" && (
            <div className="p-6">
              {loading ? (
                <div className="text-center text-white/20 text-sm py-10">Chargement...</div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center text-white/20 text-sm py-10">Aucun abonnement</div>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((s, i) => (
                    <div key={i} className="bg-white/3 border border-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#f04e23]">{s.id || `#${i + 1}`}</span>
                          <span className="px-2 py-0.5 rounded bg-[#f04e23]/10 text-[#f04e23] text-xs font-medium">{s.type || s.sub_type}</span>
                        </div>
                        <Badge2 status={s.status || s.sub_status} />
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div><span className="text-white/30">Du:</span> <span className="text-white">{s.start || s.sub_start}</span></div>
                        <div><span className="text-white/30">Au:</span> <span className="text-white">{s.end || s.sub_end}</span></div>
                        <div><span className="text-white/30">Payé:</span> <span className="text-emerald-400 font-mono">{s.paid} DH</span></div>
                        <div><span className="text-white/30">Reste:</span> <span className="text-red-400 font-mono">{s.remaining > 0 ? `${s.remaining} DH` : "0 DH"}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subscription History */}
              {history.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/5">
                  <h4 className="text-sm font-semibold text-white mb-3">Historique des abonnements</h4>
                  <div className="space-y-2">
                    {history.map((h: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-white/3 rounded-lg px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white/30 font-mono">{h.sub_start} → {h.sub_end}</span>
                          <span className="text-xs text-white/60">{h.sub_type}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="text-emerald-400">{h.paid} DH</span>
                          <Badge2 status={h.sub_status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Accès */}
          {tab === "acces" && (
            <div className="p-6">
              {loading ? (
                <div className="text-center text-white/20 text-sm py-10">Chargement...</div>
              ) : (
                <div className="text-center text-white/20 text-sm py-10">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Historique des accès disponible via la page Historique accès
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-white/5">
      <td className="py-3 w-44 text-xs text-white/30 font-medium align-top">{label}</td>
      <td className="py-3 text-sm text-white">{value}</td>
    </tr>
  );
}

function StatInline({ value, label, color }: { value: string | number; label: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    red: "text-red-400",
  };
  return (
    <div>
      <div className={`text-lg font-bold font-mono ${colors[color] || colors.emerald}`}>{value}</div>
      <div className="text-xs text-white/30 mt-0.5">{label}</div>
    </div>
  );
}

function Badge2({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Payé": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    "Paiement partiel": "bg-amber-500/15 text-amber-400 border-amber-500/20",
    "Non payé": "bg-red-500/15 text-red-400 border-red-500/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${styles[status] || "bg-white/5 text-white/50"}`}>{status}</span>
  );
}