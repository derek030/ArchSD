/* ====================================================
   general.js
   ==================================================== */

if (typeof gsap !== 'undefined') {
  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
  if (typeof ScrollToPlugin !== 'undefined') gsap.registerPlugin(ScrollToPlugin);
}

document.addEventListener('DOMContentLoaded', () => {

     loadDynamicNav();

  /* ----------------------------------------------------
     3. Header Background on Scroll
     ---------------------------------------------------- */
     const header = document.querySelector('header, .site-header');
     const section1 = document.querySelector('.section-1, #section-1, section:first-of-type');

  if (header && section1) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && entry.boundingClientRect.top <= 0) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      },
      {
        threshold: 0,
        rootMargin: '-140px 0px 0px 0px'
      }
    );

    observer.observe(section1);
  }

  /* ----------------------------------------------------
     4. Back to Top Button
     ---------------------------------------------------- */
     const backToTopBtn = document.getElementById('back-to-top');
	
	if (backToTopBtn) {
		window.addEventListener('scroll', () => {
			if (window.scrollY > 300) {
				backToTopBtn.classList.add('show');
			} else {
				backToTopBtn.classList.remove('show');
			}
		});
	
		backToTopBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const focusToTop = () => {
        const topTarget = document.querySelector('header, .site-header, h1') || document.body;
        
        if (topTarget && !topTarget.hasAttribute('tabindex') && topTarget !== document.body) {
            topTarget.setAttribute('tabindex', '-1');
        }
        
        topTarget.focus({ preventScroll: true });
    };

    if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
        gsap.to(window, {
            duration: 0.5,
            scrollTo: { y: 0, autoKill: false },
            ease: 'power2.out',
            onComplete: focusToTop
        });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(focusToTop, 500);
    }
});
	}

  /* ----------------------------------------------------
     5. Smooth Scroll
     ---------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === 'javascript:void(0);') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();

        const focusTarget = () => {
          if (!targetEl.hasAttribute('tabindex') && targetEl !== document.body) {
            targetEl.setAttribute('tabindex', '-1');
          }
          targetEl.focus({ preventScroll: true });
        };

        if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
          gsap.to(window, {
            duration: 0.8,
            scrollTo: targetEl,
            ease: 'power2.out',
            onComplete: focusTarget
          });
        } else {
          targetEl.scrollIntoView({ behavior: 'smooth' });
          setTimeout(focusTarget, 500);
        }
      }
    });
  });

  /* ----------------------------------------------------
     6. GSAP ScrollTrigger Section Snap
     ---------------------------------------------------- */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    const snapSections = document.querySelectorAll('.snap-section');
    if (snapSections.length > 0) {
      ScrollTrigger.create({
        snap: {
          snapTo: 1 / (snapSections.length - 1),
          duration: { min: 0.2, max: 0.6 },
          delay: 0.1,
          ease: 'power1.inOut'
        }
      });
    }
  }

});

/* ====================================================
   1. JS Equalize Block Heights
   ==================================================== */
function equalizeBlockHeights() {
  const blocks = document.querySelectorAll('.grid-container .block');
  if (!blocks.length) return;

  blocks.forEach(block => {
    block.style.height = 'auto';
  });

  if (window.innerWidth < 768) return;

  let maxHeight = 0;
  blocks.forEach(block => {
    if (block.offsetHeight > maxHeight) {
      maxHeight = block.offsetHeight;
    }
  });

  if (maxHeight > 0) {
    blocks.forEach(block => {
      block.style.height = `${maxHeight}px`;
    });
  }
}

window.addEventListener('load', equalizeBlockHeights);

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(equalizeBlockHeights, 150);
});

if (document.fonts) {
  document.fonts.ready.then(equalizeBlockHeights);
}

document.addEventListener('navLoaded', () => {
  setTimeout(equalizeBlockHeights, 50);
});


/* ====================================================
   2. Dynamic Nav Loader Helpers
   ==================================================== */
function getCurrentLang() {
  const path = window.location.pathname;
  if (path.includes('/tc/')) return 'tc';
  if (path.includes('/sc/')) return 'sc';
  if (path.includes('/en/')) return 'en';
  return localStorage.getItem('user-lang') || 'en';
}

function loadDynamicNav() {
  const navContainer = document.getElementById('nav-placeholder');
  if (!navContainer) return;

  const lang = getCurrentLang();
  const navFilePath = `../assets/includes/nav-${lang}.html`; 

  fetch(navFilePath)
    .then(response => {
      if (!response.ok) throw new Error(`Nav file not found: ${response.status}`);
      return response.text();
    })
    .then(html => {
      const placeholder = document.getElementById('nav-placeholder');
      if (placeholder) {
        placeholder.outerHTML = html;
        document.dispatchEvent(new CustomEvent('navLoaded'));
      }
    })
    .catch(err => console.error('Error loading navigation:', err));
}