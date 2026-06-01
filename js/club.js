// ================== КЛУБ ==================
const clubContent = document.getElementById('club-content');

function getMyClub() { return clubs.find(c => c.id == myClubId); }

function renderMyClub() {
    const club = getMyClub();
    if (!club) { clubContent.innerHTML = '<p>Вы не состоите в клубе.</p>'; return; }
    const amIMaster = club.master === 'Игрок';
    const amIOfficer = club.officers?.includes('Игрок');
    let html = `<div class="club-cloud">`;
    html += `<h3>${club.emoji||'🐺'} ${club.name}</h3><p>${club.desc||''}</p>`;
    html += `<p><b>Глава:</b> ${club.master||'—'}</p><p><b>Офицеры:</b> ${club.officers?.join(', ')||'нет'}</p><p><b>Бойцы:</b> ${club.members?.join(', ')||'нет'}</p>`;
    html += '<div style="display:flex; gap:6px; flex-wrap:wrap; margin:10px 0;">';
    if (amIMaster) {
        html += '<button class="club-btn" id="edit-club-btn">✏️</button><button class="club-btn" id="invite-member-btn">👥</button><button class="club-btn" id="manage-officers-btn">🛡️</button><button class="club-btn" id="delete-club-btn">🗑️</button>';
    } else if (amIOfficer) {
        html += '<button class="club-btn" id="invite-member-btn">👥</button><button class="club-btn" id="leave-club-btn">🚪</button>';
    } else { html += '<button class="club-btn" id="leave-club-btn">🚪</button>'; }
    html += '</div></div>';
    clubContent.innerHTML = html;

    if (amIMaster) {
        document.getElementById('edit-club-btn').addEventListener('click', () => {
            clubContent.innerHTML = `<div style="display:flex; flex-direction:column; gap:8px;"><input id="edit-name" value="${club.name}"><input id="edit-emoji" value="${club.emoji}"><input id="edit-desc" value="${club.desc}"><button id="save-club-btn" style="background:#4CAF50; padding:10px;">Сохранить</button></div>`;
            document.getElementById('save-club-btn').addEventListener('click', () => {
                club.name = document.getElementById('edit-name').value.trim() || club.name;
                club.emoji = document.getElementById('edit-emoji').value.trim() || club.emoji;
                club.desc = document.getElementById('edit-desc').value.trim();
                saveAll(); renderMyClub();
            });
        });
        document.getElementById('invite-member-btn').addEventListener('click', () => { const name = prompt('Имя бойца:'); if (name) { if (!club.members) club.members = []; club.members.push(name); saveAll(); renderMyClub(); } });
        document.getElementById('manage-officers-btn').addEventListener('click', () => {
            let list = '<div><p><b>Назначить офицера:</b></p>';
            const fighters = club.members?.filter(m => m !== club.master && !club.officers?.includes(m)) || [];
            if (fighters.length) fighters.forEach(f => list += `<button class="club-btn" data-name="${f}">${f} 👆</button>`);
            else list += '<p>Нет бойцов.</p>';
            list += '<p><b>Разжаловать:</b></p>';
            if (club.officers?.length) club.officers.forEach(o => list += `<button class="club-btn" data-name="${o}">${o} 👇</button>`);
            else list += '<p>Нет офицеров.</p>';
            list += '</div>';
            clubContent.innerHTML = list;
            document.querySelectorAll('.promote-btn').forEach(b => b.addEventListener('click', e => { if (!club.officers) club.officers = []; club.officers.push(e.target.dataset.name); saveAll(); renderMyClub(); }));
            document.querySelectorAll('.demote-btn').forEach(b => b.addEventListener('click', e => { club.officers = club.officers.filter(o => o !== e.target.dataset.name); saveAll(); renderMyClub(); }));
        });
        document.getElementById('delete-club-btn').addEventListener('click', () => { if (confirm('Распустить клуб?')) { clubs = clubs.filter(c => c.id != myClubId); myClubId = null; saveAll(); renderMyClub(); } });
    } else {
        if (document.getElementById('invite-member-btn')) document.getElementById('invite-member-btn').addEventListener('click', () => { const name = prompt('Имя бойца:'); if (name) { if (!club.members) club.members = []; club.members.push(name); saveAll(); renderMyClub(); } });
        if (document.getElementById('leave-club-btn')) document.getElementById('leave-club-btn').addEventListener('click', () => {
            if (confirm('Покинуть клуб?')) { club.members = club.members.filter(m => m !== 'Игрок'); if (club.officers?.includes('Игрок')) club.officers = club.officers.filter(o => o !== 'Игрок'); myClubId = null; saveAll(); renderMyClub(); }
        });
    }
}

function renderAllClubs() {
    if (!clubs.length) { clubContent.innerHTML = '<p>Нет клубов.</p>'; return; }
    let html = '';
    clubs.forEach(c => {
        const isMember = myClubId == c.id;
        html += `<div class="club-cloud"><strong>${c.emoji||'🐺'} ${c.name}</strong> (${c.members?.length||0} уч.)<br>${c.desc||''}<br>${isMember ? '<span>✅ Вы в клубе</span>' : `<button class="club-btn" data-join="${c.id}">Вступить</button>`}</div>`;
    });
    clubContent.innerHTML = html;
    document.querySelectorAll('[data-join]').forEach(b => b.addEventListener('click', e => {
        const club = clubs.find(c => c.id == e.target.dataset.join);
        if (!club || myClubId) return;
        if (!club.members) club.members = [];
        club.members.push('Игрок'); myClubId = club.id; saveAll(); renderAllClubs();
    }));
}

function showCreateClub() {
    clubContent.innerHTML = `<div style="display:flex; flex-direction:column; gap:10px;"><input id="club-name" placeholder="Название"><input id="club-emoji" placeholder="Эмодзи"><input id="club-desc" placeholder="Описание"><p>Стоимость: 100 RUM</p><button id="club-create-submit" class="club-btn" style="background:#4CAF50;">Создать клуб</button></div>`;
    document.getElementById('club-create-submit').addEventListener('click', () => {
        const name = document.getElementById('club-name').value.trim();
        const emoji = document.getElementById('club-emoji').value.trim() || '🐺';
        const desc = document.getElementById('club-desc').value.trim();
        if (!name || rum < 100) return alert('Недостаточно RUM или пустое название');
        rum -= 100;
        const newClub = { id: Date.now(), name, emoji, desc, master: 'Игрок', officers: [], members: ['Игрок'] };
        clubs.push(newClub); myClubId = newClub.id; saveAll(); updateUI(); renderMyClub();
    });
}

document.getElementById('club-my-btn').addEventListener('click', renderMyClub);
document.getElementById('club-all-btn').addEventListener('click', renderAllClubs);
document.getElementById('club-create-btn').addEventListener('click', showCreateClub);
