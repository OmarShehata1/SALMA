// Description: This file contains the JavaScript code for the exam page.
const fileUpload = document.getElementById("fileUpload");
const examFile = document.getElementById("examFile");
const preview = document.getElementById("preview");
const startCorrection = document.getElementById("startCorrection");
const loading = document.getElementById("loading");
const results = document.getElementById("results");
const finalScore = document.getElementById("finalScore");
const resultsTable = document.getElementById("resultsTable");
const retryButton = document.getElementById("retryButton");
const tableSection = document.getElementById("tableSection");

fileUpload.addEventListener("click", () => examFile.click());

fileUpload.addEventListener("dragover", (e) => {
  e.preventDefault();
  fileUpload.style.backgroundColor = "rgba(74, 144, 226, 0.1)";
});

fileUpload.addEventListener("dragleave", () => {
  fileUpload.style.backgroundColor = "";
});

fileUpload.addEventListener("drop", (e) => {
  e.preventDefault();
  fileUpload.style.backgroundColor = "";
  handleFile(e.dataTransfer.files[0]);
});

examFile.addEventListener("change", (e) => {
  handleFile(e.target.files[0]);
});

function handleFile(file) {
  if (
    file &&
    ["application/pdf", "image/jpeg", "image/png"].includes(file.type)
  ) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = "block";
      startCorrection.style.display = "inline-block";
    };
    reader.readAsDataURL(file);
  } else {
    alert("Please upload a PDF, JPG, or PNG file.");
  }
}

startCorrection.addEventListener("click", () => {
  loading.style.display = "block";
  startCorrection.style.display = "none";
  setTimeout(showResults, 3000); // Simulating processing time
});

function showResults() {
  loading.style.display = "none";
  results.style.display = "block";
  tableSection.style.display = "block";

  const score = Math.floor(Math.random() * 41) + 60; // Random score between 60 and 100
  finalScore.textContent = `${score}/100`;
  finalScore.className = score >= 70 ? "final-score pass" : "final-score retry";

  resultsTable.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const row = resultsTable.insertRow();
    row.insertCell(0).textContent = `Question ${i}`;
    row.insertCell(1).textContent = Math.floor(Math.random() * 11);
  }
}

retryButton.addEventListener("click", () => {
  results.style.display = "none";
  tableSection.style.display = "none";
  preview.style.display = "none";
  startCorrection.style.display = "inline-block";
  examFile.value = "";
});
