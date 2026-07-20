import { useState, useEffect } from "react";

import {
  LayoutDashboard, Users, CreditCard, Shield, Clock, Package,
  ShoppingCart, Truck, UserCheck, Receipt, BarChart2, Settings,
  Search, Plus, Filter, Download, Printer, Eye, Pencil, Trash2,
  CheckCircle, XCircle, AlertTriangle, Bell, Menu,
  TrendingUp, TrendingDown, Activity, Fingerprint, QrCode,
  RefreshCw, BadgeCheck, Scan, ChevronRight, Wifi, DollarSign,
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
import CaissePanel from "./components/door/CaissePanel";
import ChequePanel from "./components/door/ChequePanel";
import { getAccessLogs } from "./services/doorService";
import ExpenseEditCard from "./components/erp/ExpenseEditCard";

type ViewId =
  | "dashboard" | "members" | "subscriptions" | "access" | "history"
  | "stock" | "sales" | "purchases" | "suppliers" | "staff" | "expenses" | "reports" | "settings" | "caisse" | "cheques" | "attendance";

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

function TH({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider whitespace-nowrap ${className ?? ""}`}>
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
    <div className="flex items-center justify-end gap-3">
      {onView && <button onClick={onView} className="hover:opacity-70 transition-opacity text-white/40 hover:text-white" title="Voir"><Eye className="w-[18px] h-[18px]" /></button>}
      {onEdit && <button onClick={onEdit} className="hover:opacity-70 transition-opacity text-white/40 hover:text-white" title="Modifier"><Pencil className="w-[18px] h-[18px]" /></button>}
      {onDelete && <button onClick={onDelete} className="hover:opacity-70 transition-opacity text-white/40 hover:text-red-400" title="Supprimer"><Trash2 className="w-[18px] h-[18px]" /></button>}
      {onPrint && <button onClick={onPrint} className="hover:opacity-70 transition-opacity text-white/40 hover:text-white" title="Imprimer"><Printer className="w-[18px] h-[18px]" /></button>}
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

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";

async function api(type: string, data?: any) {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/member-manager`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ type, ...data }),
    });
    if (res.ok) return await res.json();
    throw new Error("API error");
  } catch { return null; }
}

async function boutiqueApi(type: string, data?: any) {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/boutique-manager`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ type, ...data }),
    });
    if (res.ok) return await res.json();
    throw new Error("API error");
  } catch { return null; }
}

// ─── MEMBERS ─────────────────────────────────────────────────────────────────

type Member = typeof MEMBERS[number];

function Members() {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState<Member>({
    id: "", name: "", phone: "", cin: "", gender: "Homme", dob: "",
    joined: "", status: "Actif", email: "", address: "",
    emergencyContact: "", emergencyPhone: "", photo: "",
  });
  const [editForm, setEditForm] = useState<Member>(form);

  // Load members from Supabase on mount
  useEffect(() => {
    (async () => {
      const data = await api("list");
      if (data?.members) {
        setMembers(data.members.map((m: any) => ({
          id: m.id, name: m.name, phone: m.phone || "",
          cin: m.cin || "", gender: m.gender || "Homme",
          dob: m.dob || "", joined: m.joined || "", status: m.status,
          email: m.email || "", address: m.address || "",
          emergencyContact: m.emergency_contact || "",
          emergencyPhone: m.emergency_phone || "",
          photo: m.photo || "",
        })));
      }
    })();
  }, []);

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.id?.toLowerCase().includes(search.toLowerCase()) ||
    m.phone?.includes(search)
  );

  const handleAdd = async () => {
    const result = await api("create", {
      id: form.id, name: form.name, phone: form.phone, email: form.email,
      cin: form.cin, gender: form.gender, dob: form.dob,
      joined: form.joined || new Date().toLocaleDateString("fr-FR"),
      address: form.address, emergencyContact: form.emergencyContact,
      emergencyPhone: form.emergencyPhone, photo: form.photo,
      status: "Actif",
    });
    if (result?.member) {
      const m = result.member;
      setMembers([{
        id: m.id, name: m.name, phone: m.phone || "",
        cin: m.cin || "", gender: m.gender || "Homme",
        dob: m.dob || "", joined: m.joined || "", status: m.status,
        email: m.email || "", address: m.address || "",
        emergencyContact: m.emergency_contact || "",
        emergencyPhone: m.emergency_phone || "",
        photo: m.photo || "",
      }, ...members]);
    }
    setForm({ id: "", name: "", phone: "", cin: "", gender: "Homme", dob: "",
      joined: "", status: "Actif", email: "", address: "",
      emergencyContact: "", emergencyPhone: "", photo: "" });
    setShowAdd(false);
  };

  const handleEditSave = async () => {
    const result = await api("update", {
      id: editForm.id, name: editForm.name, phone: editForm.phone,
      email: editForm.email, cin: editForm.cin, gender: editForm.gender,
      dob: editForm.dob, joined: editForm.joined, address: editForm.address,
      emergencyContact: editForm.emergencyContact,
      emergencyPhone: editForm.emergencyPhone, photo: editForm.photo,
      status: editForm.status,
    });
    if (result?.success) {
      setMembers(members.map(m => m.id === editForm.id ? editForm : m));
    }
    setShowEdit(false);
  };

  const handleDelete = async (id: string) => {
    await api("delete", { id });
    setMembers(members.filter(m => m.id !== id));
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
              <TH>ID</TH><TH>Photo</TH><TH>Téléphone</TH><TH>CIN</TH><TH>Sexe</TH><TH>Naissance</TH><TH>Inscription</TH><TH>Statut</TH><TH>Actions</TH>
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
                    onDelete={() => handleDelete(m.id)}
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

type Subscription = {
  id: string; member: string; phone: string; type: string; start: string;
  end: string; price: number; paid: number; remaining: number;
  status: string; payment: string; observation: string;
};

async function subApi(type: string, data?: any) {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/subscription-manager`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ type, ...data }),
    });
    if (res.ok) return await res.json();
    throw new Error("API error");
  } catch { return null; }
}

