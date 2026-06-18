// ================== ПРОФИЛЬ И АДМИН-ПАНЕЛЬ ==================

// Обновление ника и статуса в шапке
function updateProfile() {
    document.getElementById('user-nickname').textContent = userNickname;
    const club = clubs.find(c => c.id == myClubId);
    document.getElementById('user-status').textContent = club && club.master === 'Игрок' ? 'Глава клуба' : 'Одиночка';
}

// Статистика (короткое нажатие на аватар)
document.getElementById('user-avatar').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('stats-nickname').textContent = userNickname;
    document.getElementById('stats-rum').textContent = rum;
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
    if (!menu.contains(e.target) && e.target !== menuBtn) {
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

// ================== АДМИН-ПАНЕЛЬ (ДОЛГОЕ НАЖАТИЕ 3 СЕКУНДЫ) ==================
let adminPressTimer;
const ADMIN_LOGIN = 'admin';
const ADMIN_PASS = 'admin';

function startPressAdmin(e) {
    e.preventDefault();
    adminPressTimer = setTimeout(() => {
        showAdminLogin();
    }, 3000); // 3 секунды удержания
}

function cancelPressAdmin() {
    clearTimeout(adminPressTimer);
}

// Вешаем долгое нажатие на аватар
document.getElementById('user-avatar').addEventListener('touchstart', startPressAdmin);
document.getElementById('user-avatar').addEventListener('touchend', cancelPressAdmin);
document.getElementById('user-avatar').addEventListener('mousedown', startPressAdmin);
document.getElementById('user-avatar').addEventListener('mouseup', cancelPressAdmin);

// Показываем форму входа в админку
function showAdminLogin() {
    const modal = document.getElementById('admin-modal');
    const content = document.getElementById('admin-content');
    
    content.innerHTML = `
        <div style="background:linear-gradient(145deg,#1a1a2e,#252545); border:2px solid #FFD700; border-radius:20px; padding:25px; width:100%; max-width:350px; text-align:center;">
            <h2 style="color:#FFD700; margin-bottom:20px;">🔐 Админ-панель</h2>
            <p style="color:#aaa; margin-bottom:15px; font-size:0.85rem;">Введите логин и пароль</p>
            <input type="text" id="admin-login" placeholder="Логин" style="width:100%; padding:12px; margin:8px 0; border-radius:10px; border:1px solid rgba(255,215,0,0.3); background:rgba(0,0,0,0.5); color:white; font-size:1rem; text-align:center;">
            <input type="password" id="admin-password" placeholder="Пароль" style="width:100%; padding:12px; margin:8px 0; border-radius:10px; border:1px solid rgba(255,215,0,0.3); background:rgba(0,0,0,0.5); color:white; font-size:1rem; text-align:center;">
            <button onclick="adminLogin()" style="width:100%; padding:14px; margin-top:15px; background:linear-gradient(180deg,#FFD700,#FFA500); border:none; border-radius:12px; font-weight:bold; font-size:1.1rem; color:#000; cursor:pointer; box-shadow:0 4px 15px rgba(255,215,0,0.4);">Войти</button>
            <button onclick="document.getElementById('admin-modal').classList.remove('active')" style="width:100%; padding:12px; margin-top:10px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.3); border-radius:10px; color:white; font-size:0.9rem; cursor:pointer;">Отмена</button>
        </div>
    `;
    modal.classList.add('active');
    
    // Фокус на поле логина
    setTimeout(() => {
        const loginInput = document.getElementById('admin-login');
        if (loginInput) loginInput.focus();
    }, 100);
}

// Проверка логина и пароля
window.adminLogin = function() {
    const login = document.getElementById('admin-login').value.trim();
    const pass = document.getElementById('admin-password').value.trim();
    
    if (login === ADMIN_LOGIN && pass === ADMIN_PASS) {
        renderAdminPanel();
    } else {
        alert('Неверный логин или пароль');
        const passInput = document.getElementById('admin-password');
        if (passInput) {
            passInput.value = '';
            passInput.focus();
        }
    }
};

// Главный экран админ-панели
function renderAdminPanel() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
        <div style="background:linear-gradient(145deg,#0d0d1a,#1a1a2e); border:2px solid #e74c3c; border-radius:20px; padding:20px; width:100%; max-width:400px; max-height:85vh; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="color:#e74c3c; margin:0;">🔧 Админ-панель</h2>
                <button onclick="document.getElementById('admin-modal').classList.remove('active')" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">✖</button>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:10px;">
                <button class="admin-action-btn" onclick="viewAllPlayers()" style="background:linear-gradient(180deg,#2980b9,#2471a3);">
                    👥 Все игроки
                </button>
                <button class="admin-action-btn" onclick="createTournament()" style="background:linear-gradient(180deg,#8e44ad,#6c3483);">
                    🏆 Создать турнир
                </button>
                <button class="admin-action-btn" onclick="toggleSpartans()" style="background:linear-gradient(180deg,#e74c3c,#c0392b);">
                    ${spartansEnabled ? '🛑 Выключить' : '🟢 Включить'} 300 спартанцев
                </button>
                <button class="admin-action-btn" onclick="resetSpartans()" style="background:linear-gradient(180deg,#f39c12,#d68910);">
                    🔄 Сбросить спартанцев
                </button>
                <button class="admin-action-btn" onclick="loadWithdrawalRequests()" style="background:linear-gradient(180deg,#27ae60,#1e8449);">
                    📤 Заявки на вывод
                </button>
            </div>
            
            <hr style="border-color:rgba(255,255,255,0.1); margin:20px 0;">
            
            <h4 style="color:#FFD700; margin-bottom:10px;">🛍️ Добавить товар в магазин</h4>
            <input type="text" id="new-item-name" placeholder="Название" style="width:100%; padding:10px; margin:5px 0; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.4); color:white;">
            <input type="text" id="new-item-icon" placeholder="Иконка (эмодзи)" style="width:100%; padding:10px; margin:5px 0; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.4); color:white;">
            <input type="number" id="new-item-price" placeholder="Цена" step="0.01" style="width:100%; padding:10px; margin:5px 0; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.4); color:white;">
            <select id="new-item-currency" style="width:100%; padding:10px; margin:5px 0; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.4); color:white;">
                <option value="RUM">RUM</option>
                <option value="SRUM">SRUM</option>
                <option value="TON">TON</option>
                <option value="STARS">STARS</option>
            </select>
            <input type="text" id="new-item-desc" placeholder="Описание" style="width:100%; padding:10px; margin:5px 0; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.4); color:white;">
            <button class="admin-action-btn" onclick="addShopItem()" style="background:linear-gradient(180deg,#00E5FF,#00B8D4); margin-top:10px;">
                ✅ Добавить товар
            </button>
            
            <div id="withdrawal-list" style="margin-top:15px; max-height:200px; overflow-y:auto;"></div>
        </div>
    `;
    
    // Стили для кнопок админки
    const style = document.createElement('style');
    style.textContent = `
        .admin-action-btn {
            width:100%;
            padding:14px;
            border:none;
            border-radius:12px;
            font-weight:bold;
            font-size:0.95rem;
            color:white;
            cursor:pointer;
            box-shadow:0 4px 10px rgba(0,0,0,0.3);
            transition:transform 0.1s;
            text-align:left;
        }
        .admin-action-btn:active {
            transform:scale(0.97);
        }
    `;
    document.head.appendChild(style);
}

// ================== ФУНКЦИИ АДМИНКИ ==================
window.viewAllPlayers = async function() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*&order=rum.desc&limit=50`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const players = await res.json();
        let html = '<h4 style="color:#FFD700;">👥 Игроки (топ-50)</h4>';
        players.forEach((p, i) => {
            html += `<div style="background:rgba(255,255,255,0.05); padding:8px; margin:4px 0; border-radius:6px; font-size:0.8rem;">
                ${i+1}. ${p.nickname || 'Игрок'} | RUM: ${p.rum || 0} | SRUM: ${parseFloat(p.srum || 0).toFixed(2)}
            </div>`;
        });
        document.getElementById('withdrawal-list').innerHTML = html;
    } catch(e) {
        console.error(e);
        alert('Ошибка загрузки игроков');
    }
};

