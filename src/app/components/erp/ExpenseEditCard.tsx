import { Pencil } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";

type ExpenseForm = {
  cat: string;
  desc: string;
  amount: number;
  date: string;
  resp: string;
  note: string;
};

interface ExpenseEditCardProps {
  form: ExpenseForm;
  setForm: Dispatch<SetStateAction<ExpenseForm>>;
  onClose: () => void;
  onSave: () => void;
}

export default function ExpenseEditCard({ form, setForm, onClose, onSave }: ExpenseEditCardProps) {
  return (
    <ModalCard title="Modifier dépense" onClose={onClose}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <input value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} placeholder="Catégorie" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Désignation" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input type="number" value={form.amount} min={0} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} placeholder="Montant DH" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="Date" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.resp} onChange={e => setForm({ ...form, resp: e.target.value })} placeholder="Responsable" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Observation" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
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
