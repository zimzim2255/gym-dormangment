import { Package, Tag, Truck, DollarSign, ShoppingCart, Image } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";
import { InputField, FormActions, SelectField } from "../ui/FormField";

type StockForm = { code: string; name: string; cat: string; supplier: string; buyPrice: number; sellPrice: number; qty: number; minStock: number; status: string; photo: string; };
interface StockAddCardProps { form: StockForm; setForm: Dispatch<SetStateAction<StockForm>>; onClose: () => void; onSave: () => void; }

export default function StockAddCard({ form, setForm, onClose, onSave }: StockAddCardProps) {
  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Ajouter produit</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Ajoutez un nouveau produit au stock.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InputField icon={Tag} value={form.name} onChange={v => setForm({ ...form, name: v as string })} placeholder="Nom du produit" />
        <InputField icon={Package} value={form.cat} onChange={v => setForm({ ...form, cat: v as string })} placeholder="Catégorie" />
        <InputField icon={Truck} value={form.supplier} onChange={v => setForm({ ...form, supplier: v as string })} placeholder="Fournisseur" />
        <InputField icon={DollarSign} type="number" value={form.buyPrice} onChange={v => setForm({ ...form, buyPrice: v as number })} placeholder="Prix achat DH" />
        <InputField icon={DollarSign} type="number" value={form.sellPrice} onChange={v => setForm({ ...form, sellPrice: v as number })} placeholder="Prix vente DH" />
        <InputField icon={ShoppingCart} type="number" value={form.qty} onChange={v => setForm({ ...form, qty: v as number, status: (v as number) <= 0 ? "Rupture" : (v as number) < form.minStock ? "Stock bas" : "En stock" })} placeholder="Quantité" />
        <InputField icon={Package} type="number" value={form.minStock} onChange={v => setForm({ ...form, minStock: v as number })} placeholder="Stock minimum" />
        <InputField icon={Image} value={form.photo} onChange={v => setForm({ ...form, photo: v as string })} placeholder="URL photo (optionnelle)" />
      </div>
      <FormActions onCancel={onClose} onSave={onSave} />
    </ModalCard>
  );
}