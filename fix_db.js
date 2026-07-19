const sql = `ALTER TABLE caisse_transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'Espèces' CHECK (payment_method IN ('Espèces', 'Chèque', 'Virement'));`;

fetch("https://api.supabase.com/v1/projects/zpxobitwvitkidcmhlyg/sql", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sb_secret_jQwh2mtdfisk3nk9ugh2gA_eUUofEmE",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ query: sql })
})
.then(r => r.text())
.then(console.log)
.catch(console.error);