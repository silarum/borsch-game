// ================== ПРОФИЛЬ И АДМИН-ПАНЕЛЬ ==================

function updateProfile() {
    document.getElementById('user-nickname').textContent = userNickname;
    const club = clubs.find(c => c.id == myClubId);
    document.getElementById('user-status').textContent = club && club.master === 'Игрок' ? 'Глава клуба' : 'Одиночка';
}

// Статистика (короткое нажатие на аватар)
document.getElementById('user-avatar').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('stats-nickname').textContent = userNickname;
    document.getElementById('stats-rum').textContent = rum.toLocaleString();
    document.getElementById('stats-srum').textContent = srum.toFixed(2);
    document.getElementById('stats-usdt').textContent = usdt.toFixed(2);
    document.getElementById('stats-ton').textContent = ton.toFixed(2);
    document.getElementById('stats-modal').classList.add('active');
});

// Кнопка меню
document.getElementById('user-menu-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('menu-dropdown').classList.toggle('active');
});

// Закрытие меню при клике вне его
document.addEventListener('click', (e) => {
    const menu = document.getElementById('menu-dropdown');
    const menuBtn = document.getElementById('user-menu-btn');
    if (menu && !menu.contains(e.target) && e.target !== menuBtn) {
        menu.classList.remove('active');
    }
});

// Пункты меню
document.querySelectorAll('#menu-dropdown button[data-screen]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.getElementById('menu-dropdown').classList.remove('active');
        switchScreen(e.currentTarget.dataset.screen);
    });
});

// ================== АДМИН-ПАНЕЛЬ ==================
let adminPressTimer;
const ADMIN_LOGIN = 'admin';
const ADMIN_PASS = 'admin';
let currentAdminTab = 'dashboard';

function startPressAdmin(e) {
    e.preventDefault();
    adminPressTimer = setTimeout(() => showAdminLogin(), 3000);
}

function cancelPressAdmin() {
    clearTimeout(adminPressTimer);
}

document.getElementById('user-avatar').addEventListener('touchstart', startPressAdmin);
document.getElementById('user-avatar').addEventListener('touchend', cancelPressAdmin);
document.getElementById('user-avatar').addEventListener('mousedown', startPressAdmin);
document.getElementById('user-avatar').addEventListener('mouseup', cancelPressAdmin);

function showAdminLogin() {
    const modal = document.getElementById('admin-modal');
    const content = document.getElementById('admin-content');
    
    content.innerHTML = `
        <div style="background:linear-gradient(145deg,#1a1a2e,#252545); border:2px solid #FFD700; border-radius:20px; padding:30px; width:90%; max-width:360px; text-align:center;">
            <h2 style="color:#FFD700; margin-bottom:5px;">🔐 Админ-панель</h2>
            <p style="color:#aaa; font-size:0.8rem; margin-bottom:20px;">Введите логин и пароль</p>
            <input type="text" id="admin-login" placeholder="Логин" style="width:100%; padding:14px; margin:8px 0; border-radius:10px; border:1px solid rgba(255,215,0,0.3); background:rgba(0,0,0,0.5); color:white; font-size:1rem; text-align:center;">
            <input type="password" id="admin-password" placeholder="Пароль" style="width:100%; padding:14px; margin:8px 0; border-radius:10px; border:1px solid rgba(255,215,0,0.3); background:rgba(0,0,0,0.5); color:white; font-size:1rem; text-align:center;">
            <button onclick="adminLogin()" style="width:100%; padding:14px; margin-top:15px; background:linear-gradient(180deg,#FFD700,#FFA500); border:none; border-radius:12px; font-weight:bold; font-size:1.1rem; color:#000; cursor:pointer;">Войти</button>
            <button onclick="document.getElementById('admin-modal').classList.remove('active')" style="width:100%; padding:12px; margin-top:10px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.3); border-radius:10px; color:white; font-size:0.9rem; cursor:pointer;">Отмена</button>
            <p style="color:#666; font-size:0.7rem; margin-top:15px;">Удерживайте аватар 3 сек для входа</p>
        </div>
    `;
    modal.classList.add('active');
    setTimeout(() => document.getElementById('admin-login')?.focus(), 100);
}