function Subscriptions() {
  const [search, setSearch] = useState("");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const today = new Date().toLocaleDateString("fr-FR");
  const [form, setForm] = useState({
    id: "", member: "", phone: "", type: "Mensuel",
    start: today, end: computeEndDate(today, "Mensuel"),
    price: 200, paid: 0, remaining: 200, status: "Non payé",
    payment: "Espèces", observation: "",
  });
  const [editForm, setEditForm] = useState(form);

  // Load subscriptions from Supabase on mount
  const [memberNames, setMemberNames] = useState<{ id: string; name: string; phone: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [subData, memberData] = await Promise.all([subApi("list"), api("list")]);
      if (subData?.subscriptions) setSubscriptions(subData.subscriptions);
      if (memberData?.members) setMemberNames(memberData.members.map((m: any) => ({ id: m.id, name: m.name, phone: m.phone || "" })));
    })();
  }, []);

  const filtered = subscriptions.filter(s =>
    s.member?.toLowerCase().includes(search.toLowerCase()) ||
    s.id?.toLowerCase().includes(search.toLowerCase())
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

  const addSubscription = async () => {
    // Map member name to member ID if possible
    const selectedMember = memberNames.find(m => m.name === form.member);
    const memberId = selectedMember?.id || form.member;

    const result = await subApi("create", {
      memberId, subType: form.type,
      subStart: form.start, subEnd: form.end,
      price: form.price, paid: form.paid,
    });
    if (result?.subscription) {
      const s = result.subscription;
      const newSub: Subscription = {
        id: s.id, member: form.member, phone: form.phone, type: s.sub_type,
        start: s.sub_start, end: s.sub_end, price: s.price, paid: s.paid,
        remaining: s.remaining, status: s.sub_status, payment: form.payment, observation: "",
      };
      setSubscriptions([newSub, ...subscriptions]);
    }
    setForm({ id: "", member: "", phone: "", type: "Mensuel",
      start: new Date().toLocaleDateString("fr-FR"), end: "",
      price: 200, paid: 0, remaining: 200, status: "Non payé",
      payment: "Espèces", observation: "" });
    setShowAdd(false);
  };

  const openEditSubscription = (subscription: Subscription) => {
    setEditForm(subscription);
    setShowEdit(true);
  };

  const handleEditSubscription = async () => {
    const result = await subApi("update", {
      id: editForm.id, sub_type: editForm.type,
      sub_start: editForm.start, sub_end: editForm.end,
      price: editForm.price, paid: editForm.paid,
    });
    if (result?.success) {
      setSubscriptions(subscriptions.map(item => item.id === editForm.id ? editForm : item));
    }
    setShowEdit(false);
  };

  const handleDeleteSubscription = async (id: string) => {
    await subApi("delete", { id });
    setSubscriptions(subscriptions.filter(item => item.id !== id));
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
          members={memberNames.map(m => m.name)}
          subTypes={SUB_TYPES_DATA}
          updateType={type => updateSubscriptionType(type, form, setForm)}
          updateStart={start => updateSubscriptionStart(start, form, setForm)}
          updatePaid={paid => updateSubscriptionPaid(paid, form, setForm)}
          onMemberChange={(name: string) => {
            const m = memberNames.find(x => x.name === name);
            setForm({ ...form, member: name, phone: m?.phone || "" });
          }}
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
                    onDelete={() => handleDeleteSubscription(s.id)}
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
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getAccessLogs({ limit: showAll ? 200 : 50 });
      if (data.logs) setLogs(data.logs);
      setLoading(false);
    })();
  }, [showAll]);

  const filtered = logs.filter((a: any) =>
    a.member_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.method?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <PageHeader
        title="Historique des accès"
        count={logs.length}
        actions={
          <>
            <SearchInput placeholder="Rechercher…" value={search} onChange={setSearch} />
            <Btn onClick={() => setShowAll(!showAll)}>
              {showAll ? "Récent" : "Tout"}
            </Btn>
            <Btn onClick={() => downloadCSV(filtered, "acces")}>
              <Download className="w-3.5 h-3.5" /> Export
            </Btn>
          </>
        }
      />
      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <TH>Date</TH><TH>Heure</TH><TH>Adhérent</TH><TH>Téléphone</TH>
              <TH>Méthode</TH><TH>Statut</TH><TH>Reste</TH><TH>Appareil</TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-white/20 text-sm">Chargement...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-white/20 text-sm">Aucun accès enregistré</td>
              </tr>
            ) : filtered.map((a: any, i: number) => (
              <TR key={a.id || i} i={i}>
                <TD mono dim>{a.date}</TD>
                <td className="px-3 py-3 font-mono text-xs text-[#f04e23]">{a.time}</td>
                <TD>{a.member_name}</TD>
                <TD mono dim>{a.phone || "—"}</TD>
                <td className="px-3 py-3">
                  <span className="text-xs text-white/40 font-mono">{a.method}</span>
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

function Stock() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [supplierNames, setSupplierNames] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", cat: "", supplier: "", buyPrice: 0, sellPrice: 0, qty: 0, minStock: 1, status: "En stock", photo: "" });
  const [editForm, setEditForm] = useState<any>(form);
  const [employeeName, setEmployeeName] = useState(() => localStorage.getItem("stock_employee") || "");

  useEffect(() => {
    (async () => {
      const [prodData, suppData] = await Promise.all([
        boutiqueApi("product-list"),
        boutiqueApi("supplier-list"),
      ]);
      if (prodData?.products) setProducts(prodData.products);
      if (suppData?.suppliers) setSupplierNames(suppData.suppliers.map((s: any) => s.name));
      // Auto-detect employee name from staff list (first staff member by default)
      const staffData = await boutiqueApi("staff-list");
      if (staffData?.staff?.length > 0 && !localStorage.getItem("stock_employee")) {
        setEmployeeName(staffData.staff[0].name);
        localStorage.setItem("stock_employee", staffData.staff[0].name);
      }
    })();
  }, []);

  const filtered = products.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase())
  );
  const ruptures = products.filter((p: any) => p.status === "Rupture" || p.status === "Stock bas").length;

  const addProduct = async () => {
    if (!employeeName) return;
    const r = await boutiqueApi("product-create", { ...form, code: form.code || undefined, updated_by: employeeName });
    if (r?.product) {
      setProducts([r.product, ...products]);
    }
    setForm({ code: "", name: "", cat: "", supplier: "", buyPrice: 0, sellPrice: 0, qty: 0, minStock: 1, status: "En stock", photo: "" });
    setShowAdd(false);
  };

  const openEditProduct = (product: any) => { setEditForm(product); setShowEdit(true); };

  const handleEditProduct = async () => {
    if (!employeeName) return;
    const r = await boutiqueApi("product-update", { ...editForm, updated_by: employeeName });
    if (r?.success) {
      setProducts(products.map((p: any) => p.code === editForm.code ? editForm : p));
    }
    setShowEdit(false);
  };

  const handleDeleteProduct = async (code: string) => {
    if (!employeeName) return;
    await boutiqueApi("product-delete", { code });
    setProducts(products.filter((p: any) => p.code !== code));
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Stock & Produits"
        count={products.length}
        actions={
          <>
            {employeeName && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#f04e23]/10 border border-[#f04e23]/20">
                <UserCheck className="w-3.5 h-3.5 text-[#f04e23]" />
                <span className="text-xs text-[#f04e23] font-medium">{employeeName}</span>
              </div>
            )}
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
        <StockAddCard
          form={form} setForm={setForm} onClose={() => setShowAdd(false)} onSave={addProduct}
          suppliers={supplierNames}
          categories={products.map((p: any) => p.cat).filter(Boolean).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)}
        />
      )}
      {showEdit && (
        <StockEditCard form={editForm} setForm={setEditForm} onClose={() => setShowEdit(false)} onSave={handleEditProduct} />
      )}

      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <TH>Photo</TH><TH>Code</TH><TH>Produit</TH><TH>Catégorie</TH><TH>Fournisseur</TH>
              <TH>Prix achat</TH><TH>Prix vente</TH><TH>Qté</TH><TH>Stock min</TH><TH>Statut</TH><TH>Employé</TH><TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <TR key={p.code} i={i}>
                <td className="px-3 py-3">
                  {p.photo ? (
                    <img src={p.photo} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                      <Package className="w-5 h-5 text-white/20" />
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 font-mono text-xs text-[#f04e23]">{p.code}</td>
                <TD>{p.name}</TD>
                <TD dim>{p.cat}</TD>
                <TD dim>{p.supplier}</TD>
                <TD mono dim>{p.buyPrice} DH</TD>
                <td className="px-3 py-3 font-mono text-xs text-emerald-400">{p.sellPrice} DH</td>
                <td className="px-3 py-3 font-mono text-sm font-bold text-white">{p.qty}</td>
                <TD mono dim>{p.minStock}</TD>
                <td className="px-3 py-3"><Badge s={p.status} /></td>
                <TD dim>{p.updated_by || "—"}</TD>
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

function Sales() {
  const [search, setSearch] = useState("");
  const [sales, setSales] = useState<any[]>([]);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<any>({ id: "", date: "", client: "", product: "", productCode: "", qty: 1, price: 0, total: 0, payment: "Espèces", emp: "" });
  const [form, setForm] = useState<any>({ id: "", date: new Date().toLocaleDateString("fr-FR"), client: "", product: "", productCode: "", qty: 1, price: 0, total: 0, payment: "Espèces", emp: "" });
  // Cheque state
  const [selectedCheque, setSelectedCheque] = useState<any>(null);
  const [showChequeAdd, setShowChequeAdd] = useState(false);
  const [chequeForm, setChequeForm] = useState({ chequeId: "", memberId: "", memberName: "", amount: 0, date: "", dateEcheance: "", photo: "", status: "En_attente" });

  useEffect(() => {
    (async () => {
      const [saleData, prodData, memberData] = await Promise.all([
        boutiqueApi("sale-list"),
        boutiqueApi("product-list"),
        api("list"),
      ]);
      if (saleData?.sales) setSales(saleData.sales);
      if (prodData?.products) setProductOptions(prodData.products);
      if (memberData?.members) setMembers(memberData.members.map((m: any) => ({ id: m.id, name: m.name })));
    })();
  }, []);

  const filtered = sales.filter((s: any) =>
    s.client?.toLowerCase().includes(search.toLowerCase()) || s.product?.toLowerCase().includes(search.toLowerCase())
  );

  const onQuantityChange = (qty: number) => setForm((prev: any) => ({ ...prev, qty, total: qty * prev.price }));
  const onPriceChange = (price: number) => setForm((prev: any) => ({ ...prev, price, total: price * prev.qty }));

  const addSale = async () => {
    const r = await boutiqueApi("sale-create", { ...form, chequeId: selectedCheque?.cheque_id });
    if (r?.sale) setSales([r.sale, ...sales]);
    setForm({ id: "", date: new Date().toLocaleDateString("fr-FR"), client: "", product: "", productCode: "", qty: 1, price: 0, total: 0, payment: "Espèces", emp: "" });
    setSelectedCheque(null);
    setShowAdd(false);
  };

  const updateSaleQuantity = (qty: number, current: any, setter: any) => setter({ ...current, qty, total: qty * current.price });
  const updateSalePrice = (price: number, current: any, setter: any) => setter({ ...current, price, total: price * current.qty });

  const openEditSale = (sale: any) => { setEditForm(sale); setShowEdit(true); };

  const handleEditSale = async () => {
    const r = await boutiqueApi("sale-update", editForm);
    if (r?.success) setSales(sales.map((item: any) => item.id === editForm.id ? editForm : item));
    setShowEdit(false);
  };

  const handleDeleteSale = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette vente ?")) return;
    await boutiqueApi("sale-delete", { id });
    setSales(sales.filter((item: any) => item.id !== id));
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
          products={productOptions}
          onQuantityChange={qty => updateSaleQuantity(qty, form, setForm)}
          onPriceChange={price => updateSalePrice(price, form, setForm)}
          chequeId={selectedCheque?.cheque_id}
          onChequeSelect={setSelectedCheque}
          chequeForm={chequeForm}
          setChequeForm={setChequeForm}
          showChequeAdd={showChequeAdd}
          onOpenChequeAdd={() => setShowChequeAdd(true)}
          onCloseChequeAdd={() => setShowChequeAdd(false)}
          onSaveCheque={async () => {
            const r = await boutiqueApi("cheque-create", chequeForm);
            if (r?.cheque) {
              setSelectedCheque(r.cheque);
              setShowChequeAdd(false);
            }
          }}
          members={members}
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
                <td className="px-3 py-3"><ActionIcons onEdit={() => openEditSale(s)} onDelete={() => handleDeleteSale(s.id)} /></td>
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

function Purchases() {
  const [search, setSearch] = useState("");
  const [purchases, setPurchases] = useState<any[]>([]);
  const [supplierNames, setSupplierNames] = useState<string[]>([]);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<any>({ id: "", supplier: "", supplierCompany: "", product: "", productCode: "", quantity: 1, price: 0, total: 0, date: "", payment: "Espèces" });
  const [form, setForm] = useState<any>({ id: "", supplier: "", supplierCompany: "", product: "", productCode: "", quantity: 1, price: 0, total: 0, date: new Date().toLocaleDateString("fr-FR"), payment: "Espèces" });
  // Cheque state
  const [selectedCheque, setSelectedCheque] = useState<any>(null);
  const [showChequeAdd, setShowChequeAdd] = useState(false);
  const [chequeForm, setChequeForm] = useState({ chequeId: "", memberId: "", memberName: "", amount: 0, date: "", dateEcheance: "", photo: "", status: "En_attente" });

  useEffect(() => {
    (async () => {
      const [purData, suppData, prodData, memberData] = await Promise.all([
        boutiqueApi("purchase-list"),
        boutiqueApi("supplier-list"),
        boutiqueApi("product-list"),
        api("list"),
      ]);
      if (purData?.purchases) setPurchases(purData.purchases);
      if (suppData?.suppliers) setSupplierNames(suppData.suppliers.map((s: any) => s.name));
      if (prodData?.products) setProductOptions(prodData.products);
      if (memberData?.members) setMembers(memberData.members.map((m: any) => ({ id: m.id, name: m.name })));
    })();
  }, []);

  const filtered = purchases.filter((p: any) =>
    (p.supplier || p.supplier_name)?.toLowerCase().includes(search.toLowerCase()) ||
    p.product?.toLowerCase().includes(search.toLowerCase())
  );

  const onQuantityChange = (quantity: number) => setForm((prev: any) => ({ ...prev, quantity, total: quantity * prev.price }));
  const onPriceChange = (price: number) => setForm((prev: any) => ({ ...prev, price, total: price * prev.quantity }));

  const addPurchase = async () => {
    const r = await boutiqueApi("purchase-create", { ...form, supplierCompany: form.supplier, chequeId: selectedCheque?.cheque_id });
    if (r?.purchase) {
      const p = r.purchase;
      setPurchases([{ ...p, supplier: p.supplier_name || form.supplier }, ...purchases]);
    }
    setForm({ id: "", supplier: "", supplierCompany: "", product: "", productCode: "", quantity: 1, price: 0, total: 0, date: new Date().toLocaleDateString("fr-FR"), payment: "Espèces" });
    setSelectedCheque(null);
    setShowAdd(false);
  };

  const updatePurchaseQuantity = (quantity: number, current: any, setter: any) => setter({ ...current, quantity, total: quantity * current.price });
  const updatePurchasePrice = (price: number, current: any, setter: any) => setter({ ...current, price, total: price * current.quantity });

  const openEditPurchase = (purchase: any) => { setEditForm(purchase); setShowEdit(true); };
  const handleEditPurchase = async () => {
    const r = await boutiqueApi("purchase-update", editForm);
    if (r?.success) setPurchases(purchases.map((item: any) => item.id === editForm.id ? editForm : item));
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
          suppliers={supplierNames}
          products={productOptions}
          onQuantityChange={quantity => updatePurchaseQuantity(quantity, form, setForm)}
          onPriceChange={price => updatePurchasePrice(price, form, setForm)}
          chequeId={selectedCheque?.cheque_id}
          onChequeSelect={setSelectedCheque}
          chequeForm={chequeForm}
          setChequeForm={setChequeForm}
          showChequeAdd={showChequeAdd}
          onOpenChequeAdd={() => setShowChequeAdd(true)}
          onCloseChequeAdd={() => setShowChequeAdd(false)}
          onSaveCheque={async () => {
            const r = await boutiqueApi("cheque-create", chequeForm);
            if (r?.cheque) {
              setSelectedCheque(r.cheque);
              setShowChequeAdd(false);
            }
          }}
          members={members}
        />
      )}
      {showEdit && (
        <PurchaseEditCard
          form={editForm}
          setForm={setEditForm}
          onClose={() => setShowEdit(false)}
          onSave={handleEditPurchase}
          suppliers={supplierNames}
          products={productOptions}
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
                <TD>{p.supplier || p.supplier_name}</TD>
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
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState<any>({ name: "", company: "", phone: "", email: "", city: "", balance: 0 });
  const [editForm, setEditForm] = useState<any>(form);

  useEffect(() => { (async () => { const d = await boutiqueApi("supplier-list"); if (d?.suppliers) setSuppliers(d.suppliers); })(); }, []);

  const handleAdd = async () => {
    const r = await boutiqueApi("supplier-create", form);
    if (r?.supplier) setSuppliers([r.supplier, ...suppliers]);
    setForm({ name: "", company: "", phone: "", email: "", city: "", balance: 0 });
    setShowAdd(false);
  };

  const openEdit = (supplier: any) => { setEditForm(supplier); setShowEdit(true); };

  const handleEdit = async () => {
    const r = await boutiqueApi("supplier-update", editForm);
    if (r?.success) setSuppliers(suppliers.map((item: any) => item.id === editForm.id ? editForm : item));
    setShowEdit(false);
  };

  const handleDelete = async (id: number) => {
    await boutiqueApi("supplier-delete", { id });
    setSuppliers(suppliers.filter((s: any) => s.id !== id));
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
                <td className="px-3 py-3"><ActionIcons onEdit={() => openEdit(s)} onDelete={() => handleDelete(s.id)} /></td>
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
  const [search, setSearch] = useState("");
  const [staff, setStaff] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState<any>({ name: "", phone: "", cin: "", role: "", salary: 0, hired: "", status: "Présent" });
  const [editForm, setEditForm] = useState<any>(form);
  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toLocaleDateString("fr-FR"));
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  useEffect(() => { (async () => { const d = await boutiqueApi("staff-list"); if (d?.staff) { setStaff(d.staff); } })(); }, []);

  // Load attendance for the selected date
  useEffect(() => {
    (async () => {
      const d = await boutiqueApi("staff-attendance-get", { date: attendanceDate });
      if (d?.attendance) {
        const map: Record<string, string> = {};
        d.attendance.forEach((a: any) => { map[a.staff_cin] = a.status; });
        setAttendance(map);
      }
    })();
  }, [attendanceDate]);

  const filtered = staff.filter((s: any) => s.name?.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async () => {
    const r = await boutiqueApi("staff-create", form);
    if (r?.staff) setStaff([r.staff, ...staff]);
    setForm({ name: "", phone: "", cin: "", role: "", salary: 0, hired: "", status: "Présent" });
    setShowAdd(false);
  };

  const openEdit = (staffMember: any) => { setEditForm(staffMember); setShowEdit(true); };

  const handleEdit = async () => {
    const r = await boutiqueApi("staff-update", editForm);
    if (r?.success) setStaff(staff.map((item: any) => item.cin === editForm.cin ? editForm : item));
    setShowEdit(false);
  };

  const handleDelete = async (cin: string) => {
    await boutiqueApi("staff-delete", { cin });
    setStaff(staff.filter((s: any) => s.cin !== cin));
  };

  const toggleAttendance = (cin: string) => {
    setAttendance(prev => ({
      ...prev,
      [cin]: prev[cin] === "Présent" ? "Absent" : "Présent",
    }));
    setAttendanceSaved(false);
  };

  const saveAttendance = async () => {
    setAttendanceSaving(true);
    const records = staff.map(s => ({
      staff_cin: s.cin,
      status: attendance[s.cin] || "Présent",
    }));
    await boutiqueApi("staff-attendance-save", { date: attendanceDate, records });
    setAttendanceSaving(false);
    setAttendanceSaved(true);
    setTimeout(() => setAttendanceSaved(false), 3000);
  };

  // Count present/absent
  const presentCount = staff.filter(s => (attendance[s.cin] || "Présent") === "Présent").length;
  const absentCount = staff.length - presentCount;

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Personnel"
        count={staff.length}
        actions={
          <>
            <SearchInput placeholder="Rechercher…" value={search} onChange={setSearch} />
            <Btn onClick={() => downloadCSV(staff, "personnel")}><Download className="w-3.5 h-3.5" /> Export</Btn>
            <Btn variant="primary" onClick={() => setShowAdd(prev => !prev)}><Plus className="w-3.5 h-3.5" /> Ajouter employé</Btn>
          </>
        }
      />

      {showAdd && <StaffAddCard form={form} setForm={setForm} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {showEdit && <StaffEditCard form={editForm} setForm={setEditForm} onClose={() => setShowEdit(false)} onSave={handleEdit} />}

      {/* ─── Attendance Bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-card border border-white/5 rounded-lg px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Pointage du {attendanceDate}</div>
            <div className="text-xs text-white/30 font-mono">
              {presentCount} présent{ presentCount > 1 ? "s" : "" } · {absentCount} absent{ absentCount > 1 ? "s" : "" }
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={attendanceDate}
            onChange={e => setAttendanceDate(e.target.value)}
            placeholder="jj/mm/aaaa"
            className="w-28 px-2.5 py-1.5 bg-[#0F172A] border border-[#334155] rounded text-xs text-white font-mono focus:outline-none focus:border-[#EA5800]"
          />
          <button
            onClick={saveAttendance}
            disabled={attendanceSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
          >
            {attendanceSaving ? "..." : attendanceSaved ? "✓" : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* ─── Staff Table with Attendance Checkboxes ──────────────── */}
      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <TH className="w-10">Présent</TH>
              <TH>Employé</TH><TH>Téléphone</TH><TH>CIN</TH><TH>Poste</TH><TH>Salaire</TH><TH>Embauché le</TH><TH>Statut</TH><TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {staff.map((s, i) => {
              const isPresent = (attendance[s.cin] || "Présent") === "Présent";
              return (
                <TR key={s.cin} i={i}>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleAttendance(s.cin)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                        isPresent
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-white/20 bg-transparent hover:border-white/40"
                      }`}
                    >
                      {isPresent && <CheckCircle className="w-4 h-4 text-white" />}
                    </button>
                  </td>
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
                  <td className="px-3 py-3"><Badge s={attendance[s.cin] || "Présent"} /></td>
                  <td className="px-3 py-3"><ActionIcons onEdit={() => openEdit(s)} onDelete={() => setStaff(staff.filter(item => item.cin !== s.cin))} /></td>
                </TR>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ATTENDANCE HISTORY ───────────────────────────────────────────────────────

function AttendanceHistory() {
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    (async () => {
      const d = await boutiqueApi("staff-attendance-history", { limit: 500 });
      if (d?.history) setHistory(d.history);
      setLoading(false);
    })();
  }, []);

  // Parse date string "dd/mm/yyyy" to Date for comparison
  const parseDate = (dateStr: string) => {
    const [d, m, y] = dateStr.split("/").map(Number);
    return new Date(y, m - 1, d);
  };

  const filtered = history.filter((h: any) => {
    // Text search
    const matchesSearch =
      h.staff?.name?.toLowerCase().includes(search.toLowerCase()) ||
      h.staff_cin?.toLowerCase().includes(search.toLowerCase()) ||
      h.date?.includes(search);

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter && h.status !== statusFilter) return false;

    // Date range filter
    if (dateFrom && dateTo) {
      const hDate = parseDate(h.date);
      const from = parseDate(dateFrom);
      const to = parseDate(dateTo);
      return hDate >= from && hDate <= to;
    }
    if (dateFrom) {
      return h.date === dateFrom;
    }
    if (dateTo) {
      return h.date === dateTo;
    }

    return true;
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Historique des pointages"
        count={filtered.length}
        actions={
          <>
            <SearchInput placeholder="Rechercher employé ou date…" value={search} onChange={setSearch} />
            <Btn onClick={() => downloadCSV(filtered, "pointages")}><Download className="w-3.5 h-3.5" /> Export</Btn>
          </>
        }
      />

      {/* ─── Filters ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4 bg-card border border-white/5 rounded-lg px-5 py-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 font-medium">Du</span>
          <input
            type="text"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            placeholder="jj/mm/aaaa"
            className="w-28 px-2.5 py-1.5 bg-[#0F172A] border border-[#334155] rounded text-xs text-white font-mono focus:outline-none focus:border-[#EA5800]"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 font-medium">Au</span>
          <input
            type="text"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            placeholder="jj/mm/aaaa"
            className="w-28 px-2.5 py-1.5 bg-[#0F172A] border border-[#334155] rounded text-xs text-white font-mono focus:outline-none focus:border-[#EA5800]"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 font-medium">Statut</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#0F172A] border border-[#334155] rounded text-xs text-white font-mono focus:outline-none focus:border-[#EA5800]"
          >
            <option value="">Tous</option>
            <option value="Présent">Présent</option>
            <option value="Absent">Absent</option>
          </select>
        </div>
        {(dateFrom || dateTo || statusFilter) && (
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); setStatusFilter(""); }}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="bg-card border border-white/5 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <TH>Date</TH><TH>Employé</TH><TH>Poste</TH><TH>Statut</TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-white/20 text-sm">Chargement...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-white/20 text-sm">Aucun historique</td>
              </tr>
            ) : filtered.map((h: any, i: number) => (
              <TR key={h.id || i} i={i}>
                <TD mono dim>{h.date}</TD>
                <TD>{h.staff?.name || h.staff_cin}</TD>
                <TD dim>{h.staff?.role || "—"}</TD>
                <td className="px-3 py-3"><Badge s={h.status} /></td>
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
  const [search, setSearch] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState<any>({ cat: "", desc: "", amount: 0, date: new Date().toLocaleDateString("fr-FR"), resp: "", note: "" });
  const [editForm, setEditForm] = useState<any>(form);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [expData, suppData, staffData, memberData] = await Promise.all([
        boutiqueApi("expense-list"),
        boutiqueApi("supplier-list"),
        boutiqueApi("staff-list"),
        api("list"),
      ]);
      if (expData?.expenses) setExpenses(expData.expenses);
      if (suppData?.suppliers) setSuppliers(suppData.suppliers);
      if (staffData?.staff) setStaff(staffData.staff);
      if (memberData?.members) setMembers(memberData.members.map((m: any) => ({ id: m.id, name: m.name })));
    })();
  }, []);

  const filtered = expenses.filter((e: any) => e.cat?.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase()));
  const total = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

  const handleAdd = async (extraData?: any) => {
    const payload = { ...form, ...extraData };
    const r = await boutiqueApi("expense-create", payload);
    if (r?.expense) setExpenses([r.expense, ...expenses]);
    setForm({ cat: "", desc: "", amount: 0, date: new Date().toLocaleDateString("fr-FR"), resp: "", note: "" });
    setShowAdd(false);
  };

  const openEdit = (expense: any) => { setEditForm(expense); setShowEdit(true); };

  const handleEdit = async () => {
    const r = await boutiqueApi("expense-update", editForm);
    if (r?.success) setExpenses(expenses.map((item: any) => item.id === editForm.id ? editForm : item));
    setShowEdit(false);
  };

  const handleDelete = async (id: number) => {
    await boutiqueApi("expense-delete", { id });
    setExpenses(expenses.filter((e: any) => e.id !== id));
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

      {showAdd && <ExpenseAddCard form={form} setForm={setForm} onClose={() => setShowAdd(false)} onSave={handleAdd} suppliers={suppliers} staff={staff} members={members} />}
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
                <TD>{e.description || e.desc}</TD>
                <td className="px-3 py-3 font-mono text-sm font-bold text-red-400">{e.amount.toLocaleString()} DH</td>
                <TD mono dim>{e.date}</TD>
                <TD dim>{e.resp}</TD>
                <TD dim>{e.note || "—"}</TD>
                <td className="px-3 py-3"><ActionIcons onEdit={() => openEdit(e)} onDelete={() => handleDelete(e.id)} /></td>
              </TR>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

function Reports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [sales, purchases, expenses, members, subs, products, staff, caisseTx] = await Promise.all([
        boutiqueApi("sale-list"),
        boutiqueApi("purchase-list"),
        boutiqueApi("expense-list"),
        api("list"),
        subApi("list"),
        boutiqueApi("product-list"),
        boutiqueApi("staff-list"),
        boutiqueApi("caisse-transactions", { limit: 500 }),
      ]);

      const salesList = sales?.sales || [];
      const purchasesList = purchases?.purchases || [];
      const expensesList = expenses?.expenses || [];
      const membersList = members?.members || [];
      const subsList = subs?.subscriptions || [];
      const productsList = products?.products || [];
      const staffList = staff?.staff || [];
      const txList = caisseTx?.transactions || [];

      // Revenue from sales
      const totalRevenue = salesList.reduce((s: number, v: any) => s + (v.total || 0), 0);
      const totalPurchases = purchasesList.reduce((s: number, p: any) => s + (p.total || 0), 0);
      const totalExpenses = expensesList.reduce((s: number, e: any) => s + (e.amount || 0), 0);
      const totalCost = totalPurchases + totalExpenses;
      const netProfit = totalRevenue - totalCost;

      // Active members
      const activeMembers = membersList.filter((m: any) => m.status === "Actif").length;
      const activeSubs = subsList.filter((s: any) => s.status === "Payé" || s.status === "Paiement partiel").length;
      const expiredSubs = subsList.filter((s: any) => s.status === "Non payé" || s.remaining > 0).length;

      // Stock alerts
      const lowStock = productsList.filter((p: any) => p.status === "Stock bas" || p.status === "Rupture").length;

      // Staff
      const presentStaff = staffList.filter((s: any) => s.status === "Présent").length;

      // Caisse breakdown
      const caisseIn = txList.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
      const caisseOut = txList.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + Math.abs(t.amount), 0);

      // Top products
      const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
      salesList.forEach((s: any) => {
        const key = s.product_code || s.product;
        if (!key) return;
        if (!productSales[key]) productSales[key] = { name: s.product || key, qty: 0, revenue: 0 };
        productSales[key].qty += s.qty || 0;
        productSales[key].revenue += s.total || 0;
      });
      const topProducts = Object.values(productSales).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);

      // Recent transactions
      const recentTx = txList.slice(0, 10);

      setData({ totalRevenue, totalPurchases, totalExpenses, totalCost, netProfit, activeMembers, activeSubs, expiredSubs, lowStock, presentStaff, staffTotal: staffList.length, caisseIn, caisseOut, topProducts, recentTx, salesCount: salesList.length, membersCount: membersList.length, productsCount: productsList.length });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6 text-center text-white/20 text-sm">Chargement...</div>;
  if (!data) return <div className="p-6 text-center text-white/20 text-sm">Aucune donnée</div>;

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Rapports" count={data.salesCount + data.membersCount + data.productsCount} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <KpiCard icon={TrendingUp} label="Revenus" value={`${data.totalRevenue.toLocaleString()} DH`} color="emerald" />
        <KpiCard icon={TrendingDown} label="Dépenses" value={`${data.totalCost.toLocaleString()} DH`} color="red" />
        <KpiCard icon={BadgeCheck} label="Bénéfice net" value={`${data.netProfit.toLocaleString()} DH`} color={data.netProfit >= 0 ? "emerald" : "red"} />
        <KpiCard icon={Users} label="Adhérents actifs" value={`${data.activeMembers}/${data.membersCount}`} color="blue" />
        <KpiCard icon={CreditCard} label="Abonnements actifs" value={data.activeSubs} color="violet" />
        <KpiCard icon={XCircle} label="Abonnements expirés" value={data.expiredSubs} color="amber" />
        <KpiCard icon={Package} label="Alertes stock" value={data.lowStock} color="red" />
        <KpiCard icon={UserCheck} label="Personnel présent" value={`${data.presentStaff}/${data.staffTotal}`} color="sky" />
        <KpiCard icon={DollarSign} label="Caisse entrées" value={`${data.caisseIn.toLocaleString()} DH`} color="emerald" />
        <KpiCard icon={DollarSign} label="Caisse sorties" value={`${data.caisseOut.toLocaleString()} DH`} color="red" />
      </div>

      {/* Top Products */}
      {data.topProducts.length > 0 && (
        <div className="bg-card border border-white/5 rounded-lg">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="font-semibold text-white text-sm">Top 5 produits les plus vendus</h3>
          </div>
          <div className="divide-y divide-white/5">
            {data.topProducts.map((p: any, i: number) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <span className="w-6 text-xs text-white/30 font-mono">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{p.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white font-mono">{p.qty} vendu{p.qty > 1 ? "s" : ""}</div>
                  <div className="text-xs text-emerald-400 font-mono">{p.revenue.toLocaleString()} DH</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Caisse Transactions */}
      {data.recentTx.length > 0 && (
        <div className="bg-card border border-white/5 rounded-lg">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="font-semibold text-white text-sm">Dernières transactions caisse</h3>
          </div>
          <div className="divide-y divide-white/5">
            {data.recentTx.map((tx: any, i: number) => (
              <div key={tx.id || i} className="px-5 py-2.5 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${tx.amount > 0 ? "bg-emerald-400" : "bg-red-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{tx.label}</div>
                  <div className="text-xs text-white/30 font-mono">{tx.date}</div>
                </div>
                <div className={`font-mono text-sm font-bold ${tx.amount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} DH
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  };
  return (
    <div className={`${colors[color] || colors.emerald} border rounded-lg p-4`}>
      <Icon className="w-5 h-5 mb-2" />
      <div className="text-lg font-bold font-mono">{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className="text-xs text-white/40 mt-0.5">{label}</div>
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
  { id: "attendance", label: "Pointages", Icon: Clock, group: "RH & Finance" },
  { id: "caisse", label: "Caisse", Icon: DollarSign, group: "RH & Finance" },
  { id: "cheques", label: "Chèques", Icon: CreditCard, group: "RH & Finance" },
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

  const renderView = () => {
    switch (view) {
      case "dashboard": return <Dashboard />;
      case "members": return <Members />;
      case "subscriptions": return <Subscriptions />;
      case "access": return <AccessControl />;
      case "history": return <AccessHistory />;
      case "stock": return <Stock />;
      case "sales": return <Sales />;
      case "purchases": return <Purchases />;
      case "suppliers": return <Suppliers />;
      case "staff": return <Staff />;
      case "attendance": return <AttendanceHistory />;
      case "caisse": return <CaissePanel />;
      case "cheques": return <ChequePanel />;
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
