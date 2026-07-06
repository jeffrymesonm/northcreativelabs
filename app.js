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

/* ============================================================
   CONFIGURACIÓN DE SUPABASE  ←  EDITA SOLO ESTE BLOQUE
   ------------------------------------------------------------
   Project Settings → API, en tu proyecto Supabase:
     - url: "Project URL"
     - anonKey: "anon public" key (o "publishable" key nueva)
   ============================================================ */
const SUPABASE_CONFIG = {
    url: 'https://hmzjubswhwlkciwltyju.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtemp1YnN3aHdsa2Npd2x0eWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNzg5MTQsImV4cCI6MjA5ODg1NDkxNH0.8bCWhb684KGqK3Mf71QRcK2z14f85EEjSVgHBH4Bhpk'
};

const supabaseClient = (window.supabase && SUPABASE_CONFIG.anonKey.indexOf('PEGA_AQUI') === -1)
    ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
    : null;

if (!supabaseClient) {
    console.warn('Supabase no está configurado: pega tu anon/publishable key en SUPABASE_CONFIG (app.js). Mientras tanto, los leads no se guardarán en la base de datos.');
}

// El id del lead viaja en memoria y en sessionStorage (por si el usuario
// recarga la página entre el Paso 1 y el Paso 2 dentro de la misma sesión).
let currentLeadId = null;

/**
 * Devuelve el id del lead actual (memoria o sessionStorage como respaldo).
 * @returns {string|null} id del lead o null si aún no se ha creado.
 */
function getLeadId() {
    if (currentLeadId) return currentLeadId;
    try { return sessionStorage.getItem('ncl_lead_id'); } catch (e) { return null; }
}

/**
 * Guarda el id del lead recién creado en memoria y sessionStorage.
 * @param {string} id - UUID generado en el navegador para el nuevo lead.
 */
function setLeadId(id) {
    currentLeadId = id;
    try { sessionStorage.setItem('ncl_lead_id', id); } catch (e) { /* almacenamiento no disponible */ }
}

/**
 * Crea el lead en Supabase con los datos del Paso 1. El id lo genera el
 * propio navegador (no se le pide a la base de datos ni se lee de vuelta),
 * así el cliente público nunca necesita permiso de lectura sobre la tabla.
 * Es "best effort": si falla, el usuario sigue su camino por WhatsApp/email
 * igual, para no afectar la conversión del formulario.
 * @param {string} id - UUID del nuevo lead.
 * @param {Object} data - {name, typeValue, budgetValue, needs, contact}.
 */
async function saveLeadStep1(id, data) {
    if (!supabaseClient) return;
    try {
        await supabaseClient.from('leads').insert({
            id,
            name: data.name,
            project_type: data.typeValue,
            budget: data.budgetValue,
            needs: data.needs,
            contact_info: data.contact,
            locale: currentLang()
        });
    } catch (err) {
        console.error('No se pudo guardar el lead en Supabase:', err);
    }
}

/**
 * Actualiza el lead ya existente con la información del Paso 2 (o solo con
 * step2_status: 'skipped' si el usuario decide completarlo más tarde).
 * Nunca crea un lead nuevo: siempre actualiza por id. También "best effort".
 *
 * Va vía RPC (update_lead_step2) y no vía UPDATE directo: PostgREST exige
 * privilegio SELECT para poder ejecutar cualquier UPDATE (incluso sin pedir
 * los datos de vuelta), y la key pública nunca debe poder leer la tabla.
 * @param {string} id - UUID del lead a actualizar.
 * @param {Object} patch - Columnas a actualizar (nombres = columnas de la tabla).
 */
