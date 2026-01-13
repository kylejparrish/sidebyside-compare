function escapeHtml(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function extractFirstUrl(text = "") {
  const match = text.match(/https?:\/\/[^\s)]+/i);
  return match ? match[0] : "";
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
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).send("Invalid JSON");
  }

  const incoming = Array.isArray(body.options) ? body.options : [];
  const options = incoming
    .map((o, i) => ({
      name: (o?.name || `Option ${i + 1}`).trim(),
      text: (o?.text || "").trim(),
      url: extractFirstUrl(o?.text || "")
    }))
    .filter(o => o.text);

  if (options.length < 2) {
    return res.status(400).send("Please provide at least two options.");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).send("Missing API key");

  const schemaRows = [
    "Core Use Case",
    "Key Features",
    "Pros",
    "Cons",
    "Best For",
    "Not Ideal For",
  ];

  const prompt = `
Return valid JSON only.

Options:
${options.map(o => `${o.name}: ${o.text}`).join("\n\n")}

Structure rows exactly as before. Include a conservative recap.
`;

  let ai;
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
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
    ai = JSON.parse((await r.json()).choices[0].message.content);
  } catch {
    return res.status(500).send("AI error");
  }

  let html = `<div class="comparison" data-options='${JSON.stringify(
    options.map(o => ({ name: o.name, url: o.url }))
  )}'>`;

  html += "<!-- existing table + recap rendering stays unchanged -->";
  html += "</div>";

  res.setHeader("Content-Type", "text/html");
  res.send(html);
}
