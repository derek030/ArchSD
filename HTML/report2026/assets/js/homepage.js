/* ====================================================
   homepage.js
   ==================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ====================================================
     GSAP ScrollTrigger
     ==================================================== */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    
    gsap.registerPlugin(ScrollTrigger);

    const sections = gsap.utils.toArray('.panel-section');

    if (sections.length > 0) {
      
      const getSnapPoints = () => {
        const maxScroll = ScrollTrigger.maxScroll(window);
        if (!maxScroll) return [0];

        const points = sections.map(section => {
          const scrollY = window.scrollY;
          const rect = section.getBoundingClientRect();
          return (rect.top + scrollY) / maxScroll;
        });

        points.push(1);
        return points;
      };

      ScrollTrigger.create({
        snap: {
          snapTo: (progress) => {
            const points = getSnapPoints();
            return gsap.utils.snap(points, progress);
          },
          duration: { min: 0.2, max: 0.6 },
          delay: 0.1,
          ease: 'power1.inOut'
        }
      });

      window.addEventListener('load', () => {
        ScrollTrigger.refresh();
      });
    }
  }

  // 3. Lottie
  initHomepageLottie();

});

/* ====================================================
   Lottie ready
   ==================================================== */
function initHomepageLottie() {
  /*
  if (typeof lottie !== 'undefined') {
    const animationContainer = document.getElementById('lottie-hero');
    if (animationContainer) {
      lottie.loadAnimation({
        container: animationContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '../json/homepage-hero.json'
      });
    }
  }
  */
}