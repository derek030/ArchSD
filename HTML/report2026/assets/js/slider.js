document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the page with the slider
    if (!document.querySelector('.key-features-section')) {
        return;
    }

    const track = document.querySelector('.kfs-slider-track');
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.kfs-next');
    const prevButton = document.querySelector('.kfs-prev');
    const indicatorsNav = document.querySelector('.kfs-indicators');
    const indicators = Array.from(indicatorsNav.children);

    const contentTitle = document.querySelector('.kfs-content-title');
    const contentText = document.querySelector('.kfs-content-text');

    const slideWidth = slides[0].getBoundingClientRect().width;
    let currentIndex = 0;

    // --- FUNCTIONS ---

    // Function to update content (title and text)
    const updateContent = (targetIndex) => {
        const targetSlide = slides[targetIndex];
        const newTitle = targetSlide.dataset.title;
        const newContent = targetSlide.dataset.content;

        // Animate out
        gsap.to([contentTitle, contentText], {
            duration: 0.2,
            opacity: 0,
            y: 10,
            onComplete: () => {
                // Update text
                contentTitle.textContent = newTitle;
                contentText.textContent = newContent;
                // Animate in
                gsap.to([contentTitle, contentText], {
                    duration: 0.3,
                    opacity: 1,
                    y: 0,
                    delay: 0.1
                });
            }
        });
    };

    // Function to update indicators
    const updateIndicators = (currentIndicator, targetIndicator) => {
        currentIndicator.classList.remove('active');
        currentIndicator.setAttribute('aria-selected', 'false');
        targetIndicator.classList.add('active');
        targetIndicator.setAttribute('aria-selected', 'true');
    };

    // Function to move to a specific slide
    const moveToSlide = (targetIndex) => {
        gsap.to(track, {
            duration: 0.5,
            x: -targetIndex * slideWidth,
            ease: "power2.inOut"
        });

        const currentIndicator = indicators[currentIndex];
        const targetIndicator = indicators[targetIndex];

        updateIndicators(currentIndicator, targetIndicator);
        updateContent(targetIndex);

        currentIndex = targetIndex;
    };

    // --- EVENT LISTENERS ---

    // Next button
    nextButton.addEventListener('click', () => {
        let nextIndex = currentIndex + 1;
        if (nextIndex >= slides.length) {
            nextIndex = 0; // Loop to the first slide
        }
        moveToSlide(nextIndex);
    });

    // Previous button
    prevButton.addEventListener('click', () => {
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
            prevIndex = slides.length - 1; // Loop to the last slide
        }
        moveToSlide(prevIndex);
    });

    // Indicator dots
    indicatorsNav.addEventListener('click', e => {
        const targetIndicator = e.target.closest('button');
        if (!targetIndicator) return;

        const targetIndex = indicators.findIndex(dot => dot === targetIndicator);
        if (targetIndex === currentIndex) return;

        moveToSlide(targetIndex);
    });

    // --- INITIALIZATION (Corrected) ---
    const initSlider = () => {
        // Set initial text content without animation
        const initialSlide = slides[0];
        contentTitle.textContent = initialSlide.dataset.title;
        contentText.textContent = initialSlide.dataset.content;

        // Set the first indicator to active
        indicators[0].classList.add('active');
        indicators[0].setAttribute('aria-selected', 'true');
    };

    initSlider();
});