window.adminLogin = function() {
    const login = document.getElementById('admin-login').value.trim();
    const pass = document.getElementById('admin-password').value.trim();
    if (login === ADMIN_LOGIN && pass === ADMIN_PASS) {
        currentAdminTab = 'dashboard';
        renderAdminPanel();
    } else {
        alert('Неверный логин или пароль');
        document.getElementById('admin-password').value = '';
        document.getElementById('admin-password')?.focus();
    }
};

// ================== РЕНДЕР АДМИН-ПАНЕЛИ ==================
function renderAdminPanel() {
    const content = document.getElementById('admin-content');
    
    const tabs = [
        { id: 'dashboard', icon: '📊', label: 'Дашборд' },
        { id: 'players', icon: '👥', label: 'Игроки' },
        { id: 'transactions', icon: '💳', label: 'Транзакции' },
        { id: 'withdrawals', icon: '📤', label: 'Выводы' },
        { id: 'tournaments', icon: '🏆', label: 'Турниры' },
        { id: 'shop', icon: '🛍️', label: 'Магазин' },
        { id: 'settings', icon: '⚙️', label: 'Настройки' }
    ];

    let tabsHtml = '';
    tabs.forEach(t => {
        tabsHtml += `<button class="admin-tab ${currentAdminTab === t.id ? 'active' : ''}" 
                            onclick="switchAdminTab('${t.id}')">${t.icon} ${t.label}</button>`;
    });

    content.innerHTML = `
        <div style="background:#0d0d1a; border:2px solid #e74c3c; border-radius:20px; width:95%; max-width:500px; height:90vh; display:flex; flex-direction:column; overflow:hidden;">
            <!-- Заголовок -->
            <div style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; border-bottom:1px solid rgba(255,255,255,0.1);">
                <h2 style="color:#e74c3c; margin:0; font-size:1.2rem;">🔧 Админ-панель</h2>
                <button onclick="document.getElementById('admin-modal').classList.remove('active')" 
                        style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">✖</button>
            </div>
            
            <!-- Табы -->
            <div style="display:flex; flex-wrap:wrap; gap:4px; padding:10px; border-bottom:1px solid rgba(255,255,255,0.1);">
                ${tabsHtml}
            </div>
            
            <!-- Контент -->
            <div id="admin-tab-content" style="flex:1; overflow-y:auto; padding:15px; -webkit-overflow-scrolling:touch;"></div>
        </div>
    `;

    // Стили для админки
    if (!document.getElementById('admin-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-styles';
        style.textContent = `
            .admin-tab {
                padding:8px 12px; border:none; border-radius:8px; font-size:0.75rem; font-weight:bold;
                cursor:pointer; background:rgba(255,255,255,0.05); color:#aaa;
                transition:all 0.2s; white-space:nowrap;
            }
            .admin-tab.active { background:#e74c3c; color:white; }
            .admin-table { width:100%; border-collapse:collapse; font-size:0.7rem; }
            .admin-table th { background:rgba(255,255,255,0.1); padding:8px 6px; text-align:left; color:#FFD700; position:sticky; top:0; }
            .admin-table td { padding:8px 6px; border-bottom:1px solid rgba(255,255,255,0.05); color:#ccc; }
            .admin-table tr:hover { background:rgba(255,255,255,0.03); }
            .admin-input { width:100%; padding:10px; margin:5px 0; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.4); color:white; font-size:0.85rem; }
            .admin-btn { padding:8px 14px; border:none; border-radius:8px; font-weight:bold; font-size:0.8rem; cursor:pointer; color:white; }
            .admin-btn-success { background:#27ae60; }
            .admin-btn-danger { background:#e74c3c; }
            .admin-btn-info { background:#2980b9; }
            .admin-stat-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:15px; text-align:center; }
            .admin-stat-card h3 { color:#FFD700; font-size:1.5rem; margin:5px 0; }
            .admin-stat-card p { color:#aaa; font-size:0.7rem; }
        `;
        document.head.appendChild(style);
    }

    loadAdminTabContent(currentAdminTab);
}

window.switchAdminTab = function(tabId) {
    currentAdminTab = tabId;
    renderAdminPanel();
};

async function loadAdminTabContent(tabId) {
    const container = document.getElementById('admin-tab-content');
    if (!container) return;
    container.innerHTML = '<p style="color:#aaa; text-align:center;">⏳ Загрузка...</p>';

    switch (tabId) {
        case 'dashboard': await loadDashboard(container); break;
        case 'players': await loadPlayers(container); break;
        case 'transactions': await loadTransactions(container); break;
        case 'withdrawals': await loadWithdrawals(container); break;
        case 'tournaments': await loadTournaments(container); break;
        case 'shop': loadShopManager(container); break;
        case 'settings': loadSettings(container); break;
    }
}

// ================== ДАШБОРД ==================
async function loadDashboard(container) {
    try {
        const [usersRes, txRes, wdRes] = await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/users?select=id`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }),
            fetch(`${SUPABASE_URL}/rest/v1/transactions?select=amount,currency&order=created_at.desc&limit=50`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }),
            fetch(`${SUPABASE_URL}/rest/v1/withdrawal_requests?status=eq.pending&select=id`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } })
        ]);
        
        const users = await usersRes.json();
        const txs = await txRes.json();
        const withdrawals = await wdRes.json();
        
        const totalUsers = users.length;
        const totalVolume = txs.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        const pendingWD = withdrawals.length;

        container.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
                <div class="admin-stat-card">
                    <p>👥 Игроков</p>
                    <h3>${totalUsers}</h3>
                </div>
                <div class="admin-stat-card">
                    <p>📤 На выводе</p>
                    <h3>${pendingWD}</h3>
                </div>
                <div class="admin-stat-card">
                    <p>💎 SRUM в обороте</p>
                    <h3>${totalVolume.toFixed(1)}</h3>
                </div>
                <div class="admin-stat-card">
                    <p>⚙️ Спартанцы</p>
                    <h3>${spartansEnabled ? '🟢' : '🔴'}</h3>
                </div>
            </div>
            
            <h4 style="color:#FFD700; margin:15px 0 10px;">⚡ Быстрые действия</h4>
            <button class="admin-btn admin-btn-info" onclick="switchAdminTab('players')" style="width:100%; margin:4px 0;">👥 Все игроки</button>
            <button class="admin-btn admin-btn-success" onclick="switchAdminTab('withdrawals')" style="width:100%; margin:4px 0;">📤 Заявки на вывод (${pendingWD})</button>
            <button class="admin-btn admin-btn-danger" onclick="toggleSpartans()" style="width:100%; margin:4px 0;">${spartansEnabled ? '🛑 Выключить' : '🟢 Включить'} спартанцев</button>
        `;
    } catch(e) {
        container.innerHTML = '<p style="color:#e74c3c;">Ошибка загрузки статистики</p>';
    }
}

// ================== ИГРОКИ ==================
async function loadPlayers(container) {
    container.innerHTML = `
        <input type="text" id="player-search" placeholder="🔍 Поиск по нику или ID..." class="admin-input" style="margin-bottom:10px;">
        <div id="players-table-container" style="max-height:400px; overflow-y:auto;"></div>
    `;

    document.getElementById('player-search').addEventListener('input', async (e) => {
        await renderPlayersTable(e.target.value.trim());
    });

    await renderPlayersTable('');
}

async function renderPlayersTable(query) {
    const container = document.getElementById('players-table-container');
    if (!container) return;

    try {
        let url = `${SUPABASE_URL}/rest/v1/users?select=*&order=rum.desc&limit=100`;
        if (query) url += `&or=(nickname.ilike.*${query}*,id.eq.${isNaN(query) ? 0 : query})`;
        
        const res = await fetch(url, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const players = await res.json();

        let html = '<table class="admin-table"><thead><tr><th>ID</th><th>Ник</th><th>RUM</th><th>SRUM</th><th>USDT</th><th>TON</th><th>Статус</th><th>Действия</th></tr></thead><tbody>';
        
        players.forEach(p => {
            html += `<tr>
                <td>${p.id}</td>
                <td>${p.nickname || '-'}</td>
                <td>${(p.rum || 0).toLocaleString()}</td>
                <td>${parseFloat(p.srum || 0).toFixed(2)}</td>
                <td>${parseFloat(p.usdt || 0).toFixed(2)}</td>
                <td>${parseFloat(p.ton || 0).toFixed(2)}</td>
                <td>${p.status || 'solo'}</td>
                <td>
                    <button class="admin-btn admin-btn-info" onclick="editPlayer(${p.id})" style="padding:4px 8px; font-size:0.65rem;">✏️</button>
                    <button class="admin-btn admin-btn-danger" onclick="deletePlayer(${p.id})" style="padding:4px 8px; font-size:0.65rem;">🗑️</button>
                </td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        if (!players.length) html = '<p style="color:#aaa; text-align:center;">Игроки не найдены</p>';
        container.innerHTML = html;
    } catch(e) {
        container.innerHTML = '<p style="color:#e74c3c;">Ошибка загрузки</p>';
    }
}

window.editPlayer = function(id) {
    const newNick = prompt('Новый никнейм:');
    if (!newNick) return;
    const newRum = prompt('RUM:', '0');
    const newSrum = prompt('SRUM:', '0');
    const newStatus = prompt('Статус (solo/silver/gold/platinum):', 'solo');
    
    fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            nickname: newNick,
            rum: parseInt(newRum) || 0,
            srum: parseFloat(newSrum) || 0,
            status: newStatus
        })
    }).then(() => {
        alert('Игрок обновлён');
        loadAdminTabContent('players');
    });
};

window.deletePlayer = function(id) {
    if (!confirm('Удалить игрока? Это необратимо!')) return;
    fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    }).then(() => {
        alert('Игрок удалён');
        loadAdminTabContent('players');
    });
};

// ================== ТРАНЗАКЦИИ ==================
async function loadTransactions(container) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=*&order=created_at.desc&limit=50`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const txs = await res.json();

        let html = '<table class="admin-table"><thead><tr><th>ID</th><th>Тип</th><th>Сумма</th><th>Валюта</th><th>Дата</th></tr></thead><tbody>';
        txs.forEach(t => {
            html += `<tr>
                <td>${t.id}</td>
                <td>${t.type || '-'}</td>
                <td>${t.amount || 0}</td>
                <td>${t.currency || '-'}</td>
                <td>${new Date(t.created_at).toLocaleString()}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        if (!txs.length) html = '<p style="color:#aaa;">Нет транзакций</p>';
        container.innerHTML = html;
    } catch(e) {
        container.innerHTML = '<p style="color:#e74c3c;">Ошибка</p>';
    }
}

// ================== ВЫВОДЫ ==================
async function loadWithdrawals(container) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/withdrawal_requests?select=*&order=created_at.desc&limit=50`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const requests = await res.json();

        let html = '<table class="admin-table"><thead><tr><th>ID</th><th>Ник</th><th>Сумма</th><th>USDT</th><th>Статус</th><th>Действия</th></tr></thead><tbody>';
        requests.forEach(r => {
            html += `<tr>
                <td>${r.id}</td>
                <td>${r.nickname || '-'}</td>
                <td>${r.amount}</td>
                <td>${r.usdt_amount}</td>
                <td style="color:${r.status === 'pending' ? '#f39c12' : r.status === 'approved' ? '#27ae60' : '#e74c3c'}">${r.status}</td>
                <td>
                    ${r.status === 'pending' ? `
                        <button class="admin-btn admin-btn-success" onclick="approveWithdrawal(${r.id})" style="padding:4px 8px; font-size:0.65rem;">✓</button>
                        <button class="admin-btn admin-btn-danger" onclick="rejectWithdrawal(${r.id})" style="padding:4px 8px; font-size:0.65rem;">✕</button>
                    ` : '-'}
                </td>
            </tr>`;
        });
        html += '</tbody></table>';
        if (!requests.length) html = '<p style="color:#aaa;">Нет заявок</p>';
        container.innerHTML = html;
    } catch(e) {
        container.innerHTML = '<p style="color:#e74c3c;">Ошибка</p>';
    }
}

// ================== ТУРНИРЫ ==================
async function loadTournaments(container) {
    container.innerHTML = `
        <button class="admin-btn admin-btn-success" onclick="createTournament()" style="width:100%; margin-bottom:15px;">🏆 Создать турнир</button>
        <div id="tournaments-list"></div>
    `;
    
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/tournaments?select=*&order=created_at.desc`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const tournaments = await res.json();

        let html = '';
        tournaments.forEach(t => {
            html += `<div style="background:rgba(255,255,255,0.03); padding:10px; margin:5px 0; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <b style="color:#FFD700;">${t.name}</b>
                    <p style="color:#aaa; font-size:0.7rem;">Приз: ${t.prize} USDT | Статус: ${t.status}</p>
                </div>
                <button class="admin-btn admin-btn-danger" onclick="deleteTournament(${t.id})" style="padding:4px 10px; font-size:0.65rem;">🗑️</button>
            </div>`;
        });
        if (!html) html = '<p style="color:#aaa;">Нет турниров</p>';
        document.getElementById('tournaments-list').innerHTML = html;
    } catch(e) {
        document.getElementById('tournaments-list').innerHTML = '<p style="color:#e74c3c;">Ошибка</p>';
    }
}

window.createTournament = async function() {
    const name = prompt('Название турнира:');
    if (!name) return;
    const prize = prompt('Приз (USDT):', '100');
    if (!prize || isNaN(prize)) return;
    
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/tournaments`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                name, prize: parseFloat(prize), status: 'active',
                created_by: userId, created_at: new Date().toISOString()
            })
        });
        alert('Турнир создан!');
        loadAdminTabContent('tournaments');
    } catch(e) { alert('Ошибка'); }
};

window.deleteTournament = async function(id) {
    if (!confirm('Удалить турнир?')) return;
    await fetch(`${SUPABASE_URL}/rest/v1/tournaments?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    loadAdminTabContent('tournaments');
};

window.approveWithdrawal = async function(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/withdrawal_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: 'approved', processed_at: new Date().toISOString() })
    });
    loadAdminTabContent('withdrawals');
};

window.rejectWithdrawal = async function(id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/withdrawal_requests?id=eq.${id}&select=*`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const data = await res.json();
    if (data.length > 0) {
        const req = data[0];
        const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${req.user_id}&select=*`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const users = await userRes.json();
        if (users.length > 0) {
            const newSrum = parseFloat(users[0].srum || 0) + parseFloat(req.amount);
            await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${req.user_id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ srum: newSrum })
            });
        }
    }
    await fetch(`${SUPABASE_URL}/rest/v1/withdrawal_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: 'rejected', processed_at: new Date().toISOString() })
    });
    alert('SRUM возвращены игроку.');
    loadAdminTabContent('withdrawals');
};

