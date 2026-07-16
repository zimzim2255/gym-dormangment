import { ShoppingCart, User, Package, DollarSign, CreditCard, Calendar } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";
import { InputField, SelectField, FormActions } from "../ui/FormField";

type SalesForm = { id: string; date: string; client: string; product: string; qty: number; price: number; total: number; payment: string; emp: string; };
interface ProductOption { code: string; name: string; }
interface SalesEditCardProps {
  form: SalesForm; setForm: Dispatch<SetStateAction<SalesForm>>;
  onClose: () => void; onSave: () => void; products: ProductOption[];
  onQuantityChange: (qty: number) => void; onPriceChange: (price: number) => void;
}

export default function SalesEditCard({ form, setForm, onClose, onSave, products, onQuantityChange, onPriceChange }: SalesEditCardProps) {
  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-white" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">Modifier vente</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Modifiez les informations de la vente.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InputField label="Client" icon={User} value={form.client} onChange={v => setForm({ ...form, client: v as string })} placeholder="Nom du client" />
        <SelectField label="Produit" icon={Package} value={form.product} onChange={v => setForm({ ...form, product: v })} options={products.map(p => ({ value: p.name, label: p.name }))} placeholder="Sélectionner" />
        <InputField label="Quantité" icon={DollarSign} type="number" value={form.qty} onChange={onQuantityChange} placeholder="0" min={1} />
        <InputField label="Prix unitaire (DH)" icon={DollarSign} type="number" value={form.price} onChange={onPriceChange} placeholder="0" min={0} />
        <InputField label="Total" icon={DollarSign} value={form.total} onChange={() => {}} placeholder="0" readOnly />
        <InputField label="Paiement" icon={CreditCard} value={form.payment} onChange={v => setForm({ ...form, payment: v as string })} placeholder="Espèces, Carte..." />
        <InputField label="Employé" icon={User} value={form.emp} onChange={v => setForm({ ...form, emp: v as string })} placeholder="Nom employé" />
        <InputField label="Date" icon={Calendar} value={form.date} onChange={v => setForm({ ...form, date: v as string })} placeholder="jj/mm/aaaa" />
      </div>
      <FormActions onCancel={onClose} onSave={onSave} saveLabel="Modifier" />
    </ModalCard>
  );
}