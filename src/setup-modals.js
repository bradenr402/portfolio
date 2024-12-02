const toggleScroll = (show) => document.body.classList.toggle('overflow-hidden', show);

const toggleModal = (modal, modalBackdrop, show) => {
  modal.classList.toggle('modal-hidden', !show);
  modal.setAttribute('aria-hidden', !show);

  modalBackdrop.classList.toggle('modal-backdrop-hidden', !show);
  toggleScroll(show);
};

const handleModalOpen = (trigger, modalBackdrop) => {
  const modalId = trigger.getAttribute('data-modal');
  const modal = document.getElementById(modalId);
  if (modal) toggleModal(modal, modalBackdrop, true);
};

const handleModalClose = (modal, modalBackdrop) => toggleModal(modal, modalBackdrop, false);

const handleTriggerClick = (event, trigger, modalBackdrop) => {
  event.preventDefault();
  handleModalOpen(trigger, modalBackdrop);
};

const handleModalClick = (event, modal, modalBackdrop) => {
  if (event.target === modal) handleModalClose(modal, modalBackdrop);
};

const handleCloseBtnClick = (modal, modalBackdrop) => handleModalClose(modal, modalBackdrop);

const closeAllModals = (modals, modalBackdrop) =>
  modals.forEach((modal) => handleModalClose(modal, modalBackdrop));

const handleBackdropClick = (modals, modalBackdrop) => closeAllModals(modals, modalBackdrop);

export default function setupModals() {
  const modals = document.querySelectorAll('.modal');
  const modalTriggers = document.querySelectorAll('.modal-trigger');
  const modalBackdrop = document.querySelector('.modal-backdrop');

  modalTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => handleTriggerClick(event, trigger, modalBackdrop));
  });

  modals.forEach((modal) => {
    modal.addEventListener('click', (event) => handleModalClick(event, modal, modalBackdrop));

    const closeBtn = modal.querySelector('.modal-x-btn');
    closeBtn?.addEventListener('click', () => handleCloseBtnClick(modal, modalBackdrop));
  });

  modalBackdrop?.addEventListener('click', () => handleBackdropClick(modals, modalBackdrop));

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAllModals(modals, modalBackdrop);
  });
}
