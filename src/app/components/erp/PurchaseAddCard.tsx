import { ShoppingCart, Truck, Package, DollarSign, CreditCard, Calendar } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";
import { InputField, SelectField, FormActions } from "../ui/FormField";

type PurchaseForm = { id: string; supplier: string; product: string; quantity: number; price: number; total: number; date: string; payment: string; };
interface SupplierOption { name: string; company: string; }
interface ProductOption { code: string; name: string; }
interface PurchaseAddCardProps {
  form: PurchaseForm; setForm: Dispatch<SetStateAction<PurchaseForm>>;
  onClose: () => void; onSave: () => void; suppliers: SupplierOption[]; products: ProductOption[];
  onQuantityChange: (value: number) => void; onPriceChange: (value: number) => void;
}

export default function PurchaseAddCard({ form, setForm, onClose, onSave, suppliers, products, onQuantityChange, onPriceChange }: PurchaseAddCardProps) {
  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center">
          <ShoppingCart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Ajouter achat</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Enregistrez un nouvel achat.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <SelectField icon={Truck} value={form.supplier} onChange={v => setForm({ ...form, supplier: v })} options={suppliers.map(s => ({ value: s.company, label: s.company }))} placeholder="Fournisseur" />
        <SelectField icon={Package} value={form.product} onChange={v => setForm({ ...form, product: v })} options={products.map(p => ({ value: p.name, label: p.name }))} placeholder="Produit" />
        <InputField icon={Package} type="number" value={form.quantity} onChange={onQuantityChange} placeholder="Quantité" min={1} />
        <InputField icon={DollarSign} type="number" value={form.price} onChange={onPriceChange} placeholder="Prix unitaire" min={0} />
        <InputField icon={DollarSign} value={form.total} onChange={() => {}} placeholder="Total" readOnly />
        <InputField icon={CreditCard} value={form.payment} onChange={v => setForm({ ...form, payment: v as string })} placeholder="Paiement" />
        <InputField icon={Calendar} value={form.date} onChange={v => setForm({ ...form, date: v as string })} placeholder="Date" />
      </div>
      <FormActions onCancel={onClose} onSave={onSave} />
    </ModalCard>
  );
}