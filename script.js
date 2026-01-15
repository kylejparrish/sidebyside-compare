const inputsDiv = document.getElementById("inputs");
const addBtn = document.getElementById("addOption");
const compareBtn = document.getElementById("compare");
const resultDiv = document.getElementById("result");

const exportActions = document.getElementById("exportActions");
const copyBtn = document.getElementById("copyTable");

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
  if (optionCount === 0) { addOption(); addOption(); }
}

/* ---------- 20 presets (generic) ---------- */
const PRESETS = {
  tvs: [
    { name: "OLED TV", text: "Perfect blacks, best contrast. Great for movies. Higher cost. https://example.com/oled" },
    { name: "QLED TV", text: "Very bright, great for daytime. No burn-in risk. https://example.com/qled" },
    { name: "LED TV", text: "Most affordable. Wide size options. Lower contrast. https://example.com/led" }
  ],
  headphones: [
    { name: "Over-ear ANC", text: "Best isolation + comfort. Great travel/office. Bulkier. https://example.com/overear" },
    { name: "On-ear", text: "Lightweight, portable. Less isolation. https://example.com/onear" },
    { name: "Earbuds", text: "Most portable. Great workouts/calls. Comfort varies. https://example.com/earbuds" }
  ],
  mattresses: [
    { name: "Memory foam", text: "Great pressure relief. Good motion isolation. Can sleep warm. https://example.com/foam" },
    { name: "Hybrid", text: "Balanced support + cooler sleep. Better edge support. https://example.com/hybrid" },
    { name: "Latex", text: "Durable, responsive, often cooler. Higher cost. https://example.com/latex" }
  ],
  laptops: [
    { name: "Ultrabook", text: "Thin/light. Great battery. Best travel/office. https://example.com/ultrabook" },
    { name: "Performance", text: "Faster CPU/GPU. Heavier + louder. https://example.com/performance" },
    { name: "Budget", text: "Best value. Fine for browsing/docs. https://example.com/budget" }
  ],
  phones: [
    { name: "Flagship", text: "Best camera/performance. Highest cost. https://example.com/flagship" },
    { name: "Midrange", text: "Great balance of price/features. https://example.com/mid" },
    { name: "Budget", text: "Lowest cost. Fewer features. https://example.com/phonebudget" }
  ],
  tablets: [
    { name: "Premium tablet", text: "Best screen/performance. Great accessories. https://example.com/tabpremium" },
    { name: "Value tablet", text: "Good enough for streaming/reading. https://example.com/tabvalue" },
    { name: "2-in-1", text: "Keyboard-first, laptop-like use. https://example.com/2in1" }
  ],
  smartwatches: [
    { name: "Fitness-focused", text: "Best tracking + battery. Fewer smart apps. https://example.com/fitnesswatch" },
    { name: "Smartwatch", text: "Best apps/notifications. Battery shorter. https://example.com/smartwatch" },
    { name: "Hybrid", text: "Simple, long battery. Limited features. https://example.com/hybridwatch" }
  ],
  speakers: [
    { name: "Bookshelf", text: "Best sound per dollar. Needs space. https://example.com/bookshelf" },
    { name: "Portable", text: "Take anywhere. Less full sound. https://example.com/portable" },
    { name: "Smart speaker", text: "Voice assistant built-in. Privacy tradeoffs. https://example.com/smartspeaker" }
  ],
  soundbars: [
    { name: "2.1 soundbar", text: "Simple upgrade. Good value. https://example.com/21" },
    { name: "5.1 system", text: "Better surround. More setup. https://example.com/51" },
    { name: "Atmos", text: "Best immersion. Higher cost. https://example.com/atmos" }
  ],
  cameras: [
    { name: "Mirrorless", text: "Best autofocus/video. Smaller body. https://example.com/mirrorless" },
    { name: "DSLR", text: "Great battery. Bulkier. https://example.com/dslr" },
    { name: "Compact", text: "Easy carry/travel. Smaller sensor. https://example.com/compact" }
  ],
  printers: [
    { name: "Laser", text: "Fast text printing, low cost/page. https://example.com/laser" },
    { name: "Inkjet", text: "Better photos, higher ink costs. https://example.com/inkjet" },
    { name: "Tank", text: "Low ink cost, higher upfront. https://example.com/tank" }
  ],
  routers: [
    { name: "Single router", text: "Best value for small homes. https://example.com/single" },
    { name: "Mesh Wi-Fi", text: "Best coverage for larger homes. https://example.com/mesh" },
    { name: "Gaming router", text: "Extra features, not always needed. https://example.com/gamingrouter" }
  ],
  vacuums: [
    { name: "Cordless stick", text: "Convenient daily use. Battery limits. https://example.com/stick" },
    { name: "Robot", text: "Hands-off cleaning. Not deep clean. https://example.com/robot" },
    { name: "Upright", text: "Best deep clean. Bulky. https://example.com/upright" }
  ],
  airpurifiers: [
    { name: "Small room", text: "Low cost. Limited coverage. https://example.com/smallair" },
    { name: "Large room", text: "Higher CADR, better coverage. https://example.com/largeair" },
    { name: "Smart", text: "Auto modes + app. Not necessary. https://example.com/smartair" }
  ],
  coffee: [
    { name: "Drip", text: "Easiest daily coffee. https://example.com/drip" },
    { name: "Espresso", text: "Best café-style drinks. More effort. https://example.com/espresso" },
    { name: "Pod", text: "Fast + convenient. Higher cost/cup. https://example.com/pod" }
  ],
  grills: [
    { name: "Gas", text: "Fast heat-up. Easy weeknights. https://example.com/gas" },
    { name: "Charcoal", text: "Best smoky flavor. More work. https://example.com/charcoal" },
    { name: "Pellet", text: "Set-and-forget temp. Great BBQ. https://example.com/pellet" }
  ],
  powertools: [
    { name: "Corded", text: "Consistent power. Needs outlet. https://example.com/corded" },
    { name: "Cordless", text: "Portable. Battery ecosystem cost. https://example.com/cordless" },
    { name: "Pro cordless", text: "Best durability. Highest cost. https://example.com/pro" }
  ],
  bikes: [
    { name: "Road", text: "Fast on pavement. Not for trails. https://example.com/road" },
    { name: "Mountain", text: "Best for trails. Slower on road. https://example.com/mtb" },
    { name: "Hybrid", text: "Balanced for city + paths. https://example.com/hybridbike" }
  ],
  standingdesks: [
    { name: "Manual", text: "Lowest cost. More effort to adjust. https://example.com/manual" },
    { name: "Electric", text: "Easy adjustments. Higher cost. https://example.com/electric" },
    { name: "Converter", text: "Sits on existing desk. Limited stability. https://example.com/converter" }
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

/* ---------- auto-load from landing template ---------- */
const presetFromLanding = sessionStorage.getItem("preset");
if (presetFromLanding) {
  loadPreset(presetFromLanding);
  sessionStorage.removeItem("preset");
}

/* ---------- copy export ---------- */
function tableToTSV(table) {
  return Array.from(table.querySelectorAll("tr"))
    .map(row =>
      Array.from(row.querySelectorAll("th,td"))
        .map(c => normalizeText(c.innerText))
        .join("\t")
    )
    .join("\n");
}

copyBtn?.addEventListener("click", async () => {
  const table = getFirstTableEl();
  if (!table) return alert("Generate a table first.");
  const tsv = tableToTSV(table);
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(tsv);
  } else {
    const ta = document.createElement("textarea");
    ta.value = tsv;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
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
