document.addEventListener('DOMContentLoaded', () => {
    const sliderContainer = document.querySelector('.key-features-section');
    if (!sliderContainer) return;

    const track = document.querySelector('.kfs-slider-track');
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.kfs-next');
    const prevButton = document.querySelector('.kfs-prev');
    const indicatorsNav = document.querySelector('.kfs-indicators');
    const indicators = indicatorsNav ? Array.from(indicatorsNav.children) : [];

    const contentTitle = document.querySelector('.kfs-content-title');
    const contentText = document.querySelector('.kfs-content-text');

    // --- Read HTML attribute settings (with default values ​​for error prevention) ---
    const initialSlideIndex = sliderContainer.dataset.initialSlide ? parseInt(sliderContainer.dataset.initialSlide, 10) : 0;
    const isLoop = sliderContainer.dataset.loop === 'true'; // Default: false (one-way)

    let slideWidth = slides[0].getBoundingClientRect().width;
    let currentIndex = Math.max(0, Math.min(initialSlideIndex, slides.length - 1)); // Ensure it does not exceed the range

    // --- 1. RWD Handling Window Size Changes ---
    window.addEventListener('resize', () => {
        slideWidth = slides[0].getBoundingClientRect().width;
        gsap.set(track, { x: -currentIndex * slideWidth });
    });

    // --- 2. Update button disabled state (for one-way mode) ---
    const updateButtonsState = () => {
        if (isLoop) return; // Buttons are always enabled in loop mode

        // Prev Button Check
        if (currentIndex === 0) {
            prevButton.classList.add('disabled');
            prevButton.setAttribute('aria-disabled', 'true');
        } else {
            prevButton.classList.remove('disabled');
            prevButton.setAttribute('aria-disabled', 'false');
        }

        // Next Button Check
        if (currentIndex === slides.length - 1) {
            nextButton.classList.add('disabled');
            nextButton.setAttribute('aria-disabled', 'true');
        } else {
            nextButton.classList.remove('disabled');
            nextButton.setAttribute('aria-disabled', 'false');
        }
    };

    // --- 3. Update text content ---
    const updateContent = (targetIndex) => {
        if (!contentTitle || !contentText) return;
        const targetSlide = slides[targetIndex];
        const newTitle = targetSlide.dataset.title;
        const newContent = targetSlide.dataset.content;

        gsap.to([contentTitle, contentText], {
            duration: 0.2,
            opacity: 0,
            y: 10,
            onComplete: () => {
                contentTitle.textContent = newTitle;
                contentText.textContent = newContent;
                gsap.to([contentTitle, contentText], {
                    duration: 0.3,
                    opacity: 1,
                    y: 0,
                    delay: 0.1
                });
            }
        });
    };

    // --- 4. Update Indicators ---
    const updateIndicators = (targetIndex) => {
        if (indicators.length === 0) return;
        indicators.forEach((dot, idx) => {
            if (idx === targetIndex) {
                dot.classList.add('active');
                dot.setAttribute('aria-selected', 'true');
            } else {
                dot.classList.remove('active');
                dot.setAttribute('aria-selected', 'false');
            }
        });
    };

    // --- 5. Move to a specific slide ---
    const moveToSlide = (targetIndex, animate = true) => {
        const duration = animate ? 0.5 : 0;

        gsap.to(track, {
            duration: duration,
            x: -targetIndex * slideWidth,
            ease: "power2.inOut",
            overwrite: "auto"
        });

        updateIndicators(targetIndex);
        updateContent(targetIndex);
        currentIndex = targetIndex;
        updateButtonsState();
    };

    // --- 6. Mouse Dragging and Mobile Touch (Drag / Swipe) ---
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;

    track.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX;
        prevTranslate = -currentIndex * slideWidth;
        track.style.cursor = 'grabbing';
        gsap.killTweensOf(track);
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const currentX = e.clientX;
        const diff = currentX - startX;
        currentTranslate = prevTranslate + diff;
        gsap.set(track, { x: currentTranslate });
    });

    window.addEventListener('pointerup', () => {
        if (!isDragging) return;
        isDragging = false;
        track.style.cursor = 'grab';

        const movedBy = currentTranslate - prevTranslate;

        if (movedBy < -50) {
            // Swipe left -> Next image
            if (currentIndex < slides.length - 1) {
                moveToSlide(currentIndex + 1);
            } else if (isLoop) {
                moveToSlide(0);
            } else {
                moveToSlide(currentIndex); // bounce back to its original position
            }
        } else if (movedBy > 50) {
            // Swipe right -> Previous image
            if (currentIndex > 0) {
                moveToSlide(currentIndex - 1);
            } else if (isLoop) {
                moveToSlide(slides.length - 1);
            } else {
                moveToSlide(currentIndex); // bounce back to its original position
            }
        } else {
            moveToSlide(currentIndex);
        }
    });

    // --- EVENT LISTENERS ---

    nextButton.addEventListener('click', () => {
        let nextIndex = currentIndex + 1;
        if (nextIndex >= slides.length) {
            if (isLoop) {
                nextIndex = 0;
            } else {
                return; // Intercept directly when the one-way mode reaches its end.
            }
        }
        moveToSlide(nextIndex);
    });

    prevButton.addEventListener('click', () => {
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
            if (isLoop) {
                prevIndex = slides.length - 1;
            } else {
                return; // Intercept directly when the one-way mode reaches its end.
            }
        }
        moveToSlide(prevIndex);
    });

    if (indicatorsNav) {
        indicatorsNav.addEventListener('click', e => {
            const targetIndicator = e.target.closest('button');
            if (!targetIndicator) return;

            const targetIndex = indicators.findIndex(dot => dot === targetIndicator);
            if (targetIndex === currentIndex || targetIndex === -1) return;

            moveToSlide(targetIndex);
        });
    }

    // --- INITIALIZATION ---
    const initSlider = () => {
        track.style.cursor = 'grab';
        // Initialize position and state (no animation)
        moveToSlide(currentIndex, false);
    };

    initSlider();
});