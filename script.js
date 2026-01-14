const inputsDiv = document.getElementById("inputs");
const addBtn = document.getElementById("addOption");
const compareBtn = document.getElementById("compare");
const resultDiv = document.getElementById("result");

const exportActions = document.getElementById("exportActions");
const copyBtn = document.getElementById("copyTable");
const csvBtn = document.getElementById("downloadCsv");

const examplesBar = document.getElementById("examples");

let optionCount = 0;

/* ---------- helpers ---------- */
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

/* ---------- presets ---------- */
const PRESETS = {
  tv: [
    {
      name: "OLED TV",
      text: "OLED TV. Perfect blacks and excellent contrast. Best for movies and dark rooms. More expensive. https://example.com/oled"
    },
    {
      name: "QLED TV",
      text: "QLED TV. Very bright, great for daytime viewing. No burn-in risk. Less perfect blacks than OLED. https://example.com/qled"
    },
    {
      name: "LED TV",
      text: "LED TV. Most affordable. Wide range of sizes. Lower contrast than OLED or QLED. https://example.com/led"
    }
  ]
};

/* ---------- load preset ---------- */
function loadPreset(key) {
  const preset = PRESETS[key];
  if (!preset) return;

  clearInputs();
  preset.forEach(p => addOption(p.name, p.text));
  resultDiv.innerHTML = "Loaded example. Click “Generate Comparison Table”.";
  hideExports();
  window.scrollTo({ top: inputsDiv.offsetTop - 20, behavior: "smooth" });
}

/* ---------- auto-load from landing page ---------- */
const presetFromLanding = sessionStorage.getItem("preset");
if (presetFromLanding) {
  loadPreset(presetFromLanding);
  sessionStorage.removeItem("preset");
}

/* ---------- export helpers ---------- */
function tableToTSV(table) {
  return Array.from(table.querySelectorAll("tr"))
    .map(row =>
      Array.from(row.querySelectorAll("th,td"))
        .map(c => normalizeText(c.innerText))
        .join("\t")
    )
    .join("\n");
}
async function copyTextToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

/* ---------- export wiring ---------- */
copyBtn?.addEventListener("click", async () => {
  const table = getFirstTableEl();
  if (!table) return alert("Generate a table first.");
  await copyTextToClipboard(tableToTSV(table));
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy (Excel-ready)"), 1200);
});

/* ---------- main compare ---------- */
addBtn?.addEventListener("click", () => addOption());

compareBtn?.addEventListener("click", async () => {
  hideExports();

  const options = Array.from(inputsDiv.children)
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
    const r = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options })
    });
    resultDiv.innerHTML = await r.text();
    if (getFirstTableEl()) showExports();
  } catch {
    resultDiv.innerHTML = "Something went wrong.";
  }
});

/* ---------- init ---------- */
ensureTwoInputs();
