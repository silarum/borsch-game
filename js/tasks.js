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
subTabs.forEach(t => t.addEventListener('click', () => { currentTasksTab = t.dataset.tab; renderAvailableTasks(); }));
