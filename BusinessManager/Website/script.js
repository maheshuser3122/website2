/**
 * Mcharv Techlabs - Production JavaScript
 * Version: 2.0.0
 * Last Updated: 2025
 * 
 * Features:
 * - Form validation with XSS protection
 * - Cookie consent management
 * - Accessibility enhancements
 * - Error handling and logging
 * - Performance optimizations
 */

'use strict';

// ========== Configuration ==========
const CONFIG = {
  emailJS: {
    serviceId: 'service_bkrtnyd',
    templateId: 'template_le127ir',
    publicKey: 'Z4RaISWJDea-fTeNF'
  },
  animation: {
    duration: 800,
    easing: 'ease-out-cubic'
  },
  preloader: {
    minDisplayTime: 1000,
    maxDisplayTime: 5000
  },
  rateLimit: {
    maxSubmissions: 3,
    windowMs: 60000 // 1 minute
  }
};

// ========== Utility Functions ==========
const Utils = {
  // Sanitize HTML to prevent XSS
  sanitizeHTML(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  },

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  },

  // Debounce function for performance
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for scroll events
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Safe localStorage operations
  storage: {
    get(key) {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch (e) {
        console.warn('localStorage get error:', e);
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn('localStorage set error:', e);
        return false;
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        return false;
      }
    }
  },

  // Check if element is in viewport
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    );
  }
};

// ========== Rate Limiter ==========
class RateLimiter {
  constructor(maxAttempts, windowMs) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = [];
  }

  canAttempt() {
    const now = Date.now();
    this.attempts = this.attempts.filter(time => now - time < this.windowMs);
    return this.attempts.length < this.maxAttempts;
  }

  recordAttempt() {
    this.attempts.push(Date.now());
  }

  getRemainingTime() {
    if (this.attempts.length === 0) return 0;
    const oldestAttempt = Math.min(...this.attempts);
    return Math.max(0, this.windowMs - (Date.now() - oldestAttempt));
  }
}

const formRateLimiter = new RateLimiter(
  CONFIG.rateLimit.maxSubmissions,
  CONFIG.rateLimit.windowMs
);

// ========== Form Validator ==========
const FormValidator = {
  rules: {
    fromName: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s'-]+$/,
      message: 'Please enter a valid name (letters only, 2-100 characters)'
    },
    fromEmail: {
      required: true,
      email: true,
      message: 'Please enter a valid email address'
    },
    message: {
      required: true,
      minLength: 10,
      maxLength: 5000,
      message: 'Message must be between 10 and 5000 characters'
    },
    gdprConsent: {
      required: true,
      message: 'Please accept the privacy policy to continue'
    }
  },

  validateField(fieldName, value) {
    const rule = this.rules[fieldName];
    if (!rule) return { valid: true };

    // Required check
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return { valid: false, message: rule.message || 'This field is required' };
    }

    // Skip other validations if empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) return { valid: true };

    // Email validation
    if (rule.email && !Utils.isValidEmail(value)) {
      return { valid: false, message: rule.message };
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return { valid: false, message: rule.message };
    }

    // Length validation
    if (rule.minLength && value.length < rule.minLength) {
      return { valid: false, message: rule.message };
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return { valid: false, message: `Maximum ${rule.maxLength} characters allowed` };
    }

    return { valid: true };
  },

  showFieldError(field, message) {
    const group = field.closest('.form-group') || field.closest('.form-check');
    if (group) {
      group.classList.add('error');
      group.classList.remove('success');
      const errorEl = group.querySelector('.form-error');
      if (errorEl) {
        errorEl.textContent = message;
      }
    }
    field.setAttribute('aria-invalid', 'true');
  },

  clearFieldError(field) {
    const group = field.closest('.form-group') || field.closest('.form-check');
    if (group) {
      group.classList.remove('error');
      group.classList.add('success');
      const errorEl = group.querySelector('.form-error');
      if (errorEl) {
        errorEl.textContent = '';
      }
    }
    field.removeAttribute('aria-invalid');
  },

  validateForm(form) {
    let isValid = true;
    const fields = ['fromName', 'fromEmail', 'message', 'gdprConsent'];

    fields.forEach(fieldName => {
      const field = form.querySelector(`#${fieldName}`);
      if (field) {
        const value = field.type === 'checkbox' ? field.checked : field.value;
        const result = this.validateField(fieldName, value);

        if (!result.valid) {
          this.showFieldError(field, result.message);
          isValid = false;
        } else {
          this.clearFieldError(field);
        }
      }
    });

    return isValid;
  }
};

