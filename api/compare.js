function escapeHtml(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).send("Invalid JSON");
    return;
  }

  // NEW: options = [{ name, text }]
  const incoming = Array.isArray(body.options) ? body.options : [];
  const options = incoming
    .map((o, i) => {
      const name = (o?.name ?? "").toString().trim() || `Option ${i + 1}`;
      const text = (o?.text ?? "").toString().trim();
      return { name, text };
    })
    .filter(o => o.text);

  if (options.length < 2) {
    res.status(400).send("Please provide at least two option descriptions.");
    return;
  }
  if (options.length > 10) {
    res.status(400).send("Please provide no more than 10 options.");
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).send("Missing OPENAI_API_KEY.");
    return;
  }

  const schemaRows = [
    "Core Use Case",
    "Key Features",
    "Pros",
    "Cons",
    "Best For",
    "Not Ideal For",
  ];

  const prompt = `
You are a strict comparison engine.

Return ONLY valid JSON in this exact format:
{
  "rows": [
    {"attribute":"Core Use Case","values":[["..."],["..."]]},
    {"attribute":"Key Features","values":[["..."],["..."]]},
    {"attribute":"Pros","values":[["..."],["..."]]},
    {"attribute":"Cons","values":[["..."],["..."]]},
    {"attribute":"Best For","values":[["..."],["..."]]},
    {"attribute":"Not Ideal For","values":[["..."],["..."]]}
  ],
  "recap":{
    "bottom_line":"One sentence bottom line.",
    "suggestion":"<one of the option names> OR No clear winner",
    "confidence":"low|medium|high",
    "why":["...","..."],
    "key_differences":["...","...","..."]
  }
}

Rules:
- values must be bullet arrays (1–4 short bullets per cell)
- values array length MUST equal number of options
- Use ["—"] when information is missing
- Do NOT invent facts. Use only the text provided.
- Suggestion must choose one of the option names exactly (or "No clear winner")
- If the best choice depends on user preferences not provided, use "No clear winner" with confidence "low"
- Keep bottom_line to one sentence.

OPTIONS (name + pasted text):
${options.map((o, i) => `Option ${i + 1} name: ${o.name}\nOption ${i + 1} text: ${o.text}`).join("\n\n")}
`.trim();

  let ai;
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    ai = JSON.parse(content);
  } catch {
    res.status(500).send("AI output error.");
    return;
  }

  function bullets(arr) {
    if (!Array.isArray(arr) || !arr.length) return "—";
    const clean = arr.map(x => (x ?? "").toString().trim()).filter(Boolean);
    if (!clean.length) return "—";
    return `<ul class="cellbullets">${clean.map(b => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`;
  }

  const names = options.map(o => o.name);

  // Build HTML
  let html = `
  <style>
    .tablewrap{overflow:auto;margin-top:10px}
    table{width:100%;min-width:860px;border-collapse:separate;border-spacing:0;border:1px solid rgba(255,255,255,0.22);border-radius:12px;overflow:hidden}
    th,td{border-right:1px solid rgba(255,255,255,0.14);border-bottom:1px solid rgba(255,255,255,0.14);padding:12px;vertical-align:top}
    th:last-child,td:last-child{border-right:0}
    tr:last-child td{border-bottom:0}
    thead th{background:rgba(255,255,255,0.08);text-align:left;font-weight:900}
    tbody td:first-child, thead th:first-child{background:rgba(255,255,255,0.05);font-weight:900;width:190px}
    .cellbullets{margin:0;padding-left:18px}
    .cellbullets li{margin:0 0 6px 0}
    .recap{margin-top:14px;border:1px solid rgba(255,255,255,0.18);border-radius:12px;padding:14px;background:rgba(255,255,255,0.04)}
    .recapTitle{font-weight:1000;margin-bottom:8px}
    .recapRow{margin:8px 0}
    .pill{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.18);font-size:12px;opacity:0.9}
    .muted{opacity:0.8;font-size:12px;margin-top:10px}
  </style>
  `.trim();

  // Bottom line
  const recap = ai?.recap ?? {};
  const bottomLine = (recap.bottom_line ?? "").toString().trim();

  if (bottomLine) {
    html += `<div class="recap"><div class="recapTitle">Bottom line</div><div>${escapeHtml(bottomLine)}</div></div>`;
  }

  html += `<div class="tablewrap"><table><thead><tr><th>Attribute</th>${names
    .map(n => `<th>${escapeHtml(n)}</th>`)
    .join("")}</tr></thead><tbody>`;

  for (const row of schemaRows) {
    const r = (ai.rows || []).find(x => x.attribute === row);
    html += `<tr><td>${escapeHtml(row)}</td>`;
    for (let i = 0; i < options.length; i++) {
      html += `<td>${bullets(r?.values?.[i])}</td>`;
    }
    html += `</tr>`;
  }

  html += `</tbody></table></div>`;

  // Recap & suggestion
  const suggestion = (recap.suggestion ?? "").toString().trim() || "No clear winner";
  const confidence = (recap.confidence ?? "").toString().trim() || "low";
  const why = Array.isArray(recap.why) ? recap.why : [];
  const diffs = Array.isArray(recap.key_differences) ? recap.key_differences : [];

  html += `
    <div class="recap">
      <div class="recapTitle">Recap & Suggestion</div>
      <div class="recapRow"><strong>Suggestion:</strong> ${escapeHtml(suggestion)} <span class="pill">${escapeHtml(confidence)}</span></div>
      <div class="recapRow"><strong>Why:</strong> ${bullets(why)}</div>
      <div class="recapRow"><strong>Key differences:</strong> ${bullets(diffs)}</div>
      <div class="muted">Note: Based only on the text you provided.</div>
    </div>
  `;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
