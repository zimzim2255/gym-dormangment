import { Plus } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";

type MemberForm = {
  id: string;
  name: string;
  phone: string;
  cin: string;
  gender: string;
  dob: string;
  joined: string;
  status: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  photo: string;
};

interface MemberAddCardProps {
  form: MemberForm;
  setForm: Dispatch<SetStateAction<MemberForm>>;
  onClose: () => void;
  onSave: () => void;
}

export default function MemberAddCard({ form, setForm, onClose, onSave }: MemberAddCardProps) {
  return (
    <ModalCard title="Ajouter adhérent" onClose={onClose}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom complet" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.cin} onChange={e => setForm({ ...form, cin: e.target.value })} placeholder="CIN" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white">
          <option>Homme</option>
          <option>Femme</option>
        </select>
        <input value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} placeholder="Date de naissance" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Adresse" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.emergencyContact} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} placeholder="Contact urgence" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.emergencyPhone} onChange={e => setForm({ ...form, emergencyPhone: e.target.value })} placeholder="Téléphone urgence" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.photo} onChange={e => setForm({ ...form, photo: e.target.value })} placeholder="URL photo" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
      </div>
      <div className="mt-4 flex justify-end">
        <button onClick={onSave} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-[#f04e23] hover:bg-[#d94118] text-white transition-all">
          <Plus className="w-3.5 h-3.5" /> Enregistrer
        </button>
      </div>
    </ModalCard>
  );
}
