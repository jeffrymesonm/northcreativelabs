/**
 * app.js
 * Lógica del sitio North Creative Labs:
 *  - Internacionalización (es/en/de) con persistencia en localStorage.
 *  - Conmutador de tema claro/oscuro con persistencia en localStorage.
 *  - Menú móvil (hamburguesa).
 *  - Acordeón de preguntas frecuentes (FAQ).
 *  - Envío del formulario de cotización vía WhatsApp (deep link) y email (mailto).
 *  - Cableado de los enlaces de contacto (WhatsApp flotante, footer, CTA).
 *  - Animaciones de aparición al hacer scroll y scroll suave.
 */

/* ============================================================
   CONFIGURACIÓN DE CONTACTO  ←  EDITA SOLO ESTE BLOQUE
   ------------------------------------------------------------
   Reemplaza estos 3 valores por los reales y todo el sitio
   (formulario, botón flotante, footer y CTA) quedará conectado.
   ============================================================ */
const CONTACT = {
    whatsapp: '18297129741',                              // Tu WhatsApp con código de país, SOLO dígitos. Ej: 18095551234
    email: 'hola@northcreativelabs.com',                  // Tu email real
    instagram: 'https://instagram.com/northcreativelabs'  // URL completa de tu Instagram
};

/**
 * Aplica un idioma a toda la página.
 * Reemplaza el texto de los elementos con data-i18n, los placeholders con
 * data-i18n-ph y el título del documento. Persiste la elección en localStorage.
 * @param {string} lang - Código de idioma ('es' | 'en' | 'de').
 */
function applyLanguage(lang) {
    const dict = (typeof translations !== 'undefined') ? translations[lang] : null;
    if (!dict) return;

    // Textos (textContent) y bloques con HTML embebido (data-i18n-html)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const value = dict[el.getAttribute('data-i18n')];
        if (value == null) return;
        if (el.hasAttribute('data-i18n-html')) {
            el.innerHTML = value;
        } else {
            el.textContent = value;
        }
    });

    // Placeholders de inputs
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const value = dict[el.getAttribute('data-i18n-ph')];
        if (value != null) el.setAttribute('placeholder', value);
    });

    // Metadatos del documento
    if (dict.doc_title) document.title = dict.doc_title;
    document.documentElement.lang = lang;

    // Estado activo del selector
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    try { localStorage.setItem('lang', lang); } catch (e) { /* almacenamiento no disponible */ }

    // El CTA de WhatsApp incluye un saludo traducido, hay que recalcularlo al cambiar idioma
    wireContactLinks();
}

/**
 * Devuelve el idioma actualmente activo en el documento.
 * @returns {string} Código de idioma ('es' | 'en' | 'de').
 */
function currentLang() {
    return document.documentElement.lang || 'es';
}

/**
 * Conecta los enlaces de contacto (botón flotante, footer y CTA) usando el
 * objeto CONTACT como única fuente de verdad. Idempotente: puede llamarse
 * cada vez que cambia el idioma sin efectos secundarios.
 */
function wireContactLinks() {
    const waBase = 'https://wa.me/' + CONTACT.whatsapp;
    const dict = (typeof translations !== 'undefined') ? translations[currentLang()] : {};
    const greeting = (dict && dict.msg_greeting) ? dict.msg_greeting : '';

    const setHref = (id, href) => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('href', href);
    };

    setHref('floatingWhatsapp', waBase);
    setHref('footerWhatsapp', waBase);
    setHref('footerEmail', 'mailto:' + CONTACT.email);
    setHref('footerInstagram', CONTACT.instagram);
    setHref('ctaWhatsapp', waBase + '?text=' + encodeURIComponent(greeting));
}

/**
 * Construye el cuerpo del mensaje de solicitud a partir de los campos del
 * formulario, usando las etiquetas traducidas del idioma activo.
 * @param {Object} data - Valores del formulario {name, type, budget, needs, contact}.
 * @returns {string} Mensaje legible listo para WhatsApp o email.
 */
