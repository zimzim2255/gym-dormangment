import { CreditCard, User, DollarSign, Calendar, Upload, X, Image } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import ModalCard from "../ui/ModalCard";
import { InputField, FormActions } from "../ui/FormField";
import { uploadMemberPhoto } from "../../services/cloudinaryService";

type ChequeForm = {
  chequeId: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  dateEcheance: string;
  photo: string;
  status: string;
};

interface MemberOption { id: string; name: string; }

interface ChequeAddCardProps {
  form: ChequeForm;
  setForm: Dispatch<SetStateAction<ChequeForm>>;
  onClose: () => void;
  onSave: () => void;
  members: MemberOption[];
}

export default function ChequeAddCard({ form, setForm, onClose, onSave, members }: ChequeAddCardProps) {
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectClient = (member: MemberOption) => {
    setForm({ ...form, memberId: member.id, memberName: member.name });
    setSearch(member.name);
    setShowSuggestions(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMemberPhoto(file);
      setForm({ ...form, photo: url });
    } catch { /* silent */ }
    finally { setUploading(false); }
  };

  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center"><CreditCard className="w-6 h-6 text-white" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">Nouveau chèque</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Enregistrez un nouveau chèque.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <InputField label="N° Chèque" icon={CreditCard} value={form.chequeId} onChange={v => setForm({ ...form, chequeId: v as string })} placeholder="Ex: CHQ001" required />
        
        {/* Client with search */}
        <div className="relative">
          <label className="block text-xs text-[#94A3B0] mb-1.5 font-medium">Client *</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 z-10">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Rechercher un adhérent..."
              className="w-full pl-10 pr-3 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] placeholder-[#94A3B0]/50 focus:outline-none focus:border-[#EA5800] transition-colors"
            />
          </div>
          {showSuggestions && filteredMembers.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filteredMembers.map(m => (
                <button
                  key={m.id}
                  onMouseDown={() => selectClient(m)}
                  className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  <span>{m.name}</span>
                  <span className="text-xs text-white/30 font-mono ml-auto">{m.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <InputField label="Montant (DH)" icon={DollarSign} type="number" value={form.amount} onChange={v => setForm({ ...form, amount: v as number })} placeholder="0" />
        <InputField label="Date du chèque" icon={Calendar} value={form.date} onChange={v => setForm({ ...form, date: v as string })} placeholder="jj/mm/aaaa" required />
        <InputField label="Date d'échéance" icon={Calendar} value={form.dateEcheance} onChange={v => setForm({ ...form, dateEcheance: v as string })} placeholder="jj/mm/aaaa" required />
      </div>

      {/* Photo Upload */}
      <div className="mt-4">
        <label className="block text-xs text-[#94A3B0] mb-1.5 font-medium">Photo du chèque (optionnelle)</label>
        <div className="flex items-center gap-3">
          {form.photo ? (
            <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-white/10">
              <img src={form.photo} alt="Cheque" className="w-full h-full object-cover" />
              <button onClick={() => setForm({ ...form, photo: "" })} className="absolute top-1 right-1 p-0.5 bg-red-500/80 rounded-full">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-dashed border-white/10 text-sm text-white/60 hover:text-white transition-colors">
              {uploading ? (
                <div className="w-4 h-4 border-2 border-[#EA5800] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? "Upload..." : "Joindre une photo"}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      <FormActions onCancel={onClose} onSave={onSave} saving={uploading} />
    </ModalCard>
  );
}