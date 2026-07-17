// ================== ЗАДАНИЯ ==================
const tasksContent = document.getElementById('tasks-content');
const categoryTabs = document.querySelectorAll('.sub-tab[data-tab]');
let currentTasksTab = 'borsch';

function getSafeTaskUrl(value) {
    if (!value) return '';
    try {
        const url = new URL(value, window.location.origin);
        return url.protocol === 'https:' ? url.href : '';
    } catch (_) {
        return '';
    }
}

function findTaskById(id, type) {
    if (type === 'borsch') return officialRumTasks.find(t => t.id === id);
    if (type === 'srum') return officialSrumTasks.find(t => t.id === id);
    if (type === 'private_rum' || type === 'private_srum') return globalUserTasks.find(t => t.id === id);
    return null;
}

function renderAvailableTasks() {
    categoryTabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`.sub-tab[data-tab="${currentTasksTab}"]`)?.classList.add('active');
    document.getElementById('tasks-available-btn')?.classList.add('active');
    document.getElementById('tasks-create-btn')?.classList.remove('active');
    document.getElementById('tasks-my-btn')?.classList.remove('active');
    let tasks = [];
    if (currentTasksTab === 'borsch') tasks = officialRumTasks.filter(t => t.completionsDone < t.maxCompletions);
    else if (currentTasksTab === 'srum') tasks = officialSrumTasks.filter(t => t.completionsDone < t.maxCompletions);
    else if (currentTasksTab === 'private_rum') tasks = globalUserTasks.filter(t => !t.completed && t.author !== 'Ты' && t.currency === 'RUM');
    else if (currentTasksTab === 'private_srum') tasks = globalUserTasks.filter(t => !t.completed && t.author !== 'Ты' && t.currency === 'SRUM');
    let html = '';
    if (tasks.length === 0) html = '<p>Нет доступных заданий.</p>';
    tasks.forEach(task => {
        const rew = task.currency==='SRUM' ? `${task.reward} SRUM` : `${task.reward} RUM`;
        const safeUrl = getSafeTaskUrl(task.link);
        html += `<div class="task-item"><span>${window.escapeHtml(task.desc)} (${window.escapeHtml(rew)})</span><div style="display:flex;gap:8px;">${safeUrl?`<button class="open-link-btn" data-url="${window.escapeHtml(safeUrl)}">🔗 Открыть</button>`:''} <button class="verify-btn" data-task-id="${Number(task.id)}" data-type="${window.escapeHtml(currentTasksTab)}">Завершить демо</button></div></div>`;
    });
    tasksContent.innerHTML = html;
    document.querySelectorAll('.open-link-btn').forEach(b => b.addEventListener('click', e => { const u = e.target.dataset.url; if(u) window.open(u, '_blank', 'noopener,noreferrer'); }));
    document.querySelectorAll('.verify-btn').forEach(b => b.addEventListener('click', e => {
        const id = parseInt(e.target.dataset.taskId), type = e.target.dataset.type, task = findTaskById(id, type);
        if (!task || task.checking) return;
        task.checking = true; saveAll(); renderAvailableTasks();
        task.checking = false; task.completionsDone = (task.completionsDone||0)+1;
        if (type === 'private_rum' || type === 'private_srum') task.completed = true;
        const reward = task.reward * 0.7;
        if (task.currency==='SRUM') srum += reward; else rum += Math.floor(reward);
        invest += Math.ceil(task.reward*0.3);
        updateUI(); renderAvailableTasks();
    }));
}

function renderCreateTask() {
    document.getElementById('tasks-available-btn')?.classList.remove('active');
    document.getElementById('tasks-create-btn')?.classList.add('active');
    document.getElementById('tasks-my-btn')?.classList.remove('active');
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
            const rawLink = document.getElementById('task-link').value.trim();
            const link = getSafeTaskUrl(rawLink);
            if (desc && reward > 0) {
                if (rawLink && !link) return alert('Допустимы только безопасные ссылки https://');
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
    document.getElementById('tasks-available-btn')?.classList.remove('active');
    document.getElementById('tasks-create-btn')?.classList.remove('active');
    document.getElementById('tasks-my-btn')?.classList.add('active');
    let html = '<h3>Выполненные официальные</h3>';
    officialRumTasks.concat(officialSrumTasks).forEach(t => {
        if (t.completionsDone > 0) {
            const type = officialRumTasks.includes(t) ? 'RUM' : 'SRUM';
            html += `<div>✅ ${window.escapeHtml(t.desc)} — ${Number(t.completionsDone)} раз (${(t.completionsDone * t.reward).toFixed(type==='SRUM'?2:0)} ${type})</div>`;
        }
    });
    html += '<h3>Созданные мной</h3>';
    if (userTasks.length === 0) html += '<p>Нет созданных заданий</p>';
    userTasks.forEach(t => {
        const id = Number(t.id);
        html += `<div class="task-item" id="my-task-${id}">
            <div class="editable"><input id="desc-${id}" value="${window.escapeHtml(t.desc)}" maxlength="160" /><input id="reward-${id}" type="number" value="${Number(t.reward)}" disabled /><input id="link-${id}" value="${window.escapeHtml(t.link || '')}" /></div>
            <div style="display:flex; gap:8px; justify-content: space-between;"><span>${Number(t.reward)} ${window.escapeHtml(t.currency)}</span>
                <div><button class="edit-task-btn" data-task-id="${id}" style="padding:8px 14px; background:#2196F3; border:none; border-radius:6px; color:white; font-weight:bold;">✏️</button><button class="delete-task-btn" data-task-id="${id}" style="padding:8px 14px; background:#F44336; border:none; border-radius:6px; color:white; font-weight:bold;">🗑️</button></div></div></div>`;
    });
    tasksContent.innerHTML = html;
    document.querySelectorAll('.edit-task-btn').forEach(button => button.addEventListener('click', () => {
        const id = Number(button.dataset.taskId);
        const task = userTasks.find(item => Number(item.id) === id);
        if (!task) return;
        const desc = document.getElementById(`desc-${id}`).value.trim().slice(0, 160);
        const rawLink = document.getElementById(`link-${id}`).value.trim();
        const link = getSafeTaskUrl(rawLink);
        if (!desc) return alert('Введите описание');
        if (rawLink && !link) return alert('Допустимы только безопасные ссылки https://');
        task.desc = desc;
        task.link = link;
        const globalTask = globalUserTasks.find(item => Number(item.id) === id);
        if (globalTask) { globalTask.desc = desc; globalTask.link = link; }
        saveAll();
        alert('Задание обновлено');
    }));
    document.querySelectorAll('.delete-task-btn').forEach(button => button.addEventListener('click', () => {
        const id = Number(button.dataset.taskId);
        const task = userTasks.find(item => Number(item.id) === id);
        if (!task || !confirm('Удалить задание и вернуть игровую награду?')) return;
        if (!task.completed) {
            if (task.currency === 'SRUM') srum += Number(task.reward) || 0;
            else rum += Math.ceil(Number(task.reward) || 0);
        }
        userTasks = userTasks.filter(item => Number(item.id) !== id);
        globalUserTasks = globalUserTasks.filter(item => Number(item.id) !== id);
        updateUI();
        renderMyTasks();
    }));
}

categoryTabs.forEach(t => t.addEventListener('click', () => { currentTasksTab = t.dataset.tab; renderAvailableTasks(); }));
document.getElementById('tasks-available-btn')?.addEventListener('click', renderAvailableTasks);
document.getElementById('tasks-create-btn')?.addEventListener('click', renderCreateTask);
document.getElementById('tasks-my-btn')?.addEventListener('click', renderMyTasks);
