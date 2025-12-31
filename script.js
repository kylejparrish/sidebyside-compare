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
  name.placeholder = `Option ${optionCount} name (e.g., Notion)`;
  name.className = "optname";
  name.style.width = "100%";
  name.style.padding = "10px 12px";
  name.style.marginBottom = "8px";
  name.style.borderRadius = "12px";
  name.style.border = "1px solid rgba(255,255,255,0.14)";
  name.style.background = "rgba(0,0,0,0.25)";
  name.style.color = "white";
  name.style.outline = "none";

  const textarea = document.createElement("textarea");
  textarea.placeholder = `Option ${optionCount} description (paste here)`;

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

function normalizeText(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

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

function downloadFile(filename, contents, mime) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function extractRecapText() {
  // Grabs Bottom line + Recap & Suggestion boxes as plain text
  const boxes = Array.from(resultDiv.querySelectorAll(".recap"));
  if (!boxes.length) return "";
  return boxes.map(b => normalizeText(b.innerText)).filter(Boolean).join("\n\n");
}

copyBtn?.addEventListener("click", async () => {
  const table = getFirstTableEl();
  if (!table) {
    alert("Generate a table first.");
    return;
  }

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
  if (!table) {
    alert("Generate a table first.");
    return;
  }
  const csv = tableToCSV(table);
  downloadFile("sidebyside-comparison.csv", csv, "text/csv;charset=utf-8");
});

compareBtn.addEventListener("click", async () => {
  hideExports();

  const wrappers = Array.from(inputsDiv.children);

  const options = wrappers
    .map((w, i) => {
      const name = w.querySelector(".optname")?.value?.trim() || `Option ${i + 1}`;
      const text = w.querySelector("textarea")?.value?.trim() || "";
      return { name, text };
    })
    .filter(o => o.text);

  if (options.length < 2) {
    resultDiv.innerHTML = "Please add at least two option descriptions to compare.";
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
    resultDiv.innerHTML = "Something went wrong. Please try again.";
  }
});
