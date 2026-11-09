/* ====================================================
   search.js  —  GovHK Search Service client
   Shared by the en / tc / sc search pages.

   Uses the JSON endpoint (jsresult), the same approach as
   the previous year's report. On a *.gov.hk host the service
   allows the cross-origin request directly; on any other host
   (e.g. the archsd.wcr.hk test server) the request is blocked
   by CORS, so we transparently fall back to the local proxy.
   ==================================================== */

(function () {
    'use strict';

    /* ----------------------------------------------------
       Configuration
       ---------------------------------------------------- */
    var SEARCH_CONFIG = {
        // GovHK Search Service JSON endpoint.
        endpoint: 'https://www.search.gov.hk/jsresult',

        // Same-origin proxy used only when the direct request is
        // blocked by CORS (i.e. on a non *.gov.hk host such as dev).
        proxy: '../api/search-proxy.php',

        // Interface language per site language.
        uiLang: { en: 'en', tc: 'zh-hk', sc: 'zh-cn' },
        uiCharset: 'utf-8',

        // Results per page.
        pSize: 10,

        // 'this' = this website, 'all' = all government websites.
        web: 'this',

        // ==== TESTING — use the previous year's (already indexed) group ====
        gp0: 'archsd_r2_report2025',
        gp1: 'archsd_r2_report2025',

        // ==== PRODUCTION — comment out the two lines above, uncomment these ====
        // gp0: 'archsd_r2_report2026',
        // gp1: 'archsd_r2_report2026',

        // Template id of the result page.
        tplId: 'stdsearch',

        // Origin used to build absolute URLs returned as relative paths.
        serviceOrigin: 'https://www.search.gov.hk'
    };

    /* ----------------------------------------------------
       UI strings (en / tc / sc)
       ---------------------------------------------------- */
    var STRINGS = {
        en: {
            searching: 'Searching results...',
            noResults: 'No results found.',
            error: 'Sorry, the search service is temporarily unavailable. Please try again later.',
            searchedKeyword: 'Searched Keyword:',
            noMatching: 'No matching results.',
            noMatchingPage: 'No matching results on this page.',
            resultsRange: 'Results {start} - {end} of about {total}. Search took {time} seconds.',
            cached: 'Cached',
            prevLabel: 'Previous Page',
            nextLabel: 'Next Page'
        },
        tc: {
            searching: '搜尋中...',
            noResults: '沒有找到結果。',
            error: '抱歉,搜尋服務暫時無法使用,請稍後再試。',
            searchedKeyword: '搜尋關鍵字:',
            noMatching: '沒有符合的結果。',
            noMatchingPage: '本頁沒有符合的結果。',
            resultsRange: '顯示第 {start} - {end} 項,共約 {total} 項。搜尋時間 {time} 秒。',
            cached: '庫存頁面',
            prevLabel: '上一頁',
            nextLabel: '下一頁'
        },
        sc: {
            searching: '搜索中...',
            noResults: '没有找到结果。',
            error: '抱歉,搜索服务暂时无法使用,请稍后再试。',
            searchedKeyword: '搜索关键字:',
            noMatching: '没有符合的结果。',
            noMatchingPage: '本页没有符合的结果。',
            resultsRange: '显示第 {start} - {end} 项,共约 {total} 项。搜索时间 {time} 秒。',
            cached: '缓存页面',
            prevLabel: '上一页',
            nextLabel: '下一页'
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        var searchForm = document.getElementById('searchForm');
        var searchInput = document.getElementById('searchInput');
        var resultsContainer = document.getElementById('searchResults');
        var searchMeta = document.getElementById('searchMeta');
        var paginationContainer = document.getElementById('pagination-container');

        if (!searchForm || !resultsContainer) return;

        var lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'en';
        var uiLang = SEARCH_CONFIG.uiLang[lang] || 'en';
        var t = STRINGS[lang] || STRINGS.en;

        // ---- state ----
        var currentKeyword = '';
        var currentPage = 1;
        var totalResults = 0;
        var searchTime = '0';
        var startPos = 0;
        var endPos = 0;
        var startPage = 1;
        var endPage = 1;
        var prevPage = 0;
        var nextPage = 0;

        // ---- initial query from the address bar (?query=...) ----
        var initial = new URLSearchParams(window.location.search).get('query');
        if (initial && initial.trim()) {
            searchInput.value = initial.trim();
            performSearch(initial.trim(), 1);
        }

        // ---- submit ----
        searchForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var keyword = searchInput.value.trim();
            if (!keyword) return;

            var url = new URL(window.location.href);
            url.searchParams.set('query', keyword);
            window.history.replaceState(null, '', url);

            performSearch(keyword, 1);
        });

        /* ----------------------------------------------------
           Search / navigation
           ---------------------------------------------------- */
        function performSearch(keyword, page) {
            currentKeyword = keyword;
            currentPage = page || 1;

            showLoading();
            request(buildParams(keyword, currentPage))
                .then(handleResponse)
                .catch(handleError);
        }

        function goToPage(page) {
            if (!page || page === currentPage) return;

            currentPage = page;
            resultsContainer.innerHTML = '<p class="text-muted">' + escapeHTML(t.searching) + '</p>';
            request(buildParams(currentKeyword, page))
                .then(handleResponse)
                .catch(handleError);

            var heading = document.getElementById('search-results-heading');
            if (heading) heading.scrollIntoView({ behavior: 'smooth' });
        }

        function showLoading() {
            resultsContainer.innerHTML = '<p class="text-muted">' + escapeHTML(t.searching) + '</p>';
            paginationContainer.innerHTML = '';
            searchMeta.innerHTML = '';
        }

        /* ----------------------------------------------------
           Networking
           ---------------------------------------------------- */
        function buildParams(keyword, page) {
            var p = new URLSearchParams();
            p.set('query', keyword);
            p.set('web', SEARCH_CONFIG.web);
            p.set('ui_charset', SEARCH_CONFIG.uiCharset);
            p.set('ui_lang', uiLang);
            p.set('page', String(page || 1));
            if (SEARCH_CONFIG.pSize) p.set('p_size', String(SEARCH_CONFIG.pSize));
            if (SEARCH_CONFIG.gp0) p.set('gp0', SEARCH_CONFIG.gp0);
            if (SEARCH_CONFIG.gp1) p.set('gp1', SEARCH_CONFIG.gp1);
            if (SEARCH_CONFIG.tplId) p.set('tpl_id', SEARCH_CONFIG.tplId);
            return p.toString();
        }

        // Direct request to the GovHK service; on CORS failure fall back to the proxy.
        function request(queryString) {
            return fetchJson(SEARCH_CONFIG.endpoint + '?' + queryString)
                .catch(function () {
                    return fetchJson(SEARCH_CONFIG.proxy + '?' + queryString);
                });
        }

        function fetchJson(url) {
            return fetch(url, { headers: { 'Accept': 'application/json' } })
                .then(function (res) {
                    if (!res.ok) throw new Error('Search service returned HTTP ' + res.status);
                    return res.json();
                });
        }

        function handleError(err) {
            console.error('[search]', err);
            resultsContainer.innerHTML = '';
            paginationContainer.innerHTML = '';
            searchMeta.innerHTML = '<p class="p2-body-style">' + escapeHTML(t.error) + '</p>';
        }

        /* ----------------------------------------------------
           Parse response and render
           ---------------------------------------------------- */
        function handleResponse(data) {
            var r = data && data.search_result ? data.search_result : null;

            if (!r) {
                totalResults = 0;
                startPos = 0;
                endPos = 0;
                startPage = 1;
                endPage = 1;
                prevPage = 0;
                nextPage = 0;
                renderResults([]);
                renderMeta(0);
                renderPagination();
                return;
            }

            totalResults = toInt(r.number_of_results);
            searchTime = (r.time_spent === 0 || r.time_spent) ? String(r.time_spent) : '0';
            startPos = toInt(r.start_pos);
            endPos = toInt(r.end_pos);
            currentPage = toInt(r.this_page) || currentPage;
            startPage = toInt(r.start_page) || 1;
            endPage = toInt(r.end_page) || 1;
            prevPage = toInt(r.prev_page);
            nextPage = toInt(r.next_page);

            // ---- items ----
            var rawItems = r.results ? r.results.item : null;
            var list = [];
            if (rawItems) {
                list = Array.isArray(rawItems) ? rawItems : [rawItems];
            }

            var items = list.map(function (item) {
                return {
                    title: stripTags(item.title),
                    snippet: stripTags(item.summary),
                    url: item.url,
                    shortUrl: item.short_url,
                    cacheUrl: item.cache_url
                        ? (SEARCH_CONFIG.serviceOrigin + item.cache_url)
                        : '',
                    size: item.size
                };
            });

            renderResults(items);
            renderMeta(items.length);
            renderPagination();
        }

        function renderResults(items) {
            resultsContainer.innerHTML = '';

            if (!items.length) {
                resultsContainer.innerHTML = '<p>' + escapeHTML(t.noResults) + '</p>';
                return;
            }

            items.forEach(function (item) {
                var href = item.url || (item.shortUrl ? 'https://' + item.shortUrl : '#');
                var external = !!item.url;

                var el = document.createElement('div');
                el.className = 'search-result-item';
                el.innerHTML =
                    '<div class="result-title">' +
                        '<a href="' + escapeAttr(href) + '"' +
                            (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
                            highlightKeyword(item.title, currentKeyword) +
                        '</a>' +
                    '</div>' +
                    '<div class="result-content">' + highlightKeyword(item.snippet, currentKeyword) + '</div>' +
                    '<div class="d-flex align-items-center gap-2 flex-wrap">' +
                        '<span class="result-link">' + escapeHTML(item.shortUrl || item.url || '') + '</span>' +
                        (item.size ? '<span class="result-size">- ' + escapeHTML(item.size) + '</span>' : '') +
                        (item.cacheUrl
                            ? '<a href="' + escapeAttr(item.cacheUrl) + '" class="result-cached-link" target="_blank" rel="noopener noreferrer">' + escapeHTML(t.cached) + '</a>'
                            : '') +
                    '</div>';

                resultsContainer.appendChild(el);
            });
        }

        function renderMeta(itemCount) {
            if (!totalResults) {
                searchMeta.innerHTML =
                    '<p class="p2-body-style">' + escapeHTML(t.searchedKeyword) + ' <strong class="text-dark">' + escapeHTML(currentKeyword) + '</strong></p>' +
                    '<p class="p2-body-style">' + escapeHTML(t.noMatching) + '</p>';
                return;
            }

            var range = format(t.resultsRange, {
                start: startPos,
                end: endPos,
                total: '<strong class="text-dark">' + totalResults + '</strong>',
                time: escapeHTML(searchTime)
            });

            searchMeta.innerHTML =
                '<p class="p2-body-style">' + escapeHTML(t.searchedKeyword) + ' <strong class="text-dark">' + escapeHTML(currentKeyword) + '</strong></p>' +
                '<p class="p2-body-style">' + range + '</p>';

            if (!itemCount) {
                searchMeta.innerHTML += '<p class="p2-body-style">' + escapeHTML(t.noMatchingPage) + '</p>';
            }
        }

        function renderPagination() {
            paginationContainer.innerHTML = '';

            if (endPage <= 1 || endPage < startPage) return;

            var html = '<div class="custom-pagination-wrapper d-flex align-items-center">';

            // ---- previous ----
            if (!prevPage) {
                html += '<span class="nav-arrow disabled" aria-hidden="true" style="opacity: 0.2; cursor: not-allowed;">' +
                    '<img src="../assets/images/page-nav-icon.svg" class="page-nav-icon" alt="' + escapeAttr(t.prevLabel) + '"></span>';
            } else {
                html += '<a class="nav-arrow" href="#" data-page="' + prevPage + '" aria-label="' + escapeAttr(t.prevLabel) + '">' +
                    '<img src="../assets/images/page-nav-icon.svg" class="page-nav-icon" alt="' + escapeAttr(t.prevLabel) + '"></a>';
            }

            // ---- page numbers ----
            for (var i = startPage; i <= endPage; i++) {
                var cls = (i === currentPage) ? 'page-num active' : 'page-num';
                html += '<a class="' + cls + '" href="#" data-page="' + i + '">' + i + '</a>';
            }

            // ---- next ----
            if (!nextPage) {
                html += '<span class="nav-arrow disabled" aria-hidden="true" style="opacity: 0.2; cursor: not-allowed;">' +
                    '<img src="../assets/images/page-nav-icon.svg" class="page-nav-icon" style="transform: scaleX(-1);" alt="' + escapeAttr(t.nextLabel) + '"></span>';
            } else {
                html += '<a class="nav-arrow" href="#" data-page="' + nextPage + '" aria-label="' + escapeAttr(t.nextLabel) + '">' +
                    '<img src="../assets/images/page-nav-icon.svg" class="page-nav-icon" style="transform: scaleX(-1);" alt="' + escapeAttr(t.nextLabel) + '"></a>';
            }

            html += '</div>';
            paginationContainer.innerHTML = html;

            paginationContainer.querySelectorAll('a[data-page]').forEach(function (link) {
                link.addEventListener('click', function (event) {
                    event.preventDefault();
                    var page = parseInt(event.currentTarget.getAttribute('data-page'), 10);
                    if (page) goToPage(page);
                });
            });
        }

        /* ----------------------------------------------------
           Helpers
           ---------------------------------------------------- */
        function toInt(value) {
            var n = parseInt(value, 10);
            return isNaN(n) ? 0 : n;
        }

        function stripTags(value) {
            return String(value || '').replace(/<[^>]*>/g, '');
        }

        // Replace {placeholders}; values are inserted as-is (items may carry markup).
        function format(template, values) {
            return String(template).replace(/\{(\w+)\}/g, function (match, key) {
                return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
            });
        }

        function escapeHTML(str) {
            return String(str == null ? '' : str).replace(/[&<>'"]/g,
                function (tag) {
                    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag;
                });
        }

        function escapeAttr(str) {
            return escapeHTML(str);
        }

        function highlightKeyword(value, keyword) {
            var safe = escapeHTML(stripTags(value));
            if (!keyword) return safe;

            var words = keyword.split(' ').filter(function (w) { return w.length > 0; });
            if (!words.length) return safe;

            var pattern = words.map(escapeRegExp).join('|');
            try {
                return safe.replace(new RegExp('(' + pattern + ')', 'gi'), '<strong>$1</strong>');
            } catch (e) {
                return safe;
            }
        }

        function escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    });
})();