window.createTournament = async function() {
    const name = prompt('Название турнира:');
    if (!name) return;
    const prize = prompt('Призовой фонд (USDT):');
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
                name: name,
                prize: parseFloat(prize),
                status: 'active',
                created_by: userId,
                created_at: new Date().toISOString()
            })
        });
        alert('Турнир создан!');
    } catch(e) {
        console.error(e);
        alert('Ошибка создания турнира');
    }
};

window.addShopItem = function() {
    const name = document.getElementById('new-item-name').value.trim();
    const icon = document.getElementById('new-item-icon').value.trim();
    const price = parseFloat(document.getElementById('new-item-price').value);
    const currency = document.getElementById('new-item-currency').value;
    const desc = document.getElementById('new-item-desc').value.trim();
    if (!name || !icon || isNaN(price) || price <= 0) {
        alert('Заполните все поля корректно');
        return;
    }
    const newItem = {
        id: Date.now(),
        name: name,
        icon: icon,
        price: price,
        currency: currency,
        description: desc || 'Новый товар'
    };
    shopItems.push(newItem);
    localStorage.setItem('shopItems', JSON.stringify(shopItems));
    alert('Товар добавлен!');
    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-icon').value = '';
    document.getElementById('new-item-price').value = '';
    document.getElementById('new-item-desc').value = '';
};

