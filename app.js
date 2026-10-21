(() => {
  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const main = document.querySelector('main');
  const footer = document.querySelector('.site-footer');
  const desktopSolutions = document.querySelector('.desktop-nav .solutions-menu');
  let lastFocused = null;

  if (mobileMenu) mobileMenu.setAttribute('aria-hidden', 'true');

  const focusable = (container) => [...container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((element) => !element.hidden && element.offsetParent !== null);

  const setMenu = (open) => {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    body.classList.toggle('menu-open', open);
    if ('inert' in HTMLElement.prototype) {
      if (main) main.inert = open;
      if (footer) footer.inert = open;
    }
    if (open) {
      lastFocused = document.activeElement;
      requestAnimationFrame(() => focusable(mobileMenu)[0]?.focus());
    } else if (lastFocused instanceof HTMLElement) {
      lastFocused.focus();
    }
  };

  menuButton?.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  mobileMenu?.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 920 && menuButton?.getAttribute('aria-expanded') === 'true') setMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (menuButton?.getAttribute('aria-expanded') === 'true') setMenu(false);
      if (desktopSolutions?.open) desktopSolutions.open = false;
    }
    if (event.key === 'Tab' && mobileMenu?.classList.contains('is-open')) {
      const items = focusable(mobileMenu);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  document.addEventListener('click', (event) => {
    if (desktopSolutions?.open && !desktopSolutions.contains(event.target)) {
      desktopSolutions.open = false;
    }
  });

  const backToTop = document.querySelector('.back-to-top');
  const updateScrollUi = () => {
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 16);
    backToTop?.classList.toggle('is-visible', y > Math.max(520, window.innerHeight * .65));
  };
  updateScrollUi();
  window.addEventListener('scroll', updateScrollUi, { passive: true });
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });

  const heroImage = document.querySelector('.home-hero__image');
  let heroFrame = 0;
  const updateHero = () => {
    heroFrame = 0;
    if (!heroImage || reducedMotion.matches) return;
    const bounds = heroImage.getBoundingClientRect();
    const progress = Math.max(-1, Math.min(1, (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height)));
    heroImage.style.setProperty('--hero-shift', `${Math.round((progress - .5) * 14)}px`);
  };
  const requestHero = () => {
    if (!heroFrame) heroFrame = requestAnimationFrame(updateHero);
  };
  if (heroImage) {
    updateHero();
    window.addEventListener('scroll', requestHero, { passive: true });
    window.addEventListener('resize', requestHero);
  }

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealItems.length && !reducedMotion.matches) {
    body.classList.add('reveal-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const tabs = [...document.querySelectorAll('.sector-tab')];
  const panel = document.querySelector('.sector-panel');
  const panelIndex = panel?.querySelector('.sector-panel__index');
  const panelTitle = panel?.querySelector('h3');
  const panelCopy = panel?.querySelector('.sector-panel__copy > p');
  const panelNeed = panel?.querySelector('.sector-panel__aside strong');

  const activateTab = (tab, focus = false) => {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    if (panel) {
      panelIndex.textContent = `${tab.dataset.number} / Industry application`;
      panelTitle.textContent = tab.dataset.title;
      panelCopy.textContent = tab.dataset.copy;
      panelNeed.textContent = tab.dataset.need;
    }
    if (focus) tab.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else next = (index - 1 + tabs.length) % tabs.length;
      activateTab(tabs[next], true);
    });
  });

  const form = document.querySelector('[data-enquiry-form]');
  if (form) {
    form.noValidate = true;
    const fields = [...form.querySelectorAll('input, select, textarea')];
    const showError = (field) => {
      const error = form.querySelector(`#${field.id}-error`);
      if (!error) return;
      let message = '';
      if (field.validity.valueMissing) message = 'Please complete this field.';
      else if (field.validity.typeMismatch) message = 'Please enter a valid email address.';
      field.setAttribute('aria-invalid', String(Boolean(message)));
      error.textContent = message;
    };
    fields.forEach((field) => {
      field.addEventListener('blur', () => showError(field));
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') showError(field);
      });
      field.addEventListener('change', () => {
        if (field.getAttribute('aria-invalid') === 'true') showError(field);
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      fields.forEach(showError);
      const firstInvalid = fields.find((field) => !field.validity.valid);
      const status = form.querySelector('.form-status');
      if (firstInvalid) {
        if (status) status.textContent = 'Please review the highlighted fields.';
        firstInvalid.focus();
        return;
      }
      if (status) {
        status.textContent = form.dataset.successMessage || 'This form is ready for a secure submission service. No information has been sent.';
      }
    });
  }

  reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches) heroImage?.style.removeProperty('--hero-shift');
  });
})();
