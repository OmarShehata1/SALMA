'use strict';

// Modal windows
const modal = document.querySelector('.modal');
const modalLogin = document.querySelector('.modalLogin');
const overlay = document.querySelector('.overlay');
const overlayLogin = document.querySelector('.overlayLogin');
const btnCloseModal = document.querySelector('.btn--close-modal');
const btnCloseModalLogin = document.querySelector('.btn--close-modalLogin');
const btnsOpenModal = document.querySelector('.btn--signUp');
const btnsOpenModalLogin = document.querySelector('.btn--show-modalLogin');
const btnScrollTo = document.querySelector('.btn--scroll-to');
const section1 = document.querySelector('#section--1');

const openModal = function (e) {
  e.preventDefault();
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
};

const closeModal = function () {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
};

const openModalLogin = function (e) {
  e.preventDefault();
  modalLogin.classList.remove('hidden');
  overlayLogin.classList.remove('hidden');
};

const closeModalLogin = function () {
  modalLogin.classList.add('hidden');
  overlayLogin.classList.add('hidden');
};

btnsOpenModal.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);
overlay.addEventListener('click', closeModal);

btnsOpenModalLogin.addEventListener('click', openModalLogin);
btnCloseModalLogin.addEventListener('click', closeModalLogin);
overlayLogin.addEventListener('click', closeModalLogin);

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
  if (e.key === 'Escape' && !modalLogin.classList.contains('hidden')) {
    closeModalLogin();
  }
});

// Button scrolling
btnScrollTo.addEventListener('click', function (e) {
  section1.scrollIntoView({ behavior: 'smooth' });
});

// Operations tabs
const tabs = document.querySelectorAll('.operations__tab');
const tabsContainer = document.querySelector('.operations__tab-container');
const tabsContent = document.querySelectorAll('.operations__content');

tabsContainer.addEventListener('click', function (e) {
  const clicked = e.target.closest('.operations__tab');
  if (!clicked) return;

  // Remove active classes
  tabs.forEach(t => t.classList.remove('operations__tab--active'));
  tabsContent.forEach(c => c.classList.remove('operations__content--active'));

  // Activate tab
  clicked.classList.add('operations__tab--active');

  // Activate content area
  document
    .querySelector(`.operations__content--${clicked.dataset.tab}`)
    .classList.add('operations__content--active');
});