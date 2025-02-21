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
        height: 10,
        includetext: true,
        textxalign: "center",
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
  const marginBottom = 50;
  const lineSpacing = 20;
  const lineWidth = doc.page.width - 100;
  const startX = 50;

  for (let y = startY; y < pageHeight - marginBottom; y += lineSpacing) {
    doc
      .moveTo(startX, y)
      .lineTo(startX + lineWidth, y)
      .stroke();
  }
}

async function createPdfFromText(inputText, outputPath, fontPath) {
  // Create a new PDF document
  const doc = new PDFDocument({
    size: "A4",
    margins: {
      top: 50,
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

  for (let i = 0; i < paragraphs.length; i++) {
    let paragraph = paragraphs[i].trim();

    if (i > 0) {
      doc.addPage();
    }

    // const rightBarcodeId = `R${String(i + 1).padStart(3, "0")}`;

    try {
      // const [rightBarcode] = await Promise.all([
      //   generateBarcode(rightBarcodeId),
      // ]);

      // // Add right barcode
      // doc.image(rightBarcode, doc.page.width - 100, 50, {
      //   width: 50,
      // });

      // Set Arabic font and size for main text
      // doc.font("Arabic").fontSize(18);

      // Position text start
      const textTop = 75;
      doc.y = textTop;
      doc.x = 50;

      // Add the paragraph text with RTL support
      doc.text(paragraph, {
        align: "left",
        features: ["rtla"], // Enable Arabic text features
        indent: 0,
        lineGap: 5,
        paragraphGap: 5,
        width: doc.page.width - 100,
        // rtl: true, // Enable right-to-left text
      });

      // Get the Y position after the text
      const textBottom = doc.y + 20;

      // Fill the rest of the page with lines
      fillPageWithLines(doc, textBottom);
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

// Example usage
async function main() {
  // Sample Arabic text
  const sampleText = `This is the first paragraph. It contains some sample text to demonstrate the functionality of the PDF generation script. The text should be properly formatted and displayed in the generated PDF file.

  Here is the second paragraph. It serves as additional content to test the script's ability to handle multiple paragraphs. Each paragraph should start on a new page in the PDF document.

  Finally, this is the third paragraph. It concludes the sample text for testing purposes. The script should correctly process and display this paragraph, ensuring that the entire text is included in the PDF.`;

  const outputPath = "output.pdf";
  const fontPath = "OpenSans-Italic-VariableFont_wdth,wght.ttf"; // Update this with your font path

  try {
    await createPdfFromText(sampleText, outputPath, fontPath);
  } catch (err) {
    console.error("Error creating PDF:", err);
  }
}

main();
