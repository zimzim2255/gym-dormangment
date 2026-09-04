// ═══════════════════════════════════════════════════════════════════════════════
//  Subscription Types Service
//  ───────────────────────────────────────────────────────────────────────────────
//  Loads & saves the "Tarifs des abonnements" from/to the Supabase DB via the
//  deployed subscription-manager edge function. Shared across the whole app so
//  prices set in Paramètres are the real prices used in the Abonnements forms.
// ═══════════════════════════════════════════════════════════════════════════════

export type SubType = {
  code: string; name: string; duration: string; price: number; desc: string; status: string;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://orjkjrdobjyctrsuiwek.supabase.co";
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const DEFAULT_SUB_TYPES: SubType[] = [
  { code: "JOUR", name: "Journalier", duration: "1 jour", price: 30, desc: "Accès unique journée", status: "Actif" },
  { code: "MENS", name: "Mensuel", duration: "1 mois", price: 200, desc: "Accès illimité 1 mois", status: "Actif" },
  { code: "TRIM", name: "Trimestriel", duration: "3 mois", price: 500, desc: "3 mois économiques", status: "Actif" },
  { code: "SEMI", name: "Semestriel", duration: "6 mois", price: 900, desc: "6 mois à prix réduit", status: "Actif" },
  { code: "ANNU", name: "Annuel", duration: "12 mois", price: 1600, desc: "Meilleure valeur", status: "Actif" },
];

// ─── In-memory cache so all views read the same (latest) prices ───────────────

let cachedPrices: SubType[] = DEFAULT_SUB_TYPES.map(t => ({ ...t }));

export function getCachedSubTypes(): SubType[] {
  return cachedPrices;
}

export function setCachedSubTypes(types: SubType[]) {
  if (Array.isArray(types) && types.length > 0) {
    cachedPrices = types.map(t => ({ ...t }));
  }
}

// ─── API calls (subscription-manager edge function) ───────────────────────────

async function subApi(type: string, data?: any) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/subscription-manager`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ type, ...data }),
    });
    if (res.ok) return await res.json();
    throw new Error("API error");
  } catch {
    return null;
  }
}

// Load prices from the backend. Falls back to in-memory cache on failure.
export async function getSubscriptionPrices(): Promise<SubType[]> {
  const result = await subApi("prices-list");
  if (result?.prices?.length) {
    const mapped: SubType[] = result.prices.map((p: any) => ({
      code: p.code, name: p.name || p.code, duration: p.duration || "",
      price: typeof p.price === "number" ? p.price : Number(p.price) || 0,
      desc: p.desc ?? p.description ?? "", status: p.status || "Actif",
    }));
    setCachedSubTypes(mapped);
    return mapped;
  }
  return getCachedSubTypes();
}

// Save prices to the backend. Returns true on success.
export async function saveSubscriptionPrices(prices: SubType[]): Promise<boolean> {
  const result = await subApi("prices-update", { prices });
  if (result?.success) {
    setCachedSubTypes(prices);
    return true;
  }
  return false;
}