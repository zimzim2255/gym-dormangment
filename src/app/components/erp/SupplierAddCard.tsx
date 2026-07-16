import { User, Building2, Phone, Mail, MapPin, DollarSign } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";
import { InputField, FormActions } from "../ui/FormField";

type SupplierForm = { name: string; company: string; phone: string; email: string; city: string; balance: number; };
interface SupplierAddCardProps { form: SupplierForm; setForm: Dispatch<SetStateAction<SupplierForm>>; onClose: () => void; onSave: () => void; }

export default function SupplierAddCard({ form, setForm, onClose, onSave }: SupplierAddCardProps) {
  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center"><Building2 className="w-6 h-6 text-white" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">Ajouter fournisseur</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Ajoutez un nouveau fournisseur.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InputField label="Nom" icon={User} value={form.name} onChange={v => setForm({ ...form, name: v as string })} placeholder="Ex: Anas Tahiri" />
        <InputField label="Société" icon={Building2} value={form.company} onChange={v => setForm({ ...form, company: v as string })} placeholder="Ex: FitSupply Maroc" />
        <InputField label="Téléphone" icon={Phone} value={form.phone} onChange={v => setForm({ ...form, phone: v as string })} placeholder="Ex: 0522 111 222" />
        <InputField label="Email" icon={Mail} value={form.email} onChange={v => setForm({ ...form, email: v as string })} placeholder="Ex: contact@fitsupply.ma" />
        <InputField label="Ville" icon={MapPin} value={form.city} onChange={v => setForm({ ...form, city: v as string })} placeholder="Ex: Casablanca" />
        <InputField label="Solde (DH)" icon={DollarSign} type="number" value={form.balance} onChange={v => setForm({ ...form, balance: v as number })} placeholder="0" />
      </div>
      <FormActions onCancel={onClose} onSave={onSave} />
    </ModalCard>
  );
}