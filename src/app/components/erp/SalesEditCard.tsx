import { Pencil } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";

type SalesForm = {
  id: string;
  date: string;
  client: string;
  product: string;
  qty: number;
  price: number;
  total: number;
  payment: string;
  emp: string;
};

interface ProductOption {
  code: string;
  name: string;
}

interface SalesEditCardProps {
  form: SalesForm;
  setForm: Dispatch<SetStateAction<SalesForm>>;
  onClose: () => void;
  onSave: () => void;
  products: ProductOption[];
  onQuantityChange: (qty: number) => void;
  onPriceChange: (price: number) => void;
}

export default function SalesEditCard({ form, setForm, onClose, onSave, products, onQuantityChange, onPriceChange }: SalesEditCardProps) {
  return (
    <ModalCard title="Modifier vente" onClose={onClose}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} placeholder="Client" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <select value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white">
          <option value="">Produit</option>
          {products.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
        </select>
        <input type="number" value={form.qty} min={1} onChange={e => onQuantityChange(Number(e.target.value))} placeholder="Quantité" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input type="number" value={form.price} min={0} onChange={e => onPriceChange(Number(e.target.value))} placeholder="Prix unitaire" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.total} readOnly placeholder="Total" className="p-2 bg-white/10 border border-white/10 rounded text-sm text-white/50" />
        <input value={form.payment} onChange={e => setForm({ ...form, payment: e.target.value })} placeholder="Paiement" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.emp} onChange={e => setForm({ ...form, emp: e.target.value })} placeholder="Employé" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="Date" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 rounded text-sm text-white bg-white/5 hover:bg-white/10 transition">Annuler</button>
        <button onClick={onSave} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-[#f04e23] hover:bg-[#d94118] text-white transition-all">
          <Pencil className="w-3.5 h-3.5" /> Enregistrer
        </button>
      </div>
    </ModalCard>
  );
}
