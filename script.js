const inputsDiv = document.getElementById("inputs");
const addBtn = document.getElementById("addOption");
const compareBtn = document.getElementById("compare");
const resultDiv = document.getElementById("result");

const exportActions = document.getElementById("exportActions");
const copyBtn = document.getElementById("copyTable");
const csvBtn = document.getElementById("downloadCsv");

const examplesBar = document.getElementById("examples");

let optionCount = 0;

// ---------- helpers ----------
function normalizeText(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}
function hideExports() {
  if (exportActions) exportActions.style.display = "none";
}
function showExports() {
  if (exportActions) exportActions.style.display = "flex";
}
function getFirstTableEl() {
  return resultDiv.querySelector("table");
}
function clearInputs() {
  inputsDiv.innerHTML = "";
  optionCount = 0;
}
function addOption(nameValue = "", textValue = "") {
  if (optionCount >= 10) return;
  optionCount++;

  const wrapper = document.createElement("div");
  wrapper.style.marginBottom = "14px";

  const name = document.createElement("input");
  name.type = "text";
  name.placeholder = `Option ${optionCount} name`;
  name.className = "optname";
  Object.assign(name.style, {
    width: "100%",
    padding: "10px 12px",
    marginBottom: "8px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.25)",
    color: "white",
    outline: "none"
  });
  name.value = nameValue;

  const textarea = document.createElement("textarea");
  textarea.placeholder = `Option ${optionCount} description (paste links or notes)`;
  textarea.value = textValue;

  wrapper.appendChild(name);
  wrapper.appendChild(textarea);
  inputsDiv.appendChild(wrapper);
}

function ensureTwoInputs() {
  if (optionCount === 0) {
    addOption();
    addOption();
  }
}

// ---------- export helpers ----------
function tableToTSV(table) {
  const rows = Array.from(table.querySelectorAll("tr"));
  return rows.map(row => {
    const cells = Array.from(row.querySelectorAll("th,td"));
    const vals = cells.map(c => normalizeText(c.innerText));
    return vals.join("\t");
  }).join("\n");
}

function tableToCSV(table) {
  const rows = Array.from(table.querySelectorAll("tr"));
  return rows.map(row => {
    const cells = Array.from(row.querySelectorAll("th,td"));
    const vals = cells.map(c => {
      let v = normalizeText(c.innerText);
      if (v.includes('"')) v = v.replace(/"/g, '""');
      if (v.includes(",") || v.includes("\n") || v.includes('"')) v = `"${v}"`;
      return v;
    });
    return vals.join(",");
  }).join("\n");
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

function downloadCsvRobust(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(blob, filename);
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  a.remove();
  setTimeout(() => {
    try { window.open(url, "_blank"); } catch (_) {}
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 250);
}

function extractRecapText() {
  const boxes = Array.from(resultDiv.querySelectorAll(".recap"));
  if (!boxes.length) return "";
  return boxes.map(b => normalizeText(b.innerText)).filter(Boolean).join("\n\n");
}

// ---------- visit official site injector ----------
function injectVisitAction() {
  // Remove existing visit box if present (avoid duplicates)
  const existing = document.getElementById("visitBox");
  if (existing) existing.remove();

  const container = resultDiv.querySelector(".comparison");
  if (!container) return;

  const raw = container.getAttribute("data-options");
  if (!raw) return;

  let opts;
  try { opts = JSON.parse(raw); } catch { return; }
  if (!Array.isArray(opts) || !opts.length) return;

  const wrapper = document.createElement("div");
  wrapper.id = "visitBox";
  wrapper.style.marginTop = "18px";
  wrapper.style.padding = "14px";
  wrapper.style.border = "1px solid rgba(255,255,255,0.18)";
  wrapper.style.borderRadius = "12px";
  wrapper.style.background = "rgba(255,255,255,0.03)";

  const label = document.createElement("div");
  label.textContent = "Ready to move forward?";
  label.style.fontWeight = "900";
  label.style.marginBottom = "8px";

  const select = document.createElement("select");
  select.style.width = "100%";
  select.style.padding = "10px";
  select.style.borderRadius = "10px";
  select.style.marginBottom = "10px";

  const defaultOpt = document.createElement("option");
  defaultOpt.textContent = "Choose an option…";
  defaultOpt.value = "";
  select.appendChild(defaultOpt);

  opts.forEach(o => {
    const opt = document.createElement("option");
    opt.value = o.url || "";
    opt.textContent = o.name || "Option";
    select.appendChild(opt);
  });

  const btn = document.createElement("button");
  btn.textContent = "Visit official site";
  btn.className = "btn primary";
  btn.disabled = true;

  select.addEventListener("change", () => {
    btn.disabled = !select.value;
  });

  btn.addEventListener("click", () => {
    if (select.value) window.open(select.value, "_blank", "noopener");
  });

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  wrapper.appendChild(btn);
  resultDiv.appendChild(wrapper);
}

// ---------- export wiring ----------
copyBtn?.addEventListener("click", async () => {
  const table = getFirstTableEl();
  if (!table) return alert("Generate a table first.");
  try {
    const recap = extractRecapText();
    const tsv = tableToTSV(table);
    const payload = recap ? `${recap}\n\n${tsv}` : tsv;
    await copyTextToClipboard(payload);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy (Excel-ready)"), 1200);
  } catch {
    alert("Copy failed. Please try again.");
  }
});

csvBtn?.addEventListener("click", () => {
  const table = getFirstTableEl();
  if (!table) return alert("Generate a table first.");
  const csv = tableToCSV(table);
  downloadCsvRobust("sidebyside-comparison.csv", csv);
});

// ---------- main compare ----------
addBtn.addEventListener("click", () => addOption());

compareBtn.addEventListener("click", async () => {
  hideExports();

  const wrappers = Array.from(inputsDiv.children);
  const options = wrappers
    .map((w, i) => ({
      name: w.querySelector(".optname")?.value?.trim() || `Option ${i + 1}`,
      text: w.querySelector("textarea")?.value?.trim() || ""
    }))
    .filter(o => o.text);

  if (options.length < 2) {
    resultDiv.innerHTML = "Please add at least two options.";
    return;
  }

  resultDiv.innerHTML = "Generating comparison…";

  try {
    const response = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options })
    });

    const html = await response.text();
    resultDiv.innerHTML = html;

    if (getFirstTableEl()) {
      showExports();
      injectVisitAction();
    }
  } catch {
    resultDiv.innerHTML = "Something went wrong.";
  }
});

