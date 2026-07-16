import { User, Phone, CreditCard, Briefcase, DollarSign, Calendar, Clock } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";
import { InputField, SelectField, FormActions } from "../ui/FormField";

type StaffForm = { name: string; phone: string; cin: string; role: string; salary: number; hired: string; status: string; };
interface StaffAddCardProps { form: StaffForm; setForm: Dispatch<SetStateAction<StaffForm>>; onClose: () => void; onSave: () => void; }

export default function StaffAddCard({ form, setForm, onClose, onSave }: StaffAddCardProps) {
  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center"><User className="w-6 h-6 text-white" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">Ajouter employé</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Ajoutez un nouvel employé.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InputField label="Nom complet" icon={User} value={form.name} onChange={v => setForm({ ...form, name: v as string })} placeholder="Ex: Amine Belhaj" required />
        <InputField label="Téléphone" icon={Phone} value={form.phone} onChange={v => setForm({ ...form, phone: v as string })} placeholder="Ex: 0661 111 222" />
        <InputField label="CIN" icon={CreditCard} value={form.cin} onChange={v => setForm({ ...form, cin: v as string })} placeholder="Ex: AA111111" />
        <InputField label="Poste" icon={Briefcase} value={form.role} onChange={v => setForm({ ...form, role: v as string })} placeholder="Ex: Coach Fitness" />
        <InputField label="Salaire (DH)" icon={DollarSign} type="number" value={form.salary} onChange={v => setForm({ ...form, salary: v as number })} placeholder="0" />
        <InputField label="Date d'embauche" icon={Calendar} value={form.hired} onChange={v => setForm({ ...form, hired: v as string })} placeholder="jj/mm/aaaa" />
        <SelectField label="Statut" icon={Clock} value={form.status} onChange={v => setForm({ ...form, status: v })} options={[{ value: "Présent", label: "Présent" }, { value: "Absent", label: "Absent" }]} />
      </div>
      <FormActions onCancel={onClose} onSave={onSave} />
    </ModalCard>
  );
}