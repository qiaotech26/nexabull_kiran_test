/* ═══════════════════════════════════════════════════════════
   dashboard.js – Dashboard logic
   ═══════════════════════════════════════════════════════════ */

const API_BASE = '/api';

// ── Auth guard ────────────────────────────────────────────────
const token = localStorage.getItem('nb_token');
if (!token) {
    window.location.href = 'signin.html';
}

// ── Fetch with auth ────────────────────────────────────────────
async function authFetch(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });
}

// ── Panel switching ───────────────────────────────────────────
function switchPanel(panelName) {
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach((l) => l.classList.remove('active'));

    const panel = document.getElementById(`panel-${panelName}`);
    const link = document.getElementById(`nav-${panelName}`);
    const title = document.getElementById('topbar-title');

    if (panel) panel.classList.add('active');
    if (link) link.classList.add('active');

    const titles = {
        overview: 'Dashboard Overview',
        wallet: 'My Wallet',
        referrals: 'My Referrals',
        profile: 'My Profile',
        signals: 'Trading Signals',
        support: 'Help & Support',
    };
    if (title) title.textContent = titles[panelName] || 'Dashboard';

    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('open');
}

// Sidebar link click handlers
document.querySelectorAll('.sidebar-link[data-panel]').forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        switchPanel(link.dataset.panel);
    });
});

// Mobile sidebar toggle
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
}

// ── Load Dashboard Data ────────────────────────────────────────
let dashData = null;

async function loadDashboard() {
    try {
        const res = await authFetch(`${API_BASE}/user/dashboard`);
        const json = await res.json();

        if (!json.success) {
            // Token expired or invalid
            localStorage.clear();
            window.location.href = 'signin.html';
            return;
        }

        dashData = json.data;
        populateDashboard(dashData);
    } catch (err) {
        // If backend not running, load from localStorage
        const cached = localStorage.getItem('nb_user');
        if (cached) {
            populateDashboard(JSON.parse(cached));
        } else {
            showDashAlert('Could not connect to server. Running in offline mode.', 'error');
        }
    }
}

function populateDashboard(data) {
    const name = data.name || 'Trader';
    const userId = data.userId || '—';
    const wallet = data.wallet || { balance: 0, totalEarned: 0, totalWithdrawn: 0 };

    // Topbar
    setText('topbar-name', name);
    setText('topbar-uid', `ID: ${userId}`);
    setText('topbar-avatar', name.charAt(0).toUpperCase());

    // Greeting
    setText('greeting-name', name.split(' ')[0]);

    // KPI
    setText('kpi-balance', `$${(wallet.balance || 0).toFixed(2)}`);
    setText('kpi-earned', `$${(wallet.totalEarned || 0).toFixed(2)}`);
    setText('kpi-withdrawn', `$${(wallet.totalWithdrawn || 0).toFixed(2)}`);
    setText('kpi-referrals', (data.totalReferrals || 0).toString());

    // Account info
    setText('info-uid', userId);
    setText('info-sponsor-id', data.sponsorId || '—');
    setText('info-sponsor-name', data.sponsorName || '—');
    setText('info-name', name);
    setText('info-email', data.email || '—');
    setText('info-mobile', data.mobile || '—');
    setText('info-since', data.memberSince ? new Date(data.memberSince).toLocaleDateString() : '—');

    const statusEl = document.getElementById('info-status');
    if (statusEl) {
        statusEl.textContent = data.status || 'active';
        statusEl.className = `badge ${data.status === 'active' ? 'badge-active' : 'badge-inactive'}`;
    }

    // Wallet panel
    setText('wallet-balance', `$${(wallet.balance || 0).toFixed(2)}`);
    setText('wallet-earned', `$${(wallet.totalEarned || 0).toFixed(2)}`);
    setText('wallet-withdrawn', `$${(wallet.totalWithdrawn || 0).toFixed(2)}`);

    // Referral link
    const refLink = `${window.location.origin}/signup.html?ref=${userId}`;
    setVal('referral-link-input', refLink);
    setVal('referral-link-input2', refLink);
    setText('ref-count', (data.totalReferrals || 0).toString());

    // Profile
    setVal('profile-name', name);
    setVal('profile-mobile', data.mobile || '');
    setVal('profile-email', data.email || '');
    setVal('profile-uid', userId);

    // Referrals table
    populateReferrals(data.referrals || []);

    // Signals
    populateSignals();
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function showDashAlert(msg, type = 'error') {
    const el = document.getElementById('dash-alert');
    if (!el) return;
    el.textContent = msg;
    el.className = `alert alert-${type} show`;
    setTimeout(() => el.classList.remove('show'), 6000);
}

// ── Referrals table ───────────────────────────────────────────
function populateReferrals(refs) {
    const tbody = document.getElementById('referrals-tbody');
    if (!tbody) return;

    if (!refs.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No referrals yet. Start sharing your referral link!</td></tr>';
        return;
    }

    tbody.innerHTML = refs.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><code style="color:var(--cyan-primary)">${r.userId || '—'}</code></td>
      <td>${r.name || '—'}</td>
      <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
      <td><span class="badge ${r.status === 'active' ? 'badge-active' : 'badge-inactive'}">${r.status || 'active'}</span></td>
    </tr>
  `).join('');
}

// ── Signals ───────────────────────────────────────────────────
function populateSignals() {
    const pairs = [
        { pair: 'BTC/USDT', type: 'BUY', entry: '$66,800', tp: '$69,500', sl: '$65,200', confidence: '87%' },
        { pair: 'ETH/USDT', type: 'BUY', entry: '$3,420', tp: '$3,680', sl: '$3,280', confidence: '83%' },
        { pair: 'SOL/USDT', type: 'SELL', entry: '$148', tp: '$135', sl: '$155', confidence: '76%' },
        { pair: 'BNB/USDT', type: 'BUY', entry: '$570', tp: '$610', sl: '$545', confidence: '80%' },
        { pair: 'XRP/USDT', type: 'BUY', entry: '$0.485', tp: '$0.540', sl: '$0.455', confidence: '74%' },
        { pair: 'AVAX/USDT', type: 'SELL', entry: '$32.50', tp: '$28.00', sl: '$35.00', confidence: '71%' },
    ];

    const grid = document.getElementById('signals-grid');
    if (!grid) return;

    grid.innerHTML = pairs.map((s) => `
    <div class="signal-card">
      <div class="signal-pair">${s.pair}</div>
      <span class="signal-type ${s.type === 'BUY' ? 'signal-buy' : 'signal-sell'}">${s.type}</span>
      <div class="signal-info">
        <div>Entry: <strong>${s.entry}</strong></div>
        <div>Take Profit: <strong style="color:#00e676">${s.tp}</strong></div>
        <div>Stop Loss: <strong style="color:#ff6b6b">${s.sl}</strong></div>
        <div style="margin-top:8px;font-size:12px">
          Confidence:
          <span style="color:var(--gold-primary);font-weight:700">${s.confidence}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Copy referral link ─────────────────────────────────────────
function copyReferralLink() {
    const input = document.getElementById('referral-link-input');
    if (!input) return;
    navigator.clipboard.writeText(input.value).then(() => {
        const btn = document.getElementById('copy-ref-btn');
        if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => { btn.textContent = 'Copy'; }, 2000); }
    });
}
function copyReferralLink2() {
    const input = document.getElementById('referral-link-input2');
    if (!input) return;
    navigator.clipboard.writeText(input.value).then(() => showDashAlert('Referral link copied!', 'success'));
}

