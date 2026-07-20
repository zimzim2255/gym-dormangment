import { useState, useEffect } from "react";
import { Package, X, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";

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

interface ProductDetailCardProps {
  product: any;
  onClose: () => void;
}

export default function ProductDetailCard({ product, onClose }: ProductDetailCardProps) {
  const [salesData, setSalesData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const [saleData, movementsData] = await Promise.all([
        boutiqueApi("sale-list"),
        boutiqueApi("stock-movements", { limit: 200 }),
      ]);
      const productSales = (saleData?.sales || []).filter((s: any) => s.product_code === product.code);
      const productMovements = (movementsData?.movements || []).filter((m: any) => m.product_code === product.code);
      const totalSold = productSales.reduce((sum: number, s: any) => sum + s.qty, 0);
      const totalRevenue = productSales.reduce((sum: number, s: any) => sum + s.total, 0);
      setSalesData({ sales: productSales, movements: productMovements, totalSold, totalRevenue, saleCount: productSales.length });
    })();
  }, [product.code]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#1A1D2E] border border-white/10 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-[#f04e23]" />
            <h3 className="font-semibold text-white text-lg">{product.name}</h3>
            <span className="px-2 py-0.5 rounded bg-[#f04e23]/10 text-[#f04e23] text-xs font-mono">{product.code}</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-lg cursor-pointer">&times;</button>
        </div>
        <div className="overflow-y-auto max-h-[calc(85vh-65px)] p-6">
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              {product.photo ? (
                <img src={product.photo} alt={product.name} className="w-52 h-52 rounded-xl object-cover border border-white/10" />
              ) : (
                <div className="w-52 h-52 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                  <Package className="w-16 h-16 text-white/20" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="Catégorie" value={product.cat || "—"} />
                <InfoCard label="Fournisseur" value={product.supplier || "—"} />
                <InfoCard label="Prix achat" value={`${product.buyPrice} DH`} mono />
                <InfoCard label="Prix vente" value={`${product.sellPrice} DH`} mono accent />
                <InfoCard label="Stock actuel" value={`${product.qty} unité${product.qty > 1 ? "s" : ""}`} mono bold />
                <InfoCard label="Stock min" value={product.minStock} mono />
              </div>

              {salesData && (
                <div className="border-t border-white/5 pt-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Statistiques des ventes</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard value={salesData.saleCount} label="Ventes" icon={ShoppingCart} color="emerald" />
                    <StatCard value={salesData.totalSold} label="Unités vendues" icon={TrendingUp} color="blue" />
                    <StatCard value={`${salesData.totalRevenue.toLocaleString()} DH`} label="Revenu total" icon={DollarSign} color="violet" />
                  </div>
                </div>
              )}

              {salesData && salesData.sales.length > 0 && (
                <div className="border-t border-white/5 pt-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Dernières ventes</h4>
                  <div className="space-y-2">
                    {salesData.sales.slice(0, 5).map((sale: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/30 font-mono">{sale.date}</span>
                          <span className="text-sm text-white">{sale.client || "—"}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white font-mono">{sale.qty} × {sale.price} DH</div>
                          <div className="text-xs text-emerald-400 font-mono">{sale.total} DH</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, mono, accent, bold }: { label: string; value: string | number; mono?: boolean; accent?: boolean; bold?: boolean }) {
  return (
    <div className="bg-white/3 rounded-lg p-3">
      <div className="text-xs text-white/30 font-medium">{label}</div>
      <div className={`text-sm mt-0.5 ${mono ? "font-mono" : ""} ${bold ? "font-bold" : "font-medium"} ${accent ? "text-emerald-400" : "text-white"}`}>{value}</div>
    </div>
  );
}

function StatCard({ value, label, icon: Icon, color }: { value: string | number; label: string; icon: any; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500/5 border-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/5 border-blue-500/10 text-blue-400",
    violet: "bg-violet-500/5 border-violet-500/10 text-violet-400",
  };
  return (
    <div className={`${colors[color]} border rounded-lg p-3 text-center`}>
      <Icon className="w-4 h-4 mx-auto mb-1 opacity-60" />
      <div className="text-xl font-bold font-mono">{value}</div>
      <div className="text-xs text-white/30 mt-0.5">{label}</div>
    </div>
  );
}