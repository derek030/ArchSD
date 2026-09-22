/* ====================================================
   menu.js - 所有 Nav/Menu 內部組件與互動邏輯
   ==================================================== */

let isMenuInitialized = false;

document.addEventListener('navLoaded', () => {
  initMenuLogic();
});

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('nav-placeholder')) {
    initMenuLogic();
  }
});

function initMenuLogic() {
  if (isMenuInitialized) return;

  const navWrapper = document.getElementById('navWrapper');
  const toggleBtn = document.getElementById('navToggleBtn');
  const trapTop = document.getElementById('trapTop');
  const trapBottom = document.getElementById('trapBottom');

  if (!navWrapper) return; 

  /* ----------------------------------------------------
     1. Menu Drawer & Focus Trap
     ---------------------------------------------------- */
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navWrapper.classList.contains('active');
      if (isOpen) closeMenu();
      else openMenu();
    });

    document.addEventListener('click', (e) => {
      if (navWrapper.classList.contains('active') && !navWrapper.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navWrapper.classList.contains('active')) closeMenu();
    });

    if (trapTop) {
      trapTop.addEventListener('focus', () => {
        if (navWrapper.classList.contains('active')) focusLastItem();
      });
    }
    if (trapBottom) {
      trapBottom.addEventListener('focus', () => {
        if (navWrapper.classList.contains('active')) focusFirstItem();
      });
    }
  }

  function openMenu() {
    navWrapper.classList.add('active');
    document.body.classList.add('menu-open');
    toggleBtn.setAttribute('aria-expanded', 'true');

    const items = navWrapper.querySelectorAll('.main-nav > li, .appendix-menu, .centered-line-col');
    if (items.length) {
      gsap.set(items, { visibility: 'visible', pointerEvents: 'auto' });
    }

    if (typeof gsap !== 'undefined') {
      gsap.set('.main-nav', { opacity: 1, visibility: 'visible' });

      if (items.length) {
        gsap.set(items, { opacity: 0, x: 80 });

        gsap.to(items, {
          opacity: 1,
          x: 0,
          duration: 0.2,
          ease: 'power2.out',
          stagger: 0.05,
          delay: 0.5,
          clearProps: 'transform'
        });
      }
    }

    setTimeout(focusFirstItem, 100);
  }

  function closeMenu() {
    const isFocusInsideMenu = navWrapper.contains(document.activeElement);

    navWrapper.classList.remove('active');
    document.body.classList.remove('menu-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    closeAllSubmenus();

    if (isFocusInsideMenu) {
      toggleBtn.focus();
    }

    const items = navWrapper.querySelectorAll('.main-nav > li, .appendix-menu, .centered-line-col');

    if (typeof gsap !== 'undefined') {
      if (items.length) {
        gsap.set(items, { opacity: 0, x: 80 });
        gsap.set(items, { visibility: 'hidden', pointerEvents: 'none', delay: 0.3 });
      }
    } else {
      items.forEach(el => {
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
      });
    }
  }

  function getFocusables() {
    return Array.from(navWrapper.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => {
      const style = window.getComputedStyle(el);
      return style.visibility !== 'hidden' && style.display !== 'none' && (el.offsetWidth > 0 || el.offsetHeight > 0);
    });
  }

  function focusFirstItem() {
    const focusables = getFocusables();
    if (focusables.length) focusables[0].focus();
  }

  function focusLastItem() {
    const focusables = getFocusables();
    if (focusables.length) focusables[focusables.length - 1].focus();
  }


  /* ----------------------------------------------------
     2. Main Nav Accordion + Accessibility Tab
     ---------------------------------------------------- */
  const mainNav = navWrapper.querySelector('.main-nav');
  if (mainNav) {
    mainNav.addEventListener('click', (e) => {
      const targetNav = e.target.closest('.nav-1st.plus-sub');
      if (!targetNav) return;
      e.preventDefault();

      const subMenu = targetNav.nextElementSibling;
      const isAlreadyOpen = targetNav.classList.contains('open-sub');

      mainNav.querySelectorAll('.nav-1st.plus-sub').forEach(nav => {
        nav.classList.remove('open-sub');
        nav.setAttribute('aria-expanded', 'false');
        const ul = nav.nextElementSibling;
        if (ul) {
          ul.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '-1'));
          if (typeof gsap !== 'undefined') gsap.to(ul, { height: 0, duration: 0.3 });
        }
      });

      if (!isAlreadyOpen && subMenu) {
        targetNav.classList.add('open-sub');
        targetNav.setAttribute('aria-expanded', 'true');
        subMenu.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '0'));
        if (typeof gsap !== 'undefined') gsap.to(subMenu, { height: 'auto', duration: 0.3 });
      }
    });
  }


  /* ----------------------------------------------------
     3. Extra Submenu
     ---------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.nav-appendix');
    if (!trigger) {
      if (!e.target.closest('.fonts-size-block, .langs-block, .forward-block, .extra-submenu')) {
        closeAllSubmenus();
      }
      return;
    }

    const currentCell = trigger.closest('.appendix-cell');
    if (!currentCell || trigger.closest('.fonts-size-block, .langs-block, .forward-block')) return;

    e.preventDefault();
    const isAlreadyOpen = currentCell.classList.contains('is-active');
    closeAllSubmenus();

    if (!isAlreadyOpen) {
      currentCell.classList.add('is-active');
      trigger.classList.add('is-active');
      const subMenu = currentCell.querySelector('.extra-submenu');
      if (subMenu) subMenu.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '0'));
    }
  }, true);

  function closeAllSubmenus() {
    document.querySelectorAll('.appendix-cell.is-active, .nav-appendix.is-active').forEach(el => {
      el.classList.remove('is-active');
    });
    document.querySelectorAll('.extra-submenu a').forEach(a => a.setAttribute('tabindex', '-1'));
  }


  /* ----------------------------------------------------
     4. Switch Font Size
     ---------------------------------------------------- */
  const fontSizeLinks = navWrapper.querySelectorAll('.fonts-size-block .nav-appendix');
  const savedSize = localStorage.getItem('user-font-size') || 'md';
  applyFontSize(savedSize);

  fontSizeLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const img = link.querySelector('img');
      if (!img) return;

      let size = 'md';
      if (img.classList.contains('fonts-size-small')) size = 'sm';
      else if (img.classList.contains('fonts-size-large')) size = 'lg';

      applyFontSize(size);
      localStorage.setItem('user-font-size', size);
    });
  });

  function applyFontSize(size) {
    document.documentElement.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg');
    document.documentElement.classList.add(`font-size-${size}`);
    fontSizeLinks.forEach(link => {
      const img = link.querySelector('img');
      if (!img) return;
      const isCurrent = (size === 'sm' && img.classList.contains('fonts-size-small')) ||
                        (size === 'md' && img.classList.contains('fonts-size-normal')) ||
                        (size === 'lg' && img.classList.contains('fonts-size-large'));
      link.classList.toggle('font-selected', isCurrent);
    });
  }


  /* ----------------------------------------------------
     5. Switch Language
     ---------------------------------------------------- */
  const langLinks = navWrapper.querySelectorAll('.langs-block .nav-appendix');
  
  const currentPath = window.location.pathname;
  let currentLang = 'tc'; 
  const urlMatch = currentPath.match(/\/(tc|sc|en)\//);

  if (urlMatch) {
    currentLang = urlMatch[1];
  } else if (localStorage.getItem('user-lang')) {
    currentLang = localStorage.getItem('user-lang');
  }

  applyActiveLang(currentLang);

  function applyActiveLang(lang) {
    langLinks.forEach(link => {
      const isCurrent = link.dataset.lang === lang;
      link.classList.toggle('font-selected', isCurrent);
      link.classList.toggle('is-active', isCurrent);
      link.classList.toggle('active', isCurrent);
    });
  }

  langLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetLang = link.dataset.lang;
      if (!targetLang) return;

      localStorage.setItem('user-lang', targetLang);
      applyActiveLang(targetLang);

      const searchAndHash = window.location.search + window.location.hash;

      let targetUrl = /\/(tc|sc|en)\//.test(currentPath) 
        ? currentPath.replace(/\/(tc|sc|en)\//, `/${targetLang}/`) + searchAndHash
        : `./${targetLang}/${currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html'}${searchAndHash}`;

      window.location.href = targetUrl;
    });
  });


  /* ----------------------------------------------------
     6. Sharing Functionality
     ---------------------------------------------------- */
  const forwardLinks = navWrapper.querySelectorAll('.forward-block .nav-appendix');
  forwardLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const platform = (e.target.closest('.nav-appendix') || link).dataset.share;
      const currentUrl = encodeURIComponent(window.location.href);
      const rawUrl = window.location.href;
      const title = encodeURIComponent(document.title);

      switch (platform) {
        case 'facebook': openWindow(`https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`); break;
        case 'x': openWindow(`https://x.com/intent/tweet?text=${title}&url=${currentUrl}`); break;
        case 'whatsapp': window.open(`https://api.whatsapp.com/send?text=${title}%20${currentUrl}`, '_blank'); break;
        case 'mail': window.location.href = `mailto:?subject=${title}&body=${currentUrl}`; break;
        case 'copy': 
          if (navigator.clipboard) navigator.clipboard.writeText(rawUrl).then(showToast);
          break;
        case 'wechat': showWeChatModal(rawUrl); break;
      }
    });
  });


  /* ----------------------------------------------------
     7. Highlight Current Menu Item
     ---------------------------------------------------- */
  function highlightCurrentMenuItem() {
    const pageTitleEl = document.querySelector('.page-title');
    if (!pageTitleEl) return;

    const currentPageTitle = pageTitleEl.textContent.trim().toLowerCase();
    if (!currentPageTitle) return;

    const menuLinks = navWrapper.querySelectorAll('.main-nav a, .appendix-menu a');

    menuLinks.forEach(link => {
      link.classList.remove('current');
      const linkText = link.textContent.trim().toLowerCase();

      if (linkText === currentPageTitle) {
        link.classList.add('current');

        const parentSubMenuUl = link.closest('ul');
        const parent1stNav = parentSubMenuUl ? parentSubMenuUl.previousElementSibling : null;

        if (parent1stNav && parent1stNav.classList.contains('plus-sub')) {
          parent1stNav.classList.add('open-sub', 'parent-current');
          parent1stNav.setAttribute('aria-expanded', 'true');

          if (parentSubMenuUl) {
            parentSubMenuUl.style.height = 'auto';
            parentSubMenuUl.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '0'));
          }
        }
      }
    });
  }

  highlightCurrentMenuItem();


  /* ----------------------------------------------------
     8. Background Music Player
     ---------------------------------------------------- */
  const bgMusic = document.getElementById('bgMusic');
  
  const audioBtnDesktop = document.getElementById('audioToggleBtn');
  const audioBtnMobile = document.getElementById('audioToggleBtnM');

  const audioBtns = [audioBtnDesktop, audioBtnMobile].filter(Boolean);

  if (bgMusic && audioBtns.length > 0) {
    bgMusic.volume = 0.3;

    const updateButtonsUI = (isPlaying) => {
      audioBtns.forEach(btn => {
        if (isPlaying) {
          btn.classList.add('is-playing');
          btn.setAttribute('aria-pressed', 'true');
          btn.setAttribute('aria-label', 'Pause background music');
        } else {
          btn.classList.remove('is-playing');
          btn.setAttribute('aria-pressed', 'false');
          btn.setAttribute('aria-label', 'Play background music');
        }
      });
    };

    audioBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (bgMusic.paused) {
          bgMusic.play().then(() => {
            updateButtonsUI(true);
          }).catch(err => {
            console.error('Audio play failed:', err);
          });
        } else {
          bgMusic.pause();
          updateButtonsUI(false);
        }
      }, true);
    });
  }

  isMenuInitialized = true;
}

