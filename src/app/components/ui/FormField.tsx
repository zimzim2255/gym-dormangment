import { X } from "lucide-react";

interface FormFieldProps {
  icon?: any;
  value: string | number;
  onChange: (v: any) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
  readOnly?: boolean;
  min?: number;
}

export function InputField({ icon: Icon, value, onChange, placeholder, required, type = "text", readOnly, min }: FormFieldProps) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        min={min}
        className={`w-full ${Icon ? "pl-10" : "pl-3"} pr-3 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] placeholder-[#94A3B0]/50 focus:outline-none focus:border-[#EA5800] transition-colors ${readOnly ? "opacity-50" : ""}`}
      />
      {required && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EA5800] text-lg">*</span>}
    </div>
  );
}

interface SelectFieldProps {
  icon?: any;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({ icon: Icon, value, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 z-10">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full ${Icon ? "pl-10" : "pl-3"} pr-3 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#EA5800] transition-colors appearance-none`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

interface FormActionsProps {
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
}

export function FormActions({ onCancel, onSave, saving, saveLabel = "Enregistrer", cancelLabel = "Annuler" }: FormActionsProps) {
  return (
    <div className="mt-8 pt-6 border-t border-[#334155] flex justify-end gap-3">
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm text-white bg-transparent border border-[#475569] hover:bg-white/5 transition-colors"
      >
        <X className="w-4 h-4" /> {cancelLabel}
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white bg-[#EA5800] hover:bg-[#d04d00] disabled:opacity-50 transition-colors shadow-lg"
      >
        {saveLabel}
      </button>
    </div>
  );
}