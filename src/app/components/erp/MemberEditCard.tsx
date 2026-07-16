import { Pencil, User, Phone, Mail, CreditCard, Calendar, MapPin, Upload, UserRound, Image } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import ModalCard from "../ui/ModalCard";
import { InputField, SelectField, FormActions } from "../ui/FormField";
import { uploadMemberPhoto } from "../../services/cloudinaryService";

type MemberForm = {
  id: string; name: string; phone: string; cin: string; gender: string;
  dob: string; joined: string; status: string; email: string; address: string;
  emergencyContact: string; emergencyPhone: string; photo: string;
};

interface MemberEditCardProps {
  form: MemberForm; setForm: Dispatch<SetStateAction<MemberForm>>;
  onClose: () => void; onSave: () => void;
}

export default function MemberEditCard({ form, setForm, onClose, onSave }: MemberEditCardProps) {
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
    } catch { setPreview(null); }
    finally { setUploading(false); }
  };

  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center flex-shrink-0">
          <Pencil className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Modifier adhérent</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Modifiez les informations de l'adhérent.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#EA5800]" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Informations personnelles</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InputField label="Nom complet" icon={User} value={form.name} onChange={v => setForm({ ...form, name: v as string })} placeholder="Ex: Karim Benali" />
            <InputField label="Téléphone" icon={Phone} value={form.phone} onChange={v => setForm({ ...form, phone: v as string })} placeholder="Ex: 0661 234 567" />
            <InputField label="Email" icon={Mail} value={form.email} onChange={v => setForm({ ...form, email: v as string })} placeholder="Ex: karim.benali@gmail.com" />
            <InputField label="CIN" icon={CreditCard} value={form.cin} onChange={v => setForm({ ...form, cin: v as string })} placeholder="Ex: AB123456" />
            <SelectField label="Sexe" icon={User} value={form.gender} onChange={v => setForm({ ...form, gender: v })} options={[{ value: "Homme", label: "Homme" }, { value: "Femme", label: "Femme" }]} />
            <InputField label="Date de naissance" icon={Calendar} value={form.dob} onChange={v => setForm({ ...form, dob: v as string })} placeholder="jj/mm/aaaa" />
          </div>
          <div className="mt-4">
            <InputField label="Adresse" icon={MapPin} value={form.address} onChange={v => setForm({ ...form, address: v as string })} placeholder="Ex: 123, Rue Mohammed V, Fès" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact urgence</h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Contact urgence" icon={Phone} value={form.emergencyContact} onChange={v => setForm({ ...form, emergencyContact: v as string })} placeholder="Ex: Fatima Benali" />
            <InputField label="Téléphone urgence" icon={Phone} value={form.emergencyPhone} onChange={v => setForm({ ...form, emergencyPhone: v as string })} placeholder="Ex: 0661 234 567" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-4 h-4 text-[#EA5800]" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Photo de profil (optionnelle)</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
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

      <FormActions onCancel={onClose} onSave={onSave} saving={uploading} saveLabel="Modifier" />
    </ModalCard>
  );
}