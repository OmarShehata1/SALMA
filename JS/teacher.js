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



var __PDF_DOC,
  __CURRENT_PAGE,
  __TOTAL_PAGES,
  __PAGE_RENDERING_IN_PROGRESS = 0,
  __CANVAS = $('#pdf-canvas').get(0),
  __CANVAS_CTX = __CANVAS.getContext('2d'),
  PDFJS = window['pdfjs-dist/build/pdf'];
let myScale = 1.3;

PDFJS.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.5.141/pdf.worker.min.js';

function showPDF(pdf_url) {
  // $("#pdf-loader").show();

  PDFJS.getDocument({ url: pdf_url })
    .promise.then(function (pdf_doc) {
      __PDF_DOC = pdf_doc;
      __TOTAL_PAGES = __PDF_DOC.numPages;

      // Hide the pdf loader and show pdf container in HTML
      $('#pdf-contents').show();
      $('#pdf-total-pages').text(__TOTAL_PAGES);

      // Show the first page
      showPage(1, myScale);
    })
    .catch(function (error) {
      alert(error.message);
    });
}

function showPage(page_no, PageScale = myScale) {
  __PAGE_RENDERING_IN_PROGRESS = 1;
  __CURRENT_PAGE = page_no;

  // Disable Prev & Next buttons while page is being loaded
  $('#pdf-next, #pdf-prev').attr('disabled', 'disabled');

  // While page is being rendered hide the canvas and show a loading message
  $('#pdf-canvas').hide();
  // $("#page-loader").show();

  // Update current page in HTML
  $('#pdf-current-page').text(page_no);

  // Fetch the page
  __PDF_DOC.getPage(page_no).then(function (page) {
    // Get viewport of the page at required scale
    let viewport = page.getViewport({
      scale: PageScale,
    });

    // As the canvas is of a fixed width we need to set the scale of the viewport accordingly
    let scale = __CANVAS.width / viewport.width;
    viewport = page.getViewport({
      scale: PageScale,
    });

    // Set canvas height
    __CANVAS.height = viewport.height;
    __CANVAS.width = viewport.width;

    var renderContext = {
      canvasContext: __CANVAS_CTX,
      viewport: viewport,
    };

    // Render the page contents in the canvas
    page
      .render(renderContext)
      .promise.then(function () {
        __PAGE_RENDERING_IN_PROGRESS = 0;
        // Re-enable Prev & Next buttons
        $('#pdf-next, #pdf-prev').removeAttr('disabled');
        // Show the canvas and hide the page loader
        $('#pdf-canvas').show();
        // Return the text contents of the page after the pdf has been rendered in the canvas
        return page.getTextContent();
      })
      .then(function (textContent) {
        // Get canvas offset
        var canvas_offset = $('#pdf-canvas').offset();
        console.log(canvas_offset.left, canvas_offset.top, 'canvas offset');

        // Clear HTML for text layer
        $('#text-layer').html('');

        // Assign the CSS created to the text-layer element
        document
          .getElementById('text-layer')
          .style.setProperty('--scale-factor', viewport.scale);
        $('#text-layer').css({
          left: canvas_offset.left + 'px',
          top: canvas_offset.top + 'px',
        });

        // Pass the data to the method for rendering of text over the pdf canvas.
        PDFJS.renderTextLayer({
          textContentSource: textContent,
          container: $('#text-layer').get(0),
          viewport: viewport,
          textDivs: [],
        });
      });
  });
}
// Previous page of the PDF
$('#pdf-prev').on('click', function () {
  if (__CURRENT_PAGE != 1) showPage(--__CURRENT_PAGE, myScale);
});

// Next page of the PDF
$('#pdf-next').on('click', function () {
  if (__CURRENT_PAGE != __TOTAL_PAGES) showPage(++__CURRENT_PAGE, myScale);
});
let selection;
//   add event listener for text selection
document.addEventListener('selectionchange', () => {
   selection = window.getSelection();
  console.log(selection.toString());
  // console.log(selection.toString().length)
});
document.querySelector('.pdf-viewer-container').addEventListener('mouseup', (e) => {
  if(selection.toString().length>100)
  {
  modal_generate.classList.remove('hidden');
    overlay.classList.remove('hidden');
}})
document.addEventListener('keydown', function (event) {
  if (event.key === 'ArrowRight' && __CURRENT_PAGE < __TOTAL_PAGES) {
    showPage(__CURRENT_PAGE + 1, myScale);
  } else if (event.key === 'ArrowLeft' && __CURRENT_PAGE > 1) {
    showPage(__CURRENT_PAGE - 1, myScale);
  }
});
// add event for when user zooms in or out not scroll
document.addEventListener('wheel', function (event) {
  if (event.ctrlKey) {
    if (event.deltaY < 0) {
      showPage(__CURRENT_PAGE, myScale);
    } else {
      showPage(__CURRENT_PAGE, myScale);
    }
  }
});
window.addEventListener('resize', function () {
  // Recalculate the viewport scale and re-render the page
  showPage(__CURRENT_PAGE, myScale);
});
document.querySelector('.toggle').addEventListener('click', e => {
  document.querySelector('.pdf-names-container').classList.toggle('try-hidden');

});

