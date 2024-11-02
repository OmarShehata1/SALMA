// Configure PDF.js worker

const url = 'Unit 2 Lesson 1.pdf'; 

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

// Variables to store the current PDF document
let currentPdf = null;
let currentPage = 1;
let pdfViewer = null;

class PDFViewer {
    constructor() {
        this.currentPageNumber = 1;
        this.pageView = null;
    }

    getPageView(pageIndex) {
        return {
            canvas: document.querySelector("#pdfViewer canvas"),
            viewport: this.viewport,
            div: document.querySelector("#pdfViewer"),
        };
    }
}

// Initialize PDFViewer
const PDFViewerApplication = {
    pdfViewer: new PDFViewer(),
};

function getHighlightCoords() {
    var pageIndex = PDFViewerApplication.pdfViewer.currentPageNumber - 1;
    var page = PDFViewerApplication.pdfViewer.getPageView(pageIndex);
    var pageRect = page.canvas.getClientRects()[0];
    var selectionRects = window.getSelection().getRangeAt(0).getClientRects();
    var viewport = page.viewport;
    var selected = Array.from(selectionRects).map(function (r) {
        return viewport
            .convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y)
            .concat(
                viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y)
            );
    });
    return { page: pageIndex, coords: selected };
}

function showHighlight(selected) {
    var pageIndex = selected.page;
    var page = PDFViewerApplication.pdfViewer.getPageView(pageIndex);
    var pageElement = page.canvas.parentElement;
    var viewport = page.viewport;

    selected.coords.forEach(function (rect) {
        var bounds = viewport.convertToViewportRectangle(rect);
        var el = document.createElement("div");
        el.className = "highlight-layer";
        el.setAttribute(
            "style",
            "position: absolute; background-color: rgba(255, 255, 0, 0.3);" +
            "left:" +
            Math.min(bounds[0], bounds[2]) +
            "px; " +
            "top:" +
            Math.min(bounds[1], bounds[3]) +
            "px; " +
            "width:" +
            Math.abs(bounds[0] - bounds[2]) +
            "px; " +
            "height:" +
            Math.abs(bounds[1] - bounds[3]) +
            "px; " +
            "pointer-events: none;"
        );
        pageElement.appendChild(el);
    });
}

document
    .getElementById("pdfInput")
    .addEventListener("change", function (event) {
        const fileList = event.target.files;
        const pdfList = document.getElementById("pdfList");
        pdfList.innerHTML = "";

        Array.from(fileList).forEach((file) => {
            if (file.type === "application/pdf") {
                const listItem = document.createElement("li");
                listItem.textContent = file.name;

                listItem.addEventListener("click", async function () {
                    try {
                        const arrayBuffer = await file.arrayBuffer();
                        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer })
                            .promise;
                        currentPdf = pdf;
                        await renderPage(1);
                    } catch (error) {
                        console.error("Error loading PDF:", error);
                        alert("Error loading PDF file");
                    }
                });

                pdfList.appendChild(listItem);
            } else {
                alert("Only PDF files are allowed.");
            }
        });
    });
// create an event listener for the page number input
document
    .getElementById("pageNumber")
    .addEventListener("change", async function () {
        try {
            const pageNumber = +document.getElementById("pageNumber").value;
            if (currentPdf) {
                await renderPage(pageNumber);
            }
        } catch (error) {
            console.error("Error changing page number:", error);
            alert("Error changing page number");
        }
    });

