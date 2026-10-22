/* ═══════════════════════════════════════════════════════════
   auth.js – Auth page logic (canvas bg, captcha, forms)
   ═══════════════════════════════════════════════════════════ */

const API_BASE = '/api';

// ── Animated canvas background ────────────────────────────────
function initAuthCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Particles (nodes of the polygon mesh)
    const NODES = 60;
    const nodes = Array.from({ length: NODES }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connecting lines
        for (let i = 0; i < NODES; i++) {
            for (let j = i + 1; j < NODES; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 160) {
                    const alpha = (1 - dist / 160) * 0.25;
                    ctx.strokeStyle = `rgba(0, 240, 200, ${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw nodes
        nodes.forEach((n) => {
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 220, 200, 0.6)';
            ctx.fill();

            // Update position
            n.x += n.vx;
            n.y += n.vy;
            if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
            if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        });

        // Floating financial numbers
        requestAnimationFrame(draw);
    }
    draw();

    // Floating number overlay (matches original site)
    const numbers = ['+45.12', '48,900', '36,900', '+40.66', '+0.936402', '-54.62', '-23%', '-5134', '400.05146', '-4871.81'];
    const numElements = [];
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;overflow:hidden;';
    document.body.appendChild(overlay);

    numbers.forEach((num, i) => {
        const el = document.createElement('div');
        el.textContent = num;
        const isPositive = num.includes('+');
        el.style.cssText = `
      position: absolute;
      color: ${isPositive ? 'rgba(0,230,118,0.35)' : 'rgba(255,100,100,0.3)'};
      font-size: ${Math.random() * 6 + 10}px;
      font-family: monospace;
      left: ${Math.random() * 90}%;
      top: ${Math.random() * 90}%;
      animation: float-num ${6 + Math.random() * 6}s ease-in-out ${Math.random() * 4}s infinite alternate;
      user-select: none;
    `;
        overlay.appendChild(el);
    });

    // Add float animation
    if (!document.getElementById('auth-num-style')) {
        const style = document.createElement('style');
        style.id = 'auth-num-style';
        style.textContent = `
      @keyframes float-num {
        from { transform: translateY(0) rotate(0deg); opacity: 0.3; }
        to   { transform: translateY(-20px) rotate(3deg); opacity: 0.6; }
      }
    `;
        document.head.appendChild(style);
    }
}

// ── Captcha Loader ────────────────────────────────────────────
function loadCaptcha(imgId, refreshBtnId, sessionKey) {
    const img = document.getElementById(imgId);
    const btn = document.getElementById(refreshBtnId);
    if (!img || !btn) return;

    const fetchCaptcha = async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/captcha`);
            const data = await res.json();
            if (data.success) {
                img.src = data.captchaImage;
                window[sessionKey] = data.sessionId;
            }
        } catch (e) {
            // Fallback: generate client-side captcha if API is not available
            generateFallbackCaptcha(imgId, sessionKey);
        }
    };

    fetchCaptcha();
    btn.addEventListener('click', () => {
        btn.style.transform = 'rotate(360deg)';
        setTimeout(() => { btn.style.transform = ''; }, 300);
        fetchCaptcha();
    });
}

// Client-side fallback captcha (used when backend is not running)
function generateFallbackCaptcha(imgId, sessionKey) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    window[sessionKey] = 'fallback:' + code;

    const canvas = document.createElement('canvas');
    canvas.width = 160; canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(0, 0, 160, 50);

    // Noise lines
    for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = `rgba(100,120,160,0.3)`;
        ctx.beginPath();
        ctx.moveTo(Math.random() * 160, Math.random() * 50);
        ctx.lineTo(Math.random() * 160, Math.random() * 50);
        ctx.stroke();
    }

    // Letters
    const colors = ['#1a7fd4', '#2baee0', '#0e5ca0', '#14527a'];
    code.split('').forEach((ch, i) => {
        ctx.save();
        ctx.font = `bold ${22 + Math.random() * 4}px Arial`;
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        const x = 12 + i * 24 + (Math.random() * 4 - 2);
        const y = 32 + (Math.random() * 6 - 3);
        ctx.translate(x, y);
        ctx.rotate((Math.random() * 20 - 10) * Math.PI / 180);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
    });

    document.getElementById(imgId).src = canvas.toDataURL();
}

// ── Password Toggle ───────────────────────────────────────────
function setupPasswordToggle(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (!input || !btn) return;
    btn.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.textContent = isPassword ? '🙈' : '👁️';
    });
}

// ── Sponsor ID Lookup ─────────────────────────────────────────
function setupSponsorLookup(sponsorIdId, sponsorNameId) {
    const sponsorIdInput = document.getElementById(sponsorIdId);
    const sponsorNameInput = document.getElementById(sponsorNameId);
    if (!sponsorIdInput || !sponsorNameInput) return;

    let debounce;
    sponsorIdInput.addEventListener('input', () => {
        clearTimeout(debounce);
        const val = sponsorIdInput.value.trim();
        if (!val) { sponsorNameInput.value = ''; return; }

        debounce = setTimeout(async () => {
            if (val.toUpperCase() === 'ADMIN') {
                sponsorNameInput.value = 'Admin';
                return;
            }
            try {
                // In a real implementation this would call the API
                // For now, show a placeholder
                sponsorNameInput.value = 'Looking up...';
                const res = await fetch(`${API_BASE}/user/lookup?userId=${encodeURIComponent(val)}`);
                if (res.ok) {
                    const data = await res.json();
                    sponsorNameInput.value = data.data?.name || 'Not Found';
                } else {
                    sponsorNameInput.value = 'Not Found';
                }
            } catch {
                sponsorNameInput.value = '';
            }
        }, 600);
    });
}

