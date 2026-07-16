import { Pencil, Upload, X } from "lucide-react";
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

interface MemberEditCardProps {
  form: MemberForm;
  setForm: Dispatch<SetStateAction<MemberForm>>;
  onClose: () => void;
  onSave: () => void;
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
    } catch (err) {
      console.error("Upload failed:", err);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const clearPhoto = () => {
    setForm({ ...form, photo: "" });
    setPreview(null);
  };

  return (
    <ModalCard title="Modifier adhérent" onClose={onClose}>
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
      </div>

      {/* Photo Upload */}
      <div className="mt-4">
        <label className="text-xs text-white/30 block mb-2">Photo (optionnelle)</label>
        <div className="flex items-center gap-3">
          {(preview || form.photo) ? (
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/10">
              <img src={preview || form.photo} alt="Photo" className="w-full h-full object-cover" />
              <button onClick={clearPhoto} className="absolute top-0 right-0 p-0.5 bg-red-500/80 rounded-full">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-[#f04e23] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-white/30" />
              )}
            </div>
          )}
          <label className="cursor-pointer px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/60 hover:text-white transition-colors">
            {uploading ? "Upload en cours..." : "Changer la photo"}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 rounded text-sm text-white bg-white/5 hover:bg-white/10 transition">Annuler</button>
        <button onClick={onSave} disabled={uploading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-[#f04e23] hover:bg-[#d94118] disabled:opacity-50 text-white transition-all">
          <Pencil className="w-3.5 h-3.5" /> Enregistrer
        </button>
      </div>
    </ModalCard>
  );
}