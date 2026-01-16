// ===== Example presets =====
const PRESETS = {
  headphones: [
    {
      name: "Over-ear ANC Headphones",
      desc: "Strong noise cancellation, comfortable for long sessions, bulky design. Good for travel and office use."
    },
    {
      name: "Wireless Earbuds",
      desc: "Compact and portable, good for workouts and commuting, less isolation and battery life."
    }
  ],

  mattress: [
    {
      name: "Memory Foam Mattress",
      desc: "Contouring feel, pressure relief, can trap heat, good for side sleepers."
    },
    {
      name: "Hybrid Mattress",
      desc: "Mix of foam and coils, better airflow, more bounce, higher price."
    }
  ],

  grill: [
    {
      name: "Gas Grill",
      desc: "Quick heat, easy temperature control, convenient for frequent use."
    },
    {
      name: "Charcoal Grill",
      desc: "Smoky flavor, longer setup, more hands-on cooking experience."
    }
  ],

  laptop: [
    {
      name: "Ultrabook",
      desc: "Lightweight, long battery life, great for productivity and travel."
    },
    {
      name: "Gaming Laptop",
      desc: "High performance, heavier, shorter battery life, more expensive."
    }
  ],

  powertools: [
    {
      name: "Cordless Tool Set",
      desc: "Portable, convenient, battery ecosystem matters."
    },
    {
      name: "Corded Tools",
      desc: "Consistent power, cheaper, limited mobility."
    }
  ],

  camera: [
    {
      name: "Mirrorless Camera",
      desc: "Compact, modern autofocus, great for photo and video."
    },
    {
      name: "DSLR",
      desc: "Optical viewfinder, strong battery life, bulkier system."
    }
  ]
};

// ===== Helpers =====
function clearInputs() {
  document.querySelectorAll(".option-name").forEach(i => i.value = "");
  document.querySelectorAll(".option-desc").forEach(i => i.value = "");
}

function loadPreset(key) {
  if (key === "clear") {
    clearInputs();
    return;
  }

  const data = PRESETS[key];
  if (!data) return;

  clearInputs();

  data.forEach((item, idx) => {
    const nameInput = document.querySelector(`#option-name-${idx + 1}`);
    const descInput = document.querySelector(`#option-desc-${idx + 1}`);

    if (nameInput) nameInput.value = item.name;
    if (descInput) descInput.value = item.desc;
  });
}

// ===== Button wiring =====
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".example-btn");
  if (!btn) return;

  const preset = btn.getAttribute("data-example");
  loadPreset(preset);
});
