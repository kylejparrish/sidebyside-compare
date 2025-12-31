const inputsDiv = document.getElementById("inputs");
const addBtn = document.getElementById("addOption");
const compareBtn = document.getElementById("compare");
const resultDiv = document.getElementById("result");

let optionCount = 0;
addInput();
addInput();

function addInput() {
  if (optionCount >= 10) return;
  optionCount++;

  const textarea = document.createElement("textarea");
  textarea.placeholder = `Option ${optionCount}`;
  inputsDiv.appendChild(textarea);
}

addBtn.addEventListener("click", addInput);

compareBtn.addEventListener("click", async () => {
  const options = Array.from(inputsDiv.querySelectorAll("textarea"))
    .map(t => t.value.trim())
    .filter(Boolean);

  if (options.length < 2) {
    resultDiv.innerHTML = "Please add at least two options to compare.";
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
