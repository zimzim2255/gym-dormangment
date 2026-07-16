import { CreditCard, User, Phone, Calendar, DollarSign, FileText } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";
import { InputField, SelectField, FormActions } from "../ui/FormField";

type SubscriptionForm = {
  id: string; member: string; phone: string; type: string; start: string;
  end: string; price: number; paid: number; remaining: number;
  status: string; payment: string; observation: string;
};
type SubType = { code: string; name: string; duration: string; price: number; desc: string; status: string };

interface SubscriptionAddCardProps {
  form: SubscriptionForm; setForm: Dispatch<SetStateAction<SubscriptionForm>>;
  onClose: () => void; onSave: () => void; members: string[]; subTypes: SubType[];
  updateType: (type: string) => void; updateStart: (value: string) => void; updatePaid: (value: number) => void;
}

export default function SubscriptionAddCard({ form, setForm, onClose, onSave, members, subTypes, updateType, updateStart, updatePaid }: SubscriptionAddCardProps) {
  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Nouvel abonnement</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Créez un abonnement pour un adhérent.</p>
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#EA5800]" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Adhérent</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <SelectField label="Adhérent" icon={User} value={form.member} onChange={v => setForm({ ...form, member: v })} options={members.map(m => ({ value: m, label: m }))} placeholder="Sélectionner adhérent" />
            <InputField label="Téléphone" icon={Phone} value={form.phone} onChange={v => setForm({ ...form, phone: v as string })} placeholder="Téléphone" />
            <SelectField label="Type d'abonnement" icon={CreditCard} value={form.type} onChange={updateType} options={subTypes.map(t => ({ value: t.name, label: `${t.name} - ${t.price}DH` }))} placeholder="Type abonnement" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-[#EA5800]" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Période & Paiement</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InputField label="Date début" icon={Calendar} value={form.start} onChange={updateStart} placeholder="jj/mm/aaaa" />
            <InputField label="Date fin" icon={Calendar} value={form.end} onChange={v => setForm({ ...form, end: v as string })} placeholder="Date fin" readOnly />
            <InputField label="Prix (DH)" icon={DollarSign} type="number" value={form.price} onChange={v => setForm({ ...form, price: v as number, remaining: Math.max(0, (v as number) - form.paid) })} placeholder="Prix" />
            <InputField label="Montant payé" icon={DollarSign} type="number" value={form.paid} onChange={updatePaid} placeholder="Payé" />
            <InputField label="Reste" icon={DollarSign} value={form.remaining} onChange={() => {}} placeholder="Reste" readOnly />
            <InputField label="Mode paiement" icon={CreditCard} value={form.payment} onChange={v => setForm({ ...form, payment: v as string })} placeholder="Espèces, Carte..." />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-[#EA5800]" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Observation</h3>
          </div>
          <InputField icon={FileText} value={form.observation} onChange={v => setForm({ ...form, observation: v as string })} placeholder="Observation" />
        </div>
      </div>
      <FormActions onCancel={onClose} onSave={onSave} />
    </ModalCard>
  );
}