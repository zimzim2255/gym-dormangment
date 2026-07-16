import { Pencil } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";

type StockForm = {
  code: string;
  name: string;
  cat: string;
  supplier: string;
  buyPrice: number;
  sellPrice: number;
  qty: number;
  minStock: number;
  status: string;
  photo: string;
};

interface StockEditCardProps {
  form: StockForm;
  setForm: Dispatch<SetStateAction<StockForm>>;
  onClose: () => void;
  onSave: () => void;
}

export default function StockEditCard({ form, setForm, onClose, onSave }: StockEditCardProps) {
  return (
    <ModalCard title="Modifier produit" onClose={onClose}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} placeholder="Catégorie" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Fournisseur" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input type="number" value={form.buyPrice} min={0} onChange={e => setForm({ ...form, buyPrice: Number(e.target.value) })} placeholder="Prix achat" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input type="number" value={form.sellPrice} min={0} onChange={e => setForm({ ...form, sellPrice: Number(e.target.value) })} placeholder="Prix vente" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input type="number" value={form.qty} min={0} onChange={e => setForm({ ...form, qty: Number(e.target.value), status: Number(e.target.value) <= 0 ? "Rupture" : Number(e.target.value) < form.minStock ? "Stock bas" : "En stock" })} placeholder="Quantité" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input type="number" value={form.minStock} min={1} onChange={e => setForm({ ...form, minStock: Number(e.target.value), status: form.qty <= 0 ? "Rupture" : form.qty < Number(e.target.value) ? "Stock bas" : "En stock" })} placeholder="Stock min" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.photo} onChange={e => setForm({ ...form, photo: e.target.value })} placeholder="URL photo" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
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
