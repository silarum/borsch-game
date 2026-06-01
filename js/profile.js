// ================== ПРОФИЛЬ И АДМИНКА (SUPABASE) ==================
function updateProfile() {
    document.getElementById('user-nickname').textContent = userNickname;
    const club = clubs.find(c => c.id == myClubId);
    document.getElementById('user-status').textContent = club && club.master === 'Игрок' ?
        translations[currentLang].status_club : translations[currentLang].status_solo;
}

// Статистика (короткое нажатие на аватар)
document.getElementById('user-avatar').addEventListener('click', () => {
    document.getElementById('stats-nickname').textContent = userNickname;
    document.getElementById('stats-rum').textContent = rum;
    document.getElementById('stats-srum').textContent = srum;
    document.getElementById('stats-usdt').textContent = usdt;
    document.getElementById('stats-ton').textContent = ton;
    document.getElementById('stats-modal').classList.add('active');
});

document.getElementById('user-menu-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('menu-dropdown').classList.toggle('active');
});

document.querySelectorAll('#menu-dropdown button[data-screen]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.getElementById('menu-dropdown').classList.remove('active');
        switchScreen(e.currentTarget.dataset.screen);
    });
});

// ================== АДМИН-ПАНЕЛЬ ==================
window.adminLogin = function(){
    let login = document.getElementById('admin-login').value;
    let pass = document.getElementById('admin-password').value;
    if(login==='admin' && pass==='admin') renderAdminPanel();
    else alert('Неверный логин/пароль');
};

function renderAdminPanel() {
    document.getElementById('admin-content').innerHTML = `
        <div class="pool-cloud" style="background: radial-gradient(circle at 20% 20%, #2e004f, #6a0dad); margin:0; width:100%;">
            <h2>🔧 Админ-панель</h2>
            <button class="btn-mining-big" onclick="createTournament()">Создать турнир</button>
            <button class="btn-mining-big" onclick="viewAllPlayers()">Все игроки</button>
            <button class="btn-mining-big" onclick="createSpartanBots()">300 спартанцев</button>
            <button class="btn-mining-big" onclick="toggleSpartans()">${spartansEnabled ? '🛑 Выключить' : '🟢 Включить'} 300 спартанцев</button>
            <button class="btn-mining-big" onclick="resetSpartans()">🔄 Сбросить состояния</button>
            <hr style="border-color:#555">
            <h4>🛍️ Добавить товар</h4>
            <input type="text" id="new-item-name" placeholder="Название" style="width:100%;padding:10px;margin:5px 0;border-radius:8px;border:none;background:rgba(255,255,255,0.15);color:white;">
            <input type="text" id="new-item-icon" placeholder="Иконка (эмодзи)" style="width:100%;padding:10px;margin:5px 0;border-radius:8px;border:none;background:rgba(255,255,255,0.15);color:white;">
            <input type="number" id="new-item-price" placeholder="Цена" step="0.01" style="width:100%;padding:10px;margin:5px 0;border-radius:8px;border:none;background:rgba(255,255,255,0.15);color:white;">
            <select id="new-item-currency" style="width:100%;padding:10px;margin:5px 0;border-radius:8px;border:none;background:rgba(255,255,255,0.15);color:white;">
                <option value="RUM">RUM</option>
                <option value="SRUM">SRUM</option>
                <option value="TON">TON</option>
                <option value="USDT">USDT</option>
            </select>
            <input type="text" id="new-item-desc" placeholder="Описание" style="width:100%;padding:10px;margin:5px 0;border-radius:8px;border:none;background:rgba(255,255,255,0.15);color:white;">
            <button class="btn-mining-big" onclick="addShopItem()">✅ Добавить товар</button>
            <hr style="border-color:#555">
            <h4>📤 Заявки на вывод SRUM</h4>
            <div id="withdrawal-list" style="max-height:200px;overflow-y:auto;"></div>
            <button class="btn-mining-big" onclick="loadWithdrawalRequests()">🔄 Обновить заявки</button>
            <hr style="border-color:#555">
            <button class="btn-mining-big" onclick="document.getElementById('admin-modal').classList.remove('active')">Выход</button>
        </div>
    `;
    loadWithdrawalRequests(); // загружаем сразу
}

