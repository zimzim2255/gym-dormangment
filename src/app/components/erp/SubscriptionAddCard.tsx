import { Plus } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";

type SubscriptionForm = {
  id: string;
  member: string;
  phone: string;
  type: string;
  start: string;
  end: string;
  price: number;
  paid: number;
  remaining: number;
  status: string;
  payment: string;
  observation: string;
};

type SubType = { code: string; name: string; duration: string; price: number; desc: string; status: string };

interface SubscriptionAddCardProps {
  form: SubscriptionForm;
  setForm: Dispatch<SetStateAction<SubscriptionForm>>;
  onClose: () => void;
  onSave: () => void;
  members: string[];
  subTypes: SubType[];
  updateType: (type: string) => void;
  updateStart: (value: string) => void;
  updatePaid: (value: number) => void;
}

export default function SubscriptionAddCard({ form, setForm, onClose, onSave, members, subTypes, updateType, updateStart, updatePaid }: SubscriptionAddCardProps) {
  return (
    <ModalCard title="Nouvel abonnement" onClose={onClose}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <select value={form.member} onChange={e => setForm({ ...form, member: e.target.value })} className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white">
          <option value="">Sélectionner adhérent</option>
          {members.map(member => <option key={member} value={member}>{member}</option>)}
        </select>
        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <select value={form.type} onChange={e => updateType(e.target.value)} className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white">
          {subTypes.map(type => <option key={type.code} value={type.name}>{type.name}</option>)}
        </select>
        <input value={form.start} onChange={e => updateStart(e.target.value)} placeholder="Date début" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.end} readOnly placeholder="Date fin" className="p-2 bg-white/10 border border-white/10 rounded text-sm text-white/50" />
        <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value), remaining: Math.max(0, Number(e.target.value) - form.paid) })} placeholder="Prix DH" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input type="number" value={form.paid} onChange={e => updatePaid(Number(e.target.value))} placeholder="Montant payé" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.remaining} readOnly placeholder="Reste" className="p-2 bg-white/10 border border-white/10 rounded text-sm text-white/50" />
        <input value={form.payment} onChange={e => setForm({ ...form, payment: e.target.value })} placeholder="Mode paiement" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
        <input value={form.observation} onChange={e => setForm({ ...form, observation: e.target.value })} placeholder="Observation" className="p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 rounded text-sm text-white bg-white/5 hover:bg-white/10 transition">Annuler</button>
        <button onClick={onSave} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-[#f04e23] hover:bg-[#d94118] text-white transition-all">
          <Plus className="w-3.5 h-3.5" /> Enregistrer
        </button>
      </div>
    </ModalCard>
  );
}