window.loadWithdrawalRequests = async function() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/withdrawal_requests?status=eq.pending&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const requests = await res.json();
        let html = '<h4 style="color:#FFD700; margin-top:15px;">📤 Заявки на вывод</h4>';
        if (!requests.length) html += '<p style="color:#aaa;">Нет активных заявок</p>';
        requests.forEach(r => {
            html += `<div style="background:rgba(255,255,255,0.05); padding:8px; margin:4px 0; border-radius:6px; font-size:0.8rem;">
                ${r.nickname || 'Игрок'}: ${r.amount} SRUM → ${r.usdt_amount} USDT<br>
                Кошелёк: ${r.wallet_address.slice(0,8)}...<br>
                <button onclick="approveWithdrawal(${r.id})" style="background:#27ae60; color:white; border:none; border-radius:4px; padding:4px 10px; margin:4px; cursor:pointer;">Одобрить</button>
                <button onclick="rejectWithdrawal(${r.id})" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding:4px 10px; margin:4px; cursor:pointer;">Отклонить</button>
            </div>`;
        });
        document.getElementById('withdrawal-list').innerHTML = html;
    } catch(e) {
        console.error(e);
        document.getElementById('withdrawal-list').innerHTML = '<p style="color:#e74c3c;">Ошибка загрузки заявок</p>';
    }
};

window.approveWithdrawal = async function(id) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/withdrawal_requests?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                status: 'approved',
                processed_at: new Date().toISOString()
            })
        });
        alert('Заявка одобрена!');
        loadWithdrawalRequests();
    } catch(e) {
        console.error(e);
    }
};

window.rejectWithdrawal = async function(id) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/withdrawal_requests?id=eq.${id}&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const data = await res.json();
        if (data.length > 0) {
            // Возвращаем SRUM игроку
            const req = data[0];
            const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${req.user_id}&select=*`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
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
            body: JSON.stringify({
                status: 'rejected',
                processed_at: new Date().toISOString()
            })
        });
        alert('Заявка отклонена. SRUM возвращены игроку.');
        loadWithdrawalRequests();
    } catch(e) {
        console.error(e);
    }
};
