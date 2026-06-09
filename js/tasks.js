// ================== ЗАДАНИЯ ==================
const tasksContent = document.getElementById('tasks-content');
const subTabs = document.querySelectorAll('.sub-tab');
let currentTasksTab = 'borsch';

function findTaskById(id, type) {
    if (type === 'borsch') return officialRumTasks.find(t => t.id === id);
    if (type === 'srum') return officialSrumTasks.find(t => t.id === id);
    if (type === 'private_rum' || type === 'private_srum') return globalUserTasks.find(t => t.id === id);
    return null;
}

function renderAvailableTasks() {
    subTabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`.sub-tab[data-tab="${currentTasksTab}"]`).classList.add('active');
    let tasks = [];
    if (currentTasksTab === 'borsch') tasks = officialRumTasks.filter(t => t.completionsDone < t.maxCompletions);
    else if (currentTasksTab === 'srum') tasks = officialSrumTasks.filter(t => t.completionsDone < t.maxCompletions);
    else if (currentTasksTab === 'private_rum') tasks = globalUserTasks.filter(t => !t.completed && t.author !== 'Ты' && t.currency === 'RUM');
    else if (currentTasksTab === 'private_srum') tasks = globalUserTasks.filter(t => !t.completed && t.author !== 'Ты' && t.currency === 'SRUM');
    let html = '';
    if (tasks.length === 0) html = '<p>Нет доступных заданий.</p>';
    tasks.forEach(task => {
        const rew = task.currency==='SRUM' ? `${task.reward} SRUM` : `${task.reward} RUM`;
        html += `<div class="task-item"><span>${task.desc} (${rew})</span><div style="display:flex;gap:8px;">${task.link?`<button class="open-link-btn" data-url="${task.link}">🔗 Выполнить</button>`:''} <button class="verify-btn" data-task-id="${task.id}" data-type="${currentTasksTab}">Я выполнил</button></div></div>`;
    });
    tasksContent.innerHTML = html;
    document.querySelectorAll('.open-link-btn').forEach(b => b.addEventListener('click', e => { const u = e.target.dataset.url; if(u) window.open(u,'_blank'); }));
    document.querySelectorAll('.verify-btn').forEach(b => b.addEventListener('click', e => {
        const id = parseInt(e.target.dataset.taskId), type = e.target.dataset.type, task = findTaskById(id, type);
        if (!task || task.checking) return;
        task.checking = true; saveAll(); renderAvailableTasks();
        e.target.textContent = '⏳'; e.target.disabled = true;
        setTimeout(() => {
            task.checking = false; task.completionsDone = (task.completionsDone||0)+1;
            const reward = task.reward * 0.7;
            if (task.currency==='SRUM') srum += reward; else rum += Math.floor(reward);
            invest += Math.ceil(task.reward*0.3);
            updateUI(); renderAvailableTasks();
        }, 3000);
    }));
}

function renderCreateTask() {
    const max = 3;
    const currentCount = userTasks.length; const canCreate = currentCount < max;
    tasksContent.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;"><p>Лимит созданных: ${currentCount}/${max}</p>
        <input id="task-desc" placeholder="Описание задания" ${canCreate ? '' : 'disabled'}>
        <input id="task-reward" type="number" placeholder="Награда" ${canCreate ? '' : 'disabled'}>
        <select id="task-currency" ${canCreate ? '' : 'disabled'}>
            <option value="RUM">RUM</option>
            <option value="SRUM">SRUM</option>
        </select>
        <input id="task-link" type="url" placeholder="Ссылка на задание" ${canCreate ? '' : 'disabled'}>
        <button id="publish-task-btn" style="padding:14px; background:#4CAF50; border:none; border-radius:10px; font-weight:bold; color:white; box-shadow:0 4px 12px rgba(76,175,80,0.5);" ${canCreate ? '' : 'disabled'}>Опубликовать</button></div>`;
    if (canCreate) {
        document.getElementById('publish-task-btn').addEventListener('click', () => {
            const desc = document.getElementById('task-desc').value.trim();
            const reward = parseFloat(document.getElementById('task-reward').value);
            const currency = document.getElementById('task-currency').value;
            const link = document.getElementById('task-link').value.trim();
            if (desc && reward > 0) {
                if (currency === 'RUM' && rum >= reward) rum -= Math.ceil(reward);
                else if (currency === 'SRUM' && srum >= reward) srum -= reward;
                else { alert('Недостаточно средств'); return; }
                const newTask = { id: Date.now(), desc, reward, currency, link, author: 'Ты', completed: false, checking: false };
                userTasks.push(newTask); globalUserTasks.push(newTask);
                updateUI(); renderCreateTask(); alert('Задание опубликовано!');
            } else alert('Неверные данные');
        });
    }
}

function renderMyTasks() {
    let html = '<h3>Выполненные официальные</h3>';
    officialRumTasks.concat(officialSrumTasks).forEach(t => {
        if (t.completionsDone > 0) {
            const type = officialRumTasks.includes(t) ? 'RUM' : 'SRUM';
            html += `<div>✅ ${t.desc} — ${t.completionsDone} раз (${(t.completionsDone * t.reward).toFixed(type==='SRUM'?2:0)} ${type})</div>`;
        }
    });
    html += '<h3>Созданные мной</h3>';
    if (userTasks.length === 0) html += '<p>Нет созданных заданий</p>';
    userTasks.forEach(t => {
        html += `<div class="task-item" id="my-task-${t.id}">
            <div class="editable"><input id="desc-${t.id}" value="${t.desc}" /><input id="reward-${t.id}" type="number" value="${t.reward}" /><input id="link-${t.id}" value="${t.link || ''}" /></div>
            <div style="display:flex; gap:8px; justify-content: space-between;"><span>${t.reward} ${t.currency}</span>
                <div><button class="edit-task-btn" data-task-id="${t.id}" style="padding:8px 14px; background:#2196F3; border:none; border-radius:6px; color:white; font-weight:bold;">✏️</button><button class="delete-task-btn" data-task-id="${t.id}" style="padding:8px 14px; background:#F44336; border:none; border-radius:6px; color:white; font-weight:bold;">🗑️</button></div></div></div>`;
    });
    tasksContent.innerHTML = html;
    // ... обработчики редактирования/удаления (без изменений)
}

subTabs.forEach(t => t.addEventListener('click', () => { currentTasksTab = t.dataset.tab; renderAvailableTasks(); }));
