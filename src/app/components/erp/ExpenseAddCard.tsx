import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Receipt, FileText, DollarSign, Calendar, User, MessageSquare, Truck, Briefcase, Building2, Phone, CreditCard, Upload, CheckCircle, X } from "lucide-react";
import ModalCard from "../ui/ModalCard";
import { InputField, SelectField, FormActions } from "../ui/FormField";
import ChequeSelector from "../door/ChequeSelector";
import ChequeAddCard from "../door/ChequeAddCard";

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";

async function boutiqueApi(type: string, data?: any) {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/boutique-manager`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ type, ...data }),
    });
    if (res.ok) return await res.json();
    return null;
  } catch { return null; }
}

type ExpenseForm = { cat: string; desc: string; amount: number; date: string; resp: string; note: string; };
interface ExpenseAddCardProps {
  form: ExpenseForm;
  setForm: Dispatch<SetStateAction<ExpenseForm>>;
  onClose: () => void;
  onSave: (extraData?: any) => void;
  suppliers?: any[];
  staff?: any[];
  members?: { id: string; name: string }[];
}

export default function ExpenseAddCard({ form, setForm, onClose, onSave, suppliers = [], staff = [], members = [] }: ExpenseAddCardProps) {
  const [step, setStep] = useState<"select" | "fournisseur" | "employe" | "autre">("select");
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("Espèces");
  const [chequeId, setChequeId] = useState("");
  const [selectedCheque, setSelectedCheque] = useState<any>(null);
  const [showChequeAdd, setShowChequeAdd] = useState(false);
  const [chequeForm, setChequeForm] = useState({ chequeId: "", memberId: "", memberName: "", amount: 0, date: "", dateEcheance: "", photo: "", status: "En_attente" });
  const [photo, setPhoto] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleSave = () => {
    const extraData: any = { payment: paymentMethod, chequeId: selectedCheque?.cheque_id, photo };
    if (step === "fournisseur" && selectedSupplier) {
      extraData.expense_type = "fournisseur";
      extraData.supplier_name = selectedSupplier.name;
      extraData.supplier_company = selectedSupplier.company;
      extraData.cat = `Fournisseur: ${selectedSupplier.name}`;
      extraData.resp = selectedSupplier.name;
    } else if (step === "employe" && selectedStaff) {
      extraData.expense_type = "employe";
      extraData.staff_name = selectedStaff.name;
      extraData.staff_cin = selectedStaff.cin;
      extraData.cat = `Employé: ${selectedStaff.name}`;
      extraData.resp = selectedStaff.name;
    }
    onSave(extraData);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${FUNCTIONS_URL}/cloudinary-upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setPhoto(data.url || data.secure_url || "");
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
    setUploading(false);
  };

  if (step === "select") {
    return (
      <ModalCard title="" onClose={onClose}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center"><Receipt className="w-6 h-6 text-white" /></div>
          <div>
            <h2 className="text-xl font-bold text-white">Ajouter dépense</h2>
            <p className="text-sm text-[#94A3B0] mt-0.5">Choisissez le type de dépense.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <button onClick={() => setStep("fournisseur")} className="bg-card border border-white/10 rounded-xl p-6 hover:border-[#EA5800]/40 hover:bg-white/[0.02] transition-all text-left group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
              <Truck className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Fournisseur</h3>
            <p className="text-sm text-white/40">Paiement à un fournisseur</p>
          </button>
          <button onClick={() => setStep("employe")} className="bg-card border border-white/10 rounded-xl p-6 hover:border-[#EA5800]/40 hover:bg-white/[0.02] transition-all text-left group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
              <Briefcase className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Employé</h3>
            <p className="text-sm text-white/40">Salaire ou avance employé</p>
          </button>
          <button onClick={() => setStep("autre")} className="bg-card border border-white/10 rounded-xl p-6 hover:border-[#EA5800]/40 hover:bg-white/[0.02] transition-all text-left group">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
              <FileText className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Autre</h3>
            <p className="text-sm text-white/40">Loyer, électricité, etc.</p>
          </button>
        </div>
      </ModalCard>
    );
  }

  if (step === "fournisseur") {
    return (
      <ModalCard title="" onClose={onClose}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center"><Truck className="w-6 h-6 text-blue-400" /></div>
          <div>
            <h2 className="text-xl font-bold text-white">Dépense Fournisseur</h2>
            <p className="text-sm text-[#94A3B0] mt-0.5">Sélectionnez un fournisseur et saisissez le montant.</p>
          </div>
        </div>
        <div className="space-y-4">
          {/* Supplier Select */}
          <div>
            <label className="block text-xs text-[#94A3B0] mb-1.5 font-medium">Fournisseur</label>
            <select
              value={selectedSupplier?.name || ""}
              onChange={e => {
                const s = suppliers.find((s: any) => s.name === e.target.value);
                setSelectedSupplier(s || null);
              }}
              className="w-full px-3 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#EA5800]"
            >
              <option value="">Sélectionner un fournisseur</option>
              {suppliers.map((s: any) => (
                <option key={s.id || s.name} value={s.name}>{s.name} — {s.company}</option>
              ))}
            </select>
          </div>

          {/* Supplier Info (read-only) */}
          {selectedSupplier && (
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-white/30" />
                <span className="text-white/50">Société:</span>
                <span className="text-white font-medium">{selectedSupplier.company}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-white/30" />
                <span className="text-white/50">Téléphone:</span>
                <span className="text-white font-medium">{selectedSupplier.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-white/30" />
                <span className="text-white/50">Ville:</span>
                <span className="text-white font-medium">{selectedSupplier.city || "—"}</span>
              </div>
            </div>
          )}

          {/* Amount */}
          <InputField label="Montant (DH)" icon={DollarSign} type="number" value={form.amount} onChange={v => setForm({ ...form, amount: v as number })} placeholder="0" />

          {/* Date */}
          <InputField label="Date" icon={Calendar} value={form.date} onChange={v => setForm({ ...form, date: v as string })} placeholder="jj/mm/aaaa" />

          {/* Payment Method */}
          <SelectField label="Paiement" icon={CreditCard} value={paymentMethod} onChange={v => setPaymentMethod(v)} options={[
            { value: "Espèces", label: "Espèces" },
            { value: "Chèque", label: "Chèque" },
            { value: "Virement", label: "Virement" },
          ]} />

          {/* Cheque Selector */}
          {paymentMethod === "Chèque" && (
            <ChequeSelector selectedChequeId={chequeId} onSelect={(c) => { setSelectedCheque(c); setChequeId(c?.cheque_id || ""); }} onCreateNew={() => setShowChequeAdd(true)} />
          )}

          {/* File Upload */}
          <div>
            <label className="block text-xs text-[#94A3B0] mb-1.5 font-medium">Pièce jointe</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-white/60 hover:text-white cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                {uploading ? "Upload..." : "Choisir un fichier"}
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
              </label>
              {photo && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Fichier attaché
                  <button onClick={() => setPhoto("")} className="text-white/30 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <InputField label="Description" icon={MessageSquare} value={form.desc} onChange={v => setForm({ ...form, desc: v as string })} placeholder="Motif du paiement" />
        </div>
        <FormActions onCancel={onClose} onSave={handleSave} saveLabel="Enregistrer la dépense" />
        {showChequeAdd && (
          <ChequeAddCard form={chequeForm} setForm={setChequeForm} onClose={() => setShowChequeAdd(false)} onSave={async () => {
            const r = await boutiqueApi("cheque-create", chequeForm);
            if (r?.cheque) { setSelectedCheque(r.cheque); setChequeId(r.cheque.cheque_id); setShowChequeAdd(false); }
          }} members={members} />
        )}
      </ModalCard>
    );
  }

  if (step === "employe") {
    return (
      <ModalCard title="" onClose={onClose}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Briefcase className="w-6 h-6 text-emerald-400" /></div>
          <div>
            <h2 className="text-xl font-bold text-white">Dépense Employé</h2>
            <p className="text-sm text-[#94A3B0] mt-0.5">Sélectionnez un employé et saisissez le montant.</p>
          </div>
        </div>
        <div className="space-y-4">
          {/* Staff Select */}
          <div>
            <label className="block text-xs text-[#94A3B0] mb-1.5 font-medium">Employé</label>
            <select
              value={selectedStaff?.name || ""}
              onChange={e => {
                const s = staff.find((s: any) => s.name === e.target.value);
                setSelectedStaff(s || null);
              }}
              className="w-full px-3 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#EA5800]"
            >
              <option value="">Sélectionner un employé</option>
              {staff.map((s: any) => (
                <option key={s.cin} value={s.name}>{s.name} — {s.role}</option>
              ))}
            </select>
          </div>

          {/* Staff Info (read-only) */}
          {selectedStaff && (
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-white/30" />
                <span className="text-white/50">CIN:</span>
                <span className="text-white font-medium">{selectedStaff.cin}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-white/30" />
                <span className="text-white/50">Téléphone:</span>
                <span className="text-white font-medium">{selectedStaff.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-white/30" />
                <span className="text-white/50">Poste:</span>
                <span className="text-white font-medium">{selectedStaff.role || "—"}</span>
              </div>
            </div>
          )}

          {/* Amount */}
          <InputField label="Montant (DH)" icon={DollarSign} type="number" value={form.amount} onChange={v => setForm({ ...form, amount: v as number })} placeholder="0" />

          {/* Date */}
          <InputField label="Date" icon={Calendar} value={form.date} onChange={v => setForm({ ...form, date: v as string })} placeholder="jj/mm/aaaa" />

          {/* Payment Method */}
          <SelectField label="Paiement" icon={CreditCard} value={paymentMethod} onChange={v => setPaymentMethod(v)} options={[
            { value: "Espèces", label: "Espèces" },
            { value: "Chèque", label: "Chèque" },
            { value: "Virement", label: "Virement" },
          ]} />

          {/* Cheque Selector */}
          {paymentMethod === "Chèque" && (
            <ChequeSelector selectedChequeId={chequeId} onSelect={(c) => { setSelectedCheque(c); setChequeId(c?.cheque_id || ""); }} onCreateNew={() => setShowChequeAdd(true)} />
          )}

          {/* File Upload */}
          <div>
            <label className="block text-xs text-[#94A3B0] mb-1.5 font-medium">Pièce jointe</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-white/60 hover:text-white cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                {uploading ? "Upload..." : "Choisir un fichier"}
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
              </label>
              {photo && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Fichier attaché
                  <button onClick={() => setPhoto("")} className="text-white/30 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <InputField label="Description" icon={MessageSquare} value={form.desc} onChange={v => setForm({ ...form, desc: v as string })} placeholder="Motif du paiement" />
        </div>
        <FormActions onCancel={onClose} onSave={handleSave} saveLabel="Enregistrer la dépense" />
        {showChequeAdd && (
          <ChequeAddCard form={chequeForm} setForm={setChequeForm} onClose={() => setShowChequeAdd(false)} onSave={async () => {
            const r = await boutiqueApi("cheque-create", chequeForm);
            if (r?.cheque) { setSelectedCheque(r.cheque); setChequeId(r.cheque.cheque_id); setShowChequeAdd(false); }
          }} members={members} />
        )}
      </ModalCard>
    );
  }

  // Autre - keep original simple form
  return (
    <ModalCard title="" onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#EA5800] flex items-center justify-center"><Receipt className="w-6 h-6 text-white" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">Ajouter dépense</h2>
          <p className="text-sm text-[#94A3B0] mt-0.5">Enregistrez une nouvelle dépense.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InputField label="Catégorie" icon={FileText} value={form.cat} onChange={v => setForm({ ...form, cat: v as string })} placeholder="Ex: Loyer, Électricité..." />
        <InputField label="Désignation" icon={MessageSquare} value={form.desc} onChange={v => setForm({ ...form, desc: v as string })} placeholder="Ex: Loyer juillet 2025" />
        <InputField label="Montant (DH)" icon={DollarSign} type="number" value={form.amount} onChange={v => setForm({ ...form, amount: v as number })} placeholder="0" />
        <InputField label="Date" icon={Calendar} value={form.date} onChange={v => setForm({ ...form, date: v as string })} placeholder="jj/mm/aaaa" />
        <InputField label="Responsable" icon={User} value={form.resp} onChange={v => setForm({ ...form, resp: v as string })} placeholder="Nom responsable" />
        <InputField label="Observation" icon={MessageSquare} value={form.note} onChange={v => setForm({ ...form, note: v as string })} placeholder="Note optionnelle" />
      </div>
      <FormActions onCancel={onClose} onSave={handleSave} />
    </ModalCard>
  );
}