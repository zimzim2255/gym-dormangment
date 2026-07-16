import { Plus } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";

type PurchaseForm = {
  id: string;
  supplier: string;
  product: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
  payment: string;
};

interface SupplierOption {
  name: string;
  company: string;
}

interface ProductOption {
  code: string;
  name: string;
}

interface PurchaseAddCardProps {
  form: PurchaseForm;
  setForm: Dispatch<SetStateAction<PurchaseForm>>;
  onClose: () => void;
  onSave: () => void;
  suppliers: SupplierOption[];
  products: ProductOption[];
  onQuantityChange: (value: number) => void;
  onPriceChange: (value: number) => void;
}

export default function PurchaseAddCard({ form, setForm, onClose, onSave, suppliers, products, onQuantityChange, onPriceChange }: PurchaseAddCardProps) {
  return (
    <ModalCard title="Ajouter achat" onClose={onClose}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <select value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white">
          <option value="">Fournisseur</option>
          {suppliers.map(s => <option key={s.company} value={s.company}>{s.company}</option>)}
        </select>
        <select value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white">
          <option value="">Produit</option>
          {products.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
        </select>
        <input type="number" value={form.quantity} min={1} onChange={e => onQuantityChange(Number(e.target.value))} placeholder="Quantité" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input type="number" value={form.price} min={0} onChange={e => onPriceChange(Number(e.target.value))} placeholder="Prix unitaire" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.total} readOnly placeholder="Total" className="p-2 bg-white/10 border border-white/10 rounded text-sm text-white/50" />
        <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="Date" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.payment} onChange={e => setForm({ ...form, payment: e.target.value })} placeholder="Paiement" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 rounded text-sm text-white bg-white/5 hover:bg-white/10 transition">Annuler</button>
        <button onClick={onSave} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-[#f04e23] hover:bg-[#d94118] text-white transition-all">
          <Plus className="w-3.5 h-3.5" /> Enregistrer
        </button>
      </div>
    </ModalCard>
  );
}
