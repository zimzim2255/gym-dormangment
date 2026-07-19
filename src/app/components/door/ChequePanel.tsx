// ═══════════════════════════════════════════════════════════════════════════════
//  Chèque Management Panel
//  ───────────────────────────────────────────────────────────────────────────────
//  Manages all cheque payments across the system.
//  Filters: client name, date range, status, execution date
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { DollarSign, Search, RefreshCw, CreditCard, Calendar, User, FileText, CheckCircle, XCircle, Clock } from "lucide-react";

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

const STATUS_STYLES: Record<string, string> = {
  Encaissé: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  En_attente: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  Rejeté: "bg-red-500/15 text-red-400 border border-red-500/20",
};

function Badge({ s }: { s: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium font-mono ${STATUS_STYLES[s] ?? "bg-white/5 text-white/50 border border-white/10"}`}>
      {s}
    </span>
  );
}

export default function ChequePanel() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = useCallback(async () => {
    const txData = await boutiqueApi("caisse-transactions", { limit: 200 });
    if (txData?.transactions) {
      // Filter only cheque transactions
      const cheques = txData.transactions.filter((t: any) => t.payment_method === "Chèque");
      setTransactions(cheques);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Filter logic
  const filtered = transactions.filter((tx: any) => {
    const label = tx.label?.toLowerCase() || "";
    const matchesSearch = label.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    const matchesDateFrom = !dateFrom || (tx.date || "").localeCompare(dateFrom) >= 0;
    const matchesDateTo = !dateTo || (tx.date || "").localeCompare(dateTo) <= 0;
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const totalAmount = filtered.reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
  const pendingCount = filtered.filter((t: any) => t.status === "En_attente" || !t.status).length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Gestion des chèques</h1>
          <p className="text-xs text-white/30 font-mono mt-0.5">Suivi des paiements par chèque</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-sm font-medium transition-all cursor-pointer disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-sm text-white/60">Total chèques</span>
          </div>
          <div className="font-mono text-lg font-bold text-white">{filtered.length}</div>
        </div>
        <div className="bg-card border border-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-sm text-white/60">En attente</span>
          </div>
          <div className="font-mono text-lg font-bold text-amber-400">{pendingCount}</div>
        </div>
        <div className="bg-card border border-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
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
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f04e23]/40"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input
              type="text"
              placeholder="Date début (jj/mm/aaaa)"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f04e23]/40"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input
              type="text"
              placeholder="Date fin (jj/mm/aaaa)"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f04e23]/40"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-[#f04e23]/40"
          >
            <option value="all">Tous les statuts</option>
            <option value="En_attente">En attente</option>
            <option value="Encaissé">Encaissé</option>
            <option value="Rejeté">Rejeté</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Date</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Libellé</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Type</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Montant</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Statut</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-white/20 text-sm">Chargement...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-white/20 text-sm">Aucun chèque trouvé</td>
              </tr>
            ) : filtered.map((tx: any, i: number) => (
              <tr key={tx.id || i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                <td className="px-3 py-3 font-mono text-xs text-white/50">{tx.date}</td>
                <td className="px-3 py-3 text-sm text-white">{tx.label}</td>
                <td className="px-3 py-3">
                  <span className="text-xs text-white/40 font-mono">{tx.type}</span>
                </td>
                <td className={`px-3 py-3 font-mono text-sm font-bold ${tx.amount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} DH
                </td>
                <td className="px-3 py-3"><Badge s={tx.status || "En_attente"} /></td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded hover:bg-emerald-500/10 text-white/30 hover:text-emerald-400 transition-colors" title="Marquer encaissé">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors" title="Marquer rejeté">
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