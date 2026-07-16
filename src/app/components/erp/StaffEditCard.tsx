import { Pencil } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";

type StaffForm = {
  name: string;
  phone: string;
  cin: string;
  role: string;
  salary: number;
  hired: string;
  status: string;
};

interface StaffEditCardProps {
  form: StaffForm;
  setForm: Dispatch<SetStateAction<StaffForm>>;
  onClose: () => void;
  onSave: () => void;
}

export default function StaffEditCard({ form, setForm, onClose, onSave }: StaffEditCardProps) {
  return (
    <ModalCard title="Modifier employé" onClose={onClose}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.cin} onChange={e => setForm({ ...form, cin: e.target.value })} placeholder="CIN" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Poste" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input type="number" value={form.salary} min={0} onChange={e => setForm({ ...form, salary: Number(e.target.value) })} placeholder="Salaire DH" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.hired} onChange={e => setForm({ ...form, hired: e.target.value })} placeholder="Embauché le" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white">
          <option>Présent</option>
          <option>Absent</option>
        </select>
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