function buildLeadMessage(data) {
    const d = (typeof translations !== 'undefined') ? translations[currentLang()] : {};
    const lines = [
        d.msg_greeting || 'Hola, quiero solicitar una cotización.',
        '',
        (d.msg_name || 'Nombre') + ': ' + data.name,
        (d.msg_type || 'Tipo de proyecto') + ': ' + data.type,
        (d.msg_budget || 'Presupuesto') + ': ' + data.budget,
        (d.msg_needs || 'Necesito') + ': ' + data.needs,
        (d.msg_contact || 'Mi contacto') + ': ' + data.contact
    ];
    return lines.join('\n');
}

/**
 * Valida que el dato de contacto sea un email plausible O un número de teléfono.
 * El campo acepta ambos formatos, así que se considera válido si cumple cualquiera.
 * @param {string} value - Texto introducido por el usuario.
 * @returns {boolean} true si parece un email o un teléfono válido.
 */
function isValidContact(value) {
    const v = (value || '').trim();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Teléfono: al menos 7 dígitos; se permiten +, espacios, guiones y paréntesis.
    const phoneRe = /^\+?[\d\s().-]{7,}$/;
    const digits = (v.match(/\d/g) || []).length;
    return emailRe.test(v) || (phoneRe.test(v) && digits >= 7);
}

