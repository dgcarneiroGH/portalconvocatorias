(function () {
    'use strict';

    const overlay = document.getElementById('report-overlay');
    if (!overlay) return;

    const modal = overlay.querySelector('.report-modal');
    const submitBtn = document.getElementById('report-submit');
    const submitLabel = document.getElementById('report-submit-label');
    const cancelBtn = document.getElementById('report-cancel');
    const closeBtn = document.getElementById('report-close');
    const statusEl = document.getElementById('report-status');
    const otherText = document.getElementById('report-other-text');
    const options = Array.from(overlay.querySelectorAll('.report-option'));
    const webhookUrl = overlay.dataset.webhookUrl;
    if (!modal || !submitBtn || !webhookUrl) return;

    let lastFocused = null;
    let grantId = '';
    let grantTitle = '';
    let hideTimer = null;

    function updateSubmitState() {
        const selected = overlay.querySelector('input[name="report-reason"]:checked');
        if (!selected) {
            submitBtn.disabled = true;
            return;
        }
        submitBtn.disabled = selected.value === 'Otros' && (!otherText || otherText.value.trim() === '');
    }

    function resetOptions() {
        options.forEach(option => {
            option.classList.remove('is-selected');
            const input = option.querySelector('input');
            if (input) input.checked = false;
        });
        if (otherText) {
            otherText.value = '';
            otherText.disabled = true;
        }
    }

    function open(trigger) {
        grantId = trigger.dataset.grantId || '';
        grantTitle = trigger.dataset.grantTitle || '';
        resetOptions();
        submitBtn.disabled = true;
        submitLabel.textContent = 'Enviar reporte';
        statusEl.hidden = true;
        statusEl.textContent = '';
        statusEl.className = 'report-status';
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
        lastFocused = trigger;
        overlay.hidden = false;
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    }

    function close() {
        overlay.hidden = true;
        document.body.style.overflow = '';
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
        if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll('.grant-detail-report').forEach(button => {
        button.addEventListener('click', () => open(button));
    });

    options.forEach(option => {
        const input = option.querySelector('input');
        if (!input) return;
        input.addEventListener('change', () => {
            options.forEach(other => other.classList.toggle('is-selected', other === option));
            if (otherText) otherText.disabled = input.value !== 'Otros';
            updateSubmitState();
        });
    });

    if (otherText) {
        otherText.addEventListener('input', updateSubmitState);
    }

    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);

    overlay.addEventListener('mousedown', event => {
        if (event.target === overlay) close();
    });

    overlay.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
            return;
        }
        if (event.key !== 'Tab') return;
        const focusables = Array.from(modal.querySelectorAll('button, input, textarea'))
            .filter(el => !el.disabled);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    submitBtn.addEventListener('click', () => {
        const selected = overlay.querySelector('input[name="report-reason"]:checked');
        if (!selected) return;
        const motivo = selected.value === 'Otros' && otherText
            ? otherText.value.trim()
            : selected.value;
        if (motivo === '') return;
        submitBtn.disabled = true;
        submitLabel.textContent = 'Enviando…';
        statusEl.hidden = true;
        statusEl.textContent = '';
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subvencionId: grantId,
                nombreSubvencion: grantTitle,
                motivoReporte: motivo
            })
        }).then(response => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            statusEl.textContent = 'Reporte enviado correctamente';
            statusEl.className = 'report-status is-success';
            statusEl.hidden = false;
            hideTimer = setTimeout(close, 2000);
        }).catch(() => {
            statusEl.textContent = 'No se pudo enviar el reporte. Inténtalo de nuevo.';
            statusEl.className = 'report-status is-error';
            statusEl.hidden = false;
            submitBtn.disabled = false;
        }).finally(() => {
            submitLabel.textContent = 'Enviar reporte';
        });
    });
})();
