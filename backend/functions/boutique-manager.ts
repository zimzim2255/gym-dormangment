// ═══════════════════════════════════════════════════════════════════════════════
//  Boutique Manager - Edge Function
//  ───────────────────────────────────────────────────────────────────────────────
//  Handles CRUD for: products, sales, purchases, suppliers, staff, expenses
//  Auto-updates: stock qty, supplier balance, caisse amount
// ═══════════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const today = () => new Date().toLocaleDateString("fr-FR");

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.json();

    switch (body.type) {
      // ─── Products ──────────────────────────────────────────────────
      case "product-list": {
        const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
        return new Response(JSON.stringify({ products: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "product-create": {
        const code = body.code || `PRD${Date.now().toString(36).toUpperCase()}`;
        const qty = body.qty || 0;
        const buyPrice = body.buyPrice || 0;
        const status = qty <= 0 ? "Rupture" : qty < (body.minStock || 1) ? "Stock bas" : "En stock";
        const { data, error } = await supabase.from("products").insert({
          code, name: body.name, cat: body.cat, supplier: body.supplier,
          buy_price: buyPrice, sell_price: body.sellPrice || 0,
          qty, min_stock: body.minStock || 1, status, photo: body.photo || "",
        }).select().single();
        if (error) throw error;

        // Update supplier balance (what we owe them increases by buyPrice * qty)
        if (body.supplier) {
          const totalOwed = buyPrice * qty;
          await supabase.rpc("update_supplier_balance_by_name", {
            p_name: body.supplier,
            amount_change: totalOwed,
          });
        }

        return new Response(JSON.stringify({ success: true, product: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "product-update": {
        const qty = body.qty;
        const status = qty <= 0 ? "Rupture" : qty < (body.minStock || 1) ? "Stock bas" : "En stock";
        const { data, error } = await supabase.from("products").update({
          name: body.name, cat: body.cat, supplier: body.supplier,
          buy_price: body.buyPrice, sell_price: body.sellPrice,
          qty, min_stock: body.minStock || 1, status, photo: body.photo || "",
        }).eq("code", body.code).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, product: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "product-delete": {
        await supabase.from("products").delete().eq("code", body.code);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ─── Sales ─────────────────────────────────────────────────────
      case "sale-create": {
        const id = body.id || `VNT${Date.now().toString(36).toUpperCase()}`;
        const product_code = body.productCode;

        // Insert sale
        const { data: sale, error } = await supabase.from("sales").insert({
          id, date: body.date || today(), client: body.client,
          product: body.product, product_code,
          qty: body.qty || 1, price: body.price || 0,
          total: body.total || 0, payment: body.payment || "Espèces",
          emp: body.emp || "",
        }).select().single();
        if (error) throw error;

        // Decrease stock
        if (product_code) {
          const { data: prod } = await supabase.from("products").select("*").eq("code", product_code).single();
          if (prod) {
            const newQty = Math.max(0, prod.qty - (body.qty || 1));
            const status = newQty <= 0 ? "Rupture" : newQty < prod.min_stock ? "Stock bas" : "En stock";
            await supabase.from("products").update({ qty: newQty, status }).eq("code", product_code);

            // Log stock movement
            await supabase.from("stock_movements").insert({
              product_code, product_name: body.product || prod.name,
              type: "sortie", reference_type: "vente", reference_id: id,
              qty_change: -(body.qty || 1), qty_after: newQty,
              date: body.date || today(),
            });
          }
        }

        // Increase caisse
        const total = body.total || 0;
        const paymentMethod = body.payment || "Espèces";
        await supabase.rpc("update_caisse", { amount_change: total });
        await supabase.from("caisse_transactions").insert({
          type: "vente", label: `Vente ${id} - ${body.product || ""}`,
          amount: total, payment_method: paymentMethod, reference: id, date: body.date || today(),
        });

        return new Response(JSON.stringify({ success: true, sale }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "sale-update": {
        // Get existing sale to calculate caisse difference
        const { data: existing } = await supabase.from("sales").select("*").eq("id", body.id).single();
        if (!existing) throw new Error("Sale not found");

        const oldTotal = existing.total;
        const newTotal = body.total || 0;
        const diff = newTotal - oldTotal;

        // Update the sale record
        const { error } = await supabase.from("sales").update({
          date: body.date, client: body.client, product: body.product,
          qty: body.qty || 1, price: body.price || 0,
          total: newTotal, payment: body.payment || "Espèces", emp: body.emp || "",
        }).eq("id", body.id);
        if (error) throw error;

        // Adjust caisse by the difference
        if (diff !== 0) {
          await supabase.rpc("update_caisse", { amount_change: diff });
          await supabase.from("caisse_transactions").insert({
            type: "vente",
            label: `Modification vente ${body.id}: ${oldTotal}DH → ${newTotal}DH`,
            amount: diff,
            payment_method: body.payment || existing.payment || "Espèces",
            date: body.date || today(),
          });
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "sale-list": {
        const { data } = await supabase.from("sales").select("*").order("created_at", { ascending: false });
        return new Response(JSON.stringify({ sales: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "sale-delete": {
        // Get sale details before deleting
        const { data: sale } = await supabase.from("sales").select("*").eq("id", body.id).single();
        if (!sale) throw new Error("Sale not found");

        // Delete the sale record
        await supabase.from("sales").delete().eq("id", body.id);

        // Reverse the caisse (subtract what was added)
        await supabase.rpc("update_caisse", { amount_change: -sale.total });
        await supabase.from("caisse_transactions").insert({
          type: "vente",
          label: `SUPPRIMÉE Vente ${body.id}: ${sale.total}DH (${sale.product || ""})`,
          amount: -sale.total,
          payment_method: sale.payment || "Espèces",
          date: sale.date || today(),
        });

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ─── Purchases ─────────────────────────────────────────────────
      case "purchase-create": {
        const id = body.id || `ACH${Date.now().toString(36).toUpperCase()}`;
        const product_code = body.productCode;
        const total = body.total || (body.quantity || 1) * (body.price || 0);

        // Insert purchase
        const { data: purchase, error } = await supabase.from("purchases").insert({
          id, supplier_name: body.supplier, supplier_company: body.supplierCompany,
          product: body.product, product_code,
          quantity: body.quantity || 1, price: body.price || 0,
          total, date: body.date || today(), payment: body.payment || "Espèces",
        }).select().single();
        if (error) throw error;

        // Increase stock
        if (product_code) {
          const { data: prod } = await supabase.from("products").select("*").eq("code", product_code).single();
          if (prod) {
            const newQty = prod.qty + (body.quantity || 1);
            const status = newQty <= 0 ? "Rupture" : newQty < prod.min_stock ? "Stock bas" : "En stock";
            await supabase.from("products").update({ qty: newQty, status }).eq("code", product_code);

            await supabase.from("stock_movements").insert({
              product_code, product_name: body.product || prod.name,
              type: "entree", reference_type: "achat", reference_id: id,
              qty_change: body.quantity || 1, qty_after: newQty,
              date: body.date || today(),
            });
          }
        }

        // Increase supplier balance
        if (body.supplier && body.supplierCompany) {
          await supabase.rpc("update_supplier_balance", {
            p_name: body.supplier, p_company: body.supplierCompany,
            amount_change: total,
          });
        }

        // Decrease caisse
        await supabase.rpc("update_caisse", { amount_change: -total });
        await supabase.from("caisse_transactions").insert({
          type: "achat", label: `Achat ${id} - ${body.product || ""}`,
          amount: -total, reference: id, date: body.date || today(),
        });

        return new Response(JSON.stringify({ success: true, purchase }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "purchase-update": {
        const { data: existing } = await supabase.from("purchases").select("*").eq("id", body.id).single();
        if (!existing) throw new Error("Purchase not found");

        const oldTotal = existing.total;
        const newTotal = body.total || 0;
        const diff = newTotal - oldTotal;

        const { error } = await supabase.from("purchases").update({
          supplier_name: body.supplier, product: body.product,
          quantity: body.quantity || 1, price: body.price || 0,
          total: newTotal, date: body.date, payment: body.payment || "Espèces",
        }).eq("id", body.id);
        if (error) throw error;

        // Adjust caisse by the difference (purchases decrease caisse)
        if (diff !== 0) {
          await supabase.rpc("update_caisse", { amount_change: -diff });
          await supabase.from("caisse_transactions").insert({
            type: "achat",
            label: `Modification achat ${body.id}: ${oldTotal}DH → ${newTotal}DH`,
            amount: -diff,
            date: body.date || today(),
          });
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "purchase-list": {
        const { data } = await supabase.from("purchases").select("*").order("created_at", { ascending: false });
        return new Response(JSON.stringify({ purchases: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "purchase-delete": {
        await supabase.from("purchases").delete().eq("id", body.id);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ─── Suppliers ─────────────────────────────────────────────────
      case "supplier-list": {
        const { data } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
        return new Response(JSON.stringify({ suppliers: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "supplier-create": {
        const { data, error } = await supabase.from("suppliers").insert({
          name: body.name, company: body.company, phone: body.phone || "",
          email: body.email || "", city: body.city || "", balance: body.balance || 0,
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, supplier: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "supplier-update": {
        const { data, error } = await supabase.from("suppliers").update({
          name: body.name, company: body.company, phone: body.phone,
          email: body.email, city: body.city, balance: body.balance,
        }).eq("id", body.id).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, supplier: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "supplier-delete": {
        await supabase.from("suppliers").delete().eq("id", body.id);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ─── Staff ─────────────────────────────────────────────────────
      case "staff-list": {
        const { data } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
        return new Response(JSON.stringify({ staff: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "staff-create": {
        const { data, error } = await supabase.from("staff").insert({
          cin: body.cin, name: body.name, phone: body.phone || "",
          role: body.role || "", salary: body.salary || 0,
          hired: body.hired || "", status: body.status || "Présent",
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, staff: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "staff-update": {
        const { data, error } = await supabase.from("staff").update({
          name: body.name, phone: body.phone, role: body.role,
          salary: body.salary, hired: body.hired, status: body.status,
        }).eq("cin", body.cin).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, staff: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "staff-delete": {
        await supabase.from("staff").delete().eq("cin", body.cin);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ─── Expenses ──────────────────────────────────────────────────
      case "expense-create": {
        const { data: expense, error } = await supabase.from("expenses").insert({
          cat: body.cat, description: body.desc, amount: body.amount || 0,
          date: body.date || today(), resp: body.resp || "", note: body.note || "",
        }).select().single();
        if (error) throw error;

        // Decrease caisse
        const amount = body.amount || 0;
        await supabase.rpc("update_caisse", { amount_change: -amount });
        await supabase.from("caisse_transactions").insert({
          type: "depense", label: `Dépense: ${body.cat} - ${body.desc || ""}`,
          amount: -amount, date: body.date || today(),
        });

        return new Response(JSON.stringify({ success: true, expense }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "expense-list": {
        const { data } = await supabase.from("expenses").select("*").order("created_at", { ascending: false });
        return new Response(JSON.stringify({ expenses: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "expense-update": {
        const { data, error } = await supabase.from("expenses").update({
          cat: body.cat, description: body.desc, amount: body.amount,
          date: body.date, resp: body.resp, note: body.note,
        }).eq("id", body.id).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, expense: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "expense-delete": {
        await supabase.from("expenses").delete().eq("id", body.id);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ─── Cheques ───────────────────────────────────────────────────
      case "cheque-list": {
        const { data } = await supabase.from("cheques").select("*").order("created_at", { ascending: false });
        return new Response(JSON.stringify({ cheques: data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "cheque-create": {
        const { data, error } = await supabase.from("cheques").insert({
          cheque_id: body.chequeId,
          member_id: body.memberId,
          member_name: body.memberName,
          amount: body.amount || 0,
          used_amount: 0,
          remaining: body.amount || 0,
          date: body.date,
          date_echeance: body.dateEcheance,
          photo: body.photo || "",
          status: body.status || "En_attente",
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, cheque: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "cheque-update": {
        const { data, error } = await supabase.from("cheques").update({
          cheque_id: body.chequeId, member_id: body.memberId, member_name: body.memberName,
          giver: body.giver, amount: body.amount, used_amount: body.usedAmount,
          remaining: body.amount - (body.usedAmount || 0),
          usage_percent: body.usagePercent, date_emission: body.dateEmission,
          date_echeance: body.dateEcheance, date_execution: body.dateExecution,
          photo: body.photo, status: body.status,
        }).eq("id", body.id).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, cheque: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "cheque-delete": {
        await supabase.from("cheques").delete().eq("id", body.id);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ─── Caisse ────────────────────────────────────────────────────
      case "caisse-get": {
        const { data } = await supabase.from("caisse").select("*").limit(1).single();
        return new Response(JSON.stringify({ caisse: data?.amount || 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "caisse-transactions": {
        const { data } = await supabase.from("caisse_transactions").select("*").order("created_at", { ascending: false }).limit(body.limit || 50);
        return new Response(JSON.stringify({ transactions: data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "stock-movements": {
        const { data } = await supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(body.limit || 100);
        return new Response(JSON.stringify({ movements: data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});