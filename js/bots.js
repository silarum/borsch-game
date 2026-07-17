// Локальный резерв 300 спартанцев для безопасной демо-версии.
// После включения защищённого matchmaking решение принимает сервер и Telegram-админка.
const spartanBaseNames = [
    'Леонид', 'Ксеркс', 'Ахиллес', 'Гектор', 'Одиссей', 'Аякс', 'Патрокл', 'Диомед',
    'Агамемнон', 'Менелай', 'Нестор', 'Идоменей', 'Тевкр', 'Эант', 'Филоктет',
    'Протесилай', 'Евриал', 'Сфенел', 'Полит', 'Антилох', 'Фоант', 'Леит',
    'Пенелей', 'Клоний', 'Аркесилай', 'Профоенор', 'Схедий', 'Элефенор',
    'Евмен', 'Еврипил', 'Калхант', 'Махаон', 'Подалирий', 'Неоптолем',
    'Феникс', 'Автомедон', 'Алким', 'Бафикл', 'Еврибат', 'Стентор',
    'Талфибий', 'Евримедон', 'Антифат', 'Кикн', 'Гипполох', 'Акамант',
    'Долон', 'Рес', 'Сарпедон', 'Главк'
];

function generateSpartans() {
    return Array.from({ length: 300 }, (_, index) => {
        const squad = Math.floor(index / spartanBaseNames.length) + 1;
        const baseName = spartanBaseNames[index % spartanBaseNames.length];
        return {
            id: index + 1,
            name: squad === 1 ? baseName : `${baseName}_${squad}`,
            lastLostStage: null,
            balance: 400 + ((index + 1) * 7919) % 2601,
            matchesPlayed: 0
        };
    });
}

let spartanBots = window.readLocalArray('spartanBots');
if (spartanBots.length !== 300) {
    spartanBots = generateSpartans();
    localStorage.setItem('spartanBots', JSON.stringify(spartanBots));
}

function selectSpartanBot(playerStage) {
    if (!spartansEnabled) return null;
    const stage = Math.max(1, Math.min(5, Number(playerStage) || 1));
    let botIndex = -1;

    if (stage === 5) {
        botIndex = spartanBots.findIndex((bot) => bot.lastLostStage === 4);
    } else {
        botIndex = spartanBots.findIndex((bot) => bot.lastLostStage === null);
        if (botIndex === -1) {
            botIndex = spartanBots.findIndex((bot) => bot.lastLostStage + 1 === stage);
        }
    }
    if (botIndex === -1) botIndex = 0;

    const bot = spartanBots[botIndex];
    const shouldWin = stage === 5 || (bot.lastLostStage !== null && bot.lastLostStage + 1 === stage);
    const speed = shouldWin
        ? 500 + Math.floor(Math.random() * 200)
        : 1200 + Math.floor(Math.random() * 300);

    return { name: bot.name, speed, botIndex, shouldWin, training: true };
}

function updateSpartanBot(botIndex, botWon, stage, penalty, reward) {
    if (!Number.isInteger(botIndex) || botIndex < 0 || botIndex >= spartanBots.length) return;
    const bot = spartanBots[botIndex];
    if (botWon) {
        bot.lastLostStage = null;
        bot.balance += Math.max(0, Number(reward) || 0);
    } else {
        bot.lastLostStage = Math.max(1, Math.min(5, Number(stage) || 1));
        bot.balance = Math.max(0, bot.balance - Math.max(0, Number(penalty) || 0));
    }
    bot.matchesPlayed = (Number(bot.matchesPlayed) || 0) + 1;
    localStorage.setItem('spartanBots', JSON.stringify(spartanBots));
}

function resetSpartans() {
    spartanBots = generateSpartans();
    localStorage.setItem('spartanBots', JSON.stringify(spartanBots));
}

function toggleSpartans() {
    spartansEnabled = !spartansEnabled;
    localStorage.setItem('spartansEnabled', JSON.stringify(spartansEnabled));
}
