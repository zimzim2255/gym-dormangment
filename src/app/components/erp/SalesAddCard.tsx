import { ShoppingCart, User, Package, DollarSign, CreditCard, Calendar, Search } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import ModalCard from "../ui/ModalCard";
import { InputField, SelectField, FormActions } from "../ui/FormField";

type SalesForm = { id: string; date: string; client: string; product: string; productCode: string; qty: number; price: number; total: number; payment: string; emp: string; };
interface ProductOption { code: string; name: string; }
interface SalesAddCardProps {
  form: SalesForm; setForm: Dispatch<SetStateAction<SalesForm>>;
  onClose: () => void; onSave: () => void; products: ProductOption[];
  onQuantityChange: (qty: number) => void; onPriceChange: (price: number) => void;
}

export default function SalesAddCard({ form, setForm, onClose, onSave, products, onQuantityChange, onPriceChange }: SalesAddCardProps) {
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectProduct = (product: ProductOption) => {
    setForm({ ...form, product: product.name, productCode: product.code });
    setSearch(product.name);
    setShowSuggestions(false);
  };

  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-white" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">Nouvelle vente</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Enregistrez une nouvelle vente.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InputField label="Client" icon={User} value={form.client} onChange={v => setForm({ ...form, client: v as string })} placeholder="Nom du client" />
        
        {/* Product with search suggestions */}
        <div className="relative">
          <label className="block text-xs text-[#94A3B0] mb-1.5 font-medium">Produit</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 z-10">
              <Package className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-3 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] placeholder-[#94A3B0]/50 focus:outline-none focus:border-[#EA5800] transition-colors"
            />
          </div>
          {showSuggestions && filtered.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filtered.map(p => (
                <button
                  key={p.code}
                  onMouseDown={() => selectProduct(p)}
                  className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <Package className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  <span>{p.name}</span>
                  <span className="text-xs text-white/30 font-mono ml-auto">{p.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <InputField label="Quantité" icon={DollarSign} type="number" value={form.qty} onChange={onQuantityChange} placeholder="0" min={1} />
        <InputField label="Prix unitaire (DH)" icon={DollarSign} type="number" value={form.price} onChange={onPriceChange} placeholder="0" min={0} />
        <InputField label="Total" icon={DollarSign} value={form.total} onChange={() => {}} placeholder="0" readOnly />
        <SelectField label="Paiement" icon={CreditCard} value={form.payment} onChange={v => setForm({ ...form, payment: v })} options={[
          { value: "Espèces", label: "Espèces" },
          { value: "Chèque", label: "Chèque" },
          { value: "Virement", label: "Virement" },
        ]} />
        <InputField label="Employé" icon={User} value={form.emp} onChange={v => setForm({ ...form, emp: v as string })} placeholder="Nom employé" />
        <InputField label="Date" icon={Calendar} value={form.date} onChange={v => setForm({ ...form, date: v as string })} placeholder="jj/mm/aaaa" />
      </div>
      <FormActions onCancel={onClose} onSave={onSave} />
    </ModalCard>
  );
}