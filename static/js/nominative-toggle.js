(function () {
    'use strict';

    const toggle = document.querySelector('.grant-nominative-toggle');
    const group = document.querySelector('.grant-nominative-toggle-group');
    if (!toggle || !group) return;

    const options = Array.from(group.querySelectorAll('.grant-nominative-option'));
    const allCards = Array.from(document.querySelectorAll('.grant-detail-card'));
    const nominativeCards = allCards.filter(card => card.dataset.nominative === 'true');
    const emptyMessage = document.getElementById('grant-nominative-empty');
    if (!options.length || !nominativeCards.length) return;

    function applyState(state) {
        const show = state === 'show';
        let visibleCount = 0;
        allCards.forEach(card => {
            if (card.dataset.nominative === 'true') {
                card.hidden = !show;
            }
            if (!card.hidden) visibleCount++;
        });
        if (emptyMessage) emptyMessage.hidden = visibleCount > 0;
    }

    function select(option, moveFocus) {
        options.forEach(o => {
            const active = o === option;
            o.classList.toggle('is-active', active);
            o.setAttribute('aria-checked', active ? 'true' : 'false');
            o.tabIndex = active ? 0 : -1;
        });
        applyState(option.dataset.nominativeState);
        if (moveFocus) option.focus();
    }

    options.forEach((option, index) => {
        option.tabIndex = option.classList.contains('is-active') ? 0 : -1;
        option.addEventListener('click', () => select(option, false));
        option.addEventListener('keydown', event => {
            const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
            if (!keys.includes(event.key)) return;
            event.preventDefault();
            const direction = (event.key === 'ArrowLeft' || event.key === 'ArrowUp') ? -1 : 1;
            const next = options[(index + direction + options.length) % options.length];
            select(next, true);
        });
    });

    applyState('hide');
})();
