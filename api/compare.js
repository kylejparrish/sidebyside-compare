function escapeHtml(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function readJsonBody(req) {
  // Vercel sometimes gives req.body, sometimes we need to read it ourselves.
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
    res.status(400).send("Bad Request: invalid JSON");
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
    res.status(500).send("Server not configured (missing OPENAI_API_KEY).");
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
You are a formatting engine. Build a clean comparison table.

Return ONLY valid JSON in this exact shape:
{
  "rows": [
    {"attribute": "Core Use Case", "values": ["...", "..."]},
    ...
  ]
}

Rules:
- rows must be exactly: ${schemaRows.join(", ")}
- values array length must equal number of options
- Use short bullet-style phrases separated by "; " (no line breaks)
- If unknown or not stated, use "—"
- Do NOT invent facts.

OPTIONS:
${options.map((t, i) => `Option ${i + 1}: ${t}`).join("\n\n")}
`.trim();

  let jsonText = "";
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      res.status(500).send(`OpenAI error: ${escapeHtml(err)}`);
      return;
    }

    const data = await resp.json();
    jsonText = data.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    res.status(500).send("Server error contacting OpenAI.");
    return;
  }

  // Parse JSON from model output
  let table;
  try {
    table = JSON.parse(jsonText);
  } catch {
    res.status(500).send("AI returned unexpected output. Please try again.");
    return;
  }

  // Build HTML table
  const headers = options.map((_, i) => `Option ${i + 1}`);
  let html = `<table><thead><tr><th>Attribute</th>${headers
    .map(h => `<th>${escapeHtml(h)}</th>`)
    .join("")}</tr></thead><tbody>`;

  for (const rowName of schemaRows) {
    const rowObj = (table.rows || []).find(r => r.attribute === rowName);
    const values = Array.isArray(rowObj?.values) ? rowObj.values : [];
    html += `<tr><td><strong>${escapeHtml(rowName)}</strong></td>`;
    for (let i = 0; i < options.length; i++) {
      const v = values[i] ?? "—";
      html += `<td>${escapeHtml(v)}</td>`;
    }
    html += `</tr>`;
  }

  html += `</tbody></table>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
