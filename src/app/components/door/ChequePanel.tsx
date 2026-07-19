// ═══════════════════════════════════════════════════════════════════════════════
//  Chèque Management Panel
//  ───────────────────────────────────────────────────────────────────────────────
//  Manages all cheque payments from the cheques table.
//  Features: Add, search, date range, status filter, photo view
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { DollarSign, Search, RefreshCw, CreditCard, Calendar, User, Plus, Eye, CheckCircle, XCircle, Clock, Image } from "lucide-react";
import ChequeAddCard from "./ChequeAddCard";

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";

async function boutiqueApi(type: string, data?: any) {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/boutique-manager`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ type, ...data }),
    });
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

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

const STATUS_STYLES: Record<string, string> = {
  Encaissé: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  En_attente: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  Partiel: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  Rejeté: "bg-red-500/15 text-red-400 border border-red-500/20",
};

function Badge({ s }: { s: string }) { return (
  <span className={`px-2 py-0.5 rounded text-xs font-medium font-mono ${STATUS_STYLES[s] ?? "bg-white/5 text-white/50 border border-white/10"}`}>{s}</span>
); }

export default function ChequePanel() {
  const [cheques, setCheques] = useState<any[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    chequeId: "", memberId: "", memberName: "", giver: "", amount: 0,
    dateEmission: "", dateEcheance: "", dateExecution: "", photo: "", status: "En_attente",
  });

  const fetchData = useCallback(async () => {
    const [chequeData, memberData] = await Promise.all([
      boutiqueApi("cheque-list"),
      api("list"),
    ]);
    if (chequeData?.cheques) setCheques(chequeData.cheques);
    if (memberData?.members) setMembers(memberData.members.map((m: any) => ({ id: m.id, name: m.name })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, [fetchData]);

  const handleCreate = async () => {
    const r = await boutiqueApi("cheque-create", form);
    if (r?.cheque) setCheques([r.cheque, ...cheques]);
    setForm({ chequeId: "", memberId: "", memberName: "", giver: "", amount: 0, dateEmission: "", dateEcheance: "", dateExecution: "", photo: "", status: "En_attente" });
    setShowAdd(false);
  };

  const filtered = cheques.filter((c: any) => {
    const label = `${c.member_name || ""} ${c.giver || ""} ${c.cheque_id || ""}`.toLowerCase();
    const matchesSearch = label.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesFrom = !dateFrom || (c.date_emission || "").localeCompare(dateFrom) >= 0;
    const matchesTo = !dateTo || (c.date_emission || "").localeCompare(dateTo) <= 0;
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  const totalAmount = filtered.reduce((s: number, c: any) => s + (c.amount || 0), 0);
  const pendingCount = filtered.filter((c: any) => c.status === "En_attente").length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Gestion des chèques</h1>
          <p className="text-xs text-white/30 font-mono mt-0.5">Suivi des paiements par chèque</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-sm font-medium transition-all cursor-pointer disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#f04e23] hover:bg-[#d94118] text-white text-sm font-medium transition-all cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Nouveau chèque
          </button>
        </div>
      </div>

      {showAdd && (
        <ChequeAddCard
          form={form} setForm={setForm}
          onClose={() => setShowAdd(false)}
          onSave={handleCreate}
          members={members}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center"><CreditCard className="w-4 h-4 text-blue-400" /></div>
            <span className="text-sm text-white/60">Total chèques</span>
          </div>
          <div className="font-mono text-lg font-bold text-white">{filtered.length}</div>
        </div>
        <div className="bg-card border border-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center"><Clock className="w-4 h-4 text-amber-400" /></div>
            <span className="text-sm text-white/60">En attente</span>
          </div>
          <div className="font-mono text-lg font-bold text-amber-400">{pendingCount}</div>
        </div>
        <div className="bg-card border border-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center"><DollarSign className="w-4 h-4 text-emerald-400" /></div>
            <span className="text-sm text-white/60">Montant total</span>
          </div>
          <div className="font-mono text-lg font-bold text-emerald-400">{totalAmount.toLocaleString()} DH</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-white/5 rounded-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f04e23]/40" />
          </div>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input type="text" placeholder="Date début" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f04e23]/40" />
          </div>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input type="text" placeholder="Date fin" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f04e23]/40" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-[#f04e23]/40">
            <option value="all">Tous</option>
            <option value="En_attente">En attente</option>
            <option value="Encaissé">Encaissé</option>
            <option value="Partiel">Partiel</option>
            <option value="Rejeté">Rejeté</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">N° Chèque</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Client</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Donneur</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Montant</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Utilisé</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Reste</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Date éch.</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Date exéc.</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Statut</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Photo</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="px-3 py-10 text-center text-white/20 text-sm">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={12} className="px-3 py-10 text-center text-white/20 text-sm">Aucun chèque trouvé</td></tr>
            ) : filtered.map((c: any, i: number) => (
              <tr key={c.id || i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                <td className="px-3 py-3 font-mono text-xs text-[#f04e23]">{c.cheque_id}</td>
                <td className="px-3 py-3 text-sm text-white">{c.member_name}</td>
                <td className="px-3 py-3 text-sm text-white/60">{c.giver}</td>
                <td className="px-3 py-3 font-mono text-sm font-bold text-white">{c.amount?.toLocaleString()} DH</td>
                <td className="px-3 py-3 font-mono text-sm text-emerald-400">{c.used_amount?.toLocaleString()} DH</td>
                <td className="px-3 py-3 font-mono text-sm text-amber-400">{c.remaining?.toLocaleString()} DH</td>
                <td className="px-3 py-3 font-mono text-xs text-white/50">{c.date_echeance}</td>
                <td className="px-3 py-3 font-mono text-xs text-white/50">{c.date_execution || "—"}</td>
                <td className="px-3 py-3"><Badge s={c.status} /></td>
                <td className="px-3 py-3">
                  {c.photo ? (
                    <a href={c.photo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                      <Image className="w-3.5 h-3.5" /> Voir
                    </a>
                  ) : <span className="text-xs text-white/20">—</span>}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded hover:bg-emerald-500/10 text-white/30 hover:text-emerald-400" title="Encaisser">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-red-500/10 text-white/30 hover:text-red-400" title="Rejeter">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}