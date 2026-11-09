/* ====================================================
   recaptcha.js
   ====================================================
   Google reCAPTCHA v3 — 共用檔（en / tc / sc 通用）

   - 依頁面路徑自動判斷語言 (en / tc / sc)，設定 reCAPTCHA 的 hl。
   - v3 為背景評分，無 checkbox／無 UI；提交時才即時取得 token。
   - 未有 site key 時會自動停用，唔會影響表單提交。
   - 對外 API：
       window.Recaptcha.isEnabled()          // 是否已設定 site key
       window.Recaptcha.getToken(action)     // 取得驗證 token（Promise<string>）
   ==================================================== */

(function () {
    'use strict';

    /* ===== 設定 ===== */
    // TODO: 填入 Google reCAPTCHA v3 的 site key（例：'6Lcxxxxxxxxxxxxxxxxxxxxxxxxxxxx'）
    // 注意：v3 必須使用 v3 site key，v2 的 key 不適用。
    var RECAPTCHA_SITE_KEY = '6LfEkBYuAAAAAHuZG8TQZSpDZIj-R-4mE4FEOuKn';

    // 預設 action 名稱（需與後端 Strapi 驗證的 action 一致）
    var DEFAULT_ACTION = 'feedback_submit';

    // 依路徑決定 reCAPTCHA 介面語言
    function getLang() {
        var path = window.location.pathname;
        if (path.indexOf('/tc/') !== -1) return 'zh-TW';
        if (path.indexOf('/sc/') !== -1) return 'zh-CN';
        return 'en';
    }

    // 是否已設定 site key（前端是否需要取得 token）
    function isEnabled() {
        return !!RECAPTCHA_SITE_KEY;
    }

    // 取得 token；回傳 Promise<string>，未啟用或失敗時 reject
    function getToken(action) {
        if (!isEnabled()) {
            return Promise.reject(new Error('reCAPTCHA site key 未設定。'));
        }
        return new Promise(function (resolve, reject) {
            if (typeof grecaptcha === 'undefined') {
                reject(new Error('reCAPTCHA 尚未載入。'));
                return;
            }
            grecaptcha.ready(function () {
                grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: action || DEFAULT_ACTION })
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    function loadApi() {
        if (!isEnabled()) {
            console.warn('[recaptcha] RECAPTCHA_SITE_KEY 未設定，已停用 reCAPTCHA。');
            return;
        }

        // 已載入過就唔重複載入
        if (typeof grecaptcha !== 'undefined') return;

        var script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?render=' +
            encodeURIComponent(RECAPTCHA_SITE_KEY) +
            '&hl=' + encodeURIComponent(getLang());
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    // 對外 API
    window.Recaptcha = {
        isEnabled: isEnabled,
        getToken: getToken
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadApi);
    } else {
        loadApi();
    }
})();
