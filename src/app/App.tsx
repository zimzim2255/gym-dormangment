import { useState } from "react";
import {
  LayoutDashboard, Users, CreditCard, Shield, Clock, Package,
  ShoppingCart, Truck, UserCheck, Receipt, BarChart2, Settings,
  Search, Plus, Filter, Download, Printer, Eye, Pencil, Trash2,
  CheckCircle, XCircle, AlertTriangle, Bell, Menu,
  TrendingUp, TrendingDown, Activity, Fingerprint, QrCode,
  RefreshCw, BadgeCheck, Scan, ChevronRight, Wifi,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import MemberAddCard from "./components/erp/MemberAddCard";
import MemberEditCard from "./components/erp/MemberEditCard";
import SubscriptionAddCard from "./components/erp/SubscriptionAddCard";
import SubscriptionEditCard from "./components/erp/SubscriptionEditCard";
import StockAddCard from "./components/erp/StockAddCard";
import StockEditCard from "./components/erp/StockEditCard";
import SalesAddCard from "./components/erp/SalesAddCard";
import SalesEditCard from "./components/erp/SalesEditCard";
import PurchaseAddCard from "./components/erp/PurchaseAddCard";
import PurchaseEditCard from "./components/erp/PurchaseEditCard";
import SupplierAddCard from "./components/erp/SupplierAddCard";
import SupplierEditCard from "./components/erp/SupplierEditCard";
import StaffAddCard from "./components/erp/StaffAddCard";
import StaffEditCard from "./components/erp/StaffEditCard";
import ExpenseAddCard from "./components/erp/ExpenseAddCard";
import AccessControlPanel from "./components/door/AccessControlPanel";
import ExpenseEditCard from "./components/erp/ExpenseEditCard";

type ViewId =
  | "dashboard" | "members" | "subscriptions" | "access" | "history"
  | "stock" | "sales" | "purchases" | "suppliers" | "staff" | "expenses" | "reports" | "settings";

// ─── mock data ────────────────────────────────────────────────────────────────

const revenueData = [
  { month: "Août 24", rev: 42000, exp: 16000 },
  { month: "Sep", rev: 45000, exp: 17500 },
  { month: "Oct", rev: 38000, exp: 15000 },
  { month: "Nov", rev: 41000, exp: 16800 },
  { month: "Déc", rev: 52000, exp: 19000 },
  { month: "Jan 25", rev: 58000, exp: 21000 },
  { month: "Fév", rev: 54000, exp: 18500 },
  { month: "Mar", rev: 61000, exp: 22000 },
  { month: "Avr", rev: 47000, exp: 17000 },
  { month: "Mai", rev: 53000, exp: 19500 },
  { month: "Jun", rev: 49000, exp: 18000 },
  { month: "Jul", rev: 48500, exp: 18200 },
];

const newMembersData = [
  { month: "Août", val: 18 }, { month: "Sep", val: 24 },
  { month: "Oct", val: 12 }, { month: "Nov", val: 9 },
  { month: "Déc", val: 31 }, { month: "Jan", val: 42 },
  { month: "Fév", val: 27 }, { month: "Mar", val: 35 },
  { month: "Avr", val: 19 }, { month: "Mai", val: 22 },
  { month: "Jun", val: 16 }, { month: "Jul", val: 14 },
];

const entriesData = [
  { day: "Lun", val: 52 }, { day: "Mar", val: 41 },
  { day: "Mer", val: 67 }, { day: "Jeu", val: 45 },
  { day: "Ven", val: 73 }, { day: "Sam", val: 89 },
  { day: "Dim", val: 34 },
];

const salesChartData = [
  { month: "Mar", val: 3200 }, { month: "Avr", val: 2800 },
  { month: "Mai", val: 4100 }, { month: "Jun", val: 3600 },
  { month: "Jul", val: 2900 },
];

const MEMBERS = [
  { id: "ADH001", name: "Karim Benali", phone: "0661 234 567", cin: "AB123456", gender: "Homme", dob: "15/03/1992", joined: "10/01/2024", status: "Actif", email: "karim.benali@gmail.com", address: "Casablanca", emergencyContact: "Amina Benali", emergencyPhone: "0660 111 222", photo: "" },
  { id: "ADH002", name: "Fatima Zahra Alami", phone: "0662 345 678", cin: "CD234567", gender: "Femme", dob: "22/07/1998", joined: "05/02/2024", status: "Actif", email: "fz.alami@gmail.com", address: "Rabat", emergencyContact: "Othman Alami", emergencyPhone: "0660 222 333", photo: "" },
  { id: "ADH003", name: "Mohammed Idrissi", phone: "0663 456 789", cin: "EF345678", gender: "Homme", dob: "08/11/1985", joined: "20/11/2023", status: "Suspendu", email: "m.idrissi@outlook.com", address: "Marrakech", emergencyContact: "Leila Idrissi", emergencyPhone: "0660 333 444", photo: "" },
  { id: "ADH004", name: "Sara Benkirane", phone: "0664 567 890", cin: "GH456789", gender: "Femme", dob: "30/05/2001", joined: "15/03/2024", status: "Actif", email: "sara.bk@gmail.com", address: "Casablanca", emergencyContact: "Samir Benkirane", emergencyPhone: "0660 444 555", photo: "" },
  { id: "ADH005", name: "Youssef Tazi", phone: "0665 678 901", cin: "IJ567890", gender: "Homme", dob: "12/09/1995", joined: "28/01/2024", status: "Actif", email: "y.tazi@gmail.com", address: "Fes", emergencyContact: "Khadija Tazi", emergencyPhone: "0660 555 666", photo: "" },
  { id: "ADH006", name: "Nadia Chraibi", phone: "0666 789 012", cin: "KL678901", gender: "Femme", dob: "03/04/1988", joined: "10/12/2023", status: "Actif", email: "nadia.c@yahoo.fr", address: "Rabat", emergencyContact: "Omar Chraibi", emergencyPhone: "0660 666 777", photo: "" },
  { id: "ADH007", name: "Hamid Ouazzani", phone: "0667 890 123", cin: "MN789012", gender: "Homme", dob: "17/08/1993", joined: "02/04/2024", status: "Actif", email: "hamid.o@gmail.com", address: "Casablanca", emergencyContact: "Rachida Ouazzani", emergencyPhone: "0660 777 888", photo: "" },
  { id: "ADH008", name: "Laila Fassi", phone: "0668 901 234", cin: "OP890123", gender: "Femme", dob: "25/12/2000", joined: "18/02/2024", status: "Suspendu", email: "laila.f@gmail.com", address: "Agadir", emergencyContact: "Samir Fassi", emergencyPhone: "0660 888 999", photo: "" },
];

const SUBSCRIPTIONS = [
  { id: "AB001", member: "Karim Benali", phone: "0661 234 567", type: "Mensuel", start: "01/07/2025", end: "31/07/2025", price: 200, paid: 200, remaining: 0, status: "Payé", payment: "Espèces", observation: "" },
  { id: "AB002", member: "Fatima Zahra Alami", phone: "0662 345 678", type: "Trimestriel", start: "01/06/2025", end: "31/08/2025", price: 500, paid: 300, remaining: 200, status: "Paiement partiel", payment: "Virement", observation: "" },
  { id: "AB003", member: "Sara Benkirane", phone: "0664 567 890", type: "Annuel", start: "15/01/2025", end: "15/01/2026", price: 1600, paid: 1600, remaining: 0, status: "Payé", payment: "Carte", observation: "" },
  { id: "AB004", member: "Youssef Tazi", phone: "0665 678 901", type: "Semestriel", start: "01/04/2025", end: "01/10/2025", price: 900, paid: 0, remaining: 900, status: "Non payé", payment: "—", observation: "" },
  { id: "AB005", member: "Nadia Chraibi", phone: "0666 789 012", type: "Mensuel", start: "10/07/2025", end: "10/08/2025", price: 200, paid: 200, remaining: 0, status: "Payé", payment: "Espèces", observation: "" },
  { id: "AB006", member: "Hamid Ouazzani", phone: "0667 890 123", type: "Mensuel", start: "05/07/2025", end: "05/08/2025", price: 200, paid: 150, remaining: 50, status: "Paiement partiel", payment: "Espèces", observation: "" },
];

const ACCESS_LOG = [
  { date: "15/07/2025", time: "08:34", member: "Karim Benali", phone: "0661 234 567", type: "Mensuel", status: "Autorisé", remaining: 0, device: "SenseFace 3A" },
  { date: "15/07/2025", time: "09:12", member: "Fatima Zahra Alami", phone: "0662 345 678", type: "Trimestriel", status: "Paiement restant", remaining: 200, device: "SenseFace 3A" },
  { date: "15/07/2025", time: "09:45", member: "Sara Benkirane", phone: "0664 567 890", type: "Annuel", status: "Autorisé", remaining: 0, device: "QR Code" },
  { date: "15/07/2025", time: "10:22", member: "Nadia Chraibi", phone: "0666 789 012", type: "Mensuel", status: "Autorisé", remaining: 0, device: "Badge RFID" },
  { date: "15/07/2025", time: "11:08", member: "Hamid Ouazzani", phone: "0667 890 123", type: "Mensuel", status: "Paiement restant", remaining: 50, device: "SenseFace 3A" },
  { date: "15/07/2025", time: "11:55", member: "Youssef Tazi", phone: "0665 678 901", type: "Semestriel", status: "Expiré", remaining: 900, device: "SenseFace 3A" },
];

const PRODUCTS = [
  { code: "PRD001", name: "Shaker Protein", cat: "Accessoires", supplier: "FitSupply Maroc", buyPrice: 45, sellPrice: 80, qty: 23, minStock: 10, status: "En stock", photo: "" },
  { code: "PRD002", name: "Whey Protein 1kg", cat: "Nutrition", supplier: "NutriFit Casablanca", buyPrice: 180, sellPrice: 290, qty: 8, minStock: 15, status: "Stock bas", photo: "" },
  { code: "PRD003", name: "Corde à sauter Pro", cat: "Équipement", supplier: "SportGear MA", buyPrice: 30, sellPrice: 60, qty: 15, minStock: 5, status: "En stock", photo: "" },
  { code: "PRD004", name: "Gants de musculation", cat: "Accessoires", supplier: "FitSupply Maroc", buyPrice: 55, sellPrice: 120, qty: 2, minStock: 8, status: "Rupture", photo: "" },
  { code: "PRD005", name: "Créatine Monohydrate 300g", cat: "Nutrition", supplier: "NutriFit Casablanca", buyPrice: 90, sellPrice: 160, qty: 11, minStock: 10, status: "En stock", photo: "" },
  { code: "PRD006", name: "Bande élastique résistance", cat: "Équipement", supplier: "SportGear MA", buyPrice: 25, sellPrice: 50, qty: 3, minStock: 10, status: "Rupture", photo: "" },
];

const STAFF = [
  { name: "Amine Belhaj", phone: "0661 111 111", cin: "AA111111", role: "Coach Fitness", salary: 4500, hired: "01/03/2022", status: "Présent" },
  { name: "Imane Berrada", phone: "0662 222 222", cin: "BB222222", role: "Réceptionniste", salary: 3200, hired: "15/06/2023", status: "Présent" },
  { name: "Khalid Hajji", phone: "0663 333 333", cin: "CC333333", role: "Coach Cardio", salary: 4200, hired: "10/09/2021", status: "Absent" },
  { name: "Rim Amrani", phone: "0664 444 444", cin: "DD444444", role: "Coach Yoga", salary: 3800, hired: "20/01/2023", status: "Présent" },
  { name: "Omar Kettani", phone: "0665 555 555", cin: "EE555555", role: "Agent d'entretien", salary: 2800, hired: "05/11/2022", status: "Présent" },
];

const EXPENSES = [
  { cat: "Loyer", desc: "Loyer juillet 2025", amount: 8000, date: "01/07/2025", resp: "Amine Belhaj", note: "—" },
  { cat: "Électricité", desc: "Facture ONEE juin 2025", amount: 1450, date: "05/07/2025", resp: "Imane Berrada", note: "Hausse 10%" },
  { cat: "Internet", desc: "Abonnement fibre mensuel", amount: 350, date: "05/07/2025", resp: "Imane Berrada", note: "—" },
  { cat: "Paiement personnel", desc: "Salaires juillet 2025", amount: 18500, date: "10/07/2025", resp: "Amine Belhaj", note: "5 employés" },
  { cat: "Marketing", desc: "Campagne Instagram été", amount: 800, date: "12/07/2025", resp: "Imane Berrada", note: "—" },
  { cat: "Maintenance", desc: "Réparation tapis roulant T4", amount: 650, date: "14/07/2025", resp: "Omar Kettani", note: "Pièces + MO" },
];

const SUB_TYPES_DATA = [
  { code: "JOUR", name: "Journalier", duration: "1 jour", price: 30, desc: "Accès unique journée", status: "Actif" },
  { code: "MENS", name: "Mensuel", duration: "1 mois", price: 200, desc: "Accès illimité 1 mois", status: "Actif" },
  { code: "TRIM", name: "Trimestriel", duration: "3 mois", price: 500, desc: "3 mois économiques", status: "Actif" },
  { code: "SEMI", name: "Semestriel", duration: "6 mois", price: 900, desc: "6 mois à prix réduit", status: "Actif" },
  { code: "ANNU", name: "Annuel", duration: "12 mois", price: 1600, desc: "Meilleure valeur", status: "Actif" },
];

function downloadCSV(rows: any[], filename: string) {
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map(row => keys.map(key => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function computeEndDate(startDate: string, type: string) {
  const [day, month, year] = startDate.split("/").map(Number);
  if (!day || !month || !year) return "";
  const date = new Date(year, month - 1, day);
  const months = type === "Journalier" ? 0 : type === "Mensuel" ? 1 : type === "Trimestriel" ? 3 : type === "Semestriel" ? 6 : type === "Annuel" ? 12 : 0;
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  "Actif": "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  "Suspendu": "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  "Payé": "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  "Paiement partiel": "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  "Non payé": "bg-red-500/15 text-red-400 border border-red-500/20",
  "Autorisé": "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  "Expiré": "bg-red-500/15 text-red-400 border border-red-500/20",
  "Paiement restant": "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  "En stock": "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  "Stock bas": "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  "Rupture": "bg-red-500/15 text-red-400 border border-red-500/20",
  "Présent": "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  "Absent": "bg-red-500/15 text-red-400 border border-red-500/20",
};

function Badge({ s }: { s: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium font-mono ${STATUS_STYLES[s] ?? "bg-white/5 text-white/50 border border-white/10"}`}>
      {s}
    </span>
  );
}

function PageHeader({ title, count, actions }: { title: string; count?: number; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
      <div className="flex items-center gap-2.5">
        <h1 className="text-lg font-bold text-white">{title}</h1>
        {count !== undefined && (
          <span className="px-2 py-0.5 rounded bg-white/5 text-white/40 text-xs font-mono">{count}</span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function Btn({ children, variant = "default", onClick, disabled }: {
  children: React.ReactNode;
  variant?: "default" | "primary" | "ghost";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10",
    primary: "bg-[#f04e23] hover:bg-[#d94118] text-white",
    ghost: "hover:bg-white/5 text-white/40 hover:text-white",
  };
  return (
    <button className={`${base} ${variants[variant]}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function SearchInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f04e23]/40 w-60"
      />
    </div>
  );
}

function TH({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  );
}

function TR({ children, i }: { children: React.ReactNode; i: number }) {
  return (
    <tr className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${i % 2 !== 0 ? "bg-white/[0.01]" : ""}`}>
      {children}
    </tr>
  );
}

function TD({ children, mono, dim }: { children: React.ReactNode; mono?: boolean; dim?: boolean }) {
  return (
    <td className={`px-3 py-3 text-sm ${mono ? "font-mono text-xs" : ""} ${dim ? "text-white/50" : "text-white"}`}>
      {children}
    </td>
  );
}

function ActionIcons({ onEdit, onDelete, onView, onPrint }: { onEdit?: () => void; onDelete?: () => void; onView?: () => void; onPrint?: () => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {onView && <button onClick={onView} className="p-1.5 rounded hover:bg-white/10 text-white/30 hover:text-white transition-colors"><Eye className="w-3.5 h-3.5" /></button>}
      {onEdit && <button onClick={onEdit} className="p-1.5 rounded hover:bg-white/10 text-white/30 hover:text-white transition-colors"><Pencil className="w-3.5 h-3.5" /></button>}
      {onDelete && <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
      {onPrint && <button onClick={onPrint} className="p-1.5 rounded hover:bg-white/10 text-white/30 hover:text-white transition-colors"><Printer className="w-3.5 h-3.5" /></button>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

const KPI_DATA = [
  { label: "Total adhérents", value: "156", sub: "+14 ce mois", Icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
  { label: "Adhérents actifs", value: "134", sub: "85,9 % du total", Icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { label: "Abonnements expirés", value: "22", sub: "À renouveler", Icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
  { label: "Expirent aujourd'hui", value: "3", sub: "Notifier maintenant", Icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
  { label: "Paiements du jour", value: "2 400 DH", sub: "8 transactions", Icon: CreditCard, color: "text-violet-400", bg: "bg-violet-500/10" },
  { label: "Revenus du mois", value: "48 500 DH", sub: "+12 % vs mois dernier", Icon: TrendingUp, color: "text-[#f04e23]", bg: "bg-[#f04e23]/10" },
  { label: "Dépenses du mois", value: "18 200 DH", sub: "Loyer, salaires…", Icon: TrendingDown, color: "text-rose-400", bg: "bg-rose-500/10" },
  { label: "Bénéfice net", value: "30 300 DH", sub: "Marge 62,5 %", Icon: BadgeCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { label: "Entrées aujourd'hui", value: "47", sub: "Jusqu'à 13h00", Icon: Scan, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { label: "Ruptures de stock", value: "2", sub: "Gants, élastiques", Icon: Package, color: "text-red-400", bg: "bg-red-500/10" },
  { label: "Personnel présent", value: "4 / 5", sub: "1 absent aujourd'hui", Icon: UserCheck, color: "text-sky-400", bg: "bg-sky-500/10" },
];

const tooltipStyle = {
  contentStyle: { background: "#1a1e2c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, fontSize: 12 },
  labelStyle: { color: "rgba(255,255,255,0.5)" },
  cursor: { stroke: "rgba(255,255,255,0.08)" },
};

function Dashboard() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Tableau de bord</h1>
          <p className="text-white/30 text-xs mt-0.5 font-mono">Mardi 15 juillet 2025 — SportGym ERP</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
            <Bell className="w-4 h-4 text-white/40" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#f04e23]" />
          </button>
          <Btn variant="primary"><RefreshCw className="w-3.5 h-3.5" /> Actualiser</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {KPI_DATA.map(k => (
          <div key={k.label} className="bg-card border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors">
            <div className={`w-8 h-8 rounded-md ${k.bg} flex items-center justify-center mb-3`}>
              <k.Icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <div className="font-mono text-lg font-bold text-white leading-tight">{k.value}</div>
            <div className="text-xs text-white/35 font-medium mt-1 leading-snug">{k.label}</div>
            <div className="text-xs text-white/20 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-white/5 rounded-lg p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Revenus vs Dépenses</h3>
            <p className="text-xs text-white/25 font-mono mt-0.5">12 derniers mois (DH)</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f04e23" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f04e23" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toLocaleString()} DH`]} />
              <Area type="monotone" dataKey="rev" name="Revenus" stroke="#f04e23" fill="url(#gRev)" strokeWidth={2} />
              <Area type="monotone" dataKey="exp" name="Dépenses" stroke="#ef4444" fill="url(#gExp)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-white/5 rounded-lg p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Nouveaux adhérents</h3>
            <p className="text-xs text-white/25 font-mono mt-0.5">Inscriptions mensuelles</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={newMembersData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [v, "adhérents"]} />
              <Bar dataKey="val" name="Nouveaux" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-white/5 rounded-lg p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Entrées par jour</h3>
            <p className="text-xs text-white/25 font-mono mt-0.5">Cette semaine</p>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={entriesData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [v, "entrées"]} />
              <Line type="monotone" dataKey="val" name="Entrées" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-white/5 rounded-lg p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Ventes boutique</h3>
            <p className="text-xs text-white/25 font-mono mt-0.5">5 derniers mois (DH)</p>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={salesChartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toLocaleString()} DH`, "ventes"]} />
              <Bar dataKey="val" name="Ventes" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── MEMBERS ─────────────────────────────────────────────────────────────────

type Member = typeof MEMBERS[number];

function Members() {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState<Member>({
    id: "",
    name: "",
    phone: "",
    cin: "",
    gender: "Homme",
    dob: "",
    joined: "",
    status: "Actif",
    email: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    photo: "",
  });
  const [editForm, setEditForm] = useState<Member>(form);

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search)
  );

  const handleAdd = () => {
    const id = form.id || `ADH${String(members.length + 1).padStart(3, "0")}`;
    setMembers([{ ...form, id, joined: form.joined || new Date().toLocaleDateString("fr-FR") }, ...members]);
    setForm({
      id: "",
      name: "",
      phone: "",
      cin: "",
      gender: "Homme",
      dob: "",
      joined: "",
      status: "Actif",
      email: "",
      address: "",
      emergencyContact: "",
      emergencyPhone: "",
      photo: "",
    });
    setShowAdd(false);
  };

  const handleEditSave = () => {
    setMembers(members.map(member => member.id === editForm.id ? editForm : member));
    setShowEdit(false);
  };

  const openEdit = (member: Member) => {
    setEditForm(member);
    setShowEdit(true);
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Adhérents"
        count={members.length}
        actions={
          <>
            <SearchInput placeholder="Rechercher…" value={search} onChange={setSearch} />
            <Btn onClick={() => downloadCSV(filtered, "adhérents")}><Download className="w-3.5 h-3.5" /> Export</Btn>
            <Btn variant="primary" onClick={() => setShowAdd(prev => !prev)}><Plus className="w-3.5 h-3.5" /> {showAdd ? "Annuler" : "Ajouter"}</Btn>
          </>
        }
      />

      {showAdd && (
        <MemberAddCard form={form} setForm={setForm} onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}

      {showEdit && (
        <MemberEditCard form={editForm} setForm={setEditForm} onClose={() => setShowEdit(false)} onSave={handleEditSave} />
      )}

      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <TH>ID</TH><TH>Photo</TH><TH>Nom</TH><TH>Téléphone</TH><TH>CIN</TH><TH>Sexe</TH><TH>Naissance</TH><TH>Inscription</TH><TH>Statut</TH><TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <TR key={m.id} i={i}>
                <TD mono dim>{m.id}</TD>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#f04e23]/20 flex items-center justify-center text-sm font-bold text-[#f04e23]">{m.name.charAt(0)}</div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-white">{m.name}</div>
                      <div className="text-xs text-white/25 font-mono">{m.email}</div>
                    </div>
                  </div>
                </td>
                <TD mono dim>{m.phone}</TD>
                <TD mono dim>{m.cin}</TD>
                <TD dim>{m.gender}</TD>
                <TD mono dim>{m.dob}</TD>
                <TD mono dim>{m.joined}</TD>
                <td className="px-3 py-3"><Badge s={m.status} /></td>
                <td className="px-3 py-3">
                  <ActionIcons
                    onView={() => window.alert(`Profil de ${m.name} : ${m.address}, urgence ${m.emergencyContact} ${m.emergencyPhone}`)}
                    onEdit={() => openEdit(m)}
                    onDelete={() => setMembers(members.filter(item => item.id !== m.id))}
                    onPrint={() => window.alert("Imprimer fiche adhérent")}
                  />
                </td>
              </TR>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-white/20 text-sm">Aucun adhérent trouvé</div>
        )}
      </div>
    </div>
  );
}

// ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────

type Subscription = typeof SUBSCRIPTIONS[number];

function Subscriptions() {
  const [search, setSearch] = useState("");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(SUBSCRIPTIONS);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    id: "",
    member: "",
    phone: "",
    type: "Mensuel",
    start: new Date().toLocaleDateString("fr-FR"),
    end: "",
    price: 200,
    paid: 0,
    remaining: 200,
    status: "Non payé",
    payment: "Espèces",
    observation: "",
  });
  const [editForm, setEditForm] = useState(form);

  const filtered = subscriptions.filter(s =>
    s.member.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())
  );

  const updateSubscriptionType = (type: string, current: typeof form, setter: typeof setForm) => {
    const selected = SUB_TYPES_DATA.find(t => t.name === type);
    const end = computeEndDate(current.start, type);
    const price = selected?.price ?? current.price;
    const remaining = Math.max(0, price - current.paid);
    const status = remaining === 0 ? "Payé" : current.paid === 0 ? "Non payé" : "Paiement partiel";
    setter({ ...current, type, price, end, remaining, status });
  };

  const updateSubscriptionStart = (start: string, current: typeof form, setter: typeof setForm) => {
    const end = computeEndDate(start, current.type);
    setter({ ...current, start, end });
  };

  const updateSubscriptionPaid = (paid: number, current: typeof form, setter: typeof setForm) => {
    const remaining = Math.max(0, current.price - paid);
    const status = remaining === 0 ? "Payé" : paid === 0 ? "Non payé" : "Paiement partiel";
    setter({ ...current, paid, remaining, status });
  };

  const addSubscription = () => {
    const id = form.id || `AB${String(subscriptions.length + 1).padStart(3, "0")}`;
    setSubscriptions([{ ...form, id }, ...subscriptions]);
    setForm({
      id: "",
      member: "",
      phone: "",
      type: "Mensuel",
      start: new Date().toLocaleDateString("fr-FR"),
      end: computeEndDate(new Date().toLocaleDateString("fr-FR"), "Mensuel"),
      price: 200,
      paid: 0,
      remaining: 200,
      status: "Non payé",
      payment: "Espèces",
      observation: "",
    });
    setShowAdd(false);
  };

  const openEditSubscription = (subscription: Subscription) => {
    setEditForm(subscription);
    setShowEdit(true);
  };

  const handleEditSubscription = () => {
    setSubscriptions(subscriptions.map(item => item.id === editForm.id ? editForm : item));
    setShowEdit(false);
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Abonnements"
        count={subscriptions.length}
        actions={
          <>
            <SearchInput placeholder="Rechercher…" value={search} onChange={setSearch} />
            <Btn onClick={() => downloadCSV(filtered, "abonnements")}><Download className="w-3.5 h-3.5" /> Export</Btn>
            <Btn variant="primary" onClick={() => setShowAdd(prev => !prev)}><Plus className="w-3.5 h-3.5" /> {showAdd ? "Annuler" : "Nouvel abonnement"}</Btn>
          </>
        }
      />

      {showAdd && (
        <SubscriptionAddCard
          form={form}
          setForm={setForm}
          onClose={() => setShowAdd(false)}
          onSave={addSubscription}
          members={MEMBERS.map(member => member.name)}
          subTypes={SUB_TYPES_DATA}
          updateType={type => updateSubscriptionType(type, form, setForm)}
          updateStart={start => updateSubscriptionStart(start, form, setForm)}
          updatePaid={paid => updateSubscriptionPaid(paid, form, setForm)}
        />
      )}
      {showEdit && (
        <SubscriptionEditCard
          form={editForm}
          setForm={setEditForm}
          onClose={() => setShowEdit(false)}
          onSave={handleEditSubscription}
          members={MEMBERS.map(member => member.name)}
          subTypes={SUB_TYPES_DATA}
          updateType={type => updateSubscriptionType(type, editForm, setEditForm)}
          updateStart={start => updateSubscriptionStart(start, editForm, setEditForm)}
          updatePaid={paid => updateSubscriptionPaid(paid, editForm, setEditForm)}
        />
      )}

      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <TH>N°</TH><TH>Adhérent</TH><TH>Téléphone</TH><TH>Type</TH>
              <TH>Début</TH><TH>Fin</TH><TH>Prix</TH><TH>Payé</TH><TH>Reste</TH>
              <TH>Statut</TH><TH>Paiement</TH><TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <TR key={s.id} i={i}>
                <td className="px-3 py-3 font-mono text-xs text-[#f04e23]">{s.id}</td>
                <TD>{s.member}</TD>
                <TD mono dim>{s.phone}</TD>
                <td className="px-3 py-3">
                  <span className="px-2 py-0.5 rounded bg-[#f04e23]/10 text-[#f04e23] text-xs font-medium">{s.type}</span>
                </td>
                <TD mono dim>{s.start}</TD>
                <TD mono dim>{s.end}</TD>
                <td className="px-3 py-3 font-mono text-xs font-bold text-white">{s.price} DH</td>
                <td className="px-3 py-3 font-mono text-xs text-emerald-400">{s.paid} DH</td>
                <td className="px-3 py-3 font-mono text-xs text-red-400">{s.remaining > 0 ? `${s.remaining} DH` : "—"}</td>
                <td className="px-3 py-3"><Badge s={s.status} /></td>
                <TD dim>{s.payment}</TD>
                <td className="px-3 py-3">
                  <ActionIcons
                    onEdit={() => openEditSubscription(s)}
                    onDelete={() => setSubscriptions(subscriptions.filter(item => item.id !== s.id))}
                    onPrint={() => window.alert("Imprimer contrat / reçu")}
                  />
                </td>
              </TR>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ACCESS CONTROL ───────────────────────────────────────────────────────────

function AccessControl() {
  return <AccessControlPanel />;
}

// ─── ACCESS HISTORY ───────────────────────────────────────────────────────────

function AccessHistory() {
  const [search, setSearch] = useState("");
  const filtered = ACCESS_LOG.filter(a => a.member.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="p-6">
      <PageHeader
        title="Historique des accès"
        count={ACCESS_LOG.length}
        actions={
          <>
            <SearchInput placeholder="Rechercher…" value={search} onChange={setSearch} />
            <Btn><Download className="w-3.5 h-3.5" /> PDF</Btn>
            <Btn><Download className="w-3.5 h-3.5" /> Excel</Btn>
          </>
        }
      />
      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <TH>Date</TH><TH>Heure</TH><TH>Adhérent</TH><TH>Téléphone</TH>
              <TH>Abonnement</TH><TH>Statut</TH><TH>Reste</TH><TH>Appareil</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <TR key={i} i={i}>
                <TD mono dim>{a.date}</TD>
                <td className="px-3 py-3 font-mono text-xs text-[#f04e23]">{a.time}</td>
                <TD>{a.member}</TD>
                <TD mono dim>{a.phone}</TD>
                <td className="px-3 py-3">
                  <span className="px-2 py-0.5 rounded bg-[#f04e23]/10 text-[#f04e23] text-xs">{a.type}</span>
                </td>
                <td className="px-3 py-3"><Badge s={a.status} /></td>
                <td className="px-3 py-3 font-mono text-xs text-white/40">{a.remaining > 0 ? `${a.remaining} DH` : "—"}</td>
                <TD dim>{a.device}</TD>
              </TR>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── STOCK ────────────────────────────────────────────────────────────────────

function Stock({ products, setProducts }: { products: typeof PRODUCTS; setProducts: React.Dispatch<React.SetStateAction<typeof PRODUCTS>> }) {
  type Product = typeof PRODUCTS[number];
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState<Product>({
    code: "",
    name: "",
    cat: "",
    supplier: "",
    buyPrice: 0,
    sellPrice: 0,
    qty: 0,
    minStock: 1,
    status: "En stock",
    photo: "",
  });
  const [editForm, setEditForm] = useState<Product>(form);
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
  );
  const ruptures = products.filter(p => p.status === "Rupture" || p.status === "Stock bas").length;

  const addProduct = () => {
    const code = form.code || `PRD${String(products.length + 1).padStart(3, "0")}`;
    const status = form.qty <= 0 ? "Rupture" : form.qty < form.minStock ? "Stock bas" : "En stock";
    setProducts([{ ...form, code, status }, ...products]);
    setForm({ code: "", name: "", cat: "", supplier: "", buyPrice: 0, sellPrice: 0, qty: 0, minStock: 1, status: "En stock", photo: "" });
    setShowAdd(false);
  };

  const openEditProduct = (product: Product) => {
    setEditForm(product);
    setShowEdit(true);
  };

  const handleEditProduct = () => {
    setProducts(products.map(item => item.code === editForm.code ? editForm : item));
    setShowEdit(false);
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Stock & Produits"
        count={products.length}
        actions={
          <>
            {ruptures > 0 && (
              <div className="px-2.5 py-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                {ruptures} alerte{ruptures > 1 ? "s" : ""} stock
              </div>
            )}
            <SearchInput placeholder="Rechercher produit…" value={search} onChange={setSearch} />
            <Btn onClick={() => downloadCSV(filtered, "produits")}><Download className="w-3.5 h-3.5" /> Export</Btn>
            <Btn variant="primary" onClick={() => setShowAdd(prev => !prev)}><Plus className="w-3.5 h-3.5" /> {showAdd ? "Annuler" : "Ajouter produit"}</Btn>
          </>
        }
      />

      {showAdd && (
        <StockAddCard form={form} setForm={setForm} onClose={() => setShowAdd(false)} onSave={addProduct} />
      )}
      {showEdit && (
        <StockEditCard form={editForm} setForm={setEditForm} onClose={() => setShowEdit(false)} onSave={handleEditProduct} />
      )}

      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <TH>Code</TH><TH>Produit</TH><TH>Catégorie</TH><TH>Fournisseur</TH>
              <TH>Prix achat</TH><TH>Prix vente</TH><TH>Qté</TH><TH>Stock min</TH><TH>Statut</TH><TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <TR key={p.code} i={i}>
                <td className="px-3 py-3 font-mono text-xs text-[#f04e23]">{p.code}</td>
                <TD>{p.name}</TD>
                <TD dim>{p.cat}</TD>
                <TD dim>{p.supplier}</TD>
                <TD mono dim>{p.buyPrice} DH</TD>
                <td className="px-3 py-3 font-mono text-xs text-emerald-400">{p.sellPrice} DH</td>
                <td className="px-3 py-3 font-mono text-sm font-bold text-white">{p.qty}</td>
                <TD mono dim>{p.minStock}</TD>
                <td className="px-3 py-3"><Badge s={p.status} /></td>
                <td className="px-3 py-3"><ActionIcons onEdit={() => openEditProduct(p)} onDelete={() => setProducts(products.filter(item => item.code !== p.code))} /></td>
              </TR>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SALES ────────────────────────────────────────────────────────────────────

const SALES_DATA = [
  { id: "VNT001", date: "15/07/2025", client: "Karim Benali", product: "Shaker Protein", qty: 2, price: 80, total: 160, payment: "Espèces", emp: "Imane Berrada" },
  { id: "VNT002", date: "15/07/2025", client: "Sara Benkirane", product: "Whey Protein 1kg", qty: 1, price: 290, total: 290, payment: "Carte", emp: "Imane Berrada" },
  { id: "VNT003", date: "14/07/2025", client: "Hamid Ouazzani", product: "Gants musculation", qty: 1, price: 120, total: 120, payment: "Espèces", emp: "Amine Belhaj" },
  { id: "VNT004", date: "13/07/2025", client: "Nadia Chraibi", product: "Créatine 300g", qty: 1, price: 160, total: 160, payment: "Espèces", emp: "Imane Berrada" },
];

function Sales({ products, setProducts }: { products: typeof PRODUCTS; setProducts: React.Dispatch<React.SetStateAction<typeof PRODUCTS>> }) {
  type Sale = typeof SALES_DATA[number];
  const [search, setSearch] = useState("");
  const [sales, setSales] = useState<Sale[]>(SALES_DATA);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<Sale>({
    id: "",
    date: new Date().toLocaleDateString("fr-FR"),
    client: "",
    product: "",
    qty: 1,
    price: 0,
    total: 0,
    payment: "Espèces",
    emp: "",
  });
  const [form, setForm] = useState<Sale>({
    id: "",
    date: new Date().toLocaleDateString("fr-FR"),
    client: "",
    product: "",
    qty: 1,
    price: 0,
    total: 0,
    payment: "Espèces",
    emp: "",
  });

  const filtered = sales.filter(s =>
    s.client.toLowerCase().includes(search.toLowerCase()) ||
    s.product.toLowerCase().includes(search.toLowerCase())
  );

  const onQuantityChange = (qty: number) => setForm(prev => ({ ...prev, qty, total: qty * prev.price }));
  const onPriceChange = (price: number) => setForm(prev => ({ ...prev, price, total: price * prev.qty }));

  const addSale = () => {
    const id = form.id || `VNT${String(sales.length + 1).padStart(3, "0")}`;
    setSales([{ ...form, id }, ...sales]);
    setForm({
      id: "",
      date: new Date().toLocaleDateString("fr-FR"),
      client: "",
      product: "",
      qty: 1,
      price: 0,
      total: 0,
      payment: "Espèces",
      emp: "",
    });
    setShowAdd(false);
  };

  const updateSaleQuantity = (qty: number, current: Sale, setter: React.Dispatch<React.SetStateAction<Sale>>) => setter({ ...current, qty, total: qty * current.price });
  const updateSalePrice = (price: number, current: Sale, setter: React.Dispatch<React.SetStateAction<Sale>>) => setter({ ...current, price, total: price * current.qty });

  const openEditSale = (sale: Sale) => {
    setEditForm(sale);
    setShowEdit(true);
  };

  const handleEditSale = () => {
    setSales(sales.map(item => item.id === editForm.id ? editForm : item));
    setShowEdit(false);
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Ventes boutique"
        count={sales.length}
        actions={
          <>
            <SearchInput placeholder="Rechercher…" value={search} onChange={setSearch} />
            <Btn onClick={() => downloadCSV(filtered, "ventes")}><Download className="w-3.5 h-3.5" /> Export</Btn>
            <Btn variant="primary" onClick={() => setShowAdd(prev => !prev)}><Plus className="w-3.5 h-3.5" /> {showAdd ? "Annuler" : "Nouvelle vente"}</Btn>
          </>
        }
      />

      {showAdd && (
        <SalesAddCard
          form={form}
          setForm={setForm}
          onClose={() => setShowAdd(false)}
          onSave={addSale}
          products={PRODUCTS}
          onQuantityChange={qty => updateSaleQuantity(qty, form, setForm)}
          onPriceChange={price => updateSalePrice(price, form, setForm)}
        />
      )}
      {showEdit && (
        <SalesEditCard
          form={editForm}
          setForm={setEditForm}
          onClose={() => setShowEdit(false)}
          onSave={handleEditSale}
          products={PRODUCTS}
          onQuantityChange={qty => updateSaleQuantity(qty, editForm, setEditForm)}
          onPriceChange={price => updateSalePrice(price, editForm, setEditForm)}
        />
      )}

      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <TH>N° Vente</TH><TH>Date</TH><TH>Client</TH><TH>Produit</TH>
              <TH>Qté</TH><TH>Prix unit.</TH><TH>Total</TH><TH>Paiement</TH><TH>Employé</TH><TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <TR key={s.id} i={i}>
                <td className="px-3 py-3 font-mono text-xs text-[#f04e23]">{s.id}</td>
                <TD mono dim>{s.date}</TD>
                <TD>{s.client}</TD>
                <TD dim>{s.product}</TD>
                <TD mono dim>{s.qty}</TD>
                <TD mono dim>{s.price} DH</TD>
                <td className="px-3 py-3 font-mono text-xs font-bold text-emerald-400">{s.total} DH</td>
                <TD dim>{s.payment}</TD>
                <TD dim>{s.emp}</TD>
                <td className="px-3 py-3"><ActionIcons onEdit={() => openEditSale(s)} onDelete={() => setSales(sales.filter(item => item.id !== s.id))} /></td>
              </TR>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PURCHASES ────────────────────────────────────────────────────────────────

type Purchase = {
  id: string;
  supplier: string;
  product: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
  payment: string;
};

function Purchases({ products, setProducts }: { products: typeof PRODUCTS; setProducts: React.Dispatch<React.SetStateAction<typeof PRODUCTS>> }) {
  const [search, setSearch] = useState("");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<Purchase>({
    id: "",
    supplier: "",
    product: "",
    quantity: 1,
    price: 0,
    total: 0,
    date: new Date().toLocaleDateString("fr-FR"),
    payment: "Espèces",
  });
  const [form, setForm] = useState<Purchase>({
    id: "",
    supplier: "",
    product: "",
    quantity: 1,
    price: 0,
    total: 0,
    date: new Date().toLocaleDateString("fr-FR"),
    payment: "Espèces",
  });

  const filtered = purchases.filter(p =>
    p.supplier.toLowerCase().includes(search.toLowerCase()) ||
    p.product.toLowerCase().includes(search.toLowerCase())
  );

  const onQuantityChange = (quantity: number) => setForm(prev => ({ ...prev, quantity, total: quantity * prev.price }));
  const onPriceChange = (price: number) => setForm(prev => ({ ...prev, price, total: price * prev.quantity }));

  const addPurchase = () => {
    const id = form.id || `ACH${String(purchases.length + 1).padStart(3, "0")}`;
    setPurchases([{ ...form, id }, ...purchases]);
    setForm({
      id: "",
      supplier: "",
      product: "",
      quantity: 1,
      price: 0,
      total: 0,
      date: new Date().toLocaleDateString("fr-FR"),
      payment: "Espèces",
    });
    setShowAdd(false);
  };

  const updatePurchaseQuantity = (quantity: number, current: Purchase, setter: React.Dispatch<React.SetStateAction<Purchase>>) => setter({ ...current, quantity, total: quantity * current.price });
  const updatePurchasePrice = (price: number, current: Purchase, setter: React.Dispatch<React.SetStateAction<Purchase>>) => setter({ ...current, price, total: price * current.quantity });

  const openEditPurchase = (purchase: Purchase) => {
    setEditForm(purchase);
    setShowEdit(true);
  };

  const handleEditPurchase = () => {
    setPurchases(purchases.map(item => item.id === editForm.id ? editForm : item));
    setShowEdit(false);
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Achats"
        count={purchases.length}
        actions={
          <>
            <SearchInput placeholder="Rechercher…" value={search} onChange={setSearch} />
            <Btn onClick={() => downloadCSV(filtered, "achats")}><Download className="w-3.5 h-3.5" /> Excel</Btn>
            <Btn variant="primary" onClick={() => setShowAdd(prev => !prev)}><Plus className="w-3.5 h-3.5" /> Ajouter</Btn>
          </>
        }
      />

      {showAdd && (
        <PurchaseAddCard
          form={form}
          setForm={setForm}
          onClose={() => setShowAdd(false)}
          onSave={addPurchase}
          suppliers={SUPPLIERS_DATA}
          products={PRODUCTS}
          onQuantityChange={quantity => updatePurchaseQuantity(quantity, form, setForm)}
          onPriceChange={price => updatePurchasePrice(price, form, setForm)}
        />
      )}
      {showEdit && (
        <PurchaseEditCard
          form={editForm}
          setForm={setEditForm}
          onClose={() => setShowEdit(false)}
          onSave={handleEditPurchase}
          suppliers={SUPPLIERS_DATA}
          products={PRODUCTS}
          onQuantityChange={quantity => updatePurchaseQuantity(quantity, editForm, setEditForm)}
          onPriceChange={price => updatePurchasePrice(price, editForm, setEditForm)}
        />
      )}

      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <TH>Fournisseur</TH><TH>Produit</TH><TH>Quantité</TH><TH>Prix</TH><TH>Total</TH><TH>Date</TH><TH>Paiement</TH><TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <TR key={p.id} i={i}>
                <TD>{p.supplier}</TD>
                <TD>{p.product}</TD>
                <TD mono dim>{p.quantity}</TD>
                <TD mono dim>{p.price} DH</TD>
                <TD mono dim>{p.total} DH</TD>
                <TD mono dim>{p.date}</TD>
                <TD dim>{p.payment}</TD>
                <td className="px-3 py-3"><ActionIcons onEdit={() => openEditPurchase(p)} onDelete={() => setPurchases(purchases.filter(item => item.id !== p.id))} /></td>
              </TR>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SUPPLIERS ────────────────────────────────────────────────────────────────

const SUPPLIERS_DATA = [
  { name: "Anas Tahiri", company: "FitSupply Maroc SARL", phone: "0522 111 222", email: "contact@fitsupply.ma", city: "Casablanca", balance: 0 },
  { name: "Zineb Ouahbi", company: "NutriFit SAS", phone: "0522 333 444", email: "info@nutrifit.ma", city: "Casablanca", balance: 1200 },
  { name: "Rachid Filali", company: "SportGear Maroc SARL", phone: "0537 555 666", email: "vente@sportgear.ma", city: "Rabat", balance: 500 },
];

type Supplier = typeof SUPPLIERS_DATA[number];

function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(SUPPLIERS_DATA);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState<Supplier>({ name: "", company: "", phone: "", email: "", city: "", balance: 0 });
  const [editForm, setEditForm] = useState<Supplier>(form);

  const handleAdd = () => {
    setSuppliers([{ ...form }, ...suppliers]);
    setForm({ name: "", company: "", phone: "", email: "", city: "", balance: 0 });
    setShowAdd(false);
  };

  const openEdit = (supplier: Supplier) => {
    setEditForm(supplier);
    setShowEdit(true);
  };

  const handleEdit = () => {
    setSuppliers(suppliers.map(item => item.name === editForm.name ? editForm : item));
    setShowEdit(false);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Fournisseurs"
        count={suppliers.length}
        actions={
          <>
            <Btn onClick={() => downloadCSV(suppliers, "fournisseurs")}><Download className="w-3.5 h-3.5" /> Export</Btn>
            <Btn variant="primary" onClick={() => setShowAdd(prev => !prev)}><Plus className="w-3.5 h-3.5" /> Ajouter fournisseur</Btn>
          </>
        }
      />

      {showAdd && <SupplierAddCard form={form} setForm={setForm} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {showEdit && <SupplierEditCard form={editForm} setForm={setEditForm} onClose={() => setShowEdit(false)} onSave={handleEdit} />}

      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <TH>Nom</TH><TH>Société</TH><TH>Téléphone</TH><TH>Email</TH><TH>Ville</TH><TH>Solde</TH><TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s, i) => (
              <TR key={`${s.name}-${i}`} i={i}>
                <TD>{s.name}</TD>
                <TD dim>{s.company}</TD>
                <TD mono dim>{s.phone}</TD>
                <td className="px-3 py-3 text-sm text-blue-400">{s.email}</td>
                <TD dim>{s.city}</TD>
                <td className="px-3 py-3 font-mono text-xs font-bold text-white">{s.balance > 0 ? `${s.balance} DH` : "—"}</td>
                <td className="px-3 py-3"><ActionIcons onEdit={() => openEdit(s)} onDelete={() => setSuppliers(suppliers.filter(item => item.name !== s.name))} /></td>
              </TR>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── STAFF ────────────────────────────────────────────────────────────────────

function Staff() {
  type StaffMember = typeof STAFF[number];
  const [staff, setStaff] = useState<StaffMember[]>(STAFF);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState<StaffMember>({ name: "", phone: "", cin: "", role: "", salary: 0, hired: "", status: "Présent" });
  const [editForm, setEditForm] = useState<StaffMember>(form);

  const handleAdd = () => {
    setStaff([form, ...staff]);
    setForm({ name: "", phone: "", cin: "", role: "", salary: 0, hired: "", status: "Présent" });
    setShowAdd(false);
  };

  const openEdit = (staffMember: StaffMember) => {
    setEditForm(staffMember);
    setShowEdit(true);
  };

  const handleEdit = () => {
    setStaff(staff.map(item => item.cin === editForm.cin ? editForm : item));
    setShowEdit(false);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Personnel"
        count={staff.length}
        actions={
          <>
            <Btn onClick={() => downloadCSV(staff, "personnel")}><Download className="w-3.5 h-3.5" /> Export</Btn>
            <Btn variant="primary" onClick={() => setShowAdd(prev => !prev)}><Plus className="w-3.5 h-3.5" /> Ajouter employé</Btn>
          </>
        }
      />

      {showAdd && <StaffAddCard form={form} setForm={setForm} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {showEdit && <StaffEditCard form={editForm} setForm={setEditForm} onClose={() => setShowEdit(false)} onSave={handleEdit} />}

      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <TH>Employé</TH><TH>Téléphone</TH><TH>CIN</TH><TH>Poste</TH><TH>Salaire</TH><TH>Embauché le</TH><TH>Statut</TH><TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {staff.map((s, i) => (
              <TR key={s.cin} i={i}>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400 flex-shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <span className="font-medium text-white text-sm">{s.name}</span>
                  </div>
                </td>
                <TD mono dim>{s.phone}</TD>
                <TD mono dim>{s.cin}</TD>
                <TD dim>{s.role}</TD>
                <td className="px-3 py-3 font-mono text-xs font-bold text-emerald-400">{s.salary.toLocaleString()} DH</td>
                <TD mono dim>{s.hired}</TD>
                <td className="px-3 py-3"><Badge s={s.status} /></td>
                <td className="px-3 py-3"><ActionIcons onEdit={() => openEdit(s)} onDelete={() => setStaff(staff.filter(item => item.cin !== s.cin))} /></td>
              </TR>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── EXPENSES ─────────────────────────────────────────────────────────────────

function Expenses() {
  type Expense = typeof EXPENSES[number];
  const [expenses, setExpenses] = useState<Expense[]>(EXPENSES);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState<Expense>({ cat: "", desc: "", amount: 0, date: new Date().toLocaleDateString("fr-FR"), resp: "", note: "" });
  const [editForm, setEditForm] = useState<Expense>(form);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAdd = () => {
    setExpenses([form, ...expenses]);
    setForm({ cat: "", desc: "", amount: 0, date: new Date().toLocaleDateString("fr-FR"), resp: "", note: "" });
    setShowAdd(false);
  };

  const openEdit = (expense: Expense) => {
    setEditForm(expense);
    setShowEdit(true);
  };

  const handleEdit = () => {
    setExpenses(expenses.map(item => item.date === editForm.date && item.desc === editForm.desc ? editForm : item));
    setShowEdit(false);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Dépenses"
        actions={
          <>
            <div className="px-3 py-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono font-bold">
              Total : {total.toLocaleString()} DH
            </div>
            <Btn onClick={() => downloadCSV(expenses, "depenses")}><Download className="w-3.5 h-3.5" /> Export</Btn>
            <Btn variant="primary" onClick={() => setShowAdd(prev => !prev)}><Plus className="w-3.5 h-3.5" /> Ajouter dépense</Btn>
          </>
        }
      />

      {showAdd && <ExpenseAddCard form={form} setForm={setForm} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {showEdit && <ExpenseEditCard form={editForm} setForm={setEditForm} onClose={() => setShowEdit(false)} onSave={handleEdit} />}

      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <TH>Catégorie</TH><TH>Désignation</TH><TH>Montant</TH><TH>Date</TH><TH>Responsable</TH><TH>Observation</TH><TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e, i) => (
              <TR key={`${e.date}-${i}`} i={i}>
                <td className="px-3 py-3">
                  <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 text-xs font-medium">{e.cat}</span>
                </td>
                <TD>{e.desc}</TD>
                <td className="px-3 py-3 font-mono text-sm font-bold text-red-400">{e.amount.toLocaleString()} DH</td>
                <TD mono dim>{e.date}</TD>
                <TD dim>{e.resp}</TD>
                <TD dim>{e.note}</TD>
                <td className="px-3 py-3"><ActionIcons onEdit={() => openEdit(e)} onDelete={() => setExpenses(expenses.filter((item, index) => index !== i))} /></td>
              </TR>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

const REPORT_ITEMS = [
  { name: "Revenus mensuels", desc: "Synthèse des recettes par mois", Icon: TrendingUp, color: "text-[#f04e23]", bg: "bg-[#f04e23]/10" },
  { name: "Dépenses détaillées", desc: "Toutes les dépenses par catégorie", Icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10" },
  { name: "Bénéfices nets", desc: "Revenus moins dépenses", Icon: BadgeCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { name: "Abonnements actifs", desc: "Liste des abonnements en cours", Icon: CreditCard, color: "text-blue-400", bg: "bg-blue-500/10" },
  { name: "Paiements reçus", desc: "Historique complet des paiements", Icon: Receipt, color: "text-violet-400", bg: "bg-violet-500/10" },
  { name: "Adhérents actifs", desc: "Membres avec abonnement valide", Icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { name: "Abonnements expirés", desc: "Membres à relancer en priorité", Icon: XCircle, color: "text-amber-400", bg: "bg-amber-500/10" },
  { name: "Présences", desc: "Journal d'accès complet", Icon: Clock, color: "text-sky-400", bg: "bg-sky-500/10" },
  { name: "Ventes boutique", desc: "Rapport des ventes produits", Icon: ShoppingCart, color: "text-pink-400", bg: "bg-pink-500/10" },
  { name: "État du stock", desc: "Inventaire et alertes de rupture", Icon: Package, color: "text-lime-400", bg: "bg-lime-500/10" },
  { name: "Salaires", desc: "Fiches de paie du personnel", Icon: UserCheck, color: "text-indigo-400", bg: "bg-indigo-500/10" },
];

function Reports() {
  return (
    <div className="p-6">
      <PageHeader title="Rapports" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORT_ITEMS.map(r => (
          <div key={r.name} className="bg-card border border-white/5 hover:border-white/10 rounded-lg p-4 flex items-start gap-3.5 cursor-pointer group transition-all hover:translate-y-[-1px]">
            <div className={`p-2.5 rounded-lg ${r.bg} flex-shrink-0`}>
              <r.Icon className={`w-5 h-5 ${r.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm mb-0.5 group-hover:text-[#f04e23] transition-colors">{r.name}</div>
              <div className="text-xs text-white/35 leading-relaxed">{r.desc}</div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/35 transition-colors"><Printer className="w-3.5 h-3.5" /></button>
              <button className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/35 transition-colors"><Download className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

function SettingsView() {
  const [prices, setPrices] = useState(SUB_TYPES_DATA.map(t => ({ ...t })));

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <PageHeader title="Paramètres" />

      <div className="bg-card border border-white/5 rounded-lg p-5">
        <h3 className="font-semibold text-white mb-1">Tarifs des abonnements</h3>
        <p className="text-xs text-white/30 mb-4">Modifiez les prix sans toucher au reste du système</p>
        <div className="space-y-2.5">
          {prices.map((t, i) => (
            <div key={t.code} className="flex items-center gap-4 p-3 bg-white/3 rounded-lg">
              <div className="w-14 font-mono text-xs text-[#f04e23]">{t.code}</div>
              <div className="flex-1">
                <div className="font-medium text-white text-sm">{t.name}</div>
                <div className="text-xs text-white/25">{t.duration} — {t.desc}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={t.price}
                  onChange={e => {
                    const updated = [...prices];
                    updated[i] = { ...updated[i], price: Number(e.target.value) };
                    setPrices(updated);
                  }}
                  className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-white font-mono text-right focus:outline-none focus:border-[#f04e23]/40"
                />
                <span className="text-xs text-white/30">DH</span>
              </div>
              <Badge s={t.status} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Btn variant="primary"><CheckCircle className="w-3.5 h-3.5" /> Sauvegarder les tarifs</Btn>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-lg p-5">
        <h3 className="font-semibold text-white mb-1">Gestion des utilisateurs</h3>
        <p className="text-xs text-white/30 mb-4">Comptes administrateurs et opérateurs</p>
        <div className="space-y-2.5">
          {[
            { user: "admin", role: "Administrateur", email: "admin@sportgym.ma" },
            { user: "reception", role: "Réceptionniste", email: "reception@sportgym.ma" },
          ].map(u => (
            <div key={u.user} className="flex items-center gap-3.5 p-3 bg-white/3 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[#f04e23]/20 flex items-center justify-center text-sm font-bold text-[#f04e23]">
                {u.user.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium text-white text-sm">{u.user}</div>
                <div className="text-xs text-white/25 font-mono">{u.email}</div>
              </div>
              <span className="text-xs text-white/40">{u.role}</span>
              <Badge s="Actif" />
              <button className="p-1.5 rounded hover:bg-white/10 text-white/25 hover:text-white transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Btn variant="primary"><Plus className="w-3.5 h-3.5" /> Créer un utilisateur</Btn>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-lg p-5">
        <h3 className="font-semibold text-white mb-1">Terminal SenseFace 3A</h3>
        <p className="text-xs text-white/30 mb-4">Configuration du contrôle d'accès biométrique</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Adresse IP", value: "192.168.1.100" },
            { label: "Port", value: "4370" },
            { label: "Modèle", value: "SenseFace 3A" },
            { label: "Protocole", value: "PUSH / TCP-IP" },
          ].map(item => (
            <div key={item.label} className="flex flex-col gap-1.5">
              <label className="text-xs text-white/30">{item.label}</label>
              <input
                defaultValue={item.value}
                className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white font-mono focus:outline-none focus:border-[#f04e23]/40"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Btn><Wifi className="w-3.5 h-3.5" /> Tester connexion</Btn>
          <Btn variant="primary"><CheckCircle className="w-3.5 h-3.5" /> Sauvegarder</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

type NavItem = { id: ViewId; label: string; Icon: React.ElementType; group?: string };

const NAV: NavItem[] = [
  { id: "dashboard", label: "Tableau de bord", Icon: LayoutDashboard },
  { id: "members", label: "Adhérents", Icon: Users, group: "Gestion" },
  { id: "subscriptions", label: "Abonnements", Icon: CreditCard, group: "Gestion" },
  { id: "access", label: "Contrôle d'accès", Icon: Shield, group: "Accès" },
  { id: "history", label: "Historique accès", Icon: Clock, group: "Accès" },
  { id: "stock", label: "Stock & Produits", Icon: Package, group: "Boutique" },
  { id: "sales", label: "Ventes", Icon: ShoppingCart, group: "Boutique" },
  { id: "purchases", label: "Achats", Icon: Truck, group: "Boutique" },
  { id: "suppliers", label: "Fournisseurs", Icon: Truck, group: "Boutique" },
  { id: "staff", label: "Personnel", Icon: UserCheck, group: "RH & Finance" },
  { id: "expenses", label: "Dépenses", Icon: Receipt, group: "RH & Finance" },
  { id: "reports", label: "Rapports", Icon: BarChart2, group: "RH & Finance" },
  { id: "settings", label: "Paramètres", Icon: Settings },
];

function Sidebar({ view, setView }: { view: ViewId; setView: (v: ViewId) => void }) {
  const [collapsed, setCollapsed] = useState(false);

  const groups: { name?: string; items: NavItem[] }[] = [];
  let last: (typeof groups)[0] | null = null;
  for (const item of NAV) {
    if (!last || item.group !== last.name) {
      last = { name: item.group, items: [] };
      groups.push(last);
    }
    last.items.push(item);
  }

  return (
    <div
      className={`flex flex-col h-full border-r border-white/5 transition-all duration-300 flex-shrink-0 ${collapsed ? "w-14" : "w-52"}`}
      style={{ background: "#060810" }}
    >
      <div className={`flex items-center gap-2.5 border-b border-white/5 py-4 ${collapsed ? "px-3 justify-center" : "px-4"}`}>
        <div className="w-7 h-7 rounded-lg bg-[#f04e23] flex items-center justify-center flex-shrink-0">
          <Activity className="w-3.5 h-3.5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm leading-tight">SportGym</div>
            <div className="text-xs text-white/25 font-mono">ERP v1.0</div>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded hover:bg-white/10 text-white/25 hover:text-white transition-colors"
          >
            <Menu className="w-3.5 h-3.5" />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="p-1 rounded hover:bg-white/10 text-white/25 hover:text-white transition-colors"
          >
            <Menu className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.name && !collapsed && (
              <div className="px-2 pt-4 pb-1 text-xs font-semibold text-white/15 uppercase tracking-widest">{g.name}</div>
            )}
            {g.name && collapsed && gi > 0 && <div className="my-1 border-t border-white/5" />}
            {g.items.map(item => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 py-2 rounded-lg text-sm font-medium transition-all ${collapsed ? "justify-center px-2" : "px-2.5"} ${
                    active
                      ? "bg-[#f04e23]/12 text-[#f04e23]"
                      : "text-white/35 hover:text-white/70 hover:bg-white/5"
                  }`}
                >
                  <item.Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate text-[13px]">{item.label}</span>
                      {active && <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-60" />}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#f04e23]/20 flex items-center justify-center text-xs font-bold text-[#f04e23]">A</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">Admin</div>
              <div className="text-xs text-white/25 font-mono truncate">admin@sportgym.ma</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<ViewId>("dashboard");
  const [products, setProducts] = useState(PRODUCTS);

  const renderView = () => {
    switch (view) {
      case "dashboard": return <Dashboard />;
      case "members": return <Members />;
      case "subscriptions": return <Subscriptions />;
      case "access": return <AccessControl />;
      case "history": return <AccessHistory />;
      case "stock": return <Stock products={products} setProducts={setProducts} />;
      case "sales": return <Sales products={products} setProducts={setProducts} />;
      case "purchases": return <Purchases products={products} setProducts={setProducts} />;
      case "suppliers": return <Suppliers />;
      case "staff": return <Staff />;
      case "expenses": return <Expenses />;
      case "reports": return <Reports />;
      case "settings": return <SettingsView />;
      default: return <Dashboard />;
    }
  };

  return (
    <div
      className="flex h-screen overflow-hidden bg-background text-foreground"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Sidebar view={view} setView={setView} />
      <main className="flex-1 overflow-auto">
        {renderView()}
      </main>
    </div>
  );
}
