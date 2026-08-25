// ═══════════════════════════════════════════════════════════════════════════════
//  Dashboard Stats - edge function
//  Aggregates real KPIs for the Tableau de bord (dashboard) page.
// ═══════════════════════════════════════════════════════════════════════════════
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Août", "Sep", "Oct", "Nov", "Déc"];

// Normalize a date (dd/mm/yyyy or yyyy-mm-dd) to yyyy-mm-dd, or null.
function toIso(str?: string): string | null {
  if (!str) return null;
  const s = String(str).trim();
  const dm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (dm) return `${dm[3]}-${dm[2]}-${dm[1]}`;
  const ym = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (ym) return `${ym[1]}-${ym[2]}-${ym[3]}`;
  return null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [membersRes, activeRes, subsRes, salesRes, expensesRes, accessRes] = await Promise.all([
      supabase.from("members").select("id,status"),
      supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "Actif"),
      supabase.from("subscriptions").select("*"),
      supabase.from("sales").select("date,total,amount"),
      supabase.from("expenses").select("date,amount"),
      supabase.from("access_logs").select("id", { count: "exact", head: true }).eq("date", today),
    ]);

    const membersArr = membersRes.data ?? [];
    const subsArr = subsRes.data ?? [];
    const totalMembers = membersArr.length;
    const activeMembers = activeRes.count ?? 0;

    const expiredSubscriptions = subsArr.filter((s: any) => { const e = toIso(s.sub_end); return e && e < today; }).length;
    const expiringToday = subsArr.filter((s: any) => { const e = toIso(s.sub_end); return e === today; }).length;

    const salesArr = salesRes.data ?? [];
    const salesToday = salesArr.filter((s: any) => toIso(s.date) === today);
    const salesTodayTotal = salesToday.reduce((sum: number, s: any) => sum + Number(s.total ?? s.amount ?? 0), 0);

    // revenue & expense series for the last 5 months
    const months: { key: string; month: string }[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      months.push({ key, month: MONTHS_FR[d.getMonth()] });
    }
    const revBy: Record<string, number> = {};
    const expBy: Record<string, number> = {};
    for (const m of months) { revBy[m.key] = 0; expBy[m.key] = 0; }
    for (const s of salesArr) {
      const iso = toIso(s.date); if (!iso) continue;
      const k = iso.slice(0, 7); if (revBy[k] !== undefined) revBy[k] += Number(s.total ?? s.amount ?? 0);
    }
    for (const e of expensesRes.data ?? []) {
      const iso = toIso(e.date); if (!iso) continue;
      const k = iso.slice(0, 7); if (expBy[k] !== undefined) expBy[k] += Number(e.amount ?? 0);
    }

    const monthlyRevenue = revBy[months[months.length - 1]?.key] ?? 0; // current month
    const monthlyExpenses = expBy[months[months.length - 1]?.key] ?? 0;

    // entitled access entries for the week (Sun..Sat short labels)
    const WEEK_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const entriesByDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      entriesByDay[d.toISOString().slice(0, 10)] = 0;
    }
    const weekLogs = await supabase
      .from("access_logs")
      .select("date")
      .gte("date", Object.keys(entriesByDay)[0]);
    for (const l of (weekLogs.data ?? [])) {
      const iso = toIso(l.date); if (!iso) continue;
      if (entriesByDay[iso] !== undefined) entriesByDay[iso] += 1;
    }
    const entriesSeries = Object.keys(entriesByDay).map((k) => {
      const d = new Date(k + "T00:00:00Z");
      return { day: WEEK_FR[((d.getUTCDay() + 6) % 7)] || "", val: entriesByDay[k] };
    });

    return new Response(JSON.stringify({
      kpi: {
        totalMembers, activeMembers, expiredSubscriptions, expiringToday,
        salesTodayCount: salesToday.length, salesTodayTotal,
        monthlyRevenue, monthlyExpenses,
        netProfit: monthlyRevenue - monthlyExpenses,
        entriesToday: accessRes.count ?? 0,
      },
      revenueSeries: revBy, expenseSeries: expBy, months,
      entriesSeries: entriesSeries,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});