import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ingredients = [
  { num: 1, name: "Arsenic", detail: "Rice-based foods, fruit juices. Linked to IQ loss." },
  { num: 2, name: "Lead", detail: "Sweet potatoes, juices, snacks. Causes brain damage." },
  { num: 3, name: "Mercury", detail: "Seafood-based foods. Attacks nervous system." },
  { num: 4, name: "Cadmium", detail: "Grains, sweet potatoes. Kidney & bone damage." },
  { num: 5, name: "BPA / BPS", detail: "Plastic linings, cans. Hormonal disruption." },
  { num: 6, name: "Nitrates", detail: "Spinach, carrots, beets. 'Blue baby syndrome'." },
  { num: 7, name: "Carrageenan", detail: "Organic baby foods. Gut inflammation." },
  { num: 8, name: "High-Fructose Corn Syrup", detail: "Many snacks & pouches. Obesity, metabolic issues." },
  { num: 9, name: "Artificial Colors", detail: "Red 40, Yellow 5/6. ADHD, behavioral problems." },
  { num: 10, name: "Sodium Nitrite", detail: "Meat-based foods. Known carcinogen." },
  { num: 11, name: "MSG / Glutamates", detail: "Hidden as 'natural flavors'. Brain excitotoxin." },
  { num: 12, name: "Titanium Dioxide", detail: "White processed snacks. Potential carcinogen." },
  { num: 13, name: "Potassium Bromate", detail: "Teething crackers. Carcinogenic compound." },
  { num: 14, name: "Propyl Paraben", detail: "Preservatives. Hormonal disruption." },
  { num: 15, name: "Perchlorate", detail: "Dry cereals, food packaging. Thyroid disruption." },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>15 Toxic Ingredients Cheat Sheet – FoodFactScanner</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      background: #fff;
      color: #1a1a2e;
      padding: 32px;
      max-width: 900px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 3px solid #e63946;
    }

    .logo-badge {
      display: inline-block;
      background: #e63946;
      color: white;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 10px;
    }

    h1 {
      font-size: 26px;
      font-weight: 800;
      color: #1a1a2e;
      line-height: 1.2;
      margin-bottom: 6px;
    }

    .subtitle {
      font-size: 13px;
      color: #666;
      margin-top: 4px;
    }

    .warning-banner {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 12px;
      color: #856404;
      margin-bottom: 24px;
      text-align: center;
      font-weight: 600;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 24px;
    }

    .ingredient-card {
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 12px 14px;
      background: #fafafa;
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    .ingredient-card:nth-child(odd) {
      background: #fff8f8;
      border-color: #fce4e4;
    }

    .num {
      font-size: 11px;
      font-weight: 800;
      color: #e63946;
      background: #fce4e4;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .ing-content {}

    .ing-name {
      font-size: 13px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 2px;
    }

    .ing-detail {
      font-size: 11px;
      color: #666;
      line-height: 1.4;
    }

    .footer {
      border-top: 2px solid #e8e8e8;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .footer-cta {
      background: #1a1a2e;
      color: white;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
    }

    .footer-text {
      font-size: 11px;
      color: #888;
      line-height: 1.5;
    }

    .footer-brand {
      font-size: 12px;
      font-weight: 700;
      color: #1a1a2e;
    }

    @media print {
      body { padding: 16px; }
      .no-print { display: none; }
      .footer-cta { background: #1a1a2e !important; -webkit-print-color-adjust: exact; }
    }

    .print-btn {
      display: block;
      margin: 0 auto 20px;
      background: #e63946;
      color: white;
      border: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>

  <div class="header">
    <div class="logo-badge">FoodFactScanner.com</div>
    <h1>15 Toxic Ingredients<br>to Avoid in Baby Food</h1>
    <p class="subtitle">Keep this in your wallet — check labels before you buy</p>
  </div>

  <div class="warning-banner">
    ⚠️ A 2021 Congressional report found toxic heavy metals in 94% of baby food products
  </div>

  <div class="grid">
    ${ingredients.map(ing => `
    <div class="ingredient-card">
      <div class="num">${ing.num}</div>
      <div class="ing-content">
        <div class="ing-name">${ing.name}</div>
        <div class="ing-detail">${ing.detail}</div>
      </div>
    </div>`).join("")}
  </div>

  <div class="footer">
    <div>
      <div class="footer-brand">FoodFactScanner</div>
      <div class="footer-text">
        Protecting babies, empowering parents.<br>
        foodfactscanner.com
      </div>
    </div>
    <div class="footer-text" style="text-align:center; max-width: 240px;">
      Scan any product to instantly check for these ingredients and get a safety score.
    </div>
    <a href="https://foodfactscanner.com/scanner" class="footer-cta">
      📱 Scan Free Now →
    </a>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": 'inline; filename="15-toxic-ingredients-cheatsheet.html"',
    },
  });
});
