(function () {
    'use strict';

    window.dataLayer = window.dataLayer || [];

    var AI_REFERRAL_PATTERNS = [
        { source: 'chatgpt',          match: /(?:^|\.)chat\.openai\.com$|(?:^|\.)chatgpt\.com$/i },
        { source: 'perplexity',       match: /(?:^|\.)perplexity\.ai$|(?:^|\.)perplexity\.tech$/i },
        { source: 'claude',           match: /(?:^|\.)claude\.ai$|(?:^|\.)anthropic\.com$/i },
        { source: 'gemini',           match: /(?:^|\.)gemini\.google\.com$|(?:^|\.)bard\.google\.com$/i },
        { source: 'copilot',          match: /(?:^|\.)copilot\.microsoft\.com$|(?:^|\.)bing\.com\/chat|(?:^|\.)edgeservices\.bing\.com$/i },
        { source: 'you',              match: /(?:^|\.)you\.com$/i },
        { source: 'huggingface',      match: /(?:^|\.)huggingface\.co$/i },
        { source: 'mistral',          match: /(?:^|\.)chat\.mistral\.ai$|(?:^|\.)lechat\.mistral\.ai$/i },
        { source: 'phind',            match: /(?:^|\.)phind\.com$/i },
        { source: 'kagi_assistant',   match: /(?:^|\.)kagi\.com$/i },
        { source: 'poe',              match: /(?:^|\.)poe\.com$/i },
        { source: 'duckassist',       match: /(?:^|\.)duckduckgo\.com$/i },
        { source: 'searchgpt',        match: /(?:^|\.)search\.openai\.com$/i }
    ];

    function classifyReferrer(hostname) {
        if (!hostname) return null;
        var h = hostname.toLowerCase();
        for (var i = 0; i < AI_REFERRAL_PATTERNS.length; i++) {
            if (AI_REFERRAL_PATTERNS[i].match.test(h)) return AI_REFERRAL_PATTERNS[i].source;
        }
        return null;
    }

    var referrer = document.referrer;
    if (!referrer) return;

    var url;
    try { url = new URL(referrer); } catch (e) { return; }
    if (url.hostname === window.location.hostname) return;

    var source = classifyReferrer(url.hostname);
    if (!source) return;

    var path = window.location.pathname + window.location.search;
    dataLayer.push({
        event: 'ai_referral',
        source: source,
        path: path,
        full_referrer: referrer
    });
})();
