import { useState } from "react";
import { Package, Tag, Truck, DollarSign, ShoppingCart, Image, Upload, CheckCircle, X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import ModalCard from "../ui/ModalCard";
import { InputField, SelectField, FormActions } from "../ui/FormField";

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";

type StockForm = { code: string; name: string; cat: string; supplier: string; buyPrice: number; sellPrice: number; qty: number; minStock: number; status: string; photo: string; };
interface StockAddCardProps {
  form: StockForm; setForm: Dispatch<SetStateAction<StockForm>>;
  onClose: () => void; onSave: () => void;
  suppliers?: string[];
  categories?: string[];
}

export default function StockAddCard({ form, setForm, onClose, onSave, suppliers = [], categories = [] }: StockAddCardProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${FUNCTIONS_URL}/cloudinary-upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setForm({ ...form, photo: data.url || data.secure_url || "" });
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
    setUploading(false);
  };

  // Preview if photo URL exists
  const hasPhoto = form.photo && form.photo.length > 0;

  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center"><Package className="w-6 h-6 text-white" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">Ajouter produit</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Ajoutez un nouveau produit au stock.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InputField label="Nom du produit" icon={Tag} value={form.name} onChange={v => setForm({ ...form, name: v as string })} placeholder="Ex: Shaker Protein" />
        <div>
          <label className="block text-xs text-[#94A3B0] mb-1.5 font-medium">Catégorie</label>
          <input list="cat-suggestions" value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} placeholder="Ex: Accessoires" className="w-full pl-3 pr-3 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] placeholder-[#94A3B0]/50 focus:outline-none focus:border-[#EA5800] transition-colors" />
          <datalist id="cat-suggestions">
            {categories.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <SelectField label="Fournisseur" icon={Truck} value={form.supplier} onChange={v => setForm({ ...form, supplier: v })} options={suppliers.map(s => ({ value: s, label: s }))} placeholder="Sélectionner fournisseur" />
        <InputField label="Prix achat (DH)" icon={DollarSign} type="number" value={form.buyPrice} onChange={v => setForm({ ...form, buyPrice: v as number })} placeholder="0" />
        <InputField label="Prix vente (DH)" icon={DollarSign} type="number" value={form.sellPrice} onChange={v => setForm({ ...form, sellPrice: v as number })} placeholder="0" />
        <InputField label="Quantité" icon={ShoppingCart} type="number" value={form.qty} onChange={v => setForm({ ...form, qty: v as number, status: (v as number) <= 0 ? "Rupture" : (v as number) < form.minStock ? "Stock bas" : "En stock" })} placeholder="0" />
        <InputField label="Stock minimum" icon={Package} type="number" value={form.minStock} onChange={v => setForm({ ...form, minStock: v as number })} placeholder="1" />

        {/* Photo Upload */}
        <div className="col-span-3">
          <label className="block text-xs text-[#94A3B0] mb-1.5 font-medium">Photo du produit</label>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-white/60 hover:text-white cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              {uploading ? "Upload..." : "Choisir une photo"}
              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
            </label>
            {hasPhoto && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                  <img src={form.photo} alt="Aperçu" className="w-full h-full object-cover" />
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-white/50">Photo ajoutée</span>
                <button onClick={() => setForm({ ...form, photo: "" })} className="text-white/30 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <FormActions onCancel={onClose} onSave={onSave} />
    </ModalCard>
  );
}
