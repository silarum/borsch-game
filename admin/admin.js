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
                <div class="field"><label>Игровая выплата</label><input name="payout_asset" value="SILARUM" readonly></div>
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

    function fightStatus(value) {
        return ({
            pending: 'НА ПРОВЕРКЕ', verified: 'ПРОВЕРЕН', suspended: 'ПРИОСТАНОВЛЕН', rejected: 'ОТКЛОНЁН',
            pending_review: 'НА ПРОВЕРКЕ', registration: 'РЕГИСТРАЦИЯ', live: 'ИДЁТ', finished: 'ЗАВЕРШЁН'
        })[value] || String(value || '—').toUpperCase();
    }

    function renderFightNetwork() {
        const clubs = state.data.fightClubs || [];
        const tournaments = state.data.fightTournaments || [];
        const challenges = state.data.fightChallenges || [];
        const exchanges = state.data.exchangeRequests || [];
        const submittedMatches = state.data.submittedMatches || [];
        const contributionCampaigns = state.data.contributionCampaigns || [];
        const contributions = state.data.clubContributions || [];
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyContributions = contributions.filter((item) => String(item.created_at || '').slice(0, 7) === currentMonth);
        const monthlySupport = monthlyContributions.reduce((sum, item) => sum + Number(item.amount_silarum || 0), 0);
        const pendingClubs = clubs.filter((item) => item.status === 'pending').length;
        const pendingTournaments = tournaments.filter((item) => item.approval_status === 'pending').length;
        const pendingExchanges = exchanges.filter((item) => item.status === 'pending_review').length;
        view.innerHTML = `
            <div class="section-heading"><div><h2>Сеть «Голодные волки»</h2><p>Заведения, территориальные лиги, турниры и призовой контроль.</p></div><button class="button small" id="new-global-tournament">+ Мировой турнир</button></div>
            <section class="metric-grid">
                <article class="metric purple"><span class="metric-label">Клубы</span><b class="metric-value">${clubs.length}</b><span class="metric-note">${pendingClubs} ждут проверки</span></article>
                <article class="metric gold"><span class="metric-label">Турниры</span><b class="metric-value">${tournaments.length}</b><span class="metric-note">${pendingTournaments} требуют решения</span></article>
                <article class="metric green"><span class="metric-label">Результаты</span><b class="metric-value">${submittedMatches.length}</b><span class="metric-note">ждут судью</span></article>
                <article class="metric blue"><span class="metric-label">Обмен</span><b class="metric-value">${pendingExchanges}</b><span class="metric-note">заявок на проверке</span></article>
                <article class="metric purple"><span class="metric-label">Поддержка клубов</span><b class="metric-value">${number(monthlySupport, 2)}</b><span class="metric-note">SILARUM за текущий месяц</span></article>
            </section>
            <div id="global-tournament-slot"></div>
            <section class="card safety-banner"><div><small>ЗАЩИЩЁННЫЙ ОБМЕН</small><h3>Автоматическая отправка TON/USDT отключена</h3><p>Одобрение только разрешает ручную обработку. Отметить заявку исполненной можно после фактической отправки и указания хеша транзакции.</p></div><span>LOCKED</span></section>
            <section class="review-section"><div class="section-heading"><div><h2>Заявки клубов</h2><p>Проверьте связь заявителя с реальным заведением.</p></div></div>
                ${clubs.map(clubReviewCard).join('') || '<div class="empty">Заявок пока нет. После применения миграции они появятся здесь.</div>'}
            </section>
            <section class="review-section"><div class="section-heading"><div><h2>Добровольная поддержка</h2><p>Кампании создают клубы, списание происходит только по действию бойца.</p></div></div>
                ${contributionCampaigns.filter((item) => String(item.month_start || '').slice(0, 7) === currentMonth).map(contributionCampaignCard).join('') || '<div class="empty">В этом месяце клубы ещё не открывали сбор</div>'}
            </section>
            <section class="review-section"><div class="section-heading"><div><h2>Турниры и призы</h2><p>Мировые события и ценные награды требуют решения проекта.</p></div></div>
                ${tournaments.map(tournamentReviewCard).join('') || '<div class="empty">Турниров пока нет</div>'}
            </section>
            <section class="review-section"><div class="section-heading"><div><h2>Заявленные результаты</h2><p>Клиент сообщает результат, но только судья изменяет сетку и выдаёт приз.</p></div></div>
                ${submittedMatches.map(matchReviewCard).join('') || '<div class="empty">Спорных или неподтверждённых результатов нет</div>'}
            </section>
            <section class="review-section"><div class="section-heading"><div><h2>Межклубные поединки</h2><p>Подтвердите победителя после проверки протокола боя.</p></div></div>
                ${challenges.map(challengeReviewCard).join('') || '<div class="empty">Вызовов клубов пока нет</div>'}
            </section>
            <section class="review-section"><div class="section-heading"><div><h2>Обмен SILARUM</h2><p>Курс, комиссия, газ, адрес и хеш транзакции фиксируются в заявке.</p></div></div>
                ${exchanges.map(exchangeReviewCard).join('') || '<div class="empty">Заявок на обмен пока нет</div>'}
            </section>`;
    }

    function clubReviewCard(club) {
        const canReview = club.status === 'pending';
        const clubTreasury = (state.data.clubTreasuries || []).find((item) => item.club_id === club.id) || {};
        return `<article class="card review-card"><div class="card-head"><div><h3>🐺 ${esc(club.name)}</h3><p>${esc(club.venue_name)} · ${esc(club.city)}${club.district ? ' · ' + esc(club.district) : ''}</p></div><span class="pill ${club.status === 'verified' ? '' : 'off'}">${fightStatus(club.status)}</span></div>
            <div class="review-facts"><span><small>ТИП</small>${esc(club.venue_type)}</span><span><small>ВЛАДЕЛЕЦ</small>${esc(club.owner_nickname)}</span><span><small>РЕЙТИНГ</small>${Number(club.rating || 1200)}</span><span><small>КАЗНА</small>${number(clubTreasury.silarum_available, 2)} SILARUM</span></div>
            <p>${esc(club.description || 'Описание не указано')}</p><small class="review-address">📍 ${esc(club.address || 'Адрес не указан')}</small>
            <div class="button-row">${canReview ? `<button class="button approve-club" data-id="${club.id}">Одобрить</button><button class="button danger reject-club" data-id="${club.id}">Отклонить</button>` : `<button class="button secondary suspend-club" data-id="${club.id}" data-status="${club.status}">${club.status === 'suspended' ? 'Вернуть на проверку' : 'Приостановить'}</button>${club.status === 'verified' ? `<button class="button small toggle-club-exchange" data-id="${club.id}" data-enabled="${Boolean(clubTreasury.exchange_enabled)}">${clubTreasury.exchange_enabled ? 'Запретить обмен' : 'Разрешить заявки'}</button>` : ''}`}</div></article>`;
    }

    function clubName(clubId) {
        return (state.data.fightClubs || []).find((item) => item.id === clubId)?.name || `Клуб ${clubId}`;
    }

    function contributionCampaignCard(campaign) {
        const entries = (state.data.clubContributions || []).filter((item) => item.campaign_id === campaign.id).slice(0, 10);
        return `<article class="card review-card"><div class="card-head"><div><h3>💚 ${esc(clubName(campaign.club_id))}</h3><p>${esc(campaign.message || 'Добровольная поддержка клуба')}</p></div><span class="pill ${campaign.enabled ? '' : 'off'}">${campaign.enabled ? 'АКТИВНА' : 'ПАУЗА'}</span></div>
            <div class="review-facts"><span><small>СОБРАНО</small>${number(campaign.total_silarum, 2)} SILARUM</span><span><small>УЧАСТНИКИ</small>${Number(campaign.contributor_count || 0)}</span><span><small>РЕКОМЕНДАЦИЯ</small>${number(campaign.suggested_silarum, 2)} SILARUM</span></div>
            ${entries.map((item) => `<div class="card-row"><span>${item.publish_on_wall ? '💚' : '🔒'} ${esc(item.nickname)}</span><b>${number(item.amount_silarum, 2)} SILARUM</b></div>`).join('') || '<div class="empty">Поступлений пока нет</div>'}</article>`;
    }

    function matchReviewCard(match) {
        const tournament = (state.data.fightTournaments || []).find((item) => item.id === match.tournament_id);
        return `<article class="card review-card"><div class="card-head"><div><h3>⚔ ${esc(tournament?.title || 'Турнирный бой')}</h3><p>Раунд ${Number(match.round_number)} · бой ${Number(match.match_number)}</p></div><span class="pill off">ЗАЯВЛЕН</span></div><div class="review-facts"><span><small>БОЕЦ 1</small>#${Number(match.player_one_telegram_id)}</span><span><small>БОЕЦ 2</small>#${Number(match.player_two_telegram_id)}</span></div><div class="button-row"><button class="button verify-match" data-id="${match.id}" data-winner="${Number(match.player_one_telegram_id)}">Победил #${Number(match.player_one_telegram_id)}</button><button class="button secondary verify-match" data-id="${match.id}" data-winner="${Number(match.player_two_telegram_id)}">Победил #${Number(match.player_two_telegram_id)}</button></div></article>`;
    }

    function challengeReviewCard(challenge) {
        const verifiable = ['accepted', 'live'].includes(challenge.status);
        return `<article class="card review-card"><div class="card-head"><div><h3>🐺 ${esc(challenge.title)}</h3><p>${esc(clubName(challenge.challenger_club_id))} против ${esc(clubName(challenge.defender_club_id))} · ${dateTime(challenge.proposed_starts_at)}</p></div><span class="pill ${challenge.status === 'finished' ? '' : 'off'}">${fightStatus(challenge.status)}</span></div><div class="review-facts"><span><small>ФОРМАТ</small>${esc(challenge.format)}</span><span><small>РЕЙТИНГ</small>+${Number(challenge.rating_points)}</span><span><small>ПОБЕДИТЕЛЬ</small>${challenge.winner_club_id ? esc(clubName(challenge.winner_club_id)) : '—'}</span></div>${verifiable ? `<div class="button-row"><button class="button verify-challenge" data-id="${challenge.id}" data-winner="${challenge.challenger_club_id}">${esc(clubName(challenge.challenger_club_id))}</button><button class="button secondary verify-challenge" data-id="${challenge.id}" data-winner="${challenge.defender_club_id}">${esc(clubName(challenge.defender_club_id))}</button></div>` : ''}</article>`;
    }

    function exchangeReviewCard(request) {
        const pending = request.status === 'pending_review';
        const approved = request.status === 'approved' || request.status === 'processing';
        const source = request.source_type === 'club' ? clubName(request.source_club_id) : `Игрок #${Number(request.requester_telegram_user_id)}`;
        return `<article class="card review-card"><div class="card-head"><div><h3>⇄ ${number(request.amount_silarum, 2)} SILARUM → ${esc(request.target_asset)}</h3><p>${esc(source)} · ${dateTime(request.created_at)}</p></div><span class="pill ${request.status === 'sent' ? '' : 'off'}">${esc(request.status)}</span></div><div class="review-facts"><span><small>К ПОЛУЧЕНИЮ</small>${number(request.net_target_amount, request.target_asset === 'TON' ? 6 : 2)} ${esc(request.target_asset)}</span><span><small>КОМИССИЯ</small>${number(request.service_commission_silarum, 2)} SILARUM</span><span><small>ГАЗ</small>${number(request.estimated_gas_target, 6)} ${esc(request.target_asset)}</span></div><p class="mono-address">${esc(request.destination_address)}</p>${pending ? `<div class="button-row"><button class="button approve-exchange" data-id="${request.id}">Разрешить обработку</button><button class="button danger reject-exchange" data-id="${request.id}">Отклонить и вернуть</button></div>` : approved ? `<button class="button complete-exchange" data-id="${request.id}">Отметить отправленной по хешу</button>` : request.tx_hash ? `<p class="mono-address">TX: ${esc(request.tx_hash)}</p>` : ''}</article>`;
    }

    function tournamentReviewCard(tournament) {
        const pending = tournament.approval_status === 'pending';
        return `<article class="card review-card"><div class="card-head"><div><h3>🏆 ${esc(tournament.title)}</h3><p>${esc(tournament.league_tier)} · ${esc(tournament.discipline)} · ${dateTime(tournament.starts_at)}</p></div><span class="pill ${tournament.approval_status === 'approved' ? '' : 'off'}">${fightStatus(tournament.status)}</span></div>
            <div class="review-facts"><span><small>ПРИЗ</small>${esc(tournament.prize_title || '—')}</span><span><small>ФОНД</small>${number(tournament.prize_fund_amount, 2)} ${esc(tournament.prize_currency)}</span><span><small>УЧАСТНИКИ</small>${Number(tournament.max_participants)}</span></div>
            <p>${esc(tournament.rules_text || 'Условия не указаны')}</p>
            ${pending ? `<div class="button-row"><button class="button approve-tournament" data-id="${tournament.id}">Одобрить публикацию</button><button class="button danger reject-tournament" data-id="${tournament.id}">Отклонить</button></div>` : ''}</article>`;
    }

    function globalTournamentForm() {
        const registration = new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 16);
        const start = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16);
        return `<form id="global-tournament-form" class="card"><div class="card-head"><div><h3>Мировой турнир</h3><p>Главная админка задаёт условия и публикует событие. Выплата фонда остаётся ручной.</p></div></div>
            <div class="form-grid"><div class="field wide"><label>Название</label><input required maxlength="120" name="title"></div><div class="field wide"><label>Описание</label><textarea maxlength="2000" name="description"></textarea></div>
            <div class="field"><label>Дисциплина</label><select name="discipline"><option value="fight">Бойцы</option><option value="borsch">Крипто Борщ</option><option value="mixed">Обе</option></select></div><div class="field"><label>Формат</label><select name="format"><option value="knockout">На выбывание</option><option value="round_robin">Каждый с каждым</option><option value="groups_knockout">Группы + плей-офф</option></select></div>
            <div class="field"><label>Конец регистрации</label><input required type="datetime-local" name="registration_ends_at" value="${registration}"></div><div class="field"><label>Начало</label><input required type="datetime-local" name="starts_at" value="${start}"></div>
            <div class="field"><label>Участников</label><input type="number" min="2" max="100000" name="max_participants" value="128"></div><div class="field"><label>Минимальный рейтинг</label><input type="number" min="0" name="min_rating" value="1500"></div>
            <div class="field"><label>Тип приза</label><select name="prize_type"><option value="physical">Ценный подарок</option><option value="food">Еда / купон</option><option value="digital">Цифровой приз</option><option value="silarum">Фонд SILARUM</option><option value="mixed">Смешанный</option></select></div><div class="field"><label>Расчётная единица</label><input name="prize_currency" value="SILARUM" readonly></div>
            <div class="field wide"><label>Название приза</label><input required maxlength="200" name="prize_title"></div><div class="field"><label>Стоимость / фонд, SILARUM</label><input type="number" min="0.0001" step="0.01" name="prize_fund_amount" value="1000"></div><div class="field"><label>Минимальный возраст</label><input type="number" min="0" max="99" name="min_age" value="18"></div>
            <div class="field wide"><label>Условия участия</label><textarea required maxlength="5000" name="rules_text"></textarea></div></div>
            <div class="button-row"><button class="button" type="submit">Создать и открыть регистрацию</button><button class="button secondary" type="button" id="cancel-global-tournament">Отмена</button></div></form>`;
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
            <section class="card"><div class="card-head"><div><h3>Telegram-команды</h3><p>Привяжите команды и кнопки управления к админ-боту без передачи токена в браузер.</p></div></div>
                <button class="button" id="register-webhook" type="button">Подключить админ-бота</button>
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
        if (state.tab === 'fight-network') renderFightNetwork();
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
        if (target.id === 'register-webhook') mutate('register_webhook', {}, 'Админ-бот подключён');
        if (target.id === 'new-global-tournament') document.getElementById('global-tournament-slot').innerHTML = globalTournamentForm();
        if (target.id === 'cancel-global-tournament') document.getElementById('global-tournament-slot').innerHTML = '';
        if (target.classList.contains('approve-club')) mutate('review_fight_club', { clubId: target.dataset.id, status: 'verified' }, 'Клуб одобрен');
        if (target.classList.contains('reject-club')) mutate('review_fight_club', { clubId: target.dataset.id, status: 'rejected' }, 'Клуб отклонён');
        if (target.classList.contains('suspend-club')) mutate('review_fight_club', { clubId: target.dataset.id, status: target.dataset.status === 'suspended' ? 'pending' : 'suspended' }, 'Статус клуба изменён');
        if (target.classList.contains('approve-tournament')) mutate('review_fight_tournament', { tournamentId: target.dataset.id, approvalStatus: 'approved' }, 'Турнир опубликован');
        if (target.classList.contains('reject-tournament')) mutate('review_fight_tournament', { tournamentId: target.dataset.id, approvalStatus: 'rejected' }, 'Турнир отклонён');
        if (target.classList.contains('verify-match') && confirm('Подтвердить победителя и изменить турнирную сетку?')) mutate('verify_tournament_match_result', { matchId: target.dataset.id, winnerTelegramUserId: Number(target.dataset.winner) }, 'Результат боя подтверждён');
        if (target.classList.contains('verify-challenge') && confirm('Подтвердить победителя межклубного боя и изменить рейтинг?')) mutate('verify_club_challenge', { challengeId: target.dataset.id, winnerClubId: target.dataset.winner }, 'Рейтинг клубов обновлён');
        if (target.classList.contains('toggle-club-exchange')) mutate('set_club_exchange_enabled', { clubId: target.dataset.id, enabled: target.dataset.enabled !== 'true' }, 'Доступ клуба к заявкам изменён');
        if (target.classList.contains('approve-exchange')) mutate('review_silarum_exchange', { requestId: target.dataset.id, approved: true }, 'Заявка разрешена к ручной обработке');
        if (target.classList.contains('reject-exchange')) mutate('review_silarum_exchange', { requestId: target.dataset.id, approved: false }, 'Заявка отклонена, SILARUM возвращены');
        if (target.classList.contains('complete-exchange')) {
            const txHash = prompt('Введите хеш уже выполненной транзакции TON/USDT:') || '';
            if (txHash.trim().length >= 10) mutate('complete_silarum_exchange', { requestId: target.dataset.id, txHash: txHash.trim() }, 'Транзакция зафиксирована');
        }
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
        if (form.id === 'global-tournament-form') {
            mutate('save_global_tournament', { tournament: {
                ...values,
                max_participants: Number(values.max_participants), min_rating: Number(values.min_rating),
                prize_fund_amount: Number(values.prize_fund_amount), min_age: Number(values.min_age),
                registration_ends_at: new Date(values.registration_ends_at).toISOString(),
                starts_at: new Date(values.starts_at).toISOString()
            } }, 'Мировой турнир создан');
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
