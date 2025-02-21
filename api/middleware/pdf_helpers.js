const PDFDocument = require("pdfkit");
const fs = require("fs");
const bwipjs = require("bwip-js");

// Function to generate a barcode as a Buffer
async function generateBarcode(text) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: "code128",
        text: text,
        scale: 2,
        height: 40,
        includetext: false,
      },
      (err, png) => {
        if (err) reject(err);
        else resolve(png);
      }
    );
  });
}

// Function to fill the rest of the page with lines
function fillPageWithLines(doc, startY) {
  const pageHeight = doc.page.height;
  const marginBottom = 20;
  const lineSpacing = 25;
  const lineWidth = doc.page.width - 100;
  const startX = 50;

  for (let y = startY; y < pageHeight - marginBottom; y += lineSpacing) {
    doc
      .moveTo(startX, y)
      .lineTo(startX + lineWidth, y)
      .stroke();

    // if (y === startY) {
    // Add a marker next to the first line for computer vision detection
    doc
      .circle(startX - 15, y, 5)
      .fillColor("black")
      .fill();
    doc
      .circle(startX + lineWidth + 15, y, 5)
      .fillColor("black")
      .fill();
    // }
  }
}

async function createPdfFromText(
  inputText,
  outputPath,
  fontPath,
  questionIds,
  fill = false
) {
  // Create a new PDF document
  const doc = new PDFDocument({
    size: "A4",
    margins: {
      top: 5,
      bottom: 50,
      left: 50,
      right: 50,
    },
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Register Arabic font
  // doc.registerFont("Arabic", fontPath);

  const paragraphs = inputText.split(/\n\s*\n/);
  const ids = questionIds.split(/\n\s*\n/);
  console.log(ids);

  for (let i = 0; i < paragraphs.length; i++) {
    let paragraph = paragraphs[i].trim();
    let examID = ids[i].trim();

    if (i > 0) {
      doc.addPage();
    }
    const rightBarcodeId = examID.toString();

    try {
      const [rightBarcode] = await Promise.all([
        generateBarcode(rightBarcodeId),
      ]);

      // Add right barcode
      doc.image(rightBarcode, doc.page.width - 150, 15, {
        width: 120,
      });

      // Set Arabic font and size for main text
      // doc.font("Arabic").fontSize(18);

      // Position text start
      const textTop = 75;
      doc.y = textTop;
      doc.x = 50;

      // Add the paragraph text with RTL support
      doc.text(paragraph, {
        align: "left",
        // features: ["rtla"], // Enable Arabic text features
        indent: 0,
        lineGap: 5,
        paragraphGap: 5,
        width: doc.page.width - 100,
        // rtl: true, // Enable right-to-left text
      });

      // Get the Y position after the text
      const textBottom = doc.y + 20;

      // Fill the rest of the page with lines
      if (fill) fillPageWithLines(doc, textBottom);
    } catch (err) {
      console.error("Error generating barcodes:", err);
    }
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => {
      console.log(`PDF created successfully at ${outputPath}`);
      resolve();
    });
    stream.on("error", (err) => {
      console.error("Error writing PDF:", err);
      reject(err);
    });
  });
}

module.exports = { createPdfFromText };