// ========== Notification System ==========
const Notification = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'success', duration = 5000) {
    this.init();

    // Remove existing notifications
    const existing = this.container.querySelector('.notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'alert');
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';

    notification.innerHTML = `
      <i class="fas ${icon}" aria-hidden="true"></i>
      <span>${Utils.sanitizeHTML(message)}</span>
      <button class="notification-close" aria-label="Close notification">&times;</button>
    `;

    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      padding: 16px 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      z-index: 10001;
      animation: slideIn 0.3s ease;
      max-width: 400px;
      font-size: 14px;
    `;

    this.container.appendChild(notification);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.hide(notification);
    });

    // Auto-hide
    if (duration > 0) {
      setTimeout(() => this.hide(notification), duration);
    }

    return notification;
  },

  hide(notification) {
    if (notification && notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }
  }
};

// ========== Cookie Consent ==========
const CookieConsent = {
  banner: null,
  cookieName: 'mcharv_cookie_consent',

  init() {
    this.banner = document.getElementById('cookieBanner');
    if (!this.banner) return;

    const consent = Utils.storage.get(this.cookieName);
    
    if (consent === null) {
      // Show banner after a short delay
      setTimeout(() => {
        this.banner.classList.add('visible');
      }, 2000);
    }

    // Bind events
    const acceptBtn = document.getElementById('acceptCookies');
    const declineBtn = document.getElementById('declineCookies');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => this.accept());
    }
    if (declineBtn) {
      declineBtn.addEventListener('click', () => this.decline());
    }
  },

  accept() {
    Utils.storage.set(this.cookieName, { accepted: true, date: new Date().toISOString() });
    this.hideBanner();
    this.enableTracking();
  },

  decline() {
    Utils.storage.set(this.cookieName, { accepted: false, date: new Date().toISOString() });
    this.hideBanner();
  },

  hideBanner() {
    if (this.banner) {
      this.banner.classList.remove('visible');
    }
  },

  enableTracking() {
    console.log('Analytics tracking enabled');
  }
};

// ========== Main Application ==========
const App = {
  init() {
    this.initPreloader();
    this.initNavigation();
    this.initSmoothScroll();
    this.initAOS();
    this.initSwiper();
    this.initBackToTop();
    this.initContactForm();
    this.initStatsCounter();
    this.initNewsletterForm();
    this.initAccessibility();
    this.initDynamicYear();
    this.initParallax();
    CookieConsent.init();
    this.addNotificationStyles();
  },

  addNotificationStyles() {
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        .notification-close {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          margin-left: auto;
          padding: 0 0 0 10px;
          line-height: 1;
        }
        .notification-close:hover {
          opacity: 0.8;
        }
      `;
      document.head.appendChild(style);
    }
  },

  initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    const startTime = Date.now();

    const hidePreloader = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, CONFIG.preloader.minDisplayTime - elapsed);

      setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.style.overflow = '';
        setTimeout(() => preloader.remove(), 500);
      }, remaining);
    };

    if (document.readyState === 'complete') {
      hidePreloader();
    } else {
      window.addEventListener('load', hidePreloader);
      setTimeout(hidePreloader, CONFIG.preloader.maxDisplayTime);
    }
  },

  initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');
    const navbar = document.querySelector('.navbar');

    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded);
        navLinks.classList.toggle('active');

        const icon = navToggle.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-bars');
          icon.classList.toggle('fa-times');
        }
      });

      // Close menu on link click
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('active');
          navToggle.setAttribute('aria-expanded', 'false');
          const icon = navToggle.querySelector('i');
          if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
          }
        });
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
          navLinks.classList.remove('active');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
          navLinks.classList.remove('active');
          navToggle.setAttribute('aria-expanded', 'false');
          navToggle.focus();
        }
      });
    }

    // Navbar scroll effect
    if (navbar) {
      const handleScroll = Utils.throttle(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
      }, 100);

      window.addEventListener('scroll', handleScroll, { passive: true });
    }
  },

  initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);

        if (target) {
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          history.pushState(null, null, href);
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      });
    });
  },

  initAOS() {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: CONFIG.animation.duration,
        easing: CONFIG.animation.easing,
        once: true,
        offset: 100,
        delay: 100,
        disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      });
    }
  },

  initSwiper() {
    if (typeof Swiper !== 'undefined') {
      try {
        new Swiper('.testimonials-slider .swiper', {
          slidesPerView: 1,
          spaceBetween: 30,
          loop: true,
          autoplay: {
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          },
          pagination: {
            el: '.swiper-pagination',
            clickable: true
          },
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
          },
          keyboard: { enabled: true },
          a11y: {
            prevSlideMessage: 'Previous testimonial',
            nextSlideMessage: 'Next testimonial'
          }
        });
      } catch (error) {
        console.warn('Swiper initialization error:', error);
      }
    }
  },

  initBackToTop() {
    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;

    const handleScroll = Utils.throttle(() => {
      backToTop.classList.toggle('visible', window.scrollY > 500);
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });

    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  },

  initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const submitBtn = document.getElementById('submitBtn');
    const btnText = form.querySelector('.btn-text');
    const btnLoading = form.querySelector('.btn-loading');
    const formStatus = document.getElementById('formStatus');

    // Real-time validation
    ['fromName', 'fromEmail', 'message'].forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('blur', () => {
          const result = FormValidator.validateField(fieldId, field.value);
          if (!result.valid) {
            FormValidator.showFieldError(field, result.message);
          } else {
            FormValidator.clearFieldError(field);
          }
        });

        field.addEventListener('input', Utils.debounce(() => {
          const result = FormValidator.validateField(fieldId, field.value);
          if (result.valid) {
            FormValidator.clearFieldError(field);
          }
        }, 300));
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Check honeypot (spam protection)
      const honeypot = form.querySelector('input[name="website"]');
      if (honeypot && honeypot.value) {
        console.log('Spam detected');
        return;
      }

      // Rate limiting
      if (!formRateLimiter.canAttempt()) {
        const waitTime = Math.ceil(formRateLimiter.getRemainingTime() / 1000);
        Notification.show(`Too many submissions. Please wait ${waitTime} seconds.`, 'warning');
        return;
      }

      // Validate
      if (!FormValidator.validateForm(form)) {
        Notification.show('Please fix the errors in the form.', 'error');
        const firstError = form.querySelector('.error input, .error textarea');
        if (firstError) firstError.focus();
        return;
      }

      // Loading state
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'inline-flex';
      if (submitBtn) submitBtn.disabled = true;
      if (formStatus) {
        formStatus.className = 'form-status';
        formStatus.textContent = '';
      }

      // Form data
      const formData = {
        from_name: Utils.sanitizeHTML(document.getElementById('fromName').value.trim()),
        from_email: document.getElementById('fromEmail').value.trim(),
        subject: Utils.sanitizeHTML(document.getElementById('subject')?.value.trim() || 'Website Inquiry'),
        message: Utils.sanitizeHTML(document.getElementById('message').value.trim()),
        to_email: 'info@mcharvtechlabs.com',
        timestamp: new Date().toISOString()
      };

      try {
        if (typeof emailjs !== 'undefined') {
          emailjs.init(CONFIG.emailJS.publicKey);
          await emailjs.send(CONFIG.emailJS.serviceId, CONFIG.emailJS.templateId, formData);

          formRateLimiter.recordAttempt();
          Notification.show('Thank you! Your message has been sent successfully.', 'success');
          form.reset();
          form.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('success', 'error');
          });

          if (formStatus) {
            formStatus.className = 'form-status success';
            formStatus.textContent = 'Message sent! We\'ll get back to you soon.';
          }
        } else {
          throw new Error('EmailJS not loaded');
        }
      } catch (error) {
        console.error('Form error:', error);
        Notification.show('Something went wrong. Please email us directly.', 'error');
        if (formStatus) {
          formStatus.className = 'form-status error';
          formStatus.textContent = 'Failed. Please email info@mcharvtechlabs.com';
        }
      } finally {
        if (btnText) btnText.style.display = 'inline-flex';
        if (btnLoading) btnLoading.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  },

  initStatsCounter() {
    const statsSection = document.querySelector('.stats');
    if (!statsSection) return;

    const statNumbers = statsSection.querySelectorAll('.stat-number');
    let hasAnimated = false;

    const animateCounter = (element, target, duration = 2000) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        element.textContent = target + '+';
        return;
      }

      const startTime = performance.now();

      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        element.textContent = Math.floor(easeOutQuart * target) + '+';

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          element.textContent = target + '+';
        }
      };

      requestAnimationFrame(update);
    };

    const handleScroll = Utils.throttle(() => {
      if (hasAnimated) return;
      if (Utils.isInViewport(statsSection)) {
        hasAnimated = true;
        statNumbers.forEach(stat => {
          const target = parseInt(stat.getAttribute('data-count'), 10);
          if (!isNaN(target)) animateCounter(stat, target);
        });
      }
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  },

  initNewsletterForm() {
    const newsletterForm = document.querySelector('.footer-newsletter');
    if (!newsletterForm) return;

    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      
      if (emailInput && Utils.isValidEmail(emailInput.value)) {
        Notification.show('Thank you for subscribing!', 'success');
        emailInput.value = '';
      } else {
        Notification.show('Please enter a valid email address.', 'error');
      }
    });
  },

  initAccessibility() {
    document.body.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') document.body.classList.add('keyboard-nav');
    });

    document.body.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });
  },

  initDynamicYear() {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  },

  initParallax() {
    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    window.addEventListener('scroll', Utils.throttle(() => {
      if (window.scrollY < window.innerHeight) {
        heroBg.style.transform = `translateY(${window.scrollY * 0.3}px)`;
      }
    }, 16), { passive: true });
  }
};

// ========== Initialize ==========
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// ========== Error Handling ==========
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
});
