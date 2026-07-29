(function () {
    'use strict';

    var STORAGE_KEY = 'cookie_consent';
    var POLICY_URL = '/politica-cookies/';

    function hasConsent() {
        try {
            return localStorage.getItem(STORAGE_KEY) !== null;
        } catch (e) {
            return true;
        }
    }

    function readConsent() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    function writeConsent(value) {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch (e) {
            return false;
        }
        return true;
    }

    function updateGtagConsent(value) {
        window.dataLayer = window.dataLayer || [];
        var analyticsStorage = value === 'accept' ? 'granted' : 'denied';
        dataLayer.push([
            'consent',
            'update',
            {
                'analytics_storage': analyticsStorage,
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied'
            }
        ]);
        dataLayer.push({ event: 'cookie_consent_' + value });
    }

    function applyStoredConsent() {
        var stored = readConsent();
        if (stored === 'accept' || stored === 'reject') {
            updateGtagConsent(stored);
            return true;
        }
        return false;
    }

    function removeBanner(banner) {
        if (banner && banner.parentNode) {
            banner.parentNode.removeChild(banner);
        }
    }

    function buildBanner() {
        var banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-modal', 'false');
        banner.setAttribute('aria-label', 'Aviso de cookies');
        banner.innerHTML =
            '<div class="cookie-banner-content">' +
                '<p class="cookie-banner-text">' +
                    'Utilizamos Google Analytics 4 para entender cómo navegas por el portal. ' +
                    'Puedes aceptar el uso de cookies de análisis o rechazarlas. ' +
                    'Las cookies estrictamente necesarias (Cloudflare) no requieren consentimiento. ' +
                    'Consulta la <a href="' + POLICY_URL + '">política de cookies</a>.' +
                '</p>' +
                '<div class="cookie-banner-actions">' +
                    '<button type="button" class="cookie-banner-button cookie-banner-button-accept" data-cookie="accept">Aceptar</button>' +
                    '<button type="button" class="cookie-banner-button cookie-banner-button-reject" data-cookie="reject">Rechazar</button>' +
                '</div>' +
            '</div>';
        return banner;
    }

    function showBanner() {
        if (document.getElementById('cookie-banner')) return;
        var banner = buildBanner();
        document.body.appendChild(banner);
        requestAnimationFrame(function () {
            banner.setAttribute('data-state', 'visible');
        });

        banner.addEventListener('click', function (e) {
            var action = e.target && e.target.getAttribute('data-cookie');
            if (action !== 'accept' && action !== 'reject') return;
            writeConsent(action);
            updateGtagConsent(action);
            removeBanner(banner);
        });
    }

    function reopenPreferences() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) { return; }
        showBanner();
    }

    function bindResetLinks() {
        document.addEventListener('click', function (e) {
            var trigger = e.target && e.target.closest('[data-cookie-reset]');
            if (!trigger) return;
            e.preventDefault();
            reopenPreferences();
        });
    }

    bindResetLinks();

    if (applyStoredConsent()) {
        return;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showBanner);
    } else {
        showBanner();
    }
})();
