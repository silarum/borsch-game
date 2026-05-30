// ================== ПЕРЕВОДЫ ==================
const translations = {
    ru: {
        top_players: 'Топ', top_miners: 'Майнеры', referral: 'Рефералы', invest: 'Инвест', about: 'О проекте',
        rules_btn: '📜 Правила', start_btn: '🥘 НАЧАТЬ', arena_btn: '🏟️ Арена', club_btn: '🐺 Клуб', tasks_btn: '📋 Задания',
        wallet_btn: '👛 Кошелёк', shop_btn: '🛍️ Магазин', back: 'Назад', duel_you: 'Ты', duel_miner: 'Майнер',
        arena_mining: 'Майнинг', arena_band: 'Банда', arena_tour: 'Турниры', club_title: 'Бойцовский клуб',
        club_my: 'Мой клуб', club_all: 'Все клубы', club_create: 'Создать', tasks_title: 'Задания',
        tasks_avail: 'Доступные', tasks_create: 'Создать', tasks_my: 'Мои', invest_title: 'Инвестиции',
        invest_desc: 'Вкладывай RUM в реальные проекты и становись совладельцем прибыли после запуска бизнеса. Тратя время и внимание, ты инвестируешь в своё финансовое будущее.',
        invest_btn: 'Инвестировать RUM', wallet_title: 'Кошелёк', wallet_connect: 'Привязать TON кошелёк',
        shop_title: 'Магазин', top_players_title: 'Топ игроков', top_miners_title: 'Топ майнеров',
        referral_title: 'Рефералы', rules_title: 'Правила игры', about_title: 'О проекте',
        lang_title: 'Выберите язык / Choose language / 选择语言', lang_cancel: 'Отмена / Cancel / 取消',
        status_solo: 'Одиночка', status_club: 'Глава клуба',
        shop_status_silver: '🥈 Серебро — 100 SRUM (+1M RUM, вывод от 200 SRUM)',
        shop_status_gold: '🥇 Золото — 200 SRUM (+2M RUM, вывод от 100 SRUM)',
        shop_status_platinum: '💠 Платина — 300 SRUM (+3M RUM, вывод от 25 SRUM)',
        invite_nickname: 'Пригласить по никнейму', invite_referral: 'Из рефералов', invite_club: 'Из клуба',
        ready: 'Готов', not_ready: 'Не готов', invite_title: 'Приглашение в банду', accept: 'Принять', decline: 'Отклонить',
        referral_active: 'Активен', referral_inactive: 'Неактивен', referral_long: 'Давно не заходил'
    },
    en: {
        top_players: 'Top', top_miners: 'Miners', referral: 'Referral', invest: 'Invest', about: 'About',
        rules_btn: '📜 Rules', start_btn: '🥘 START', arena_btn: '🏟️ Arena', club_btn: '🐺 Club', tasks_btn: '📋 Tasks',
        wallet_btn: '👛 Wallet', shop_btn: '🛍️ Shop', back: 'Back', duel_you: 'You', duel_miner: 'Miner',
        arena_mining: 'Mining', arena_band: 'Band', arena_tour: 'Tournaments', club_title: 'Fight Club',
        club_my: 'My Club', club_all: 'All Clubs', club_create: 'Create', tasks_title: 'Tasks',
        tasks_avail: 'Available', tasks_create: 'Create', tasks_my: 'My', invest_title: 'Investments',
        invest_desc: 'Invest RUM in real projects and become a co-owner of profits after business launch. Spending your time and attention, you invest in your financial future.',
        invest_btn: 'Invest RUM', wallet_title: 'Wallet', wallet_connect: 'Link TON Wallet',
        shop_title: 'Shop', top_players_title: 'Top Players', top_miners_title: 'Top Miners',
        referral_title: 'Referrals', rules_title: 'Game Rules', about_title: 'About Project',
        lang_title: 'Choose language / Выберите язык / 选择语言', lang_cancel: 'Cancel / Отмена / 取消',
        status_solo: 'Lone Wolf', status_club: 'Club Leader',
        shop_status_silver: '🥈 Silver — 100 SRUM (+1M RUM, withdrawal from 200 SRUM)',
        shop_status_gold: '🥇 Gold — 200 SRUM (+2M RUM, withdrawal from 100 SRUM)',
        shop_status_platinum: '💠 Platinum — 300 SRUM (+3M RUM, withdrawal from 25 SRUM)',
        invite_nickname: 'Invite by nickname', invite_referral: 'From referrals', invite_club: 'From club',
        ready: 'Ready', not_ready: 'Not ready', invite_title: 'Band invitation', accept: 'Accept', decline: 'Decline',
        referral_active: 'Active', referral_inactive: 'Inactive', referral_long: 'Long time offline'
    },
    zh: {
        top_players: '排行', top_miners: '矿工', referral: '推荐', invest: '投资', about: '关于',
        rules_btn: '📜 规则', start_btn: '🥘 开始', arena_btn: '🏟️ 竞技场', club_btn: '🐺 俱乐部', tasks_btn: '📋 任务',
        wallet_btn: '👛 钱包', shop_btn: '🛍️ 商店', back: '返回', duel_you: '你', duel_miner: '矿工',
        arena_mining: '挖矿', arena_band: '帮派', arena_tour: '锦标赛', club_title: '战斗俱乐部',
        club_my: '我的俱乐部', club_all: '所有俱乐部', club_create: '创建', tasks_title: '任务',
        tasks_avail: '可用', tasks_create: '创建', tasks_my: '我的', invest_title: '投资',
        invest_desc: '将RUM投资到真实项目中，成为业务启动后利润的共同拥有者。花费你的时间和注意力，为你的财务未来投资。',
        invest_btn: '投资 RUM', wallet_title: '钱包', wallet_connect: '连接 TON 钱包',
        shop_title: '商店', top_players_title: '顶级玩家', top_miners_title: '顶级矿工',
        referral_title: '推荐', rules_title: '游戏规则', about_title: '关于项目',
        lang_title: '选择语言 / Choose language / Выберите язык', lang_cancel: '取消 / Cancel / Отмена',
        status_solo: '独狼', status_club: '俱乐部领袖',
        shop_status_silver: '🥈 白银 — 100 SRUM (+100万 RUM, 200 SRUM起提现)',
        shop_status_gold: '🥇 黄金 — 200 SRUM (+200万 RUM, 100 SRUM起提现)',
        shop_status_platinum: '💠 铂金 — 300 SRUM (+300万 RUM, 25 SRUM起提现)',
        invite_nickname: '通过昵称邀请', invite_referral: '从推荐中', invite_club: '从俱乐部',
        ready: '准备', not_ready: '未准备', invite_title: '战队邀请', accept: '接受', decline: '拒绝',
        referral_active: '活跃', referral_inactive: '不活跃', referral_long: '长时间离线'
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
