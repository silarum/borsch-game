// ================== ПРОФИЛЬ И АДМИНКА (SUPABASE) ==================
function updateProfile() {
    document.getElementById('user-nickname').textContent = userNickname;
    const club = clubs.find(c => c.id == myClubId);
    document.getElementById('user-status').textContent = club && club.master === 'Игрок' ?
        translations[currentLang].status_club : translations[currentLang].status_solo;
}

// Статистика (короткое нажатие)
document.getElementById('user-avatar').addEventListener('click', (e) => {
    e.stopPropagation();
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

// Админка (долгое нажатие)
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
    }, 500);
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
    loadWithdrawalRequests();
};

// Заглушки для функций (реализованы в последних версиях)
window.addShopItem = function() { /* ... */ };
window.createTournament = async function() { /* ... */ };
window.viewAllPlayers = async function() { /* ... */ };
window.createSpartanBots = function() { /* ... */ };
window.loadWithdrawalRequests = async function() { /* ... */ };
window.approveWithdrawal = async function(id) { /* ... */ };
window.rejectWithdrawal = async function(id) { /* ... */ };