// ---------- examples ----------
const PRESETS = {
  headphones: [
    { name: "Sony WH-1000XM5", text: "Over-ear ANC headphones. Great comfort, strong noise cancelling. $250. https://example.com/xm5" },
    { name: "Bose QC Ultra", text: "Over-ear ANC. Very strong comfort and clean sound. $300. https://example.com/qcultra" },
    { name: "AirPods Pro", text: "In-ear earbuds. Best for portability and calls. $200. https://example.com/airpodspro" },
  ],
  mattress: [
    { name: "Foam", text: "Memory foam. Great pressure relief. Can sleep warm. $900. https://example.com/foam" },
    { name: "Hybrid", text: "Coils + foam. Balanced support. Cooler sleep. $1200. https://example.com/hybrid" },
    { name: "Latex", text: "Durable and responsive feel. Higher cost. $1400. https://example.com/latex" },
  ],
  grill: [
    { name: "Gas", text: "Fast heat-up. Easy weeknight cooking. Less smoky flavor. $500. https://example.com/gas" },
    { name: "Charcoal", text: "Best smoky flavor. More effort and cleanup. $250. https://example.com/charcoal" },
    { name: "Pellet", text: "Set-and-forget temp. Great BBQ. Higher cost. $800. https://example.com/pellet" },
  ],
  laptop: [
    { name: "Ultrabook", text: "Lightweight. Great battery. Good for travel and office. $1200. https://example.com/ultra" },
    { name: "Gaming", text: "High performance. Great GPU. Heavier and louder. $1600. https://example.com/gaming" },
    { name: "Budget", text: "Affordable. Fine for docs and browsing. Lower build quality. $700. https://example.com/budget" },
  ],
  "power-tool": [
    { name: "Corded", text: "Consistent power. No batteries. Needs outlet. $120. https://example.com/corded" },
    { name: "Cordless", text: "Portable. Battery ecosystem cost. $180. https://example.com/cordless" },
    { name: "Pro cordless", text: "Best durability. Most expensive. $260. https://example.com/pro" },
  ],
  camera: [
    { name: "Mirrorless", text: "Great autofocus and video. Smaller body. $1500. https://example.com/mirrorless" },
    { name: "DSLR", text: "Great battery. Big lens ecosystem. Bulkier. $1100. https://example.com/dslr" },
    { name: "Compact", text: "Easy carry. Great travel. Smaller sensor. $900. https://example.com/compact" },
  ],
};

function loadPreset(key) {
  if (key === "clear") {
    clearInputs();
    addOption();
    addOption();
    resultDiv.innerHTML = "Your table will appear here.";
    hideExports();
    const vb = document.getElementById("visitBox");
    if (vb) vb.remove();
    return;
  }

  const preset = PRESETS[key];
  if (!preset) return;

  clearInputs();
  preset.forEach(p => addOption(p.name, p.text));
  resultDiv.innerHTML = "Loaded example. Click “Generate Comparison Table”.";
  hideExports();
  const vb = document.getElementById("visitBox");
  if (vb) vb.remove();

  window.scrollTo({ top: inputsDiv.getBoundingClientRect().top + window.scrollY - 20, behavior: "smooth" });
}

examplesBar?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-example]");
  if (!btn) return;
  loadPreset(btn.getAttribute("data-example"));
});

// init
ensureTwoInputs();
