import { Receipt, FileText, DollarSign, Calendar, User, MessageSquare } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";
import { InputField, FormActions } from "../ui/FormField";

type ExpenseForm = { cat: string; desc: string; amount: number; date: string; resp: string; note: string; };
interface ExpenseEditCardProps { form: ExpenseForm; setForm: Dispatch<SetStateAction<ExpenseForm>>; onClose: () => void; onSave: () => void; }

export default function ExpenseEditCard({ form, setForm, onClose, onSave }: ExpenseEditCardProps) {
  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center"><Receipt className="w-6 h-6 text-white" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">Modifier dépense</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Modifiez les informations de la dépense.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InputField label="Catégorie" icon={FileText} value={form.cat} onChange={v => setForm({ ...form, cat: v as string })} placeholder="Ex: Loyer, Électricité..." />
        <InputField label="Désignation" icon={MessageSquare} value={form.desc} onChange={v => setForm({ ...form, desc: v as string })} placeholder="Ex: Loyer juillet 2025" />
        <InputField label="Montant (DH)" icon={DollarSign} type="number" value={form.amount} onChange={v => setForm({ ...form, amount: v as number })} placeholder="0" />
        <InputField label="Date" icon={Calendar} value={form.date} onChange={v => setForm({ ...form, date: v as string })} placeholder="jj/mm/aaaa" />
        <InputField label="Responsable" icon={User} value={form.resp} onChange={v => setForm({ ...form, resp: v as string })} placeholder="Nom responsable" />
        <InputField label="Observation" icon={MessageSquare} value={form.note} onChange={v => setForm({ ...form, note: v as string })} placeholder="Note optionnelle" />
      </div>
      <FormActions onCancel={onClose} onSave={onSave} saveLabel="Modifier" />
    </ModalCard>
  );
}