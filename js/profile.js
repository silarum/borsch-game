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
            <button onclick="document.getElementById('admin-modal').classList.remove('active')">Выход</button>
        `;
    } else alert('Неверный логин/пароль');
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
