// Teachable Machine model URL
const CHEST_URL = "https://teachablemachine.withgoogle.com/models/CHMEJ5Ywr/";

let chestModel, chestMaxPredictions;

// load model
async function initChestModel() {
  const modelURL = CHEST_URL + "model.json";
  const metadataURL = CHEST_URL + "metadata.json";
  chestModel = await tmImage.load(modelURL, metadataURL);
  chestMaxPredictions = chestModel.getTotalClasses();
}

// advanced grayscale + brightness + contrast filter
function isLikelyXray(imageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;

  if (canvas.width < 128 || canvas.height < 128) {
    return false; // Reject very small images
  }

  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageElement, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let grayscalePixels = 0;
  let totalLuminance = 0;
  let luminanceValues = [];
  const totalPixels = canvas.width * canvas.height;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];

    const isGray =
      Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10;
    if (isGray) grayscalePixels++;

    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    totalLuminance += luminance;
    luminanceValues.push(luminance);
  }

  const grayscaleRatio = grayscalePixels / totalPixels;
  const avgLuminance = totalLuminance / totalPixels;

  // contrast, standard deviation of luminance
  const mean = avgLuminance;
  const variance =
    luminanceValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    totalPixels;
  const contrast = Math.sqrt(variance);

  console.log(
    "📊 grayscale:",
    grayscaleRatio.toFixed(2),
    "brightness:",
    avgLuminance.toFixed(2),
    "contrast:",
    contrast.toFixed(2)
  );

  const isGrayscaleEnough = grayscaleRatio >= 0.88;
  const isBrightnessOK = avgLuminance >= 50 && avgLuminance <= 190;
  const isContrastOK = contrast >= 25;

  return isGrayscaleEnough && isBrightnessOK && isContrastOK;
}

async function generateMedicalAnalysis(condition) {
  try {
    const response = await fetch("/.netlify/functions/analysis-generator", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ condition }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate medical analysis");
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error("Error generating analysis:", error);
    return null;
  }
}

function generatePDFReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Set up PDF styling
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPosition = margin;

  // Theme colors 
  const primaryBlue = [41, 128, 185]; // Header background
  const accentBlue = [52, 152, 219]; // Section headers
  const darkGray = [44, 62, 80]; // Main text
  const lightGray = [236, 240, 241]; // Box backgrounds
  const successGreen = [39, 174, 96]; // Low risk
  const warningOrange = [230, 126, 34]; // Medium risk
  const dangerRed = [231, 76, 60]; // High risk

  // Header with professional styling
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Main title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("AI X-RAY ANALYSIS REPORT", pageWidth / 2, 22, { align: "center" });

  // Subtitle
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Medical Image Analysis System", pageWidth / 2, 32, {
    align: "center",
  });

  yPosition = 55;

  // Patient/File Information Section
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 35, "F");
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 35, "S");

  yPosition += 12;

  // File information
  const fileName =
    document.getElementById("file-name-display")?.textContent || "Unknown File";
  const currentDate = new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text("File Name:", margin + 8, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(fileName, margin + 35, yPosition);

  yPosition += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Generated:", margin + 8, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(currentDate, margin + 35, yPosition);

  yPosition += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Report ID:", margin + 8, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(`XRA-${Date.now().toString().slice(-6)}`, margin + 35, yPosition);

  yPosition += 30;

  // Analysis Results Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.text("ANALYSIS RESULTS", margin, yPosition);

  // Underline
  doc.setLineWidth(2);
  doc.setDrawColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.line(margin, yPosition + 3, margin + 65, yPosition + 3);

  yPosition += 20;

  // Get all result cards (excluding title card)
  const resultCards = document.querySelectorAll(".result-card");
  let analysisCount = 0;

  resultCards.forEach((card, index) => {
    // Skip the title card (first card)
    if (index === 0) return;

    analysisCount++;

    // Extract condition name from the blue text paragraph
    const conditionNameElement = card.querySelector(
      "p[style*='color: #58a6ff']"
    );
    const conditionName = conditionNameElement
      ? conditionNameElement.textContent
      : "Unknown Condition";

    // Extract confidence score
    const confidenceText = card.textContent.match(/Confidence:\s*(\d+\.?\d*%)/);
    const confidence = confidenceText ? confidenceText[1] : "N/A";
    const confidenceNum = parseFloat(confidence);

    // Extract analysis text
    const analysisDiv = card.querySelector(`[id^="detailed-analysis-"]`);
    let analysisText = "";
    if (analysisDiv) {
      analysisText = analysisDiv.textContent.trim();
      analysisText = analysisText.replace(/<[^>]*>/g, "");
    }

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = margin;
    }

    // Main condition section
    const sectionHeight = 45;
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, sectionHeight, "F");
    doc.setDrawColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.setLineWidth(1);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, sectionHeight, "S");

    yPosition += 15;

    // Condition name (actual condition name instead of "Predicted Condition")
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(dangerRed[0], dangerRed[1], dangerRed[2]);
    doc.text(
      `${analysisCount}. Predicted Condition: ${conditionName}`,
      margin + 8,
      yPosition
    );

    yPosition += 12;

    // Confidence and Risk Level on same line
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text("Confidence:", margin + 8, yPosition);

    // Confidence score with color
    const confidenceColor =
      confidenceNum >= 80
        ? dangerRed
        : confidenceNum >= 60
        ? warningOrange
        : successGreen;
    doc.setTextColor(
      confidenceColor[0],
      confidenceColor[1],
      confidenceColor[2]
    );
    doc.setFont("helvetica", "bold");
    doc.text(confidence, margin + 35, yPosition);

    // Risk level
    const riskLevel =
      confidenceNum >= 80
        ? "HIGH RISK"
        : confidenceNum >= 60
        ? "MEDIUM RISK"
        : "LOW RISK";
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Risk Level:", margin + 80, yPosition);
    doc.setTextColor(
      confidenceColor[0],
      confidenceColor[1],
      confidenceColor[2]
    );
    doc.text(riskLevel, margin + 115, yPosition);

    yPosition += 35;

    // Detailed Medical Analysis (only as heading, content removed)
    if (analysisText) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
      doc.text("DETAILED MEDICAL ANALYSIS", margin, yPosition);
      yPosition += 18;

      // Parse and format analysis sections as bullet points
      const sections = analysisText.split(
        /(?=Common symptoms|Recommended diagnostic tests|Treatment options|Seek immediate)/i
      );

      sections.forEach((section) => {
        if (!section.trim()) return;

        // Check for page break
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        // Extract section header and content
        let sectionHeader = "";
        let sectionContent = section.trim();

        if (section.toLowerCase().includes("common symptoms")) {
          sectionHeader = "Symptoms";
          sectionContent = section.replace(/common symptoms:?/i, "").trim();
        } else if (section.toLowerCase().includes("recommended diagnostic")) {
          sectionHeader = "Diagnostic Tests";
          sectionContent = section
            .replace(/recommended diagnostic tests:?/i, "")
            .trim();
        } else if (section.toLowerCase().includes("treatment options")) {
          sectionHeader = "Treatment Options";
          sectionContent = section.replace(/treatment options:?/i, "").trim();
        } else if (section.toLowerCase().includes("seek immediate")) {
          sectionHeader = "Important Notice";
          sectionContent = section.trim();
        }

        if (sectionHeader) {
          // Section header (bold)
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
          doc.text(`${sectionHeader}:`, margin + 5, yPosition);
          yPosition += 10;

          // Process content as bullet points
          const bulletPoints = sectionContent
            .split(/\s*\*\s*/)
            .filter((point) => point.trim());

          if (bulletPoints.length > 1) {
            // Remove first empty element if exists
            bulletPoints.shift();

            bulletPoints.forEach((point) => {
              if (yPosition > pageHeight - 30) {
                doc.addPage();
                yPosition = margin;
              }

              doc.setFont("helvetica", "normal");
              doc.setFontSize(10);
              doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

              // Add bullet point
              doc.text("•", margin + 10, yPosition);

              const maxWidth = pageWidth - 2 * margin - 20;
              const lines = doc.splitTextToSize(point.trim(), maxWidth);

              lines.forEach((line, lineIndex) => {
                if (yPosition > pageHeight - 25) {
                  doc.addPage();
                  yPosition = margin;
                }
                doc.text(line, margin + 15, yPosition);
                yPosition += 5;
              });
              yPosition += 2;
            });
          } else {
            // Regular paragraph format
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

            const maxWidth = pageWidth - 2 * margin - 10;
            const lines = doc.splitTextToSize(sectionContent, maxWidth);

            lines.forEach((line) => {
              if (yPosition > pageHeight - 25) {
                doc.addPage();
                yPosition = margin;
              }
              doc.text(line, margin + 10, yPosition);
              yPosition += 5;
            });
          }
          yPosition += 8;
        }
      });
    }

    yPosition += 10;
  });

  // Professional Footer
  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = margin;
  }

  const footerY = pageHeight - 40;

  // Footer background
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(0, footerY - 10, pageWidth, 50, "F");

  // Disclaimer header
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(dangerRed[0], dangerRed[1], dangerRed[2]);
  doc.text("⚠️ MEDICAL DISCLAIMER", pageWidth / 2, footerY, {
    align: "center",
  });

  // Disclaimer text
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  const disclaimerText =
    "This is an AI-generated analysis for screening purposes only. Results should not be used for final medical diagnosis. Please consult a qualified medical professional for proper evaluation and treatment.";
  const disclaimerLines = doc.splitTextToSize(
    disclaimerText,
    pageWidth - 2 * margin
  );

  let disclaimerY = footerY + 8;
  disclaimerLines.forEach((line) => {
    doc.text(line, pageWidth / 2, disclaimerY, { align: "center" });
    disclaimerY += 4;
  });

  // Save the PDF
  const reportFileName = `X-Ray_Analysis_Report_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  doc.save(reportFileName);
}

// predictions from uploaded image
async function predictChestFromUpload(imageElement) {
  const analysisResults = document.getElementById("analysis-results");
  const loadingSpinner = document.getElementById("loading-spinner");
  const previewBox = document.getElementById("preview-box");

  analysisResults.innerHTML = "";
  analysisResults.style.display = "none";

  // block invalid images before prediction
  if (!isLikelyXray(imageElement)) {
    const message = document.createElement("div");
    message.className = "result-card";
    message.innerHTML = `
      <h3 style="color: #f97316;">⚠️ Invalid Image</h3>
      <p>This image does not appear to be a chest X-ray. Please upload a proper grayscale X-ray image.</p>
      <button class="btn btn-primary" style="margin-top: 1rem;" onclick="document.getElementById('upload-section').style.display = 'none';">Try Again</button>
    `;
    analysisResults.appendChild(message);
    previewBox.style.display = "none";
    analysisResults.style.display = "block";
    return;
  }

  previewBox.style.display = "none";
  loadingSpinner.style.display = "block";
  analysisResults.style.display = "none";

  await new Promise((resolve) => setTimeout(resolve, 3000));
  if (!chestModel) await initChestModel();
  const predictions = await chestModel.predict(imageElement);

  analysisResults.innerHTML = "";
  loadingSpinner.style.display = "none";
  analysisResults.style.display = "block"; // only show once ready

  const fileName =
    document.getElementById("file-name-display")?.textContent || "";

  const titleCard = document.createElement("div");
  titleCard.className = "result-card";
  titleCard.innerHTML = `
    <h3 style="color: var(--accent-color);">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      Analysis Complete
    </h3>
    <p id="result-file-name">${fileName}</p>
  `;
  analysisResults.appendChild(titleCard);

  const sorted = predictions.sort((a, b) => b.probability - a.probability);
  let topToShow = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (
      sorted[i].probability * 100 >= 60 ||
      sorted[i].probability >= sorted[0].probability - 0.1
    ) {
      topToShow.push(sorted[i]);
    } else break;
  }

  topToShow = topToShow.filter((pred) => pred.probability > 0.05);

  // Function to generate medical analysis from Gemini API
  const generateMedicalAnalysis = async (condition) => {
    try {
      const response = await fetch("/.netlify/functions/analysis-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ condition }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate medical analysis");
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error("Error generating analysis:", error);
      return null;
    }
  };

  // Process each prediction and generate analysis
  for (const pred of topToShow) {
    const resultCard = document.createElement("div");
    resultCard.className = "result-card";

    // Initial result card with loading state
    resultCard.innerHTML = `
      <h3>Predicted Condition</h3>
      <p style="color: #58a6ff; font-weight: 600;">${pred.className}</p>
      <p>Confidence: ${(pred.probability * 100).toFixed(2)}%</p>
      <div id="analysis-loading-${pred.className.replace(
        /\s+/g,
        "-"
      )}" class="loading-spinner-small">
  <i class="fas fa-spinner fa-spin" style="font-size: 18px;"></i>
  <p>Generating detailed analysis...</p>
