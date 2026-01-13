const inputsDiv = document.getElementById("inputs");
const addBtn = document.getElementById("addOption");
const compareBtn = document.getElementById("compare");
const resultDiv = document.getElementById("result");

const exportActions = document.getElementById("exportActions");
const copyBtn = document.getElementById("copyTable");
const csvBtn = document.getElementById("downloadCsv");

const examplesBar = document.getElementById("examples");

let optionCount = 0;

// ====== helpers ======
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
function removeAllOptions() {
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
function seedMinimumInputs() {
  if (optionCount === 0) { addOption(); addOption(); }
}

// ====== export helpers ======
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

// ====== export button wiring ======
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

// ====== main compare ======
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
      // Visit official site UI is injected by existing code in your current script version.
      // If it’s not present, it’s fine — comparisons still work.
      if (typeof window.injectVisitAction === "function") window.injectVisitAction();
    }
  } catch {
    resultDiv.innerHTML = "Something went wrong.";
  }
});

// ====== examples (the wedge) ======
const PRESETS = {
  headphones: [
    { name: "Option A", text: "Over-ear noise-cancelling headphones. Comfortable for long sessions. Strong bass. $250. https://example.com/a" },
    { name: "Option B", text: "On-ear lightweight headphones. Portable. Good mic for calls. $180. https://example.com/b" },
    { name: "Option C", text: "In-ear earbuds. Best for workouts. Strong ANC. $200. https://example.com/c" },
  ],
  mattress: [
    { name: "Foam", text: "Memory foam mattress. Great pressure relief. Can sleep warm. $900. https://example.com/foam" },
    { name: "Hybrid", text: "Hybrid coil + foam. Balanced support. Cooler sleep. $1200. https://example.com/hybrid" },
    { name: "Latex", text: "Latex mattress. Very durable. Responsive feel. $1400. https://example.com/latex" },
  ],
  grill: [
    { name: "Gas", text: "Gas grill. Fast heat-up. Easy weeknight cooking. Less smoky flavor. $500. https://example.com/gas" },
    { name: "Charcoal", text: "Charcoal grill. Best smoke flavor. More effort and cleanup. $250. https://example.com/charcoal" },
    { name: "Pellet", text: "Pellet smoker/grill. Set-and-forget temperature. Great BBQ. $800. https://example.com/pellet" },
  ],
  laptop: [
    { name: "Ultrabook", text: "Lightweight laptop. Great battery. Good for travel and office work. $1200. https://example.com/ultra" },
    { name: "Gaming", text: "High performance laptop. Great GPU. Heavier and louder. $1600. https://example.com/gaming" },
    { name: "Budget", text: "Affordable laptop. Fine for browsing and documents. Lower build quality. $700. https://example.com/budget" },
  ],
  "power-tool": [
    { name: "Corded", text: "Corded tool. Consistent power. No batteries. Needs outlet. $120. https://example.com/corded" },
    { name: "Cordless", text: "Cordless tool. Portable. Battery ecosystem cost. $180. https://example.com/cordless" },
    { name: "Pro", text: "Pro-grade cordless. Best durability. Expensive. $260. https://example.com/pro" },
  ],
  camera: [
    { name: "Mirrorless", text: "Mirrorless camera. Great autofocus and video. Smaller body. $1500. https://example.com/mirrorless" },
    { name: "DSLR", text: "DSLR camera. Great battery. Big lens ecosystem. Bulkier. $1100. https://example.com/dslr" },
    { name: "Compact", text: "Compact camera. Easy carry. Good travel shots. Smaller sensor. $900. https://example.com/compact" },
  ],
};

function loadPreset(key) {
  if (key === "clear") {
    removeAllOptions();
    addOption();
    addOption();
    resultDiv.innerHTML = "Your table will appear here.";
    hideExports();
    return;
  }
  const preset = PRESETS[key];
  if (!preset) return;

  removeAllOptions();
  preset.forEach(p => addOption(p.name, p.text));
  resultDiv.innerHTML = "Loaded example. Click “Generate Comparison Table”.";
  hideExports();
  window.scrollTo({ top: inputsDiv.getBoundingClientRect().top + window.scrollY - 20, behavior: "smooth" });
}

examplesBar?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-example]");
  if (!btn) return;
  loadPreset(btn.getAttribute("data-example"));
});

// initialize
seedMinimumInputs();
