// ═══════════════════════════════════════════════════════════════════════════════
//  Caisse (Cash Register) Panel
//  ───────────────────────────────────────────────────────────────────────────────
//  Shows current cash amount and transaction history.
//  Auto-updates from: ventes (+), abonnements (+), achats (-), dépenses (-)
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

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

const TYPE_LABELS: Record<string, { label: string; color: string; Icon: any }> = {
  vente: { label: "Vente", color: "text-emerald-400", Icon: TrendingUp },
  abonnement: { label: "Abonnement", color: "text-emerald-400", Icon: TrendingUp },
  achat: { label: "Achat", color: "text-red-400", Icon: TrendingDown },
  depense: { label: "Dépense", color: "text-red-400", Icon: TrendingDown },
  approvisionnement: { label: "Approvisionnement", color: "text-blue-400", Icon: TrendingUp },
};

export default function CaissePanel() {
  const [caisse, setCaisse] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [caisseData, txData] = await Promise.all([
      boutiqueApi("caisse-get"),
      boutiqueApi("caisse-transactions", { limit: 50 }),
    ]);
    if (caisseData?.caisse !== undefined) setCaisse(caisseData.caisse);
    if (txData?.transactions) setTransactions(txData.transactions);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const income = transactions.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
  const expenses = transactions.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + Math.abs(t.amount), 0);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Caisse</h1>
          <p className="text-xs text-white/30 font-mono mt-0.5">Gestion de la trésorerie</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-sm font-medium transition-all cursor-pointer disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Main Balance Card */}
      <div className="bg-gradient-to-br from-[#f04e23]/20 to-[#f04e23]/5 border border-[#f04e23]/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#f04e23]/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#f04e23]" />
          </div>
          <div>
            <div className="text-sm text-white/50">Solde actuel</div>
            <div className="text-3xl font-bold text-white font-mono">{caisse.toLocaleString()} DH</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-white/30">Entrées</div>
              <div className="font-mono text-sm font-bold text-emerald-400">+{income.toLocaleString()} DH</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <div className="text-xs text-white/30">Sorties</div>
              <div className="font-mono text-sm font-bold text-red-400">-{expenses.toLocaleString()} DH</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-card border border-white/5 rounded-lg">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-white/30" />
            <h3 className="font-semibold text-white text-sm">Historique des transactions</h3>
          </div>
          <span className="text-xs text-white/25 font-mono">{transactions.length} entrées</span>
        </div>
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="px-5 py-10 text-center text-white/20 text-sm">Chargement...</div>
          ) : transactions.length === 0 ? (
            <div className="px-5 py-10 text-center text-white/20 text-sm">Aucune transaction</div>
          ) : transactions.map((tx: any, i: number) => {
            const info = TYPE_LABELS[tx.type] || { label: tx.type, color: "text-white", Icon: DollarSign };
            return (
              <div key={tx.id || i} className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                <div className={`w-8 h-8 rounded flex items-center justify-center ${tx.amount > 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                  <info.Icon className={`w-4 h-4 ${tx.amount > 0 ? "text-emerald-400" : "text-red-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{tx.label}</div>
                  <div className="text-xs text-white/30 font-mono">{tx.date}</div>
                </div>
                <div className={`font-mono text-sm font-bold ${tx.amount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} DH
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}