</div>

      <div id="detailed-analysis-${pred.className.replace(
        /\s+/g,
        "-"
      )}" style="display: none;"></div>
      <p class="result-note">Note: This is an AI prediction. Consult a medical professional for actual diagnosis.</p>
    `;

    analysisResults.appendChild(resultCard);

    // Generate and display detailed analysis
    const analysis = await generateMedicalAnalysis(pred.className);
    const loadingElement = document.getElementById(
      `analysis-loading-${pred.className.replace(/\s+/g, "-")}`
    );
    const analysisElement = document.getElementById(
      `detailed-analysis-${pred.className.replace(/\s+/g, "-")}`
    );

    if (analysis) {
      loadingElement.style.display = "none";
      analysisElement.innerHTML = `
        <h3 style="margin-top: 1rem;">Detailed Medical Analysis</h3>
        <div style="margin-top: 0.5rem; line-height: 1.6;">${analysis.replace(
          /\n/g,
          "<br>"
        )}</div>
      `;
      analysisElement.style.display = "block";
    } else {
      loadingElement.innerHTML =
        '<p style="color: #f97316;">Could not generate detailed analysis. Please consult a doctor for more information.</p>';
    }
  }

  // Create button container
  const buttonContainer = document.createElement("div");
  buttonContainer.style.marginTop = "1rem";
  buttonContainer.style.display = "flex";
  buttonContainer.style.gap = "10px";
  buttonContainer.style.justifyContent = "center";

  // Download Report button
  const downloadBtn = document.createElement("button");
  downloadBtn.className = "btn btn-success";
  downloadBtn.innerText = "Download Report";
  downloadBtn.style.backgroundColor = "#28a745";
  downloadBtn.style.color = "white";
  downloadBtn.style.border = "none";
  downloadBtn.style.padding = "10px 20px";
  downloadBtn.style.borderRadius = "5px";
  downloadBtn.style.cursor = "pointer";
  downloadBtn.addEventListener("click", generatePDFReport);

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "btn btn-primary";
  closeBtn.innerText = "Close";
  closeBtn.style.backgroundColor = "#007bff";
  closeBtn.style.color = "white";
  closeBtn.style.border = "none";
  closeBtn.style.padding = "10px 20px";
  closeBtn.style.borderRadius = "5px";
  closeBtn.style.cursor = "pointer";
  closeBtn.addEventListener("click", () => {
    document.getElementById("upload-section").style.display = "none";
  });

  // Add buttons to container
  buttonContainer.appendChild(downloadBtn);
  buttonContainer.appendChild(closeBtn);
  analysisResults.appendChild(buttonContainer);

  analysisResults.style.display = "block";
}
