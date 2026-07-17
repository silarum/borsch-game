(function () {
    'use strict';

    const tg = window.Telegram?.WebApp;
    const view = document.getElementById('view');
    const loading = document.getElementById('loading');
    const toast = document.getElementById('toast');
    const connection = document.getElementById('connection');
    const connectionLabel = document.getElementById('connection-label');
    const refreshButton = document.getElementById('refresh-btn');
    const updatedAt = document.getElementById('updated-at');
    const state = { data: null, tab: 'overview', spartanQuery: '', playerQuery: '' };

    const esc = (value) => String(value ?? '')
        .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
    const number = (value, digits = 0) => Number(value || 0).toLocaleString('ru-RU', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });
    const checked = (value) => value ? 'checked' : '';
    const stageLine = () => `<div class="stage-line">${[10, 20, 40, 80, 100]
        .map((rate, index) => `<div class="stage">${index + 1}<br>−${rate}%</div>`).join('')}</div>`;

    function haptic(type = 'light') {
        try { tg?.HapticFeedback?.impactOccurred(type); } catch (_) { /* no-op */ }
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 2200);
    }

    function setConnection(kind, label) {
        connection.className = `connection ${kind}`;
        connectionLabel.textContent = label;
    }

    async function api(action, payload = {}) {
        const initData = tg?.initData || '';
        if (!initData) throw new Error('Откройте админку кнопкой внутри Telegram-бота.');
        const response = await fetch(`${window.ADMIN_CONFIG.supabaseUrl}/functions/v1/admin-api`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': window.ADMIN_CONFIG.supabasePublishableKey
            },
            body: JSON.stringify({ action, payload, initData })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || `Ошибка сервера ${response.status}`);
        return result;
    }

    function sessionStats() {
        const sessions = state.data?.sessions || [];
        return {
            humans: sessions.filter((item) => item.participant_kind === 'human' && item.status !== 'ended').length,
            spartans: sessions.filter((item) => item.participant_kind === 'spartan' && item.status !== 'ended').length,
            locked: sessions.reduce((sum, item) => sum + Number(item.stake_remaining_srum || 0), 0)
        };
    }

    function renderOverview() {
        const data = state.data;
        const bots = data.spartans || [];
        const stats = sessionStats();
        const treasury = data.treasury || {};
        const activeBots = bots.filter((bot) => bot.active).length;
        const miningBots = bots.filter((bot) => bot.state === 'mining').length;
        const queuedBots = bots.filter((bot) => ['queued', 'matched'].includes(bot.state)).length;
        view.innerHTML = `
            <section class="hero">
                <p class="hero-kicker">КАЗНА ПРОЕКТА</p>
                <h2 class="hero-value">${number(treasury.srum_balance, 2)} <small>SRUM</small></h2>
                <p class="hero-sub">Казна получает ровно 30% каждого штрафа. Победителю автоматически начисляется 70%.</p>
                <div class="split-rule"><span><b>70%</b> победителю</span><span><b>30%</b> в казну</span><span><b>5 этап</b> у майнера до поражения</span></div>
            </section>
            <section class="metric-grid">
                <article class="metric green"><span class="metric-label">Спартанцы</span><b class="metric-value">${activeBots}/300</b><span class="metric-note">активны</span></article>
                <article class="metric gold"><span class="metric-label">Майнят RUMIR</span><b class="metric-value">${miningBots}</b><span class="metric-note">прямо сейчас</span></article>
                <article class="metric blue"><span class="metric-label">В пулах</span><b class="metric-value">${stats.humans + stats.spartans}</b><span class="metric-note">${stats.humans} игроков · ${queuedBots} ботов</span></article>
                <article class="metric purple"><span class="metric-label">Взносы</span><b class="metric-value">${number(stats.locked, 2)}</b><span class="metric-note">SRUM заблокировано</span></article>
            </section>
            <section class="card">
                <div class="card-head"><div><h3>Пятиэтапная логика</h3><p>Майнер после поражения возвращается на первый этап, сохраняя остаток взноса. Спартанец после поражения гарантированно выигрывает на следующем этапе, а после победы начинает новый цикл.</p></div><span class="pill">АКТИВНА</span></div>
                ${stageLine()}
            </section>
            <section class="card">
                <div class="card-head"><div><h3>Последняя активность</h3><p>Движения спартанцев и действия администраторов.</p></div></div>
                ${(data.activity || []).slice(0, 8).map((item) => `<div class="card-row"><span>Спартанец #${Number(item.spartan_id)} · ${activityLabel(item.action)}</span><small>${dateTime(item.created_at)}</small></div>`).join('') || '<div class="empty">Активности пока нет</div>'}
            </section>`;
    }

    function activityLabel(action) {
        return ({ mine_rumir: 'майнит RUMIR', join_pool: 'вошёл в пул', leave_pool: 'вышел из пула', match: 'завершил бой', cooldown: 'восстанавливается', admin_change: 'изменён админом' })[action] || action;
    }

    function dateTime(value) {
        if (!value) return '—';
        return new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    function renderPools() {
        const totals = new Map((state.data.poolTotals || []).map((pool) => [pool.id, pool]));
        const cards = (state.data.pools || []).map((pool) => {
            const total = totals.get(pool.id) || {};
            return `<article class="card">
                <div class="card-head"><div><h3>${esc(pool.name)}</h3><p>${esc(pool.description || 'Без описания')}</p></div><span class="pill ${pool.enabled ? '' : 'off'}">${pool.enabled ? 'РАБОТАЕТ' : 'ВЫКЛЮЧЕН'}</span></div>
                <div class="pool-fund">
                    <div class="fund-cell"><small>ПУЛ USDT</small><strong>${number(total.display_usdt ?? pool.base_usdt, 2)}</strong></div>
                    <div class="fund-cell"><small>ПУЛ TON</small><strong>${number(total.display_ton ?? pool.base_ton, 3)}</strong></div>
                    <div class="fund-cell"><small>ИГРОКИ</small><strong>${Number(total.players || 0)}</strong></div>
                    <div class="fund-cell"><small>СПАРТАНЦЫ</small><strong>${Number(total.spartans || 0)}</strong></div>
                </div>
                <p>Вход ${number(pool.entry_srum_min, 2)}–${number(pool.entry_srum_max, 2)} SRUM · цель ${Number(pool.target_queue_size)} участников</p>
                ${stageLine()}
                <div class="button-row"><button class="button secondary edit-pool" data-id="${pool.id}">Настроить</button><button class="button small toggle-pool" data-id="${pool.id}">${pool.enabled ? 'Отключить' : 'Включить'}</button></div>
            </article>`;
        }).join('');
        view.innerHTML = `
            <div class="section-heading"><div><h2>Игровые пулы</h2><p>Фонды, входы, очереди и спартанцы.</p></div><button class="button small" id="new-pool">+ Создать</button></div>
            <div id="pool-form-slot"></div>
            <section class="pool-list">${cards || '<div class="empty">Создайте первый пул</div>'}</section>`;
    }

    function poolForm(pool = {}) {
        return `<form id="pool-form" class="card">
            <div class="card-head"><div><h3>${pool.id ? 'Настройка пула' : 'Новый пул'}</h3><p>Суммы игроков автоматически прибавляются к показанному фонду.</p></div></div>
            <input type="hidden" name="id" value="${esc(pool.id || '')}">
            <div class="form-grid">
                <div class="field wide"><label>Название</label><input required maxlength="80" name="name" value="${esc(pool.name || '')}"></div>
                <div class="field wide"><label>Описание</label><textarea maxlength="500" name="description">${esc(pool.description || '')}</textarea></div>
                <div class="field"><label>Базовый USDT</label><input type="number" min="0" step="0.01" name="base_usdt" value="${Number(pool.base_usdt || 0)}"></div>
                <div class="field"><label>Базовый TON</label><input type="number" min="0" step="0.001" name="base_ton" value="${Number(pool.base_ton || 0)}"></div>
                <div class="field"><label>Вход по умолчанию, SRUM</label><input type="number" min="0.01" step="0.01" name="entry_srum_default" value="${Number(pool.entry_srum_default || 1)}"></div>
                <div class="field"><label>Выплата</label><select name="payout_asset"><option ${pool.payout_asset !== 'TON' ? 'selected' : ''}>USDT</option><option ${pool.payout_asset === 'TON' ? 'selected' : ''}>TON</option></select></div>
                <div class="field"><label>Минимальный вход</label><input type="number" min="0.01" step="0.01" name="entry_srum_min" value="${Number(pool.entry_srum_min || .01)}"></div>
                <div class="field"><label>Максимальный вход</label><input type="number" min="0.01" step="0.01" name="entry_srum_max" value="${Number(pool.entry_srum_max || 300)}"></div>
                <div class="field"><label>Спартанцы при игроках меньше</label><input type="number" min="0" max="300" name="activation_threshold" value="${Number(pool.activation_threshold ?? 2)}"></div>
                <div class="field"><label>Целевой размер пула</label><input type="number" min="1" max="300" name="target_queue_size" value="${Number(pool.target_queue_size || 10)}"></div>
                <div class="field"><label>Курс TON за 1 SRUM</label><input type="number" min="0.00000001" step="0.000001" name="ton_per_srum" value="${Number(pool.ton_per_srum || .2)}"></div>
                <div class="field"><label>Приоритет</label><input type="number" min="1" max="1000" name="priority" value="${Number(pool.priority || 100)}"></div>
            </div>
            <div class="check-row"><div><b>Пул включён</b><p>Доступен игрокам.</p></div><input class="switch" type="checkbox" name="enabled" ${checked(pool.enabled ?? true)}></div>
            <div class="check-row"><div><b>Разрешить спартанцев</b><p>Заполнять очередь по условиям.</p></div><input class="switch" type="checkbox" name="bots_allowed" ${checked(pool.bots_allowed ?? true)}></div>
            <div class="button-row"><button class="button" type="submit">Сохранить пул</button><button class="button secondary" type="button" id="cancel-pool">Отмена</button></div>
        </form>`;
    }

    function renderSpartans() {
        const query = state.spartanQuery.toLowerCase();
        const bots = (state.data.spartans || []).filter((bot) => !query || bot.name.toLowerCase().includes(query) || String(bot.id) === query);
        const totalRumir = (state.data.spartans || []).reduce((sum, bot) => sum + Number(bot.rumir_balance || 0), 0);
        const totalSrum = (state.data.spartans || []).reduce((sum, bot) => sum + Number(bot.srum_balance || 0) + Number(bot.srum_locked || 0), 0);
        view.innerHTML = `
            <div class="section-heading"><div><h2>300 спартанцев</h2><p>Каждый живёт на собственных балансах и игровой активности.</p></div></div>
            <section class="metric-grid">
                <article class="metric gold"><span class="metric-label">Общий SRUM</span><b class="metric-value">${number(totalSrum, 0)}</b></article>
                <article class="metric green"><span class="metric-label">Добыто RUMIR</span><b class="metric-value">${number(totalRumir, 0)}</b></article>
            </section>
            <div class="toolbar"><input class="search" id="spartan-search" type="search" placeholder="Имя или номер" value="${esc(state.spartanQuery)}"><button class="button small" id="run-worker">Запустить ход</button></div>
            <section class="spartan-list">${bots.map(spartanCard).join('') || '<div class="empty">Никого не найдено</div>'}</section>`;
    }

    function spartanCard(bot) {
        return `<article class="spartan">
            <div class="spartan-avatar">${Number(bot.id)}</div>
            <div><h3 class="spartan-name">${esc(bot.name)} <span class="pill ${bot.active ? '' : 'off'}">${esc(stateLabel(bot.state))}</span></h3>
                <div class="spartan-meta"><span>${number(bot.srum_balance, 2)} SRUM</span><span>${number(bot.rumir_balance, 0)} RUMIR</span><span>${Number(bot.wins || 0)}W/${Number(bot.losses || 0)}L</span></div>
                <progress class="energy" max="100" value="${Math.max(0, Math.min(100, Number(bot.energy || 0)))}">${Number(bot.energy || 0)}%</progress>
            </div>
            <button class="button small ${bot.active ? 'danger' : ''} toggle-spartan" data-id="${Number(bot.id)}" data-active="${bot.active}">${bot.active ? 'OFF' : 'ON'}</button>
        </article>`;
    }

    function stateLabel(value) {
        return ({ idle: 'СВОБОДЕН', mining: 'МАЙНИТ', queued: 'В ПУЛЕ', matched: 'В БОЮ', cooldown: 'ОТДЫХ', disabled: 'OFF' })[value] || String(value).toUpperCase();
    }

    function renderPlayers() {
        const query = state.playerQuery.toLowerCase();
        const players = (state.data.players || []).filter((player) =>
            !query || String(player.telegram_user_id).includes(query) || String(player.nickname || '').toLowerCase().includes(query)
        );
        view.innerHTML = `
            <div class="section-heading"><div><h2>Игроки</h2><p>Аккаунты, балансы и доступ к игровым пулам.</p></div></div>
            <div class="toolbar"><input class="search" id="player-search" type="search" placeholder="Имя или Telegram ID" value="${esc(state.playerQuery)}"></div>
            <section class="spartan-list">${players.map((player) => `<article class="spartan">
                <div class="spartan-avatar">♙</div>
                <div><h3 class="spartan-name">${esc(player.nickname || 'Майнер')} <span class="pill ${player.is_suspended ? 'off' : ''}">${player.is_suspended ? 'ЗАБЛОКИРОВАН' : 'АКТИВЕН'}</span></h3>
                    <div class="spartan-meta"><span>${number(player.srum_available, 2)} SRUM</span><span>${number(player.srum_locked, 2)} в пуле</span><span>${number(player.rumir_balance, 0)} RUMIR</span></div>
                    <div class="spartan-meta"><span>ID ${Number(player.telegram_user_id)}</span><span>${Number(player.wins || 0)}W/${Number(player.losses || 0)}L</span></div>
                </div>
                <button class="button small ${player.is_suspended ? '' : 'danger'} toggle-player" data-id="${Number(player.telegram_user_id)}" data-suspended="${Boolean(player.is_suspended)}">${player.is_suspended ? 'Разблок.' : 'Блок.'}</button>
            </article>`).join('') || '<div class="empty">Игроки не найдены</div>'}</section>`;
    }

    function renderTasks() {
        const cards = (state.data.tasks || []).map((task) => `<article class="card">
            <div class="card-head"><div><h3>${esc(task.title)}</h3><p>${esc(task.description || 'Без описания')}</p></div><span class="pill ${task.enabled ? '' : 'off'}">${task.enabled ? 'АКТИВНО' : 'ПАУЗА'}</span></div>
            <div class="card-row"><span>Награда</span><b>${number(task.reward_amount, task.reward_currency === 'SRUM' ? 2 : 0)} ${esc(task.reward_currency)}</b></div>
            <div class="card-row"><span>Выполнения</span><b>${Number(task.completions || 0)} / ${Number(task.completion_limit)}</b></div>
            <div class="card-row"><span>Бюджет</span><b>${number(task.budget_total, 2)}</b></div>
            <div class="button-row"><button class="button secondary edit-task" data-id="${task.id}">Настроить</button><button class="button small toggle-task" data-id="${task.id}">${task.enabled ? 'Пауза' : 'Включить'}</button></div>
        </article>`).join('');
        view.innerHTML = `<div class="section-heading"><div><h2>Задания</h2><p>Создание, бюджет и лимиты выполнения.</p></div><button class="button small" id="new-task">+ Создать</button></div><div id="task-form-slot"></div><section class="task-list">${cards || '<div class="empty">Заданий пока нет</div>'}</section>`;
    }

    function taskForm(task = {}) {
        return `<form id="task-form" class="card">
            <div class="card-head"><div><h3>${task.id ? 'Настройка задания' : 'Новое задание'}</h3><p>Ссылка должна начинаться с https://</p></div></div>
            <input type="hidden" name="id" value="${esc(task.id || '')}">
            <div class="form-grid">
                <div class="field wide"><label>Название</label><input required maxlength="100" name="title" value="${esc(task.title || '')}"></div>
                <div class="field wide"><label>Описание</label><textarea maxlength="1000" name="description">${esc(task.description || '')}</textarea></div>
                <div class="field wide"><label>Ссылка</label><input type="url" name="task_url" value="${esc(task.task_url || '')}" placeholder="https://..."></div>
                <div class="field"><label>Валюта награды</label><select name="reward_currency"><option ${task.reward_currency !== 'SRUM' ? 'selected' : ''}>RUMIR</option><option ${task.reward_currency === 'SRUM' ? 'selected' : ''}>SRUM</option></select></div>
                <div class="field"><label>Награда</label><input required type="number" min="0.0001" step="0.01" name="reward_amount" value="${Number(task.reward_amount || 1)}"></div>
                <div class="field"><label>Общий бюджет</label><input required type="number" min="0.0001" step="0.01" name="budget_total" value="${Number(task.budget_total || 100)}"></div>
                <div class="field"><label>Лимит выполнений</label><input required type="number" min="1" max="1000000" name="completion_limit" value="${Number(task.completion_limit || 100)}"></div>
            </div>
            <div class="check-row"><div><b>Задание активно</b><p>Видно игрокам.</p></div><input class="switch" type="checkbox" name="enabled" ${checked(task.enabled ?? true)}></div>
            <div class="button-row"><button class="button" type="submit">Сохранить задание</button><button class="button secondary" type="button" id="cancel-task">Отмена</button></div>
        </form>`;
    }

    function renderSettings() {
        const settings = state.data.settings || {};
        view.innerHTML = `<div class="section-heading"><div><h2>Управление проектом</h2><p>Главные выключатели и поведение армии.</p></div></div>
            <form id="settings-form" class="card">
                <div class="check-row"><div><b>300 спартанцев</b><p>Полностью включить или выключить армию.</p></div><input class="switch" type="checkbox" name="bots_enabled" ${checked(settings.bots_enabled)}></div>
                <div class="check-row"><div><b>Условный режим</b><p>Включено — по порогу игроков; выключено — принудительно до целевого размера.</p></div><input class="switch" type="checkbox" name="auto_fill_enabled" ${checked(settings.auto_fill_enabled)}></div>
                <div class="check-row"><div><b>Майнинг RUMIR</b><p>Спартанцы самостоятельно совершают игровые ходы.</p></div><input class="switch" type="checkbox" name="spartan_mining_enabled" ${checked(settings.spartan_mining_enabled)}></div>
                <div class="check-row"><div><b>Технические работы</b><p>Останавливает новые игровые сессии.</p></div><input class="switch" type="checkbox" name="maintenance_mode" ${checked(settings.maintenance_mode)}></div>
                <div class="form-grid">
                    <div class="field"><label>Максимум спартанцев в одном пуле</label><input type="number" min="0" max="300" name="max_spartans_per_pool" value="${Number(settings.max_spartans_per_pool ?? 300)}"></div>
                    <div class="field"><label>Интервал хода, секунд</label><input type="number" min="15" max="3600" name="spartan_tick_seconds" value="${Number(settings.spartan_tick_seconds || 60)}"></div>
                </div>
                <button class="button" type="submit">Сохранить настройки</button>
            </form>
            <section class="card"><div class="card-head"><div><h3>Неизменяемая экономика</h3><p>Эти правила закреплены в серверном расчёте и не меняются из браузера.</p></div></div>
                <div class="card-row"><span>Победителю</span><b>70% штрафа</b></div><div class="card-row"><span>Казне проекта</span><b>30% штрафа</b></div><div class="card-row"><span>Пятый этап майнера</span><b>повторяется до поражения</b></div><div class="card-row"><span>Пятый этап спартанца</span><b>обязательная победа и сброс цикла</b></div>
            </section>
            <section class="card"><div class="card-head"><div><h3>Журнал управления</h3><p>Последние изменения с Telegram ID администратора.</p></div></div>${(state.data.audit || []).map((item) => `<div class="card-row"><span>${esc(item.action)}</span><small>#${Number(item.telegram_admin_id)} · ${dateTime(item.created_at)}</small></div>`).join('') || '<div class="empty">Изменений пока нет</div>'}</section>`;
    }

    function render() {
        if (!state.data) return;
        view.style.animation = 'none';
        void view.offsetWidth;
        view.style.animation = '';
        if (state.tab === 'overview') renderOverview();
        if (state.tab === 'pools') renderPools();
        if (state.tab === 'spartans') renderSpartans();
        if (state.tab === 'players') renderPlayers();
        if (state.tab === 'tasks') renderTasks();
        if (state.tab === 'settings') renderSettings();
    }

    async function load(showLoader = true) {
        if (showLoader) loading.classList.add('active');
        refreshButton.classList.add('spinning');
        try {
            state.data = await api('bootstrap');
            setConnection('online', 'В сети');
            updatedAt.textContent = `Обновлено ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
            render();
        } catch (error) {
            setConnection('error', 'Нет связи');
            view.innerHTML = `<section class="error-box"><h2>Не удалось открыть админку</h2><p>${esc(error.message)}</p><button class="button" id="retry">Повторить</button></section>`;
        } finally {
            loading.classList.remove('active');
            refreshButton.classList.remove('spinning');
        }
    }

    async function mutate(action, payload, successMessage) {
        loading.classList.add('active');
        try {
            await api(action, payload);
            haptic('medium');
            showToast(successMessage);
            await load(false);
        } catch (error) {
            haptic('heavy');
            showToast(error.message);
            loading.classList.remove('active');
        }
    }

    document.querySelector('.tabbar').addEventListener('click', (event) => {
        const button = event.target.closest('.tab');
        if (!button) return;
        document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('active', item === button));
        state.tab = button.dataset.tab;
        haptic();
        render();
    });

    view.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;
        if (target.id === 'retry') load();
        if (target.id === 'new-pool') document.getElementById('pool-form-slot').innerHTML = poolForm();
        if (target.id === 'cancel-pool') document.getElementById('pool-form-slot').innerHTML = '';
        if (target.classList.contains('edit-pool')) {
            const pool = state.data.pools.find((item) => item.id === target.dataset.id);
            document.getElementById('pool-form-slot').innerHTML = poolForm(pool);
            document.getElementById('pool-form-slot').scrollIntoView({ behavior: 'smooth' });
        }
        if (target.classList.contains('toggle-pool')) {
            const pool = state.data.pools.find((item) => item.id === target.dataset.id);
            mutate('save_pool', { pool: { id: pool.id, enabled: !pool.enabled } }, 'Статус пула изменён');
        }
        if (target.id === 'new-task') document.getElementById('task-form-slot').innerHTML = taskForm();
        if (target.id === 'cancel-task') document.getElementById('task-form-slot').innerHTML = '';
        if (target.classList.contains('edit-task')) {
            const task = state.data.tasks.find((item) => item.id === target.dataset.id);
            document.getElementById('task-form-slot').innerHTML = taskForm(task);
            document.getElementById('task-form-slot').scrollIntoView({ behavior: 'smooth' });
        }
        if (target.classList.contains('toggle-task')) {
            const task = state.data.tasks.find((item) => item.id === target.dataset.id);
            mutate('save_task', { task: { id: task.id, enabled: !task.enabled } }, 'Статус задания изменён');
        }
        if (target.classList.contains('toggle-spartan')) {
            mutate('update_spartan', { spartanId: Number(target.dataset.id), patch: { active: target.dataset.active !== 'true' } }, 'Спартанец обновлён');
        }
        if (target.classList.contains('toggle-player')) {
            const suspended = target.dataset.suspended !== 'true';
            const reason = suspended ? (prompt('Причина блокировки (до 300 символов):') || '') : '';
            if (suspended && !reason.trim()) return;
            mutate('update_player_status', { playerId: Number(target.dataset.id), suspended, reason }, suspended ? 'Игрок заблокирован' : 'Игрок разблокирован');
        }
        if (target.id === 'run-worker') mutate('run_spartans', {}, 'Спартанцы сделали ход');
    });

    view.addEventListener('input', (event) => {
        if (event.target.id === 'spartan-search') {
            state.spartanQuery = event.target.value;
            const position = event.target.selectionStart;
            renderSpartans();
            const search = document.getElementById('spartan-search');
            search.focus();
            search.setSelectionRange(position, position);
        }
        if (event.target.id === 'player-search') {
            state.playerQuery = event.target.value;
            const position = event.target.selectionStart;
            renderPlayers();
            const search = document.getElementById('player-search');
            search.focus();
            search.setSelectionRange(position, position);
        }
    });

    view.addEventListener('submit', (event) => {
        event.preventDefault();
        const form = event.target;
        const values = Object.fromEntries(new FormData(form).entries());
        if (form.id === 'pool-form') {
            const pool = {
                ...values,
                enabled: form.elements.enabled.checked,
                bots_allowed: form.elements.bots_allowed.checked,
                base_usdt: Number(values.base_usdt), base_ton: Number(values.base_ton),
                entry_srum_min: Number(values.entry_srum_min), entry_srum_default: Number(values.entry_srum_default),
                entry_srum_max: Number(values.entry_srum_max), activation_threshold: Number(values.activation_threshold),
                target_queue_size: Number(values.target_queue_size), ton_per_srum: Number(values.ton_per_srum),
                priority: Number(values.priority)
            };
            mutate('save_pool', { pool }, 'Пул сохранён');
        }
        if (form.id === 'task-form') {
            const task = {
                ...values,
                enabled: form.elements.enabled.checked,
                reward_amount: Number(values.reward_amount), budget_total: Number(values.budget_total),
                completion_limit: Number(values.completion_limit)
            };
            mutate('save_task', { task }, 'Задание сохранено');
        }
        if (form.id === 'settings-form') {
            const patch = {
                bots_enabled: form.elements.bots_enabled.checked,
                auto_fill_enabled: form.elements.auto_fill_enabled.checked,
                spartan_mining_enabled: form.elements.spartan_mining_enabled.checked,
                maintenance_mode: form.elements.maintenance_mode.checked,
                max_spartans_per_pool: Number(form.elements.max_spartans_per_pool.value),
                spartan_tick_seconds: Number(form.elements.spartan_tick_seconds.value)
            };
            mutate('update_settings', { patch }, 'Настройки проекта сохранены');
        }
    });

    refreshButton.addEventListener('click', () => load(false));

    tg?.ready();
    tg?.expand();
    try {
        tg?.setHeaderColor('#0b0f19');
        tg?.setBackgroundColor('#080b12');
        tg?.setBottomBarColor('#080b12');
        tg?.enableClosingConfirmation();
    } catch (_) { /* older Telegram client */ }
    load();
})();
