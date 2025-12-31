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

  const options = Array.isArray(body.options) ? body.options : [];
  if (options.length < 2) {
    res.status(400).send("Please provide at least two options.");
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
    "suggestion":"Option X or No clear winner",
    "confidence":"low|medium|high",
    "why":["...","..."],
    "key_differences":["...","..."]
  }
}

Rules:
- Values must be bullet arrays (1–4 short bullets max per cell)
- values array length MUST equal number of options
- Use "—" if information is missing
- Do NOT invent facts
- Suggestion must be conservative if data is insufficient

OPTIONS:
${options.map((t, i) => `Option ${i + 1}: ${t}`).join("\n\n")}
`.trim();

  let aiJson;
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
    aiJson = JSON.parse(data.choices[0].message.content);
  } catch {
    res.status(500).send("AI output error.");
    return;
  }

  function bullets(arr) {
    if (!Array.isArray(arr) || !arr.length) return "—";
    return `<ul>${arr.map(b => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`;
  }

  let html = `
  <style>
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid rgba(255,255,255,0.25);padding:12px;vertical-align:top}
    th{background:rgba(255,255,255,0.1);font-weight:800}
    td:first-child{font-weight:800;width:180px;background:rgba(255,255,255,0.05)}
    ul{margin:0;padding-left:18px}
    li{margin-bottom:6px}
    .recap{margin-top:16px;padding:14px;border:1px solid rgba(255,255,255,0.25);border-radius:12px}
    .pill{display:inline-block;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.25);font-size:12px}
  </style>
  <table>
    <thead>
      <tr>
        <th>Attribute</th>
        ${options.map((_, i) => `<th>Option ${i + 1}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
  `;

  for (const row of schemaRows) {
    const r = aiJson.rows.find(x => x.attribute === row);
    html += `<tr><td>${row}</td>`;
    for (let i = 0; i < options.length; i++) {
      html += `<td>${bullets(r?.values?.[i])}</td>`;
    }
    html += `</tr>`;
  }

  html += `
    </tbody>
  </table>
  <div class="recap">
    <strong>Suggestion:</strong> ${escapeHtml(aiJson.recap.suggestion)}
    <span class="pill">${escapeHtml(aiJson.recap.confidence)}</span>
    <br/><br/>
    <strong>Why:</strong> ${bullets(aiJson.recap.why)}
    <strong>Key differences:</strong> ${bullets(aiJson.recap.key_differences)}
  </div>
  `;

  res.status(200).send(html);
}
