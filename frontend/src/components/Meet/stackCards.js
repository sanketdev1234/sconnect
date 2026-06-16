// src/components/stackCards.js
(function () {
  const cards = [...document.querySelectorAll('.stack-cards__item')];
  const hidden = [];               // stack of hidden cards

  document.addEventListener('click', e => {
    const card = e.target.closest('.stack-cards__item');

    if (card && !card.classList.contains('slide-up')) {
      // click on a visible card → hide it
      card.classList.add('slide-up');
      hidden.push(card);
    } else if (!card && hidden.length) {
      // click outside → restore last hidden
      hidden.pop().classList.remove('slide-up');
    }
  });
})();