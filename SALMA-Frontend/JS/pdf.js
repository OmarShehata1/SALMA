let pdfs = [];
let currentPdfIndex = -1;
let currentPage = 1;
let pdfDoc = null;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.5;

const pdfList = document.getElementById('pdf-list');
const pdfViewer = document.getElementById('pdf-viewer');
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageNumberInput = document.getElementById('page-number');
const pdfUpload = document.getElementById('pdf-upload');




pdfUpload.addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type === 'application/pdf') {
            const pdfObject = {
                name: file.name,
                file: file
            };
            pdfs.push(pdfObject);
        }
    }
    updatePdfList();
}

function updatePdfList() {
    pdfList.innerHTML = '';
    pdfs.forEach((pdf, index) => {
        const li = document.createElement('li');
        li.textContent = pdf.name;
        li.addEventListener('click', () =>{ 
            document.querySelector('.pdf-name').textContent = pdf.name;
            loadPdf(index)});
        pdfList.appendChild(li);
    });
}

function loadPdf(index) {
    currentPdfIndex = index;
    currentPage = 1;
    pageNumberInput.value = currentPage;
    
    const pdf = pdfs[currentPdfIndex];
    const fileReader = new FileReader();
    
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        
        pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
            pdfDoc = pdf;
            pageNumberInput.max = pdf.numPages;
            renderPage(currentPage);
        });
    };
    
    fileReader.readAsArrayBuffer(pdf.file);
}

function renderPage(num) {
    pageRendering = true;
    pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({scale: scale});
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        
        renderTask.promise.then(function() {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
            createTextLayer(page, viewport);
        });
    });
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function changePage(offset) {
    const newPage = currentPage + offset;
    if (newPage >= 1 && newPage <= pdfDoc.numPages) {
        currentPage = newPage;
        pageNumberInput.value = currentPage;
        queueRenderPage(currentPage);
    }
}

prevPageBtn.addEventListener('click', () => changePage(-1));
nextPageBtn.addEventListener('click', () => changePage(1));


// Keyboard navigation
document.addEventListener('keydown', (event) => {
    if (pdfDoc) {
        switch (event.key) {
            case 'ArrowLeft': // Left arrow key
                changePage(-1);
                break;
            case 'ArrowRight': // Right arrow key
                changePage(1);
                break;
        }
    }
});

pageNumberInput.addEventListener('change', () => {
    const newPage = parseInt(pageNumberInput.value);
    if (newPage >= 1 && newPage <= pdfDoc.numPages) {
        currentPage = newPage;
        queueRenderPage(currentPage);
    }
});

// Text selection
let textLayer = null;

function createTextLayer(page, viewport) {
    page.getTextContent().then(function(textContent) {
        if (textLayer) {
            textLayer.remove();
        }
        
        textLayer = document.createElement('div');
        textLayer.setAttribute('id', 'text-layer');
        textLayer.style.position = 'absolute';
        textLayer.style.left = canvas.offsetLeft + 'px';
        textLayer.style.top = canvas.offsetTop + 'px';
        textLayer.style.height = canvas.height + 'px';
        textLayer.style.width = canvas.width + 'px';
        pdfViewer.appendChild(textLayer);
        
        pdfjsLib.renderTextLayer({
            textContent: textContent,
            container: textLayer,
            viewport: viewport,
            textDivs: []
        });
    });
}
