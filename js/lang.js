// ================== ПЕРЕВОДЫ ==================
const translations = {
    ru: {
        top_players: 'Топ', top_miners: 'Майнеры', referral: 'Рефералы', invest: 'Инвест', about: 'О проекте',
        rules_btn: '📜 Правила', start_btn: '🥘 НАЧАТЬ', arena_btn: '🏟️ Арена', club_btn: '🐺 Клуб', tasks_btn: '📋 Задания',
        wallet_btn: '👛 Кошелёк', shop_btn: '🛍️ Магазин', back: 'Назад', duel_you: 'Ты', duel_miner: 'Майнер',
        arena_mining: 'Майнинг', arena_band: 'Банда', arena_tour: 'Турниры', club_title: 'Бойцовский клуб',
        club_my: 'Мой клуб', club_all: 'Все клубы', club_create: 'Создать', tasks_title: 'Задания',
        tasks_avail: 'Доступные', tasks_create: 'Создать', tasks_my: 'Мои', invest_title: 'Инвестиции',
        invest_desc: 'Распределяй игровые RUM между демонстрационными проектами и следи за локальным прогрессом.',
        invest_btn: 'Инвестировать RUM', wallet_title: 'Кошелёк', wallet_connect: 'Привязать TON кошелёк',
        shop_title: 'Магазин', top_players_title: 'Топ игроков', top_miners_title: 'Топ майнеров',
        referral_title: 'Рефералы', rules_title: 'Правила игры', about_title: 'О проекте',
        lang_title: 'Выберите язык / Choose language / 选择语言', lang_cancel: 'Отмена / Cancel / 取消',
        status_solo: 'Одиночка', status_club: 'Глава клуба',
        shop_status_silver: '🥈 Серебро — 100 игровых SRUM (+1M RUM)',
        shop_status_gold: '🥇 Золото — 200 игровых SRUM (+2M RUM)',
        shop_status_platinum: '💠 Платина — 300 игровых SRUM (+3M RUM)',
        invite_nickname: 'Пригласить по никнейму', invite_referral: 'Из рефералов', invite_club: 'Из клуба',
        ready: 'Готов', not_ready: 'Не готов', invite_title: 'Приглашение в банду', accept: 'Принять', decline: 'Отклонить',
        referral_active: 'Активен', referral_inactive: 'Неактивен', referral_long: 'Давно не заходил',
        rules_rum_title: 'RUM‑майнинг',
        rules_rum_desc: 'Это твоя личная кухня! Нажимай на полезные овощи 🥬🧅🥔🥕 — они принесут тебе 🪙 RUM. Каждые 10 точных попаданий подряд удваивают награду: ×2, ×4, ×8… Ошибка (💩, 🪱 или промах) сбрасывает серию и отнимает 20 RUM. У тебя 3 попытки в час — используй их с умой!',
        rules_pvp_title: 'Криптобеспредел (PvP‑майнинг)',
        rules_pvp_desc: 'Тренировочная дуэль с ботом длится 20 секунд. Игровая ставка учитывается в SRUM, а награда начисляется в локальных RUM. Реальные деньги не используются.',
        rules_status_title: 'Статусы в демо',
        rules_status_desc: 'Статусы и их бонусы относятся только к локальной демо-игре. Покупка за реальные средства, обмен и вывод отключены.',
        rules_start_title: 'Как начать прямо сейчас',
        rules_start_desc: '1. Жми 🥘 НАЧАТЬ — собирай игровые RUM. 2. Открой тренировочную дуэль. 3. Используй локальные бустеры, клубы и задания. Реальные платежи отключены.'
    },
    en: {
        top_players: 'Top', top_miners: 'Miners', referral: 'Referral', invest: 'Invest', about: 'About',
        rules_btn: '📜 Rules', start_btn: '🥘 START', arena_btn: '🏟️ Arena', club_btn: '🐺 Club', tasks_btn: '📋 Tasks',
        wallet_btn: '👛 Wallet', shop_btn: '🛍️ Shop', back: 'Back', duel_you: 'You', duel_miner: 'Miner',
        arena_mining: 'Mining', arena_band: 'Band', arena_tour: 'Tournaments', club_title: 'Fight Club',
        club_my: 'My Club', club_all: 'All Clubs', club_create: 'Create', tasks_title: 'Tasks',
        tasks_avail: 'Available', tasks_create: 'Create', tasks_my: 'My', invest_title: 'Investments',
        invest_desc: 'Allocate game RUM between demo projects and track local progress.',
        invest_btn: 'Invest RUM', wallet_title: 'Wallet', wallet_connect: 'Link TON Wallet',
        shop_title: 'Shop', top_players_title: 'Top Players', top_miners_title: 'Top Miners',
        referral_title: 'Referrals', rules_title: 'Game Rules', about_title: 'About Project',
        lang_title: 'Choose language / Выберите язык / 选择语言', lang_cancel: 'Cancel / Отмена / 取消',
        status_solo: 'Lone Wolf', status_club: 'Club Leader',
        shop_status_silver: '🥈 Silver — 100 game SRUM (+1M RUM)',
        shop_status_gold: '🥇 Gold — 200 game SRUM (+2M RUM)',
        shop_status_platinum: '💠 Platinum — 300 game SRUM (+3M RUM)',
        invite_nickname: 'Invite by nickname', invite_referral: 'From referrals', invite_club: 'From club',
        ready: 'Ready', not_ready: 'Not ready', invite_title: 'Band invitation', accept: 'Accept', decline: 'Decline',
        referral_active: 'Active', referral_inactive: 'Inactive', referral_long: 'Long time offline',
        rules_rum_title: 'RUM Mining',
        rules_rum_desc: 'This is your personal kitchen! Tap healthy vegetables 🥬🧅🥔🥕 — they bring you 🪙 RUM. Every 10 consecutive hits double the reward: ×2, ×4, ×8… A mistake (💩, 🪱 or miss) resets the streak and takes 20 RUM. You have 3 attempts per hour — use them wisely!',
        rules_pvp_title: 'Crypto Mayhem (PvP Mining)',
        rules_pvp_desc: 'A training duel against a bot lasts 20 seconds. The game stake uses SRUM and the reward is local RUM. No real money is used.',
        rules_status_title: 'Demo statuses',
        rules_status_desc: 'Statuses and bonuses apply only to the local demo. Purchases with real funds, exchange and withdrawals are disabled.',
        rules_start_title: 'How to start right now',
        rules_start_desc: '1. Press 🥘 START to collect game RUM. 2. Open a training duel. 3. Try local boosters, clubs and tasks. Real payments are disabled.'
    },
    zh: {
        top_players: '排行', top_miners: '矿工', referral: '推荐', invest: '投资', about: '关于',
        rules_btn: '📜 规则', start_btn: '🥘 开始', arena_btn: '🏟️ 竞技场', club_btn: '🐺 俱乐部', tasks_btn: '📋 任务',
        wallet_btn: '👛 钱包', shop_btn: '🛍️ 商店', back: '返回', duel_you: '你', duel_miner: '矿工',
        arena_mining: '挖矿', arena_band: '帮派', arena_tour: '锦标赛', club_title: '战斗俱乐部',
        club_my: '我的俱乐部', club_all: '所有俱乐部', club_create: '创建', tasks_title: '任务',
        tasks_avail: '可用', tasks_create: '创建', tasks_my: '我的', invest_title: '投资',
        invest_desc: '在演示项目之间分配游戏 RUM，并跟踪本地进度。',
        invest_btn: '投资 RUM', wallet_title: '钱包', wallet_connect: '连接 TON 钱包',
        shop_title: '商店', top_players_title: '顶级玩家', top_miners_title: '顶级矿工',
        referral_title: '推荐', rules_title: '游戏规则', about_title: '关于项目',
        lang_title: '选择语言 / Choose language / Выберите язык', lang_cancel: '取消 / Cancel / Отмена',
        status_solo: '独狼', status_club: '俱乐部领袖',
        shop_status_silver: '🥈 白银 — 100 游戏 SRUM (+100万 RUM)',
        shop_status_gold: '🥇 黄金 — 200 游戏 SRUM (+200万 RUM)',
        shop_status_platinum: '💠 铂金 — 300 游戏 SRUM (+300万 RUM)',
        invite_nickname: '通过昵称邀请', invite_referral: '从推荐中', invite_club: '从俱乐部',
        ready: '准备', not_ready: '未准备', invite_title: '战队邀请', accept: '接受', decline: '拒绝',
        referral_active: '活跃', referral_inactive: '不活跃', referral_long: '长时间离线',
        rules_rum_title: 'RUM 挖矿',
        rules_rum_desc: '这是你的个人厨房！点击健康的蔬菜 🥬🧅🥔🥕 — 它们会带给你 🪙 RUM。连续击中 10 次奖励翻倍：×2, ×4, ×8… 错误（💩, 🪱 或未击中）会重置连击并扣除 20 RUM。每小时有 3 次机会 — 明智地使用它们！',
        rules_pvp_title: '加密混乱 (PvP 挖矿)',
        rules_pvp_desc: '与训练机器人进行 20 秒对战。游戏下注使用 SRUM，奖励为本地 RUM，不涉及真钱。',
        rules_status_title: '演示身份',
        rules_status_desc: '身份和奖励仅适用于本地演示。真钱购买、兑换和提现均已禁用。',
        rules_start_title: '立即开始',
        rules_start_desc: '1. 按 🥘 开始收集游戏 RUM。2. 打开训练对战。3. 体验本地加速、俱乐部和任务。真钱支付已禁用。'
    }
};

let currentLang = localStorage.getItem('lang') || 'ru';
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    document.getElementById('language-modal').classList.add('hidden');
}
setLanguage(currentLang);
