(function () {
    'use strict';

    const cards = document.querySelectorAll('.home-grant-card');
    const filterButtons = document.querySelectorAll('[data-filter-group] button');
    const resetButton = document.getElementById('filter-reset');
    const countLabel = document.getElementById('filter-count');
    const emptyMessage = document.getElementById('grant-empty');

    if (!cards.length || !filterButtons.length) return;

    function getActiveValues(group) {
        const groupEl = document.querySelector('[data-filter-group="' + group + '"]');
        if (!groupEl) return [];
        const active = groupEl.querySelectorAll('button.active');
        return Array.from(active).map(b => b.dataset.value);
    }

    function applyFilters() {
        const activeRegions = getActiveValues('region');
        const activeBenefs = getActiveValues('beneficiario');

        let visible = 0;

        cards.forEach(card => {
            const cardRegion = card.dataset.region || '';
            const cardBenef = card.dataset.beneficiario || '';

            const regionMatch = activeRegions.length === 0 || activeRegions.includes(cardRegion);
            const benefMatch = activeBenefs.length === 0 || activeBenefs.includes(cardBenef);

            const show = regionMatch && benefMatch;
            card.hidden = !show;
            if (show) visible++;
        });

        if (countLabel) {
            if (activeRegions.length || activeBenefs.length) {
                countLabel.textContent = visible + ' resultado' + (visible === 1 ? '' : 's');
            } else {
                countLabel.textContent = '';
            }
        }

        if (emptyMessage) {
            emptyMessage.hidden = visible > 0;
        }
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            applyFilters();
        });
    });

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            document.querySelectorAll('[data-filter-group] .active').forEach(b => b.classList.remove('active'));
            applyFilters();
        });
    }
})();
