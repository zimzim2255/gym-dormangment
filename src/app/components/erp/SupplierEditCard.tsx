import { Pencil } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";

type SupplierForm = {
  name: string;
  company: string;
  phone: string;
  email: string;
  city: string;
  balance: number;
};

interface SupplierEditCardProps {
  form: SupplierForm;
  setForm: Dispatch<SetStateAction<SupplierForm>>;
  onClose: () => void;
  onSave: () => void;
}

export default function SupplierEditCard({ form, setForm, onClose, onSave }: SupplierEditCardProps) {
  return (
    <ModalCard title="Modifier fournisseur" onClose={onClose}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Société" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Ville" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input type="number" value={form.balance} min={0} onChange={e => setForm({ ...form, balance: Number(e.target.value) })} placeholder="Solde DH" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
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
