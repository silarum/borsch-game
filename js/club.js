// ================== КЛУБ (АРХИТЕКТУРА: РОЛИ, ЧАТ, ВЫЗОВЫ, РЕЙТИНГ, ЛИЦЕНЗИИ) ==================

// Первый клуб — «Голодные Волки», создаётся автоматически
const HUNGRY_WOLVES = {
    id: 'hw01',
    name: 'Голодные Волки',
    emoji: '🐺',
    desc: 'Первый фаундер-клуб. Управляет лицензиями, задаёт стандарты.',
    master: 'silarum',
    officers: [],
    members: ['silarum'],
    rating: 9999,
    licenseIssued: 0,
    chat: [],
    invitations: [],
    isFounder: true
};

// clubs и myClubId объявлены в main.js и используются всеми экранами.
clubs = Array.isArray(clubs) ? clubs : window.readLocalArray('clubs');
if (!clubs.find(c => c.id === 'hw01')) {
    clubs.unshift(HUNGRY_WOLVES);
    localStorage.setItem('clubs', JSON.stringify(clubs));
}

myClubId = myClubId || localStorage.getItem('myClubId') || null;

// Рендер клуба
function renderMyClub() {
    const container = document.getElementById('club-content');
    if (!container) return;

    const club = clubs.find(c => c.id == myClubId);
    if (!club) {
        container.innerHTML = '<p style="color:#aaa;text-align:center;">Вы не состоите в клубе. Создайте новый или вступите в существующий.</p>';
        return;
    }

    const isMaster = club.master === userNickname;
    const isOfficer = club.officers?.includes(userNickname);
    const canManage = isMaster || isOfficer;

    let html = `
        <div class="club-cloud">
            <h3>${window.escapeHtml(club.emoji)} ${window.escapeHtml(club.name)}</h3>
            <p style="color:#aaa;font-size:0.8rem;">${window.escapeHtml(club.desc || '')}</p>
            <div style="display:flex;gap:15px;margin:10px 0;font-size:0.8rem;">
                <span>⭐ Рейтинг: <b style="color:#FFD700;">${club.rating || 0}</b></span>
                <span>👥 Участников: <b>${club.members.length}</b></span>
                ${club.isFounder ? '<span style="color:#FFD700;">👑 Фаундер</span>' : ''}
                ${club.licenseFrom ? `<span style="color:#aaa;">📜 Лицензия от ${window.escapeHtml(club.licenseFrom)}</span>` : ''}
            </div>
            <p><b>Глава:</b> ${window.escapeHtml(club.master)}</p>
            <p><b>Офицеры:</b> ${(club.officers || []).map(window.escapeHtml).join(', ') || 'нет'}</p>
            <p><b>Бойцы:</b> ${(club.members || []).map(window.escapeHtml).join(', ') || 'нет'}</p>
            
            <!-- Кнопки управления -->
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0;">
                ${canManage ? `<button class="club-btn" id="invite-club-btn">👥 Пригласить</button>` : ''}
                ${isMaster ? `<button class="club-btn" id="manage-club-btn">⚙️ Управление</button>` : ''}
                ${!isMaster ? `<button class="club-btn" id="leave-club-btn" style="background:#e74c3c;">🚪 Выйти</button>` : ''}
                ${isMaster ? `<button class="club-btn" id="disband-club-btn" style="background:#e74c3c;">🗑️ Распустить</button>` : ''}
            </div>
            
            <!-- Вызов на Криптобеспредел -->
            ${canManage ? `
                <div style="background:rgba(255,215,0,0.05);border-radius:10px;padding:10px;margin:10px 0;">
                    <p style="color:#FFD700;font-size:0.8rem;">⚔️ Отправить бойцов на Криптобеспредел</p>
                    <select id="club-fighter-select" style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(255,215,0,0.3);background:rgba(0,0,0,0.5);color:white;margin:5px 0;">
                        ${club.members.map(m => `<option value="${window.escapeHtml(m)}">${window.escapeHtml(m)}</option>`).join('')}
                    </select>
                    <div style="display:flex;gap:5px;">
                        <input type="number" id="club-stake-amount" placeholder="Ставка SRUM" value="1" step="0.1" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,215,0,0.3);background:rgba(0,0,0,0.5);color:white;">
                        <button class="club-btn" id="send-to-mining-btn" style="background:#FFD700;color:#000;">⚡ Отправить</button>
                    </div>
                    <p style="color:#aaa;font-size:0.65rem;">Оплата за счёт клуба</p>
                </div>
            ` : ''}
            
            <!-- Чат клуба -->
            <div style="background:rgba(0,0,0,0.3);border-radius:10px;padding:10px;margin:10px 0;max-height:200px;overflow-y:auto;" id="club-chat">
                <p style="color:#FFD700;font-size:0.8rem;">💬 Чат клуба</p>
                ${(club.chat || []).slice(-20).map(msg => `
                    <div style="font-size:0.7rem;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                        <b style="color:#FFD700;">${window.escapeHtml(msg.from)}:</b> ${window.escapeHtml(msg.text)}
                        <span style="color:#666;font-size:0.6rem;">${new Date(msg.time).toLocaleTimeString()}</span>
                    </div>
                `).join('')}
            </div>
            <div style="display:flex;gap:5px;">
                <input type="text" id="club-chat-input" placeholder="Сообщение..." style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,215,0,0.3);background:rgba(0,0,0,0.5);color:white;font-size:0.8rem;">
                <button class="club-btn" id="send-chat-btn">📨</button>
            </div>
            
            <!-- Вызов другого клуба -->
            ${canManage ? `
                <div style="margin-top:10px;">
                    <button class="club-btn" id="challenge-club-btn" style="background:#e74c3c;">⚔️ Вызвать клуб на бой</button>
                </div>
            ` : ''}
        </div>`;

    // Лицензии (только для Голодных Волков)
    if (club.isFounder) {
        html += `
            <div class="club-cloud" style="margin-top:10px;">
                <h3>📜 Выдача лицензий</h3>
                <p style="color:#aaa;font-size:0.7rem;">Как фаундер-клуб, вы можете выдавать лицензии другим клубам</p>
                <select id="license-club-select" style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(255,215,0,0.3);background:rgba(0,0,0,0.5);color:white;margin:5px 0;">
                    ${clubs.filter(c => c.id !== 'hw01' && !c.licenseFrom).map(c => `<option value="${window.escapeHtml(c.id)}">${window.escapeHtml(c.name)}</option>`).join('')}
                </select>
                <button class="club-btn" id="issue-license-btn" style="background:#FFD700;color:#000;">📜 Выдать лицензию</button>
                <p style="color:#aaa;font-size:0.65rem;">Лицензия подтверждает официальный статус клуба</p>
            </div>`;
    }

    container.innerHTML = html;

    // Обработчики
    document.getElementById('send-chat-btn')?.addEventListener('click', () => {
        const input = document.getElementById('club-chat-input');
        const text = input.value.trim().slice(0, 500);
        if (!text) return;
        if (!club.chat) club.chat = [];
        club.chat.push({ from: userNickname, text, time: Date.now() });
        localStorage.setItem('clubs', JSON.stringify(clubs));
        input.value = '';
        renderMyClub();
    });

    document.getElementById('invite-club-btn')?.addEventListener('click', () => {
        const name = prompt('Никнейм бойца:')?.trim().slice(0, 40);
        if (!name || name === userNickname) return;
        if (club.members.includes(name)) return alert('Уже в клубе');
        club.members.push(name);
        localStorage.setItem('clubs', JSON.stringify(clubs));
        renderMyClub();
    });

    document.getElementById('leave-club-btn')?.addEventListener('click', () => {
        if (!confirm('Покинуть клуб?')) return;
        club.members = club.members.filter(m => m !== userNickname);
        if (club.officers) club.officers = club.officers.filter(o => o !== userNickname);
        myClubId = null;
        localStorage.removeItem('myClubId');
        localStorage.setItem('clubs', JSON.stringify(clubs));
        renderMyClub();
    });

    document.getElementById('manage-club-btn')?.addEventListener('click', () => {
        const action = prompt('Управление:\n1. Назначить офицера\n2. Разжаловать офицера\n3. Исключить бойца\n4. Изменить описание');
        if (!action) return;
        if (action === '1') { const name = prompt('Ник:'); if (name && club.members.includes(name) && !club.officers.includes(name)) { if (!club.officers) club.officers = []; club.officers.push(name); alert(`${name} — офицер!`); } }
        if (action === '2') { const name = prompt('Ник:'); if (name && club.officers.includes(name)) { club.officers = club.officers.filter(o => o !== name); alert(`${name} разжалован.`); } }
        if (action === '3') { const name = prompt('Ник:'); if (name && club.members.includes(name) && name !== club.master) { club.members = club.members.filter(m => m !== name); if (club.officers) club.officers = club.officers.filter(o => o !== name); alert(`${name} исключён.`); } }
        if (action === '4') { const desc = prompt('Описание:'); if (desc) { club.desc = desc; alert('Обновлено!'); } }
        localStorage.setItem('clubs', JSON.stringify(clubs));
        renderMyClub();
    });

    document.getElementById('disband-club-btn')?.addEventListener('click', () => {
        if (!confirm('Распустить клуб навсегда?')) return;
        if (!confirm('Точно?')) return;
        clubs = clubs.filter(c => c.id !== club.id);
        myClubId = null;
        localStorage.setItem('clubs', JSON.stringify(clubs));
        localStorage.removeItem('myClubId');
        renderMyClub();
    });

    document.getElementById('send-to-mining-btn')?.addEventListener('click', () => {
        const fighter = document.getElementById('club-fighter-select').value;
        const stake = parseFloat(document.getElementById('club-stake-amount').value) || 1;
        if (srum < stake) return alert('Недостаточно SRUM в казне клуба');
        if (!confirm(`Отправить ${fighter} на Криптобеспредел со ставкой ${stake} SRUM за счёт клуба?`)) return;
        srum -= stake;
        updateUI();
        saveAll();
        alert(`⚡ ${fighter} отправлен на майнинг! Ставка ${stake} SRUM оплачена клубом.`);
        // TODO: реальная интеграция с майнингом
    });

    document.getElementById('challenge-club-btn')?.addEventListener('click', () => {
        const otherClubs = clubs.filter(c => c.id !== club.id);
        if (!otherClubs.length) return alert('Нет других клубов');
        const names = otherClubs.map(c => `${c.emoji} ${c.name}`).join('\n');
        const target = prompt(`Кого вызвать?\n${names}\nВведи название:`);
        const targetClub = clubs.find(c => c.name === target);
        if (!targetClub) return alert('Клуб не найден');
        const stake = parseFloat(prompt('Ставка SRUM:', '10'));
        if (!stake || isNaN(stake)) return;
        if (srum < stake) return alert('Недостаточно SRUM');
        if (!confirm(`Вызвать ${targetClub.name} на бой! Ставка: ${stake} SRUM`)) return;
        srum -= stake;
        updateUI();
        saveAll();
        alert(`⚔️ Вызов отправлен клубу ${targetClub.name}!`);
        if (!targetClub.invitations) targetClub.invitations = [];
        targetClub.invitations.push({ from: club.name, stake, time: Date.now() });
        localStorage.setItem('clubs', JSON.stringify(clubs));
    });

    document.getElementById('issue-license-btn')?.addEventListener('click', () => {
        const clubId = document.getElementById('license-club-select').value;
        const targetClub = clubs.find(c => c.id === clubId);
        if (!targetClub) return;
        if (!confirm(`Выдать лицензию клубу ${targetClub.name}?`)) return;
        targetClub.licenseFrom = club.name;
        club.licenseIssued = (club.licenseIssued || 0) + 1;
        localStorage.setItem('clubs', JSON.stringify(clubs));
        alert(`📜 Лицензия выдана клубу ${targetClub.name}!`);
        renderMyClub();
    });
}

