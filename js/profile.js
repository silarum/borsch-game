// ================== ПРОФИЛЬ И АДМИНКА ==================
function updateProfile() {
    document.getElementById('user-nickname').textContent = userNickname;
    const club = clubs.find(c => c.id == myClubId);
    if (club && club.master === 'Игрок') {
        document.getElementById('user-status').textContent = translations[currentLang].status_club;
    } else {
        document.getElementById('user-status').textContent = translations[currentLang].status_solo;
    }
}

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
document.getElementById('user-menu-btn').addEventListener('click', () => {
    document.getElementById('menu-dropdown').classList.toggle('active');
});
document.querySelectorAll('#menu-dropdown button[data-screen]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.getElementById('menu-dropdown').classList.remove('active');
        switchScreen(e.currentTarget.dataset.screen);
    });
});

// Админ-панель
window.adminLogin = function(){
    let login = document.getElementById('admin-login').value;
    let pass = document.getElementById('admin-password').value;
    if(login==='admin' && pass==='admin'){
        document.getElementById('admin-content').innerHTML = `
            <h3>🔧 Админ-панель</h3>
            <button onclick="showTournamentForm()">Создать турнир</button>
            <button onclick="viewAllPlayers()">Все игроки</button>
            <button onclick="createBots()">300 спартанцев</button>
            <button onclick="toggleSpartans()">${spartansEnabled ? '🛑 Выключить' : '🟢 Включить'} 300 спартанцев</button>
            <button onclick="resetSpartans()">🔄 Сбросить состояния</button>
            <hr style="border-color:#555">
            <h4>🛍️ Добавить товар в магазин</h4>
            <input type="text" id="new-item-name" placeholder="Название">
            <input type="text" id="new-item-icon" placeholder="Иконка (эмодзи)">
            <input type="number" id="new-item-price" placeholder="Цена" step="0.01">
            <select id="new-item-currency">
                <option value="RUM">RUM</option>
                <option value="SRUM">SRUM</option>
                <option value="TON">TON</option>
                <option value="USDT">USDT</option>
            </select>
            <input type="text" id="new-item-desc" placeholder="Описание">
            <button onclick="addShopItem()">✅ Добавить товар</button>
            <hr style="border-color:#555">
            <button onclick="document.getElementById('admin-modal').classList.remove('active')">Выход</button>
        `;
    } else alert('Неверный логин/пароль');
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

window.showTournamentForm = function(){ alert('Форма создания турнира'); };
window.viewAllPlayers = function(){ alert('Статистика игроков'); };
window.createBots = function(){ alert('Запуск ботов'); };

let pressTimer;
function startPressAdmin(e){
    pressTimer = setTimeout(() => {
        document.getElementById('admin-modal').classList.add('active');
    }, 60000);
}
function cancelPressAdmin(){ clearTimeout(pressTimer); }
document.getElementById('user-avatar').addEventListener('touchstart', startPressAdmin);
document.getElementById('user-avatar').addEventListener('touchend', cancelPressAdmin);
document.getElementById('user-avatar').addEventListener('mousedown', startPressAdmin);
document.getElementById('user-avatar').addEventListener('mouseup', cancelPressAdmin);
document.querySelector('.nav-btn[data-screen="arena"]').addEventListener('touchstart', startPressAdmin);
document.querySelector('.nav-btn[data-screen="arena"]').addEventListener('touchend', cancelPressAdmin);
document.querySelector('.nav-btn[data-screen="shop"]').addEventListener('touchstart', startPressAdmin);
document.querySelector('.nav-btn[data-screen="shop"]').addEventListener('touchend', cancelPressAdmin);
document.querySelector('.nav-btn[data-screen="wallet"]').addEventListener('touchstart', startPressAdmin);
document.querySelector('.nav-btn[data-screen="wallet"]').addEventListener('touchend', cancelPressAdmin);
