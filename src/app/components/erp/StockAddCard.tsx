import { Package, Tag, Truck, DollarSign, ShoppingCart, Image } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";
import { InputField, SelectField, FormActions } from "../ui/FormField";

type StockForm = { code: string; name: string; cat: string; supplier: string; buyPrice: number; sellPrice: number; qty: number; minStock: number; status: string; photo: string; };
interface StockAddCardProps {
  form: StockForm; setForm: Dispatch<SetStateAction<StockForm>>;
  onClose: () => void; onSave: () => void;
  suppliers?: string[];
  categories?: string[];
}

export default function StockAddCard({ form, setForm, onClose, onSave, suppliers = [], categories = [] }: StockAddCardProps) {
  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center"><Package className="w-6 h-6 text-white" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">Ajouter produit</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Ajoutez un nouveau produit au stock.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InputField label="Nom du produit" icon={Tag} value={form.name} onChange={v => setForm({ ...form, name: v as string })} placeholder="Ex: Shaker Protein" />
        <div>
          <label className="block text-xs text-[#94A3B0] mb-1.5 font-medium">Catégorie</label>
          <input list="cat-suggestions" value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} placeholder="Ex: Accessoires" className="w-full pl-3 pr-3 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] placeholder-[#94A3B0]/50 focus:outline-none focus:border-[#EA5800] transition-colors" />
          <datalist id="cat-suggestions">
            {categories.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <SelectField label="Fournisseur" icon={Truck} value={form.supplier} onChange={v => setForm({ ...form, supplier: v })} options={suppliers.map(s => ({ value: s, label: s }))} placeholder="Sélectionner fournisseur" />
        <InputField label="Prix achat (DH)" icon={DollarSign} type="number" value={form.buyPrice} onChange={v => setForm({ ...form, buyPrice: v as number })} placeholder="0" />
        <InputField label="Prix vente (DH)" icon={DollarSign} type="number" value={form.sellPrice} onChange={v => setForm({ ...form, sellPrice: v as number })} placeholder="0" />
        <InputField label="Quantité" icon={ShoppingCart} type="number" value={form.qty} onChange={v => setForm({ ...form, qty: v as number, status: (v as number) <= 0 ? "Rupture" : (v as number) < form.minStock ? "Stock bas" : "En stock" })} placeholder="0" />
        <InputField label="Stock minimum" icon={Package} type="number" value={form.minStock} onChange={v => setForm({ ...form, minStock: v as number })} placeholder="1" />
        <InputField label="URL photo (optionnelle)" icon={Image} value={form.photo} onChange={v => setForm({ ...form, photo: v as string })} placeholder="https://..." />
      </div>
      <FormActions onCancel={onClose} onSave={onSave} />
    </ModalCard>
  );
}