/**
 * Aplica un tema de color a toda la página.
 * Fija data-theme en <html>, persiste la elección, sincroniza el color de la
 * barra del navegador (meta theme-color) y actualiza el icono del botón.
 * @param {string} theme - 'light' | 'dark'.
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) { /* almacenamiento no disponible */ }

    // Sincroniza el color de la barra del navegador con el fondo del tema.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#fafafa' : '#050505');

    // Muestra el icono de la acción disponible: sol en oscuro, luna en claro.
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.innerHTML = '<i data-lucide="' + (theme === 'light' ? 'moon' : 'sun') + '"></i>';
        if (window.lucide) lucide.createIcons();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // ── Tema: restaurar el valor ya aplicado por el script en línea del <head> ──
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyTheme(currentTheme);

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            applyTheme(next);
        });
    }

    // ── Idioma: restaurar preferencia guardada (o español por defecto) ──
    const savedLang = (() => {
        try { return localStorage.getItem('lang'); } catch (e) { return null; }
    })();
    applyLanguage(savedLang && translations[savedLang] ? savedLang : 'es');

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => applyLanguage(btn.getAttribute('data-lang')));
    });

    // ── Menú móvil (hamburguesa) ──
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    if (menuToggle && mobileMenu) {
        const closeMenu = () => {
            mobileMenu.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        };
        menuToggle.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('open');
            menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        // Cerrar el menú al pulsar cualquier enlace de su interior
        mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    }

    // ── Acordeón FAQ ──
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const item = question.closest('.faq-item');
            const isOpen = item.classList.toggle('open');
            question.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    });

    // ── Animaciones de aparición al hacer scroll ──
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                obs.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    document.querySelectorAll('.section, .service-card, .portfolio-item, .pricing-card, .testimonial-card')
        .forEach(sec => {
            sec.style.opacity = '0';
            sec.style.transform = 'translateY(30px)';
            sec.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(sec);
        });

    // ── Envío del formulario: WhatsApp (principal) + email (alternativa) ──
    const form = document.getElementById('leadForm');
    const successMsg = document.getElementById('formSuccess');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Recoger valores. En los <select> tomamos el texto visible (ya traducido).
            const typeSelect = document.getElementById('project-type');
            const budgetSelect = document.getElementById('budget');
            const data = {
                name: document.getElementById('name').value.trim(),
                type: typeSelect.options[typeSelect.selectedIndex].text,
                budget: budgetSelect.value ? budgetSelect.options[budgetSelect.selectedIndex].text : '—',
                needs: document.getElementById('needs').value.trim(),
                contact: document.getElementById('contact-info').value.trim()
            };

            // Validar el contacto: sin un email/teléfono válido no podríamos responder
            const contactInput = document.getElementById('contact-info');
            const contactError = document.getElementById('contact-error');
            if (!isValidContact(data.contact)) {
                if (contactError) contactError.classList.remove('hidden');
                contactInput.classList.add('input-error');
                contactInput.focus();
                return;
            }
            if (contactError) contactError.classList.add('hidden');
            contactInput.classList.remove('input-error');

            // Construir destinos de envío
            const message = buildLeadMessage(data);
            const waUrl = 'https://wa.me/' + CONTACT.whatsapp + '?text=' + encodeURIComponent(message);
            const dict = translations[currentLang()] || {};
            const subject = dict.email_subject || 'Nueva solicitud de cotización';
            const mailUrl = 'mailto:' + CONTACT.email +
                '?subject=' + encodeURIComponent(subject) +
                '&body=' + encodeURIComponent(message);

            // Conectar los botones del estado de éxito antes de mostrarlo
            const waBtn = document.getElementById('successWhatsapp');
            const mailBtn = document.getElementById('successEmail');
            if (waBtn) waBtn.setAttribute('href', waUrl);
            if (mailBtn) mailBtn.setAttribute('href', mailUrl);

            // Estado de carga breve y luego intento de apertura de WhatsApp
            const btn = form.querySelector('button[type="submit"]');
            const sendingText = dict.form_sending || 'Enviando...';
            btn.textContent = sendingText;
            btn.disabled = true;

            // Abrir WhatsApp dentro del gesto del usuario (evita bloqueo de popups)
            window.open(waUrl, '_blank');

            setTimeout(() => {
                form.classList.add('hidden');
                successMsg.classList.remove('hidden');
                successMsg.style.opacity = '0';
                successMsg.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    successMsg.style.transition = 'all 0.4s ease';
                    successMsg.style.opacity = '1';
                    successMsg.style.transform = 'scale(1)';
                }, 10);
            }, 400);
        });
    }

    // ── Scroll suave SOLO para enlaces internos (#seccion) ──
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            // Ignorar enlaces vacíos o que ya no son anclas (p. ej. wa.me/mailto inyectados)
            if (!href || href === '#' || !href.startsWith('#')) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const offset = 100;
            const elementPosition = target.getBoundingClientRect().top - document.body.getBoundingClientRect().top;
            window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
        });
    });

    // ── Limpiar el error de contacto en cuanto el usuario corrige ──
    const contactInput = document.getElementById('contact-info');
    const contactError = document.getElementById('contact-error');
    if (contactInput) {
        contactInput.addEventListener('input', () => {
            if (contactError) contactError.classList.add('hidden');
            contactInput.classList.remove('input-error');
        });
    }

    // ── Resaltar en el nav la sección visible actualmente ──
    const navLinks = document.querySelectorAll('.desktop-nav a');
    const spySections = ['services', 'portfolio', 'about', 'pricing', 'faq']
        .map(id => document.getElementById(id))
        .filter(Boolean);
    if (navLinks.length && spySections.length) {
        const navSpy = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                navLinks.forEach(a =>
                    a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
            });
        }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
        spySections.forEach(s => navSpy.observe(s));
    }

    // ── Barra CTA fija en móvil: se muestra al dejar atrás el hero ──
    const ctaBar = document.getElementById('mobileCtaBar');
    const heroSection = document.querySelector('.hero');
    if (ctaBar && heroSection) {
        const ctaSpy = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const pastHero = !entry.isIntersecting;
                ctaBar.classList.toggle('show', pastHero);
                document.body.classList.toggle('cta-bar-visible', pastHero);
            });
        }, { rootMargin: '-70px 0px 0px 0px', threshold: 0 });
        ctaSpy.observe(heroSection);
    }
});
