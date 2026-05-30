// ================== КЛУБ ==================
const clubContent = document.getElementById('club-content');

function getMyClub() { return clubs.find(c => c.id == myClubId); }

function renderMyClub() {
    const club = getMyClub();
    if (!club) { clubContent.innerHTML = '<p>Вы не состоите в клубе.</p>'; return; }
    let html = `<h3>${club.emoji||'🐺'} ${club.name}</h3><p>${club.desc||''}</p>`;
    html += `<p><b>Глава:</b> ${club.master}</p><p><b>Офицеры:</b> ${club.officers?.join(', ')||'нет'}</p><p><b>Бойцы:</b> ${club.members?.join(', ')||'нет'}</p>`;
    if (club.master === 'Игрок') html += '<button class="club-btn" id="delete-club-btn">🗑️</button>';
    else html += '<button class="club-btn" id="leave-club-btn">🚪</button>';
    clubContent.innerHTML = html;
    document.getElementById('delete-club-btn')?.addEventListener('click', ()=>{ if(confirm('Распустить клуб?')){ clubs=clubs.filter(c=>c.id!=myClubId); myClubId=null; saveAll(); renderMyClub(); } });
    document.getElementById('leave-club-btn')?.addEventListener('click', ()=>{ if(confirm('Покинуть клуб?')){ club.members = club.members.filter(m=>m!=='Игрок'); myClubId=null; saveAll(); renderMyClub(); } });
}

function renderAllClubs() {
    if (!clubs.length) { clubContent.innerHTML = '<p>Нет клубов.</p>'; return; }
    let html = '';
    clubs.forEach(c => { html += `<div class="task-item"><strong>${c.emoji||'🐺'} ${c.name}</strong> (${c.members?.length||0} уч.)<br>${c.desc||''}<br>${myClubId==c.id ? '✅' : `<button class="club-btn" data-join="${c.id}">Вступить</button>`}</div>`; });
    clubContent.innerHTML = html;
    document.querySelectorAll('[data-join]').forEach(b=>b.addEventListener('click', e=>{
        const club = clubs.find(c=>c.id==e.target.dataset.join);
        if (!club||myClubId) return;
        if (!club.members) club.members=[];
        club.members.push('Игрок'); myClubId=club.id; saveAll(); renderAllClubs();
    }));
}

function showCreateClub() {
    if (rum < 100) return alert('Недостаточно RUM');
    const name = prompt('Название клуба:');
    if (!name) return;
    rum -= 100;
    const newClub = { id: Date.now(), name, emoji: '🐺', desc: '', master: 'Игрок', officers: [], members: ['Игрок'] };
    clubs.push(newClub); myClubId = newClub.id; saveAll(); renderMyClub();
}

document.getElementById('club-my-btn').addEventListener('click', renderMyClub);
document.getElementById('club-all-btn').addEventListener('click', renderAllClubs);
document.getElementById('club-create-btn').addEventListener('click', showCreateClub);
