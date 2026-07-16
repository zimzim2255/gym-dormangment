import { User, Phone, CreditCard, Briefcase, DollarSign, Calendar, Clock } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";
import { InputField, SelectField, FormActions } from "../ui/FormField";

type StaffForm = { name: string; phone: string; cin: string; role: string; salary: number; hired: string; status: string; };
interface StaffEditCardProps { form: StaffForm; setForm: Dispatch<SetStateAction<StaffForm>>; onClose: () => void; onSave: () => void; }

export default function StaffEditCard({ form, setForm, onClose, onSave }: StaffEditCardProps) {
  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Modifier employé</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Modifiez les informations de l'employé.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InputField icon={User} value={form.name} onChange={v => setForm({ ...form, name: v as string })} placeholder="Nom complet" />
        <InputField icon={Phone} value={form.phone} onChange={v => setForm({ ...form, phone: v as string })} placeholder="Téléphone" />
        <InputField icon={CreditCard} value={form.cin} onChange={v => setForm({ ...form, cin: v as string })} placeholder="CIN" />
        <InputField icon={Briefcase} value={form.role} onChange={v => setForm({ ...form, role: v as string })} placeholder="Poste" />
        <InputField icon={DollarSign} type="number" value={form.salary} onChange={v => setForm({ ...form, salary: v as number })} placeholder="Salaire DH" />
        <InputField icon={Calendar} value={form.hired} onChange={v => setForm({ ...form, hired: v as string })} placeholder="Embauché le" />
        <SelectField icon={Clock} value={form.status} onChange={v => setForm({ ...form, status: v })} options={[{ value: "Présent", label: "Présent" }, { value: "Absent", label: "Absent" }]} />
      </div>
      <FormActions onCancel={onClose} onSave={onSave} saveLabel="Modifier" />
    </ModalCard>
  );
}