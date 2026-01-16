const inputsDiv = document.getElementById("inputs");
const addBtn = document.getElementById("addOption");
const compareBtn = document.getElementById("compare");
const resultDiv = document.getElementById("result");

const exportActions = document.getElementById("exportActions");
const copyBtn = document.getElementById("copyTable");
const csvBtn = document.getElementById("downloadCsv");

const examplesBar = document.getElementById("examples");

let optionCount = 0;

// ===== helpers =====
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
  if (optionCount === 0) { addOption(); addOption(); }
}

// ===== 20 category presets (must match button data-example keys) =====
const PRESETS = {
  headphones: [
    { name: "Over-ear ANC", text: "Best isolation + comfort. Great travel/office. Bulkier. https://example.com/overear" },
    { name: "On-ear", text: "Lightweight, portable. Less isolation. https://example.com/onear" },
    { name: "Earbuds", text: "Most portable. Great workouts/calls. https://example.com/earbuds" }
  ],
  mattresses: [
    { name: "Memory foam", text: "Great pressure relief. Can sleep warm. https://example.com/foam" },
    { name: "Hybrid", text: "Balanced support + cooler sleep. https://example.com/hybrid" },
    { name: "Latex", text: "Durable, responsive, often cooler. https://example.com/latex" }
  ],
  grills: [
    { name: "Gas", text: "Fast heat-up. Easy weeknights. https://example.com/gas" },
    { name: "Charcoal", text: "Best smoky flavor. More work. https://example.com/charcoal" },
    { name: "Pellet", text: "Set-and-forget temp. Great BBQ. https://example.com/pellet" }
  ],
  laptops: [
    { name: "Ultrabook", text: "Thin/light. Great battery. https://example.com/ultrabook" },
    { name: "Performance", text: "Faster CPU/GPU. Heavier + louder. https://example.com/performance" },
    { name: "Budget", text: "Best value. https://example.com/budget" }
  ],
  powertools: [
    { name: "Corded", text: "Consistent power. Needs outlet. https://example.com/corded" },
    { name: "Cordless", text: "Portable. Battery ecosystem cost. https://example.com/cordless" },
    { name: "Pro cordless", text: "Best durability. Highest cost. https://example.com/pro" }
  ],
  cameras: [
    { name: "Mirrorless", text: "Great autofocus/video. Smaller body. https://example.com/mirrorless" },
    { name: "DSLR", text: "Great battery. Bulkier. https://example.com/dslr" },
    { name: "Compact", text: "Easy carry/travel. https://example.com/compact" }
  ]
};

function loadPreset(key) {
  if (key === "clear") {
    clearInputs();
    addOption(); addOption();
    resultDiv.innerHTML = "Your table will appear here.";
    hideExports();
    return;
  }

  const preset = PRESETS[key];
  if (!preset) return;

  clearInputs();
  preset.forEach(p => addOption(p.name, p.text));
  resultDiv.innerHTML = "Loaded example. Click “Generate Comparison Table”.";
  hideExports();
  window.scrollTo({ top: inputsDiv.getBoundingClientRect().top + window.scrollY - 20, behavior: "smooth" });
}

// ===== example bar wiring =====
examplesBar?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-example]");
  if (!btn) return;
  loadPreset(btn.getAttribute("data-example"));
});

// ===== export =====
function tableToTSV(table) {
  const rows = Array.from(table.querySelectorAll("tr"));
  return rows.map(row => {
    const cells = Array.from(row.querySelectorAll("th,td"));
    return cells.map(c => normalizeText(c.innerText)).join("\t");
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

copyBtn?.addEventListener("click", async () => {
  const table = getFirstTableEl();
  if (!table) return alert("Generate a table first.");
  await copyTextToClipboard(tableToTSV(table));
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy (Excel-ready)"), 1200);
});

// ===== main compare =====
addBtn?.addEventListener("click", () => addOption());

compareBtn?.addEventListener("click", async () => {
  hideExports();

  if (window.va) window.va("event", "comparison_generated");

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
    if (getFirstTableEl()) showExports();
  } catch {
    resultDiv.innerHTML = "Something went wrong.";
  }
});

// init
ensureTwoInputs();