// ================== МАГАЗИН ==================
function loadShopManager(container) {
    container.innerHTML = `
        <h4 style="color:#FFD700; margin-bottom:10px;">🛍️ Добавить товар</h4>
        <input type="text" id="new-item-name" placeholder="Название" class="admin-input">
        <input type="text" id="new-item-icon" placeholder="Иконка (эмодзи)" class="admin-input">
        <div style="display:flex; gap:8px;">
            <input type="number" id="new-item-price" placeholder="Цена" step="0.01" class="admin-input" style="flex:2;">
            <select id="new-item-currency" class="admin-input" style="flex:1;">
                <option value="RUM">RUM</option>
                <option value="SRUM">SRUM</option>
                <option value="TON">TON</option>
                <option value="STARS">STARS</option>
                <option value="USDT">USDT</option>
            </select>
        </div>
        <input type="text" id="new-item-desc" placeholder="Описание" class="admin-input">
        <button class="admin-btn admin-btn-success" onclick="addShopItem()" style="width:100%; margin-top:5px;">✅ Добавить</button>
        
        <h4 style="color:#FFD700; margin:15px 0 10px;">📋 Текущие товары</h4>
        <div id="shop-items-list" style="max-height:300px; overflow-y:auto;"></div>
    `;
    renderShopItemsList();
}