// ── Save Profile ──────────────────────────────────────────────
async function saveProfile() {
    const name = document.getElementById('profile-name')?.value.trim();
    const mobile = document.getElementById('profile-mobile')?.value.trim();
    const alertEl = document.getElementById('profile-alert');

    if (!name) {
        if (alertEl) { alertEl.textContent = 'Name is required.'; alertEl.className = 'alert alert-error show'; }
        return;
    }

    const btn = document.getElementById('profile-save-btn');
    btn.disabled = true; btn.textContent = 'Saving...';

    try {
        const res = await authFetch(`${API_BASE}/user/profile`, {
            method: 'PATCH',
            body: JSON.stringify({ name, mobile }),
        });
        const data = await res.json();
        if (data.success) {
            if (alertEl) { alertEl.textContent = '✅ Profile updated successfully!'; alertEl.className = 'alert alert-success show'; }
            setTimeout(() => alertEl.classList.remove('show'), 3000);
        } else {
            if (alertEl) { alertEl.textContent = data.message || 'Update failed.'; alertEl.className = 'alert alert-error show'; }
        }
    } catch {
        if (alertEl) { alertEl.textContent = 'Server error. Please try again.'; alertEl.className = 'alert alert-error show'; }
    } finally {
        btn.disabled = false; btn.innerHTML = '<span>💾</span> Save Changes';
    }
}

// ── Withdraw ─────────────────────────────────────────────────
async function submitWithdrawal() {
    const address = document.getElementById('withdraw-address')?.value.trim();
    const amount = parseFloat(document.getElementById('withdraw-amount')?.value);

    if (!address) { showDashAlert('Please enter your wallet address.', 'error'); return; }
    if (!amount || amount < 10) { showDashAlert('Minimum withdrawal amount is $10.', 'error'); return; }

    showDashAlert(`Withdrawal request of $${amount} submitted. Processing within 24-48 hours.`, 'success');
    document.getElementById('withdraw-address').value = '';
    document.getElementById('withdraw-amount').value = '';
}

// ── Support ───────────────────────────────────────────────────
function submitSupport() {
    const subject = document.getElementById('support-subject')?.value.trim();
    const message = document.getElementById('support-message')?.value.trim();
    if (!subject || !message) { showDashAlert('Please fill in all support fields.', 'error'); return; }
    showDashAlert('Support ticket submitted! We\'ll respond within 24 hours.', 'success');
    document.getElementById('support-subject').value = '';
    document.getElementById('support-message').value = '';
}

// ── Logout ────────────────────────────────────────────────────
document.getElementById('btn-logout')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.clear();
        window.location.href = 'signin.html';
    }
});

// ── Live crypto ticker ────────────────────────────────────────
let btcBase2 = 67420, ethChg2 = 4.8;
setInterval(() => {
    btcBase2 += (Math.random() - 0.5) * 200;
    ethChg2 += (Math.random() - 0.5) * 0.3;
    const btcEl = document.getElementById('dash-btc');
    const ethEl = document.getElementById('dash-eth');
    if (btcEl) btcEl.textContent = '$' + Math.round(btcBase2).toLocaleString();
    if (ethEl) {
        const sign = ethChg2 >= 0 ? '+' : '';
        ethEl.textContent = sign + ethChg2.toFixed(1) + '%';
        ethEl.style.color = ethChg2 >= 0 ? '#00e676' : '#ff6b6b';
    }
}, 3000);

// ── Init ─────────────────────────────────────────────────────
loadDashboard();