/* --- Sharing Helper Functions --- */
function openWindow(url) {
  window.open(url, 'shareWin', 'width=600,height=450');
}

function showToast() {
  const toast = document.getElementById('copy-toast');
  if (toast) {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }
}

function showWeChatModal(url) {
  let modal = document.getElementById('wechat-modal');

  const currentPath = window.location.pathname;
  let currentLang = 'tc';
  const urlMatch = currentPath.match(/\/(tc|sc|en)\//);

  if (urlMatch) {
    currentLang = urlMatch[1];
  } else if (localStorage.getItem('user-lang')) {
    currentLang = localStorage.getItem('user-lang');
  }

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'wechat-modal';
    
    modal.innerHTML = `
      <div class="wechat-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:9999;">
        <div class="wechat-dialog" style="background:#fff; padding:24px; border-radius:12px; text-align:center; position:relative; min-width:220px;">
          <span class="wechat-close" style="position:absolute; top:-7px; right:5px; cursor:pointer; font-size:40px; line-height:1; color:#666;">&times;</span>
          
          <p class="en" style="margin:0 0 16px 0; font-weight:bold; color:#333; font-size:16px; display:none;">Please scan the QR code with WeChat to share.</p>
          <p class="tc" style="margin:0 0 16px 0; font-weight:bold; color:#333; font-size:16px; display:none;">請使用微信掃一掃以分享</p>
          <p class="sc" style="margin:0 0 16px 0; font-weight:bold; color:#333; font-size:16px; display:none;">请使用微信扫一扫以分享</p>
          
          <div id="qrcode-box" style="display:flex; justify-content:center;"></div>
        </div>
      </div>`;
    
    document.body.appendChild(modal);

    const overlay = modal.querySelector('.wechat-overlay');
    const closeBtn = modal.querySelector('.wechat-close');

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        modal.style.display = 'none';
      }
    });

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

  } else {
    modal.style.display = 'block';
  }

  modal.querySelectorAll('p.en, p.tc, p.sc').forEach(p => p.style.display = 'none');
  const activeP = modal.querySelector(`p.${currentLang}`);
  if (activeP) activeP.style.display = 'block';

  const qrContainer = document.getElementById('qrcode-box');
  qrContainer.innerHTML = '';

  if (typeof QRCode !== 'undefined') {
    new QRCode(qrContainer, {
      text: url,
      width: 180,
      height: 180,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }
}