function renderShopItemsList() {
    const list = document.getElementById('shop-items-list');
    if (!list) return;
    
    let html = '';
    shopItems.forEach(item => {
        html += `<div style="background:rgba(255,255,255,0.03); padding:8px; margin:4px 0; border-radius:6px; display:flex; justify-content:space-between; align-items:center; font-size:0.75rem;">
            <span>${item.icon} ${item.name} — ${item.price} ${item.currency}</span>
            <button class="admin-btn admin-btn-danger" onclick="removeShopItem(${item.id})" style="padding:2px 8px; font-size:0.6rem;">✕</button>
        </div>`;
    });
    list.innerHTML = html || '<p style="color:#aaa;">Нет товаров</p>';
}

window.addShopItem = function() {
    const name = document.getElementById('new-item-name').value.trim();
    const icon = document.getElementById('new-item-icon').value.trim();
    const price = parseFloat(document.getElementById('new-item-price').value);
    const currency = document.getElementById('new-item-currency').value;
    const desc = document.getElementById('new-item-desc').value.trim();
    if (!name || !icon || isNaN(price) || price <= 0) return alert('Заполните все поля');
    
    shopItems.push({ id: Date.now(), name, icon, price, currency, description: desc || 'Новый товар' });
    localStorage.setItem('shopItems', JSON.stringify(shopItems));
    ['new-item-name', 'new-item-icon', 'new-item-price', 'new-item-desc'].forEach(id => {
        document.getElementById(id).value = '';
    });
    renderShopItemsList();
    alert('Товар добавлен!');
};

