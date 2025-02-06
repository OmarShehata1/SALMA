// Modal elements
const btnClose = document.querySelector('.btn--close');
const btnClose2 = document.querySelector('.btn--close2');
const btnCancel2 = document.querySelector('.btn--cancel2');
const btnGenerate = document.querySelector('.btn--generate');
const btnAccept = document.querySelector('.btn--Accept');
const btnCancel = document.querySelector('.btn--cancel');
const modal_generate = document.querySelector('.modal--generate');
const modal_accept = document.querySelector('.modal--accept');
const checkBox = document.querySelectorAll('.checkbox');
const overlay = document.querySelector('.overlay');


// Show selection modal when text is selected
document.addEventListener('mouseup', function() {
    let selectedText = window.getSelection().toString();
    if (selectedText.toString().length>70) {
        modal_accept.classList.remove('hidden');
        overlay.classList.remove('hidden');
    }
    console.log("Selected text: ",selectedText);
});

btnGenerate.addEventListener('click', function() {
    // fetch('https://salma-backend.vercel.app/teachers/:teacherId/exams/:pdfName/genqa')
    modal_generate.classList.remove('hidden');
    modal_accept.classList.add('hidden');
});

btnCancel2.addEventListener('click', function() {
    modal_accept.classList.add('hidden');
    overlay.classList.add('hidden');
});

btnClose2.addEventListener('click', function() {
  modal_accept.classList.add('hidden');
    overlay.classList.add('hidden');
});
// End of text selection


//After Show Modal generate
btnAccept.addEventListener('click', function() {
  modal_generate.classList.add('hidden');
  modal_accept.classList.add('hidden');
    overlay.classList.add('hidden');
  const selectedText = window.getSelection().toString();
  // console.log(selectedText);
  console.log("Accepted");
  
});


btnCancel.addEventListener('click', function(e) {
  e.preventDefault();
  modal_generate.classList.add('hidden');
  modal_accept.classList.add('hidden');
    overlay.classList.add('hidden');
});


// Initialize the viewer
updatePdfViewer();

// Close modals when clicking outside using addEventListener
overlay.addEventListener('click', function() {
    modal_generate.classList.add('hidden');
    modal_accept.classList.add('hidden');
    overlay.classList.add('hidden');
});


// Handle form submission
function submitForm() {
  const checkboxes = document.querySelectorAll('input[name="question"]:checked');
  const selectedAnswers = [];

  checkboxes.forEach(checkbox => {
      const question = checkbox.getAttribute('data-question');
      const answer = checkbox.getAttribute('data-answer');

      selectedAnswers.push({
          question: question,
          answer: answer
      });
  });

  console.log(selectedAnswers);
  // You can now use the selectedAnswers array as needed
}