document
  .getElementById('pdfInput')
  .addEventListener('change', function (event) {
    const fileList = event.target.files;
    const pdfList = document.getElementById('pdfList');
    pdfList.innerHTML = '';

    Array.from(fileList).forEach(file => {
      if (file.type === 'application/pdf') {
        const listItem = document.createElement('li');
        listItem.textContent = file.name;
        listItem.addEventListener('click', async function (e) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer })
              .promise;
            console.log(pdf);
            currentPdf = pdf;
            showPDF(URL.createObjectURL(file));
          } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Error loading PDF file');
          }
        });

        pdfList.appendChild(listItem);
      } else {
        alert('Only PDF files are allowed.');
      }
    });
  });
// create an event listener for the page number input
document
  .getElementById('pageNumber')
  .addEventListener('change', async function () {
    try {
      const pageNumber = +document.getElementById('pageNumber').value;
      if (currentPdf) {
        showPage(pageNumber);
      }
    } catch (error) {
      console.error('Error changing page number:', error);
      alert('Error changing page number');
    }
  });

let fileHandle ; // Store the file handle for reuse

document.querySelector('.btn--Accept').addEventListener('click', async () => {
    try {
        // If the fileHandle is not already set, prompt the user to pick a file
        if (!fileHandle) {
            [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Text Files',
                    accept: { 'text/plain': ['.txt'] }
                }]
            });
        }

        // Read the existing content from the file
        const file = await fileHandle.getFile();
        const existingContent = await file.text();

        // Prepare the new content to append
        const newQuestion = document.querySelector('.question').innerHTML;
        const newAnswer = document.querySelector('.answer').innerHTML;
        const newContent = `${existingContent}\n\nQuestion:\n${newQuestion}\n\nAnswer:\n${newAnswer}`;

        // Open the file for writing and write the combined content
        const writable = await fileHandle.createWritable();
        await writable.write(newContent);

        // Close the file
        await writable.close();

        alert('Content appended successfully!');
    } catch (error) {
        console.error('Error writing to file:', error);
    }
});




// let questionFileHandle; // File handle for questions only
// let qaFileHandle;       // File handle for questions and answers

// document.querySelector('.btn--Accept').addEventListener('click', async () => {
//     try {
//         // If the question file handle is not set, prompt the user to pick a file
//         if (!questionFileHandle) {
//             [questionFileHandle] = await window.showOpenFilePicker({
//                 types: [{
//                     description: 'Questions File',
//                     accept: { 'text/plain': ['.txt'] }
//                 }]
//             });
//         }

//         // If the question-answer file handle is not set, prompt the user to pick a file
//         if (!qaFileHandle) {
//             [qaFileHandle] = await window.showOpenFilePicker({
//                 types: [{
//                     description: 'Questions and Answers File',
//                     accept: { 'text/plain': ['.txt'] }
//                 }]
//             });
//         }

//         // Get content to write
//         const newQuestion = document.querySelector('.question').innerHTML;
//         const newAnswer = document.querySelector('.answer').innerHTML;

//         await appendToFile(
//             qaFileHandle,
//             `\n\nQuestion:\n${newQuestion}\n\nAnswer:\n${newAnswer}`
//         );
//         // Write to the Questions file
//         await appendToFile(questionFileHandle, `\n\nQuestion:\n${newQuestion}`);

//         // Write to the Questions and Answers file
//         alert('Content appended successfully!');
//     } catch (error) {
//         console.error('Error writing to files:', error);
//     }
// });

// // Function to append content to a file
// async function appendToFile(fileHandle, content) {
//     try {
//         // Read the existing content
//         const file = await fileHandle.getFile();
//         const existingContent = await file.text();

//         // Combine old and new content
//         const newContent = `${existingContent}${content}`;

//         // Open the file for writing
//         const writable = await fileHandle.createWritable();
//         await writable.write(newContent);

//         // Close the file
//         await writable.close();
//     } catch (error) {
//         console.error('Error appending to file:', error);
//     }
// }