async function renderPage(pageNumber) {
    try {
        const page = await currentPdf.getPage(pageNumber);
        const container = document.getElementById("pdfViewer");
        const containerWidth = container.clientWidth;
        const viewport = page.getViewport({ scale: 1.0 });
        const scale = (containerWidth / viewport.width) * 0.95;

        const scaledViewport = page.getViewport({ scale });

        // Update PDFViewer application with current viewport
        PDFViewerApplication.pdfViewer.viewport = scaledViewport;
        PDFViewerApplication.pdfViewer.currentPageNumber = pageNumber;

        container.innerHTML = "";

        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.width = `${scaledViewport.width}px`;
        wrapper.style.height = `${scaledViewport.height}px`;

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        canvas.style.display = "block";

        const textLayerDiv = document.createElement("div");
        textLayerDiv.className = "textLayer";

        Object.assign(textLayerDiv.style, {
            width: `${scaledViewport.width}px`,
            height: `${scaledViewport.height}px`,
            position: "absolute",
            left: "0",
            top: "0",
            transform: "scale(1, 1)",
            transformOrigin: "0 0",
        });

        wrapper.appendChild(canvas);
        wrapper.appendChild(textLayerDiv);
        container.appendChild(wrapper);

        const renderContext = {
            canvasContext: context,
            viewport: scaledViewport,
            enableWebGL: true,
            renderInteractiveForms: true,
        };

        await page.render(renderContext).promise;

        const textContent = await page.getTextContent();
        await pdfjsLib.renderTextLayer({
            textContent: textContent,
            container: textLayerDiv,
            viewport: scaledViewport,
            textDivs: [],
        }).promise;

        // Add selection event listener
        textLayerDiv.addEventListener("mouseup", function () {
            const selection = window.getSelection();
            if (!selection.isCollapsed) {
                try {
                    const selectedText = selection.toString();
                    document.getElementById("selectedText").value = selectedText;

                    // Get and show highlight
                    const highlightData = getHighlightCoords();
                    showHighlight(highlightData);
                } catch (error) {
                    console.error("Error handling selection:", error);
                }
            }
        });
    } catch (error) {
        console.error("Error rendering page:", error);
        console.log(error.stack);
        alert("Error rendering PDF page. Check console for details.");
    }
}

// Submit button event listener
document.querySelector(".btn-a").addEventListener("click", function () {
    const selectedText = document.getElementById("selectedText").value;
    console.log("Selected text:", selectedText);
    // Add your submission logic here
});

// Add resize handler
const resizeObserver = new ResizeObserver(
    debounce(() => {
        if (currentPdf) {
            renderPage(currentPage);
        }
    }, 250)
);

// Observe the PDF viewer container
resizeObserver.observe(document.getElementById("pdfViewer"));

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}




// Load the PDF document
pdfjsLib.getDocument(url).promise.then((pdfDoc_) => {
    let pdfDoc = pdfDoc_;
    totalPages = pdfDoc.numPages;
    currentPage = 1;
    
    // Set the min and max for the page number input
    const pageNumberInput = document.getElementById('pageNumber');
    pageNumberInput.min = 1;
    pageNumberInput.max = totalPages;

    // Render the initial page
    renderPage(currentPage);
});

// Navigation button events
let btn_prev = document.getElementById('prevPage');
let btn_next = document.getElementById('nextPage');

btn_prev.addEventListener('click', function() {
    if (currentPage > 1) {
        currentPage -= 1;
        renderPage(currentPage);
    }
});

btn_next.addEventListener('click', function() {
    if (currentPage < totalPages) {
        currentPage += 1;
        renderPage(currentPage);
    }
});

// Input field change event for direct page navigation
document.getElementById('pageNumber').addEventListener('change', function() {
    const pageNum = parseInt(this.value);
    if (pageNum >= 1 && pageNum <= totalPages) {
        currentPage = pageNum;
        renderPage(currentPage);
    } else {
        // Reset input to the current page if out of range
        this.value = currentPage;
    }
});




////////////////////////////////
// Generate quesition
///////////////////////////////

// Get button elements
const btnClose = document.querySelector('.btn--close');
const btnAccept = document.querySelector('.btn--Accept');
const btnAgain = document.querySelector('.btn--again');
const btnCancel = document.querySelector('.btn--cancel');

const modal_generate = document.querySelector('.modal--generate');

// submitt
const btnOpenModal=document.querySelector('.btn--show-modal');
const overlay = document.querySelector('.overlay');



btnOpenModal.addEventListener('click',()=>{
    modal_generate.classList.remove('hidden');
    overlay.classList.remove('hidden');
});


// Close button - Hide the modal when clicked
btnClose.addEventListener('click', () => {
    modal_generate.classList.add('hidden');
    overlay.classList.add('hidden');
    console.log('Modal closed');
});

// Accept button - Perform an action when clicked
btnAccept.addEventListener('click', () => {
    console.log('Accepted');
    // Add any additional code here for "Accept" action
});

// Try Again button - Perform an action when clicked
btnAgain.addEventListener('click', () => {
    console.log('Trying again...');
    // Add any additional code here for "Try Again" action
});

// Cancel button - Perform an action when clicked
btnCancel.addEventListener('click', () => {
    modal_generate.classList.add('hidden');
    overlay.classList.add('hidden');
    console.log('Cancelled');
    // Add any additional code here for "Cancel" action
});









