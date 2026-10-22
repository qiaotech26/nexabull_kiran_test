/* ═══════════════════════════════════════════════════════════
   main.js – Homepage interactions
   ═══════════════════════════════════════════════════════════ */

// ── Mobile Nav Toggle ─────────────────────────────────────────
(function () {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
        links.classList.toggle('open');
    });

    // Close on link click
    links.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => links.classList.remove('open'));
    });
})();

// ── Navbar scroll shrink ──────────────────────────────────────
(function () {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            navbar.style.borderBottomColor = 'rgba(0,240,255,0.15)';
        } else {
            navbar.style.borderBottomColor = 'rgba(0,240,255,0.08)';
        }
    });
})();

// ── Active nav link on scroll ─────────────────────────────────
(function () {
    const sections = document.querySelectorAll('section[id], div[id="distribution"]');
    const navLinks = document.querySelectorAll('.nav-links a');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    navLinks.forEach((link) => {
                        link.style.color = link.getAttribute('href') === `#${entry.target.id}`
                            ? 'var(--text-white)'
                            : '';
                    });
                }
            });
        },
        { threshold: 0.4 }
    );

    sections.forEach((s) => observer.observe(s));
})();

// ── Back To Top ───────────────────────────────────────────────
(function () {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

// ── Number Counter Animation ──────────────────────────────────
(function () {
    const statNums = document.querySelectorAll('.stat-number[data-target]');
    if (!statNums.length) return;

    const animateNumber = (el) => {
        const target = parseInt(el.dataset.target);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const start = performance.now();

        const tick = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);
            el.textContent = prefix + current.toLocaleString() + suffix;
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateNumber(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );

    statNums.forEach((el) => observer.observe(el));
})();

// ── FAQ Accordion ─────────────────────────────────────────────
(function () {
    document.querySelectorAll('.faq-question').forEach((q) => {
        q.addEventListener('click', () => {
            const item = q.closest('.faq-item');
            const isOpen = item.classList.contains('open');

            // Close all
            document.querySelectorAll('.faq-item.open').forEach((i) => i.classList.remove('open'));

            // Open clicked (if it was closed)
            if (!isOpen) item.classList.add('open');
        });
    });
})();

// ── Contact Form ──────────────────────────────────────────────
(function () {
    const form = document.getElementById('contact-form');
    const alertEl = document.getElementById('contact-alert');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('contact-btn');
        btn.disabled = true;
        btn.innerHTML = '<span>⌛</span> Sending...';

        // Simulate send (replace with real API call)
        await new Promise((r) => setTimeout(r, 1200));

        if (alertEl) {
            alertEl.textContent = '✅ Message sent! We\'ll get back to you within 24 hours.';
            alertEl.className = 'alert alert-success show';
            setTimeout(() => alertEl.classList.remove('show'), 5000);
        }
        form.reset();
        btn.disabled = false;
        btn.innerHTML = '<span>📤</span> Send Message';
    });
})();

// ── Donut Chart (Token Distribution) ─────────────────────────
(function () {
    const svg = document.getElementById('dist-chart');
    if (!svg) return;

    const slices = [
        { pct: 40, color: '#00f0ff', label: 'Community' },
        { pct: 25, color: '#f0c850', label: 'Public Sale' },
        { pct: 15, color: '#7c4dff', label: 'Team' },
        { pct: 12, color: '#00e676', label: 'Reserve' },
        { pct: 8, color: '#ff6d00', label: 'Marketing' },
    ];

    const cx = 100, cy = 100, R = 80, r = 50;
    let startAngle = -Math.PI / 2;

    slices.forEach((slice) => {
        const angle = (slice.pct / 100) * 2 * Math.PI;
        const endAngle = startAngle + angle;

        const x1 = cx + R * Math.cos(startAngle);
        const y1 = cy + R * Math.sin(startAngle);
        const x2 = cx + R * Math.cos(endAngle);
        const y2 = cy + R * Math.sin(endAngle);
        const ix1 = cx + r * Math.cos(endAngle);
        const iy1 = cy + r * Math.sin(endAngle);
        const ix2 = cx + r * Math.cos(startAngle);
        const iy2 = cy + r * Math.sin(startAngle);
        const large = angle > Math.PI ? 1 : 0;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${r} ${r} 0 ${large} 0 ${ix2} ${iy2} Z`);
        path.setAttribute('fill', slice.color);
        path.setAttribute('opacity', '0.9');
        path.style.transition = 'opacity 0.3s, transform 0.3s';
        path.style.transformOrigin = `${cx}px ${cy}px`;

        path.addEventListener('mouseenter', () => {
            path.style.opacity = '1';
            path.style.transform = 'scale(1.04)';
        });
        path.addEventListener('mouseleave', () => {
            path.style.opacity = '0.9';
            path.style.transform = 'scale(1)';
        });

        svg.appendChild(path);
        startAngle = endAngle;
    });

    // Center label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', cx);
    text.setAttribute('y', cy - 8);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#f0c850');
    text.setAttribute('font-size', '14');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('font-family', 'Inter, sans-serif');
    text.textContent = 'NBull';
    svg.appendChild(text);

    const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sub.setAttribute('x', cx);
    sub.setAttribute('y', cy + 10);
    sub.setAttribute('text-anchor', 'middle');
    sub.setAttribute('fill', '#8a99ad');
    sub.setAttribute('font-size', '10');
    sub.setAttribute('font-family', 'Inter, sans-serif');
    sub.textContent = 'Token';
    svg.appendChild(sub);
})();

// ── Live Crypto Price Ticker ──────────────────────────────────
(function () {
    const btcEl = document.getElementById('btc-price');
    const ethEl = document.getElementById('eth-change');
    if (!btcEl && !ethEl) return;

    // Simulate live price fluctuation
    let btcBase = 67420;
    let ethChange = 4.8;

    setInterval(() => {
        btcBase += (Math.random() - 0.5) * 200;
        ethChange += (Math.random() - 0.5) * 0.3;
        ethChange = Math.max(-10, Math.min(15, ethChange));

        if (btcEl) btcEl.textContent = '$' + Math.round(btcBase).toLocaleString();
        if (ethEl) {
            const sign = ethChange >= 0 ? '+' : '';
            ethEl.textContent = sign + ethChange.toFixed(1) + '%';
            ethEl.style.color = ethChange >= 0 ? '#00e676' : '#ff6b6b';
        }
    }, 3000);
})();

// ── Smooth scroll for anchor links ───────────────────────────
document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ── Scroll-reveal animation ───────────────────────────────────
(function () {
    const style = document.createElement('style');
    style.textContent = `
    .reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .reveal.visible { opacity: 1; transform: translateY(0); }
  `;
    document.head.appendChild(style);

    const revealEls = document.querySelectorAll('.feature-card, .about-stat-card, .roadmap-item, .faq-item, .contact-card');
    revealEls.forEach((el) => el.classList.add('reveal'));

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );
    revealEls.forEach((el) => observer.observe(el));
})();
