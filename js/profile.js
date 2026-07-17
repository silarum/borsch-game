// Профиль игрока. Админ-панель удалена из публичного клиента: операции
// управления пользователями и балансами должны выполняться только сервером.
function updateProfile() {
    const nickname = document.getElementById('user-nickname');
    const status = document.getElementById('user-status');
    if (nickname) nickname.textContent = userNickname;
    if (status) {
        const club = clubs.find(c => c.id == myClubId);
        status.textContent = club && club.master === userNickname ? 'Глава клуба' : 'Одиночка';
    }
}

document.getElementById('user-avatar')?.addEventListener('click', (event) => {
    event.stopPropagation();
    document.getElementById('stats-nickname').textContent = userNickname;
    document.getElementById('stats-rum').textContent = rum.toLocaleString();
    document.getElementById('stats-srum').textContent = srum.toFixed(2);
    document.getElementById('stats-usdt').textContent = '0.00 (отключено)';
    document.getElementById('stats-ton').textContent = '0.00 (отключено)';
    document.getElementById('stats-modal').classList.add('active');
});

document.getElementById('user-menu-btn')?.addEventListener('click', (event) => {
    event.stopPropagation();
    document.getElementById('menu-dropdown').classList.toggle('active');
});

document.addEventListener('click', (event) => {
    const menu = document.getElementById('menu-dropdown');
    const button = document.getElementById('user-menu-btn');
    if (menu && !menu.contains(event.target) && event.target !== button) {
        menu.classList.remove('active');
    }
});
