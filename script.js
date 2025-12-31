const inputsDiv = document.getElementById("inputs");
const addBtn = document.getElementById("addOption");
const compareBtn = document.getElementById("compare");
const resultDiv = document.getElementById("result");

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

compareBtn.addEventListener("click", async () => {
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
  } catch (err) {
    resultDiv.innerHTML = "Something went wrong. Please try again.";
  }
});
