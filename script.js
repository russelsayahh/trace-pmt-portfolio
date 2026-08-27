// ============================================
// MOBILE MENU TOGGLE
// ============================================

const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuToggle.classList.toggle('active');
});

// Close menu when a link is clicked
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar')) {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
    }
});

// ============================================
// ACTIVE NAVIGATION HIGHLIGHTING
// ============================================

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

let currentSection = '';
let navTicking = false;

function updateActiveNav() {
    let current = '';

    sections.forEach(section => {
        if (window.scrollY >= section.offsetTop - 200) {
            current = section.getAttribute('id');
        }
    });

    // Only touch the DOM when the active section actually changed.
    if (current === currentSection) return;
    currentSection = current;

    navLinks.forEach(link => {
        const isActive = link.getAttribute('href').slice(1) === current;
        link.style.color = isActive ? 'var(--primary-color)' : '';
    });
}

// Throttle to one measurement per frame so scrolling stays smooth.
window.addEventListener('scroll', () => {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(() => {
        updateActiveNav();
        navTicking = false;
    });
}, { passive: true });

// ============================================
// SCROLL ANIMATIONS
// ============================================

// Tells the safety net in index.html's <head> that this script is alive, so it
// leaves the reveal system switched on.
window.revealReady = true;

// Elements are marked with data-reveal in index.html - add the attribute to
// anything new that should fade in, no change needed here.
const REVEAL_DURATION = 600;  // must match the transition in styles.css
const STAGGER_STEP = 70;      // ms between neighbours appearing together
const STAGGER_MAX = 350;      // ms - cap so a big batch never crawls in

function observeElements() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reduced motion: the stylesheet already renders every element in its final
    // state, so there is nothing to animate here.
    if (prefersReducedMotion) return;

    // No IntersectionObserver: drop the flag the reveal rules key off so that
    // nothing is left hidden.
    if (!('IntersectionObserver' in window)) {
        document.documentElement.classList.remove('js');
        return;
    }

    function reveal(el, delay) {
        el.style.transitionDelay = delay ? `${delay}ms` : '';
        el.classList.add('is-visible');

        // Once it has finished appearing, mark it .revealed and drop the helper
        // class: the element stops matching the reveal rules entirely, so it
        // can never be hidden or replayed when it scrolls back into view.
        const settle = (event) => {
            // transitionend bubbles - ignore transitions from child buttons,
            // inputs and links, which would otherwise cut the reveal short.
            if (event && event.target !== el) return;

            el.removeEventListener('transitionend', settle);
            clearTimeout(fallback);
            el.classList.add('revealed');
            el.classList.remove('is-visible');
            el.style.transitionDelay = '';
        };

        // Fallback for elements that never fire transitionend (a background
        // tab, display:none at the time, an interrupted transition).
        const fallback = setTimeout(settle, REVEAL_DURATION + delay + 300);
        el.addEventListener('transitionend', settle);
    }

    const observer = new IntersectionObserver((entries) => {
        // Entries arrive in document order, so items that cross the line
        // together - a row of cards, a section title and its grid - cascade.
        let batchIndex = 0;

        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target); // reveal each element exactly once
            reveal(entry.target, Math.min(batchIndex * STAGGER_STEP, STAGGER_MAX));
            batchIndex++;
        });
    }, {
        // Fire once a tenth of the element is showing. Deliberately no negative
        // rootMargin: a bottom margin would carve out a band at the foot of the
        // page where an element can sit visible but never trigger, which at
        // maximum scroll would leave it stranded invisible.
        threshold: 0.1,
        rootMargin: '0px'
    });

    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeElements);
} else {
    observeElements();
}

// ============================================
// CONTACT FORM HANDLING
// ============================================

const contactForm = document.getElementById('contactForm');

// WhatsApp number to receive contact form messages (with country code, no + or spaces)
const WHATSAPP_NUMBER = '96176979286';

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    // Validation
    if (!name || !email || !subject || !message) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }

    // Build the WhatsApp message and open a chat with it pre-filled
    const whatsappMessage =
        `*New message from portfolio contact form*\n\n` +
        `*Name:* ${name}\n` +
        `*Email:* ${email}\n` +
        `*Subject:* ${subject}\n\n` +
        `${message}`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');

    showNotification('Opening WhatsApp to send your message...', 'success');

    // Reset form
    contactForm.reset();
});

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#00cc99' : '#ff6b6b'};
        color: white;
        border-radius: 6px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;

    document.body.appendChild(notification);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// Add slide animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// ============================================
// SMOOTH SCROLL BEHAVIOR
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ============================================
// SCROLL TO TOP BUTTON
// ============================================

function createScrollToTopButton() {
    const scrollButton = document.createElement('button');
    scrollButton.type = 'button';
    scrollButton.setAttribute('aria-label', 'Scroll to top');
    scrollButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollButton.id = 'scrollToTop';
    scrollButton.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        z-index: 999;
        box-shadow: var(--shadow-md);
        transition: var(--transition);
    `;

    document.body.appendChild(scrollButton);

    // Show/hide button based on scroll position
    let buttonShown = false;
    window.addEventListener('scroll', () => {
        const shouldShow = window.scrollY > 300;
        if (shouldShow === buttonShown) return;
        buttonShown = shouldShow;
        scrollButton.style.display = shouldShow ? 'flex' : 'none';
    }, { passive: true });

    // Scroll to top on click
    scrollButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Hover effects
    scrollButton.addEventListener('mouseenter', () => {
        scrollButton.style.transform = 'scale(1.1)';
    });

    scrollButton.addEventListener('mouseleave', () => {
        scrollButton.style.transform = 'scale(1)';
    });
}

createScrollToTopButton();

// ============================================
// COUNTER ANIMATION (Optional - for stats)
// ============================================

function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };

    updateCounter();
}

// ============================================
// PAGE LOAD OPTIMIZATION
// ============================================

// Add loading state
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// Lazy load images (if needed in future)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img.lazy').forEach(img => imageObserver.observe(img));
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Check if element is in viewport
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================

// Add skip to main content link
const skipLink = document.createElement('a');
skipLink.href = '#main';
skipLink.textContent = 'Skip to main content';
skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: white;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
`;
skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
});
skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
});
document.body.insertBefore(skipLink, document.body.firstChild);

// ============================================
// INITIALIZE
// ============================================

console.log('Tracy Gemayel Portfolio - Loaded Successfully');
console.log('Professional Psychomotor Therapist Portfolio Website');
console.log('© 2026 Tracy Gemayel. All rights reserved.');