function renderAllClubs() {
    const container = document.getElementById('club-content');
    if (!container) return;
    let html = '<h3>🐺 Все клубы</h3>';
    clubs.forEach(c => {
        html += `<div class="club-cloud">
            <strong>${window.escapeHtml(c.emoji)} ${window.escapeHtml(c.name)}</strong> ${c.isFounder ? '👑' : ''}
            <p style="font-size:0.7rem;">⭐ ${Number(c.rating) || 0} | 👥 ${(c.members || []).length} | Глава: ${window.escapeHtml(c.master)}</p>
            ${c.licenseFrom ? `<p style="font-size:0.65rem;color:#aaa;">📜 Лицензия: ${window.escapeHtml(c.licenseFrom)}</p>` : ''}
            ${!myClubId ? `<button class="club-btn" data-join="${window.escapeHtml(c.id)}">Вступить</button>` : ''}
        </div>`;
    });
    container.innerHTML = html;
    document.querySelectorAll('[data-join]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const club = clubs.find(c => c.id == e.target.dataset.join);
            if (!club || myClubId) return;
            club.members.push(userNickname);
            myClubId = club.id;
            localStorage.setItem('myClubId', club.id);
            localStorage.setItem('clubs', JSON.stringify(clubs));
            renderMyClub();
        });
    });
}

