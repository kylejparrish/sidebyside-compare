// ---------- DOM ----------
const compareBtn = document.getElementById("compare");
const resultDiv = document.getElementById("result");

const exportActions = document.getElementById("exportActions");
const copyBtn = document.getElementById("copyTable");

// Inputs (fixed 3 slots)
const name1 = document.getElementById("option-name-1");
const desc1 = document.getElementById("option-desc-1");
const name2 = document.getElementById("option-name-2");
const desc2 = document.getElementById("option-desc-2");
const name3 = document.getElementById("option-name-3");
const desc3 = document.getElementById("option-desc-3");

// ---------- Presets ----------
const PRESETS = {
  headphones: [
    {
      name: "Over-ear ANC",
      desc: "Over-ear noise cancelling headphones. Best isolation and comfort, but bulkier. Great for travel and office. https://example.com/overear"
    },
    {
      name: "On-ear",
      desc: "On-ear headphones. Lightweight and portable. Less isolation than over-ear. Good for short sessions. https://example.com/onear"
    },
    {
      name: "Earbuds",
      desc: "In-ear earbuds. Most portable. Great for workouts and calls. Comfort varies. https://example.com/earbuds"
    }
  ],
  mattress: [
    {
      name: "Memory foam",
      desc: "Contouring feel, strong pressure relief, great motion isolation. Can sleep warm. https://example.com/foam"
    },
    {
      name: "Hybrid",
      desc: "Foam + coils. Balanced support, often cooler, better edge support. Higher price. https://example.com/hybrid"
    },
    {
      name: "Latex",
      desc: "Durable and responsive, often cooler than memory foam. Higher cost. https://example.com/latex"
    }
  ],
  grill: [
    {
      name: "Gas grill",
      desc: "Fast heat-up, easy temperature control, great for weeknights. Less smoky flavor. https://example.com/gas"
    },
    {
      name: "Charcoal grill",
      desc: "Best smoky flavor. More effort, longer setup, more cleanup. https://example.com/charcoal"
    },
    {
      name: "Pellet grill",
      desc: "Set-and-forget temperature. Great BBQ. Higher cost and more parts. https://example.com/pellet"
    }
  ],
  laptop: [
    {
      name: "Ultrabook",
      desc: "Thin/light, long battery, best for productivity and travel. Less gaming power. https://example.com/ultrabook"
    },
    {
      name: "Performance",
      desc: "Faster CPU/GPU for heavier work. Heavier/louder. Shorter battery. https://example.com/performance"
    },
    {
      name: "Budget",
      desc: "Best value. Fine for browsing/docs. Lower build/screen quality. https://example.com/budget"
    }
  ],
  powertools: [
    {
      name: "Corded",
      desc: "Consistent power, cheaper, no batteries. Needs outlet. https://example.com/corded"
    },
    {
      name: "Cordless",
      desc: "Portable and convenient. Battery ecosystem cost. https://example.com/cordless"
    },
    {
      name: "Pro cordless",
      desc: "Best durability and performance. Highest cost. https://example.com/pro"
    }
  ],
  camera: [
    {
      name: "Mirrorless",
      desc: "Modern autofocus, great photo/video. Smaller body. https://example.com/mirrorless"
    },
    {
      name: "DSLR",
      desc: "Great battery and optical viewfinder. Bulkier system. https://example.com/dslr"
    },
    {
      name: "Compact",
      desc: "Easy carry/travel. Smaller sensor, simpler controls. https://example.com/compact"
    }
  ]
};

// ---------- Helpers ----------
function normalizeText(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function hideExports() {
  if (exportActions) exportActions.style.display = "none";
}

function showExports() {
  if (exportActions) exportActions.style.display = "flex";
}

function clearAll() {
  name1.value = ""; desc1.value = "";
  name2.value = ""; desc2.value = "";
  name3.value = ""; desc3.value = "";
}

function loadPreset(key) {
  if (key === "clear") {
    clearAll();
    resultDiv.innerHTML = "Your table will appear here.";
    hideExports();
    return;
  }

  const p = PRESETS[key];
  if (!p) return;

  name1.value = p[0]?.name || "";
  desc1.value = p[0]?.desc || "";

  name2.value = p[1]?.name || "";
  desc2.value = p[1]?.desc || "";

  name3.value = p[2]?.name || "";
  desc3.value = p[2]?.desc || "";
}

function getOptions() {
  const options = [];

  const o1 = normalizeText(desc1.value);
  const o2 = normalizeText(desc2.value);
  const o3 = normalizeText(desc3.value);

  if (o1) options.push({ name: normalizeText(name1.value) || "Option 1", text: o1 });
  if (o2) options.push({ name: normalizeText(name2.value) || "Option 2", text: o2 });
  if (o3) options.push({ name: normalizeText(name3.value) || "Option 3", text: o3 });

  return options;
}

function getFirstTableEl() {
  return resultDiv.querySelector("table");
}

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

// ---------- Example button wiring ----------
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".example-btn");
  if (!btn) return;
  const key = btn.getAttribute("data-example");
  loadPreset(key);
});

// ---------- Generate comparison ----------
compareBtn.addEventListener("click", async () => {
  hideExports();

  // Analytics event (safe)
  if (window.va) window.va("event", "comparison_generated");

  const options = getOptions();
  if (options.length < 2) {
    resultDiv.innerHTML = "Please fill at least two descriptions to compare.";
    return;
  }

  resultDiv.innerHTML = "Generating comparison…";

  try {
    const r = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options })
    });

    const html = await r.text();
    resultDiv.innerHTML = html;

    if (getFirstTableEl()) showExports();
  } catch {
    resultDiv.innerHTML = "Something went wrong.";
  }
});

// ---------- Copy export ----------
copyBtn?.addEventListener("click", async () => {
  const table = getFirstTableEl();
  if (!table) return alert("Generate a table first.");
  try {
    const tsv = tableToTSV(table);
    await copyTextToClipboard(tsv);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy (Excel-ready)"), 1200);
  } catch {
    alert("Copy failed. Please try again.");
  }
});
