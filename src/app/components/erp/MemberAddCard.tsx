import { Plus, User, Phone, Mail, CreditCard, Calendar, MapPin, Upload, UserRound, X, Image } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import ModalCard from "../ui/ModalCard";
import { uploadMemberPhoto } from "../../services/cloudinaryService";

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

function InputField({ icon: Icon, value, onChange, placeholder, required, type = "text" }: {
  icon: any;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
        <Icon className="w-4 h-4" />
      </div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] placeholder-[#94A3B0]/50 focus:outline-none focus:border-[#EA5800] transition-colors"
      />
      {required && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EA5800] text-lg">*</span>}
    </div>
  );
}

function SelectField({ icon: Icon, value, onChange, options }: {
  icon: any;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 z-10">
        <Icon className="w-4 h-4" />
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-10 pr-3 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#EA5800] transition-colors appearance-none"
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function MemberAddCard({ form, setForm, onClose, onSave }: MemberAddCardProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    try {
      const url = await uploadMemberPhoto(file, form.id || undefined);
      setForm({ ...form, photo: url });
    } catch {
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ModalCard title="" onClose={onClose}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center flex-shrink-0">
          <div className="relative">
            <User className="w-6 h-6 text-white" />
            <Plus className="w-3 h-3 text-white absolute -bottom-1 -right-1" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Ajouter un adhérent</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Remplissez les informations pour ajouter un nouvel adhérent.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section 1: Informations personnelles */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#EA5800]" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Informations personnelles</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InputField icon={User} value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Ex: Karim Benali" required />
            <InputField icon={Phone} value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="Ex: 0661 234 567" required />
            <InputField icon={Mail} value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="Ex: karim.benali@gmail.com" />
            <InputField icon={CreditCard} value={form.cin} onChange={v => setForm({ ...form, cin: v })} placeholder="Ex: AB123456" />
            <SelectField icon={User} value={form.gender} onChange={v => setForm({ ...form, gender: v })} options={["Homme", "Femme"]} />
            <InputField icon={Calendar} value={form.dob} onChange={v => setForm({ ...form, dob: v })} placeholder="jj/mm/aaaa" type="text" />
          </div>
          <div className="mt-4">
            <InputField icon={MapPin} value={form.address} onChange={v => setForm({ ...form, address: v })} placeholder="Ex: 123, Rue Mohammed V, Fès" />
          </div>
        </div>

        {/* Section 2: Contact urgence */}
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact urgence</h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField icon={Phone} value={form.emergencyContact} onChange={v => setForm({ ...form, emergencyContact: v })} placeholder="Ex: Fatima Benali" />
            <InputField icon={Phone} value={form.emergencyPhone} onChange={v => setForm({ ...form, emergencyPhone: v })} placeholder="Ex: 0661 234 567" />
          </div>
        </div>

        {/* Section 3: Photo */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-4 h-4 text-[#EA5800]" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Photo de profil (optionnelle)</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {/* Upload Area */}
            <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-[#475569] rounded-xl p-8 hover:border-[#EA5800]/50 transition-colors min-h-[180px]">
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-[#EA5800] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[#94A3B0]">Upload en cours...</span>
                </div>
              ) : preview || form.photo ? (
                <img src={preview || form.photo} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5 text-[#94A3B0]" />
                  </div>
                  <span className="text-sm font-semibold text-white mb-1">Cliquez pour choisir une photo</span>
                  <span className="text-xs text-[#94A3B0]">PNG, JPG ou WEBP</span>
                  <span className="text-xs text-[#94A3B0]">Max 5MB</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
            </label>

            {/* Preview */}
            <div>
              <span className="text-xs text-[#94A3B0] block mb-3">Aperçu</span>
              <div className="w-[120px] h-[120px] rounded-full bg-[#475569] flex items-center justify-center mx-auto">
                {preview || form.photo ? (
                  <img src={preview || form.photo} alt="Preview" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserRound className="w-12 h-12 text-white/30" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-[#334155] flex justify-end gap-3">
        <button onClick={onClose} className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm text-white bg-transparent border border-[#475569] hover:bg-white/5 transition-colors">
          <X className="w-4 h-4" /> Annuler
        </button>
        <button onClick={onSave} disabled={uploading} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white bg-[#EA5800] hover:bg-[#d04d00] disabled:opacity-50 transition-colors shadow-lg">
          <Plus className="w-4 h-4" /> Enregistrer
        </button>
      </div>
    </ModalCard>
  );
}