window.removeShopItem = function(id) {
    shopItems = shopItems.filter(i => i.id !== id);
    localStorage.setItem('shopItems', JSON.stringify(shopItems));
    renderShopItemsList();
};

// ================== НАСТРОЙКИ ==================
function loadSettings(container) {
    container.innerHTML = `
        <h4 style="color:#FFD700; margin-bottom:10px;">⚙️ Настройки игры</h4>
        
        <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:10px; margin:10px 0;">
            <p style="color:#aaa; font-size:0.8rem;">Армия «300 спартанцев»</p>
            <p style="font-size:0.9rem;">Статус: ${spartansEnabled ? '🟢 Включена' : '🔴 Отключена'}</p>
            <button class="admin-btn ${spartansEnabled ? 'admin-btn-danger' : 'admin-btn-success'}" 
                    onclick="toggleSpartans()" style="width:100%; margin-top:8px;">
                ${spartansEnabled ? '🛑 Выключить' : '🟢 Включить'}
            </button>
            <button class="admin-btn admin-btn-info" onclick="resetSpartans()" style="width:100%; margin-top:5px;">🔄 Сбросить состояния</button>
        </div>
        
        <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:10px; margin:10px 0;">
            <p style="color:#aaa; font-size:0.8rem;">Курсы обмена SRUM</p>
            <div style="display:flex; gap:8px;">
                <div style="flex:1;">
                    <label style="color:#aaa; font-size:0.7rem;">USDT (за 1 SRUM)</label>
                    <input type="number" id="rate-usdt" value="1" step="0.01" class="admin-input">
                </div>
                <div style="flex:1;">
                    <label style="color:#aaa; font-size:0.7rem;">TON (за 1 SRUM)</label>
                    <input type="number" id="rate-ton" value="0.2" step="0.01" class="admin-input">
                </div>
            </div>
            <button class="admin-btn admin-btn-success" onclick="saveRates()" style="width:100%; margin-top:8px;">💾 Сохранить курсы</button>
        </div>
        
        <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:10px; margin:10px 0;">
            <p style="color:#aaa; font-size:0.8rem;">Опасные действия</p>
            <button class="admin-btn admin-btn-danger" onclick="resetAllData()" style="width:100%;">⚠️ Сбросить все данные</button>
        </div>
    `;
}

window.saveRates = function() {
    const usdtRate = parseFloat(document.getElementById('rate-usdt').value);
    const tonRate = parseFloat(document.getElementById('rate-ton').value);
    if (isNaN(usdtRate) || isNaN(tonRate)) return alert('Неверные значения');
    localStorage.setItem('exchangeRateUSDT', usdtRate);
    localStorage.setItem('exchangeRateTON', tonRate);
    alert('Курсы сохранены!');
};

window.resetAllData = function() {
    if (!confirm('СБРОСИТЬ ВСЕ ДАННЫЕ? Это удалит всё!')) return;
    if (!confirm('Точно? Отменить будет нельзя!')) return;
    localStorage.clear();
