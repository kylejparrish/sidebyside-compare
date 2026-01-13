const inputsDiv = document.getElementById("inputs");
const addBtn = document.getElementById("addOption");
const compareBtn = document.getElementById("compare");
const resultDiv = document.getElementById("result");

const exportActions = document.getElementById("exportActions");
const copyBtn = document.getElementById("copyTable");
const csvBtn = document.getElementById("downloadCsv");

let optionCount = 0;
addOption();
addOption();

function addOption() {
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

  const textarea = document.createElement("textarea");
  textarea.placeholder = `Option ${optionCount} description (paste links or notes)`;

  wrapper.appendChild(name);
  wrapper.appendChild(textarea);
  inputsDiv.appendChild(wrapper);
}

addBtn.addEventListener("click", addOption);

function hideExports() {
  if (exportActions) exportActions.style.display = "none";
}
function showExports() {
  if (exportActions) exportActions.style.display = "flex";
}
function getFirstTableEl() {
  return resultDiv.querySelector("table");
}

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
    const r = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options })
    });

    const html = await r.text();
    resultDiv.innerHTML = html;
    if (getFirstTableEl()) {
      showExports();
      injectVisitAction();
    }
  } catch {
    resultDiv.innerHTML = "Something went wrong.";
  }
});

function injectVisitAction() {
  const container = resultDiv.querySelector(".comparison");
  if (!container) return;

  const data = container.dataset.options;
  if (!data) return;

  let options;
  try {
    options = JSON.parse(data);
  } catch {
    return;
  }

  if (!options.length) return;

  const wrapper = document.createElement("div");
  wrapper.style.marginTop = "18px";
  wrapper.style.padding = "14px";
  wrapper.style.border = "1px solid rgba(255,255,255,0.18)";
  wrapper.style.borderRadius = "12px";
  wrapper.style.background = "rgba(255,255,255,0.03)";

  const label = document.createElement("div");
  label.textContent = "Ready to move forward?";
  label.style.fontWeight = "800";
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

  options.forEach(o => {
    const opt = document.createElement("option");
    opt.value = o.url || "";
    opt.textContent = o.name;
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
    if (select.value) {
      window.open(select.value, "_blank", "noopener");
    }
  });

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  wrapper.appendChild(btn);
  resultDiv.appendChild(wrapper);
}
