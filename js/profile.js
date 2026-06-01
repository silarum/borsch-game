// ================== ПРОФИЛЬ И АДМИНКА (SUPABASE) ==================
function updateProfile() {
    document.getElementById('user-nickname').textContent = userNickname;
    const club = clubs.find(c => c.id == myClubId);
    if (club && club.master === 'Игрок') {
        document.getElementById('user-status').textContent = translations[currentLang].status_club;
    } else {
        document.getElementById('user-status').textContent = translations[currentLang].status_solo;
    }
}

// Статистика (короткое нажатие на аватар)
document.getElementById('user-avatar').addEventListener('click', () => {
    document.getElementById('stats-nickname').textContent = userNickname;
    document.getElementById('stats-rum').textContent = rum;
    document.getElementById('stats-srum').textContent = srum;
    document.getElementById('stats-usdt').textContent = usdt;
    document.getElementById('stats-ton').textContent = ton;
    document.getElementById('stats-rank-rum').textContent = '1';
    document.getElementById('stats-rank-srum').textContent = '1';
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
    if(login==='admin' && pass==='admin'){
        renderAdminPanel();
    } else alert('Неверный логин/пароль');
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
            <h4>🛍️ Добавить товар в магазин</h4>
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
            <button class="btn-mining-big" onclick="document.getElementById('admin-modal').classList.remove('active')">Выход</button>
        </div>
    `;
}

// ================== ФУНКЦИИ АДМИНКИ (Supabase) ==================
window.createTournament = async function() {
    const name = prompt('Название турнира:');
    if (!name) return;
    const prize = prompt('Призовой фонд (USDT):', '1000');
    if (!prize || isNaN(prize)) return alert('Неверная сумма');
    await supabaseRequest('POST', 'tournaments', {
        name,
        prize: parseFloat(prize),
        status: 'active',
        created_by: userId,
        created_at: new Date().toISOString()
    });
    alert(`Турнир "${name}" создан!`);
};

window.viewAllPlayers = async function() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });
    if (response.ok) {
        const users = await response.json();
        let list = '';
        users.forEach(u => {
            list += `${u.nickname || 'Без имени'} – RUM: ${u.rum}, SRUM: ${u.srum}\n`;
        });
        alert('Все игроки:\n' + (list || 'Нет данных'));
    } else {
        alert('Ошибка загрузки игроков');
    }
};

window.createSpartanBots = function() {
    spartanBots = generateSpartans();
    localStorage.setItem('spartanBots', JSON.stringify(spartanBots));
    alert('300 спартанцев созданы!');
};

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

const navBtns = document.querySelectorAll('.nav-btn[data-screen="arena"], .nav-btn[data-screen="shop"], .nav-btn[data-screen="wallet"]');
navBtns.forEach(btn => {
    btn.addEventListener('touchstart', startPressAdmin);
    btn.addEventListener('touchend', cancelPressAdmin);
    btn.addEventListener('mousedown', startPressAdmin);
    btn.addEventListener('mouseup', cancelPressAdmin);
});
