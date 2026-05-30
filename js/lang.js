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
        referral_active: 'Активен', referral_inactive: 'Неактивен', referral_long: 'Давно не заходил',
        rules_rum_title: 'RUM‑майнинг',
        rules_rum_desc: 'Это твоя личная кухня! Нажимай на полезные овощи 🥬🧅🥔🥕 — они принесут тебе 🪙 RUM. Каждые 10 точных попаданий подряд удваивают награду: ×2, ×4, ×8… Ошибка (💩, 🪱 или промах) сбрасывает серию и отнимает 20 RUM. У тебя 3 попытки в час — используй их с умой!',
        rules_pvp_title: 'Криптобеспредел (PvP‑майнинг)',
        rules_pvp_desc: 'Здесь ты сражаешься с другими майнерами за реальные блоки 🎯. Ты ставишь 💎 SRUM (1 SRUM = 1 USDT) и выбираешь этап — от этого зависят риски и награды. За 20 секунд нужно набрать больше очков, чем соперник. Победил — получил USDT на кошелёк 💵, проиграл — штраф SRUM. Но самый крутой шанс — <strong>редкий блок до 10 000 USDT</strong>! Он выпадает случайно, как джекпот 🎰. Твоя мощь зависит от этапа и активных бустеров ⚡.',
        rules_status_title: 'Статусы и вывод USDT',
        rules_status_desc: 'Чем выше твой статус, тем больше можно выводить ежедневно:<br>🥈 Серебро — до 200 USDT/сутки<br>🥇 Золото — до 500 USDT/сутки<br>💠 Платина — до 1 000 USDT/сутки<br>Статус покупается в магазине за SRUM, но можно и заработать активной игрой. Вывод мгновенный, через TON‑кошелёк ⚡.',
        rules_start_title: 'Как начать прямо сейчас',
        rules_start_desc: '1. Жми 🥘 НАЧАТЬ — фарми RUM.<br>2. Нажми на золотую монету 💰 — войди в PvP‑майнинг за USDT.<br>3. Покупай бустеры и статусы в магазине 🛍️.<br>4. Приглашай друзей 👥 — получай бонусы.<br>5. Выводи реальные доллары на свой TON‑кошелёк 💵.'
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
        referral_active: 'Active', referral_inactive: 'Inactive', referral_long: 'Long time offline',
        rules_rum_title: 'RUM Mining',
        rules_rum_desc: 'This is your personal kitchen! Tap healthy vegetables 🥬🧅🥔🥕 — they bring you 🪙 RUM. Every 10 consecutive hits double the reward: ×2, ×4, ×8… A mistake (💩, 🪱 or miss) resets the streak and takes 20 RUM. You have 3 attempts per hour — use them wisely!',
        rules_pvp_title: 'Crypto Mayhem (PvP Mining)',
        rules_pvp_desc: 'Here you fight other miners for real blocks 🎯. You stake 💎 SRUM (1 SRUM = 1 USDT) and choose a stage — risks and rewards depend on it. You have 20 seconds to score more points than your opponent. Win — get USDT to your wallet 💵, lose — a SRUM penalty. But the coolest chance — a <strong>rare block up to 10,000 USDT</strong>! It drops randomly like a jackpot 🎰. Your power depends on the stage and active boosters ⚡.',
        rules_status_title: 'Statuses and USDT Withdrawal',
        rules_status_desc: 'The higher your status, the more you can withdraw daily:<br>🥈 Silver — up to 200 USDT/day<br>🥇 Gold — up to 500 USDT/day<br>💠 Platinum — up to 1,000 USDT/day<br>Status is bought in the shop for SRUM, but can also be earned by active play. Withdrawal is instant, via TON wallet ⚡.',
        rules_start_title: 'How to start right now',
        rules_start_desc: '1. Press 🥘 START — farm RUM.<br>2. Tap the golden coin 💰 — enter PvP mining for USDT.<br>3. Buy boosters and statuses in the shop 🛍️.<br>4. Invite friends 👥 — get bonuses.<br>5. Withdraw real dollars to your TON wallet 💵.'
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
        referral_active: '活跃', referral_inactive: '不活跃', referral_long: '长时间离线',
        rules_rum_title: 'RUM 挖矿',
        rules_rum_desc: '这是你的个人厨房！点击健康的蔬菜 🥬🧅🥔🥕 — 它们会带给你 🪙 RUM。连续击中 10 次奖励翻倍：×2, ×4, ×8… 错误（💩, 🪱 或未击中）会重置连击并扣除 20 RUM。每小时有 3 次机会 — 明智地使用它们！',
        rules_pvp_title: '加密混乱 (PvP 挖矿)',
        rules_pvp_desc: '在这里你与其他矿工争夺真正的区块 🎯。你质押 💎 SRUM (1 SRUM = 1 USDT) 并选择阶段 — 风险和奖励取决于此。你有 20 秒时间获得比对手更多的分数。获胜 — 将 USDT 存入钱包 💵，失败 — 扣除 SRUM 罚款。但最酷的机会 — <strong>稀有区块高达 10,000 USDT</strong>！它随机掉落如同大奖 🎰。你的力量取决于阶段和激活的加速器 ⚡。',
        rules_status_title: '身份和 USDT 提现',
        rules_status_desc: '身份越高，每日提现额度越大：<br>🥈 白银 — 最高 200 USDT/天<br>🥇 黄金 — 最高 500 USDT/天<br>💠 铂金 — 最高 1,000 USDT/天<br>身份可在商店用 SRUM 购买，也可通过活跃游戏赚取。提现即时，通过 TON 钱包 ⚡。',
        rules_start_title: '立即开始',
        rules_start_desc: '1. 按 🥘 开始 — 收获 RUM。<br>2. 点击金币 💰 — 进入 PvP 挖矿获取 USDT。<br>3. 在商店购买加速器和身份 🛍️。<br>4. 邀请朋友 👥 — 获得奖励。<br>5. 提取真实美元到你的 TON 钱包 💵。'
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