function showCreateClub() {
    const container = document.getElementById('club-content');
    if (!container) return;
    container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:10px;">
            <h3>🐺 Создать клуб</h3>
            <input id="club-name" placeholder="Название" class="admin-input">
            <input id="club-emoji" placeholder="Эмодзи" value="🐺" class="admin-input">
            <input id="club-desc" placeholder="Описание" class="admin-input">
            <p style="color:#aaa;font-size:0.8rem;">Стоимость: 100 RUM</p>
            <button id="club-create-submit" class="club-btn" style="background:#4CAF50;">Создать клуб</button>
        </div>
    `;
    document.getElementById('club-create-submit').addEventListener('click', () => {
        const name = document.getElementById('club-name').value.trim().slice(0, 50);
        const emoji = document.getElementById('club-emoji').value.trim().slice(0, 8) || '🐺';
        const desc = document.getElementById('club-desc').value.trim().slice(0, 240);
        if (!name || rum < 100) return alert('Недостаточно RUM или пустое название');
        rum -= 100;
        const newClub = {
            id: 'club_' + Date.now(),
            name, emoji, desc,
            master: userNickname,
            officers: [],
            members: [userNickname],
            rating: 0,
            chat: [],
            invitations: [],
            isFounder: false
        };
        clubs.push(newClub);
        myClubId = newClub.id;
        localStorage.setItem('clubs', JSON.stringify(clubs));
        localStorage.setItem('myClubId', myClubId);
        updateUI();
        saveAll();
        renderMyClub();
    });
}

document.getElementById('club-my-btn')?.addEventListener('click', () => {
    if (window.ClubLeaguePlatform) window.ClubLeaguePlatform.renderHub('my');
    else renderMyClub();
});
document.getElementById('club-all-btn')?.addEventListener('click', () => {
    if (window.ClubLeaguePlatform) window.ClubLeaguePlatform.renderHub('leagues');
    else renderAllClubs();
});
document.getElementById('club-create-btn')?.addEventListener('click', () => {
    if (window.ClubLeaguePlatform) window.ClubLeaguePlatform.renderHub('create');
    else showCreateClub();
});
