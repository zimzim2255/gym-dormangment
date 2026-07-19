import { useState, useEffect } from "react";
import { Search, CreditCard, Plus, CheckCircle } from "lucide-react";

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

interface ChequeSelectorProps {
  selectedChequeId: string;
  onSelect: (cheque: any) => void;
  onCreateNew: () => void;
}

export default function ChequeSelector({ selectedChequeId, onSelect, onCreateNew }: ChequeSelectorProps) {
  const [cheques, setCheques] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    (async () => {
      const d = await boutiqueApi("cheque-list");
      if (d?.cheques) setCheques(d.cheques.filter((c: any) => c.status !== "Encaissé" && c.remaining > 0));
    })();
  }, []);

  const filtered = cheques.filter((c: any) =>
    `${c.cheque_id} ${c.member_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const selected = cheques.find(c => c.cheque_id === selectedChequeId);

  return (
    <div className="relative">
      <label className="block text-xs text-[#94A3B0] mb-1.5 font-medium">Chèque</label>
      
      {selected ? (
        <div className="flex items-center gap-2 bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-mono">{selected.cheque_id}</div>
            <div className="text-xs text-white/40">{selected.member_name} — {selected.remaining?.toLocaleString()} DH restant</div>
          </div>
          <button onClick={() => onSelect(null)} className="text-xs text-white/40 hover:text-white">Changer</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Chercher un chèque..."
              className="w-full pl-8 pr-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] placeholder-[#94A3B0]/50 focus:outline-none focus:border-[#EA5800]"
            />
            {showDropdown && filtered.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl max-h-40 overflow-y-auto">
                {filtered.map(c => (
                  <button
                    key={c.id}
                    onMouseDown={() => { onSelect(c); setShowDropdown(false); setSearch(""); }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 flex items-center gap-2"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                    <span className="font-mono">{c.cheque_id}</span>
                    <span className="text-white/50 ml-1">— {c.member_name}</span>
                    <span className="ml-auto text-emerald-400 font-mono text-xs">{c.remaining?.toLocaleString()} DH</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onCreateNew}
            className="px-3 py-2.5 rounded-lg bg-[#f04e23]/10 hover:bg-[#f04e23]/20 border border-[#f04e23]/30 text-[#f04e23] text-sm transition-colors flex items-center gap-1 flex-shrink-0"
            title="Créer un nouveau chèque"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}