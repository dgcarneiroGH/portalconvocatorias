(function () {
    'use strict';

    const pills = document.querySelectorAll('.filter-pill');
    const cards = document.querySelectorAll('.home-grant-card');
    const countLabel = document.getElementById('filter-count');
    const emptyMessage = document.getElementById('grant-empty');

    if (!pills.length || !cards.length) return;

    function setActive(pill, active) {
        pill.classList.toggle('is-active', active);
        pill.setAttribute('aria-checked', active ? 'true' : 'false');
    }

    function selectInGroup(group, clickedPill) {
        const groupPills = document.querySelectorAll('.filter-pill[data-group="' + group + '"]');
        groupPills.forEach(p => setActive(p, p === clickedPill));
    }

    function getActiveValue(group) {
        const active = document.querySelector('.filter-pill[data-group="' + group + '"].is-active');
        if (!active || active.dataset.action === 'reset') return '';
        return active.dataset.value || '';
    }

    function applyFilters() {
        const activeRegion = getActiveValue('region');
        const activeBenef = getActiveValue('beneficiario');

        let visible = 0;

        cards.forEach(card => {
            const cardRegion = card.dataset.region || '';
            const cardBenef = card.dataset.beneficiario || '';

            const regionMatch = !activeRegion || cardRegion === activeRegion;
            const benefMatch = !activeBenef || cardBenef === activeBenef;

            const show = regionMatch && benefMatch;
            card.hidden = !show;
            if (show) visible++;
        });

        if (countLabel) {
            const anyFilter = activeRegion || activeBenef;
            if (anyFilter) {
                countLabel.textContent = visible + ' resultado' + (visible === 1 ? '' : 's');
            } else {
                countLabel.textContent = '';
            }
        }

        if (emptyMessage) {
            emptyMessage.hidden = visible > 0;
        }
    }

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            const group = pill.dataset.group;
            if (!group) return;

            const wasActive = pill.classList.contains('is-active');

            if (pill.dataset.action === 'reset') {
                const resetPill = pill;
                selectInGroup(group, resetPill);
            } else if (wasActive) {
                const resetPill = document.querySelector('.filter-pill[data-group="' + group + '"][data-action="reset"]');
                if (resetPill) selectInGroup(group, resetPill);
            } else {
                selectInGroup(group, pill);
            }

            applyFilters();
        });
    });
})();