async function updateLeadStep2(id, patch) {
    if (!supabaseClient || !id) return;
    try {
        await supabaseClient.rpc('update_lead_step2', {
            p_lead_id: id,
            p_business_name: patch.business_name ?? null,
            p_business_description: patch.business_description ?? null,
            p_has_website: patch.has_website ?? null,
            p_website_url: patch.website_url ?? null,
            p_goals: patch.goals ?? null,
            p_goals_other: patch.goals_other ?? null,
            p_features: patch.features ?? null,
            p_features_other: patch.features_other ?? null,
            p_existing_content: patch.existing_content ?? null,
            p_design_reference_url: patch.design_reference_url ?? null,
            p_design_style: patch.design_style ?? null,
            p_seo_location: patch.seo_location ?? null,
            p_seo_main_service: patch.seo_main_service ?? null,
            p_additional_info: patch.additional_info ?? null,
            p_step2_status: patch.step2_status ?? null
        });
    } catch (err) {
        console.error('No se pudo actualizar el lead en Supabase:', err);
    }
}

/**
 * Recolecta los valores marcados de un grupo de checkboxes por su atributo name.
 * @param {string} name - Atributo name compartido por el grupo de checkboxes.
 * @returns {string[]} Valores marcados (vacío si ninguno está marcado).
 */
function getCheckedValues(name) {
    return Array.from(document.querySelectorAll('input[name="' + name + '"]:checked')).map(el => el.value);
}

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
 * Revela un panel del formulario con una transición suave de opacidad y
 * desplazamiento vertical (quita 'hidden' y anima en el siguiente frame).
 * @param {HTMLElement} el - Panel a mostrar.
 */
function revealPanel(el) {
    if (!el) return;
    el.classList.remove('hidden');
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    });
}

/**
 * Cambia el estado visible del formulario de 2 pasos (uno de:
 * 'step1' | 'transition' | 'step2' | 'success'), incluyendo la barra de
 * progreso, que solo se muestra durante los pasos 1 y 2.
 * @param {string} state - Estado a mostrar.
 */