// ── Alert Helper ──────────────────────────────────────────────
function showAlert(alertId, message, type = 'error') {
    const el = document.getElementById(alertId);
    if (!el) return;
    el.textContent = message;
    el.className = `alert alert-${type} show`;
    setTimeout(() => { el.classList.remove('show'); }, 5000);
}

// ── Set loading state ─────────────────────────────────────────
function setLoading(btnId, spinnerId, textId, loading) {
    const btn = document.getElementById(btnId);
    const spinner = document.getElementById(spinnerId);
    const text = document.getElementById(textId);
    if (!btn) return;
    btn.disabled = loading;
    if (spinner) spinner.classList.toggle('show', loading);
    if (text) text.style.opacity = loading ? '0.5' : '1';
}

// ── Store JWT ─────────────────────────────────────────────────
function saveToken(token) {
    localStorage.setItem('nb_token', token);
}
function getToken() {
    return localStorage.getItem('nb_token');
}
function clearToken() {
    localStorage.removeItem('nb_token');
    localStorage.removeItem('nb_user');
}

// ── Login Form Handler ────────────────────────────────────────
function setupLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('login-userid')?.value.trim();
        const password = document.getElementById('login-password')?.value;
        const captchaCode = document.getElementById('login-captcha-input')?.value.trim();
        const captchaSessionId = window['login-captcha-session'];

        if (!userId || !password || !captchaCode) {
            showAlert('login-alert', 'Please fill in all fields.', 'error');
            return;
        }

        setLoading('login-btn', 'login-spinner', 'login-btn-text', true);

        try {
            let success = false;

            // Handle fallback captcha (when backend is not running)
            if (captchaSessionId && captchaSessionId.startsWith('fallback:')) {
                const expectedCode = captchaSessionId.split(':')[1];
                if (captchaCode.toLowerCase() !== expectedCode.toLowerCase()) {
                    showAlert('login-alert', 'Invalid captcha. Please try again.', 'error');
                    loadCaptcha('login-captcha-img', 'login-captcha-refresh', 'login-captcha-session');
                    return;
                }
                // Try API anyway for real login
            }

            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password, captchaCode, captchaSessionId }),
            });

            const data = await res.json();

            if (data.success) {
                saveToken(data.token);
                localStorage.setItem('nb_user', JSON.stringify(data.data?.user));
                showAlert('login-alert', 'Login successful! Redirecting...', 'success');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
            } else {
                showAlert('login-alert', data.message || 'Login failed. Please try again.', 'error');
                loadCaptcha('login-captcha-img', 'login-captcha-refresh', 'login-captcha-session');
            }
        } catch (err) {
            showAlert('login-alert', 'Cannot connect to server. Please ensure the backend is running.', 'error');
        } finally {
            setLoading('login-btn', 'login-spinner', 'login-btn-text', false);
        }
    });
}

// ── Register Form Handler ─────────────────────────────────────
function setupRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const sponsorId = document.getElementById('reg-sponsor-id')?.value.trim();
        const sponsorName = document.getElementById('reg-sponsor-name')?.value.trim();
        const name = document.getElementById('reg-name')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim();
        const mobile = document.getElementById('reg-mobile')?.value.trim();
        const password = document.getElementById('reg-password')?.value;
        const confirmPassword = document.getElementById('reg-confirm-password')?.value;
        const captchaCode = document.getElementById('reg-captcha-input')?.value.trim();
        const captchaSessionId = window['reg-captcha-session'];
        const terms = document.getElementById('reg-terms')?.checked;

        if (!name || !email || !mobile || !password || !confirmPassword || !captchaCode) {
            showAlert('register-alert', 'Please fill in all required fields.', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showAlert('register-alert', 'Passwords do not match.', 'error');
            return;
        }
        if (password.length < 6) {
            showAlert('register-alert', 'Password must be at least 6 characters.', 'error');
            return;
        }
        if (!terms) {
            showAlert('register-alert', 'You must agree to the Terms & Conditions.', 'error');
            return;
        }

        // Handle fallback captcha
        if (captchaSessionId && captchaSessionId.startsWith('fallback:')) {
            const expectedCode = captchaSessionId.split(':')[1];
            if (captchaCode.toLowerCase() !== expectedCode.toLowerCase()) {
                showAlert('register-alert', 'Invalid captcha. Please try again.', 'error');
                loadCaptcha('reg-captcha-img', 'reg-captcha-refresh', 'reg-captcha-session');
                return;
            }
        }

        setLoading('register-btn', 'register-spinner', 'register-btn-text', true);

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sponsorId, sponsorName, name, email, mobile, password, confirmPassword, captchaCode, captchaSessionId }),
            });

            const data = await res.json();

            if (data.success) {
                saveToken(data.token);
                localStorage.setItem('nb_user', JSON.stringify(data.data?.user));
                showAlert('register-alert', 'Account created successfully! Redirecting to dashboard...', 'success');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
            } else {
                showAlert('register-alert', data.message || 'Registration failed. Please try again.', 'error');
                loadCaptcha('reg-captcha-img', 'reg-captcha-refresh', 'reg-captcha-session');
            }
        } catch (err) {
            showAlert('register-alert', 'Cannot connect to server. Please ensure the backend is running.', 'error');
        } finally {
            setLoading('register-btn', 'register-spinner', 'register-btn-text', false);
        }
    });
}
