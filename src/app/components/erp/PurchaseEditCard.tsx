import { ShoppingCart, Truck, Package, DollarSign, CreditCard, Calendar } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";
import { InputField, SelectField, FormActions } from "../ui/FormField";

type PurchaseForm = { id: string; supplier: string; product: string; quantity: number; price: number; total: number; date: string; payment: string; };
interface SupplierOption { name: string; company: string; }
interface ProductOption { code: string; name: string; }
interface PurchaseEditCardProps {
  form: PurchaseForm; setForm: Dispatch<SetStateAction<PurchaseForm>>;
  onClose: () => void; onSave: () => void; suppliers: SupplierOption[]; products: ProductOption[];
  onQuantityChange: (value: number) => void; onPriceChange: (value: number) => void;
}

export default function PurchaseEditCard({ form, setForm, onClose, onSave, suppliers, products, onQuantityChange, onPriceChange }: PurchaseEditCardProps) {
  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-white" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">Modifier achat</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Modifiez les informations de l'achat.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <SelectField label="Fournisseur" icon={Truck} value={form.supplier} onChange={v => setForm({ ...form, supplier: v })} options={suppliers.map(s => ({ value: s.company, label: s.company }))} placeholder="Sélectionner" />
        <SelectField label="Produit" icon={Package} value={form.product} onChange={v => setForm({ ...form, product: v })} options={products.map(p => ({ value: p.name, label: p.name }))} placeholder="Sélectionner" />
        <InputField label="Quantité" icon={Package} type="number" value={form.quantity} onChange={onQuantityChange} placeholder="0" min={1} />
        <InputField label="Prix unitaire (DH)" icon={DollarSign} type="number" value={form.price} onChange={onPriceChange} placeholder="0" min={0} />
        <InputField label="Total" icon={DollarSign} value={form.total} onChange={() => {}} placeholder="0" readOnly />
        <InputField label="Paiement" icon={CreditCard} value={form.payment} onChange={v => setForm({ ...form, payment: v as string })} placeholder="Espèces, Carte..." />
        <InputField label="Date" icon={Calendar} value={form.date} onChange={v => setForm({ ...form, date: v as string })} placeholder="jj/mm/aaaa" />
      </div>
      <FormActions onCancel={onClose} onSave={onSave} saveLabel="Modifier" />
    </ModalCard>
  );
}