function showFormState(state) {
    const progress = document.getElementById('formProgress');
    const progressFill = document.getElementById('progressFill');
    const progressLabel = document.getElementById('progressLabel');
    const panels = {
        step1: document.getElementById('leadForm'),
        transition: document.getElementById('transitionScreen'),
        step2: document.getElementById('step2Form'),
        success: document.getElementById('formSuccess')
    };
    const dict = translations[currentLang()] || {};

    Object.values(panels).forEach(el => { if (el) el.classList.add('hidden'); });
    revealPanel(panels[state]);

    // El panel que se muestra puede tener una altura muy distinta al anterior
    // (el Paso 2 es largo, la transición y el éxito son cortos). Sin esto, el
    // usuario podría quedar viendo una sección totalmente distinta de la
    // página tras el cambio de layout.
    const heroForm = document.getElementById('hero-form');
    if (heroForm) heroForm.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (state === 'step1' || state === 'step2') {
        const key = state === 'step2' ? 'progress_step2' : 'progress_step1';
        if (progress) progress.classList.remove('hidden');
        if (progressFill) progressFill.classList.toggle('step-2', state === 'step2');
        if (progressLabel) {
            progressLabel.setAttribute('data-i18n', key);
            progressLabel.textContent = dict[key] || (state === 'step2' ? 'Paso 2 de 2' : 'Paso 1 de 2');
        }
    } else if (progress) {
        progress.classList.add('hidden');
    }
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

    // ── Paso 1: WhatsApp (principal) + email (alternativa) + guardado en Supabase ──
    const form = document.getElementById('leadForm');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Recoger valores. En los <select> tomamos el texto visible (ya traducido)
            // para el mensaje de WhatsApp/email, y el value crudo para la base de datos.
            const typeSelect = document.getElementById('project-type');
            const budgetSelect = document.getElementById('budget');
            const data = {
                name: document.getElementById('name').value.trim(),
                type: typeSelect.options[typeSelect.selectedIndex].text,
                typeValue: typeSelect.value,
                budget: budgetSelect.value ? budgetSelect.options[budgetSelect.selectedIndex].text : '—',
                budgetValue: budgetSelect.value || null,
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

            // Conectar los botones de respaldo (WhatsApp/email) del cierre final
            const waBtn = document.getElementById('successWhatsapp');
            const mailBtn = document.getElementById('successEmail');
            if (waBtn) waBtn.setAttribute('href', waUrl);
            if (mailBtn) mailBtn.setAttribute('href', mailUrl);

            // Estado de carga breve y luego intento de apertura de WhatsApp
            const btn = form.querySelector('button[type="submit"]');
            const sendingText = dict.form_sending || 'Enviando...';
            btn.textContent = sendingText;
            btn.disabled = true;

            // Crear el lead ya mismo (id generado en el navegador) para no perderlo
            // aunque el usuario abandone después. Guardado en Supabase es best-effort:
            // nunca bloquea ni condiciona el resto del flujo de conversión.
            const leadId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(16).slice(2));
            setLeadId(leadId);
            saveLeadStep1(leadId, data);

            // Abrir WhatsApp dentro del gesto del usuario (evita bloqueo de popups)
            window.open(waUrl, '_blank');

            setTimeout(() => showFormState('transition'), 400);
        });
    }

    // ── Transición Paso 1 → Paso 2 ──
    const continueBtn = document.getElementById('continueToStep2');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => showFormState('step2'));
    }

    const skipBtn = document.getElementById('skipStep2');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            const id = getLeadId();
            if (id) updateLeadStep2(id, { step2_status: 'skipped' });
            showFormState('success');
        });
    }

    // ── Paso 2: información adicional para preparar la propuesta ──
    // Campos condicionales: URL del sitio actual y aclaración de "Otro"
    document.querySelectorAll('input[name="has_website"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const field = document.getElementById('websiteUrlField');
            if (field) field.classList.toggle('show', radio.value === 'yes' && radio.checked);
        });
    });

    const goalOtherCheckbox = document.getElementById('goalOtherCheckbox');
    const goalOtherField = document.getElementById('goalOtherField');
    if (goalOtherCheckbox && goalOtherField) {
        goalOtherCheckbox.addEventListener('change', () => goalOtherField.classList.toggle('show', goalOtherCheckbox.checked));
    }

    const featureOtherCheckbox = document.getElementById('featureOtherCheckbox');
    const featureOtherField = document.getElementById('featureOtherField');
    if (featureOtherCheckbox && featureOtherField) {
        featureOtherCheckbox.addEventListener('change', () => featureOtherField.classList.toggle('show', featureOtherCheckbox.checked));
    }

    const step2Form = document.getElementById('step2Form');
    if (step2Form) {
        step2Form.addEventListener('submit', (e) => {
            e.preventDefault();

            const id = getLeadId();
            const hasWebsiteChecked = document.querySelector('input[name="has_website"]:checked');
            const patch = {
                business_name: document.getElementById('business-name').value.trim(),
                business_description: document.getElementById('business-desc').value.trim(),
                has_website: hasWebsiteChecked ? hasWebsiteChecked.value === 'yes' : null,
                website_url: document.getElementById('website-url').value.trim() || null,
                goals: getCheckedValues('goals'),
                goals_other: document.getElementById('goal-other-text').value.trim() || null,
                features: getCheckedValues('features'),
                features_other: document.getElementById('feature-other-text').value.trim() || null,
                existing_content: getCheckedValues('existing_content'),
                design_reference_url: document.getElementById('design-ref').value.trim() || null,
                design_style: document.getElementById('design-style').value.trim() || null,
                seo_location: document.getElementById('seo-location').value.trim() || null,
                seo_main_service: document.getElementById('seo-service').value.trim() || null,
                additional_info: document.getElementById('additional-info').value.trim() || null,
                step2_status: 'completed',
                step2_completed_at: new Date().toISOString()
            };

            const dict = translations[currentLang()] || {};
            const step2Btn = step2Form.querySelector('button[type="submit"]');
            if (step2Btn) {
                step2Btn.textContent = dict.form_sending || 'Enviando...';
                step2Btn.disabled = true;
            }

            if (id) updateLeadStep2(id, patch);
            showFormState('success');
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