// ================== ЗАЯВКИ НА ВЫВОД ==================
window.loadWithdrawalRequests = async function() {
    const container = document.getElementById('withdrawal-list');
    if (!container) return;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/withdrawal_requests?select=*&status=eq.pending`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });
    if (response.ok) {
        const requests = await response.json();
        if (requests.length === 0) {
            container.innerHTML = '<p>Нет активных заявок</p>';
            return;
        }
        let html = '';
        requests.forEach(r => {
            html += `<div style="background:rgba(255,255,255,0.1);padding:8px;margin:5px 0;border-radius:8px;">
                <b>${r.nickname || 'Игрок'}</b>: ${r.amount} SRUM → ${r.usdt_amount} USDT (${r.wallet_address.slice(0,6)}...)
                <button onclick="approveWithdrawal(${r.id})">✅</button>
                <button onclick="rejectWithdrawal(${r.id})">❌</button>
            </div>`;
        });
        container.innerHTML = html;
    } else {
        container.innerHTML = '<p>Ошибка загрузки</p>';
    }
};

window.approveWithdrawal = async function(id) {
    if (!confirm('Подтвердить вывод? SRUM будут списаны с баланса игрока.')) return;
    try {
        const res = await fetch('https://hngfpdsnjgdpazmortix.supabase.co/functions/v1/process-withdrawal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_id: id, action: 'approve' })
        });
        const data = await res.json();
        if (res.ok) {
            alert('✅ Вывод подтверждён! Баланс игрока обновлён.');
            loadWithdrawalRequests();
        } else {
            alert('Ошибка: ' + (data.error || 'неизвестная ошибка'));
        }
    } catch (e) {
        alert('Ошибка соединения с сервером');
    }
};

window.rejectWithdrawal = async function(id) {
    if (!confirm('Отклонить заявку? SRUM не будут списаны.')) return;
    try {
        const res = await fetch('https://hngfpdsnjgdpazmortix.supabase.co/functions/v1/process-withdrawal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_id: id, action: 'reject' })
        });
        if (res.ok) {
            alert('Заявка отклонена.');
            loadWithdrawalRequests();
        } else {
            const data = await res.json();
            alert('Ошибка: ' + (data.error || 'неизвестная ошибка'));
        }
    } catch (e) {
        alert('Ошибка соединения с сервером');
    }
};

// ================== ТУРНИРЫ И ИГРОКИ ==================
window.createTournament = async function() {
    const name = prompt('Название турнира:');
    if (!name) return;
    const prize = prompt('Призовой фонд (USDT):', '1000');
    if (!prize || isNaN(prize)) return alert('Неверная сумма');
    await supabaseRequest('POST', 'tournaments', { name, prize: parseFloat(prize), status: 'active', created_by: userId, created_at: new Date().toISOString() });
    alert(`Турнир "${name}" создан!`);
};

window.viewAllPlayers = async function() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (response.ok) {
        const users = await response.json();
        let list = users.map(u => `${u.nickname || 'Без имени'} – RUM: ${u.rum}, SRUM: ${u.srum}`).join('\n');
        alert('Все игроки:\n' + (list || 'Нет данных'));
    } else alert('Ошибка загрузки');
};

window.createSpartanBots = function() {
    spartanBots = generateSpartans();
    localStorage.setItem('spartanBots', JSON.stringify(spartanBots));
    alert('300 спартанцев созданы!');
};

// Добавление товара (уже работает с localStorage, позже перенесём в Supabase)
window.addShopItem = function() {
    const name = document.getElementById('new-item-name').value.trim();
    const icon = document.getElementById('new-item-icon').value.trim() || '🛒';
    const price = parseFloat(document.getElementById('new-item-price').value);
    const currency = document.getElementById('new-item-currency').value;
    const desc = document.getElementById('new-item-desc').value.trim();

    if (!name || isNaN(price) || price <= 0) {
        alert('Заполните название и цену корректно');
        return;
    }

    const newItem = {
        id: Date.now(),
        name,
        icon,
        price,
        currency,
        description: desc || ''
    };

    shopItems.push(newItem);
    localStorage.setItem('shopItems', JSON.stringify(shopItems));
    alert(`Товар "${name}" добавлен!`);
    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-icon').value = '';
    document.getElementById('new-item-price').value = '';
    document.getElementById('new-item-desc').value = '';
    if (document.getElementById('shop-screen').classList.contains('active')) {
        renderShop();
    }
};

// ================== ДОЛГОЕ НАЖАТИЕ ==================
let pressTimer;
function startPressAdmin(e){
    e.preventDefault();
    pressTimer = setTimeout(() => {
        document.getElementById('admin-content').innerHTML = `
            <div class="pool-cloud" style="background: radial-gradient(circle at 20% 20%, #2e004f, #6a0dad); margin:0; width:100%;">
                <h2>🔐 Вход в админ-панель</h2>
                <input type="text" id="admin-login" placeholder="Логин" value="admin" style="width:100%;padding:10px;margin:5px 0;border-radius:8px;border:none;background:rgba(255,255,255,0.15);color:white;">
                <input type="password" id="admin-password" placeholder="Пароль" value="admin" style="width:100%;padding:10px;margin:5px 0;border-radius:8px;border:none;background:rgba(255,255,255,0.15);color:white;">
                <button class="btn-mining-big" onclick="adminLogin()">Войти</button>
                <button class="btn-mining-big" onclick="document.getElementById('admin-modal').classList.remove('active')">Отмена</button>
            </div>
        `;
        document.getElementById('admin-modal').classList.add('active');
    }, 5000);
}
function cancelPressAdmin(){ clearTimeout(pressTimer); }

document.getElementById('user-avatar').addEventListener('touchstart', startPressAdmin);
document.getElementById('user-avatar').addEventListener('touchend', cancelPressAdmin);
document.getElementById('user-avatar').addEventListener('mousedown', startPressAdmin);
document.getElementById('user-avatar').addEventListener('mouseup', cancelPressAdmin);

document.querySelectorAll('.nav-btn[data-screen="arena"], .nav-btn[data-screen="shop"], .nav-btn[data-screen="wallet"]').forEach(btn => {
    btn.addEventListener('touchstart', startPressAdmin);
    btn.addEventListener('touchend', cancelPressAdmin);
    btn.addEventListener('mousedown', startPressAdmin);
    btn.addEventListener('mouseup', cancelPressAdmin);
});
