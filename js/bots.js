// ================== АРМИЯ БОТОВ "300 СПАРТАНЦЕВ" ==================
// Боты с балансами и логикой чередования побед/поражений по этапам.
// Включение/выключение через админ-панель (переменная spartansEnabled).

// Генерация 300 имён (используем список из 50 имён + добавляем номера)
const baseNames = [
    'Леонид', 'Ксеркс', 'Ахиллес', 'Гектор', 'Одиссей', 'Аякс', 'Патрокл', 'Диомед',
    'Агамемнон', 'Менелай', 'Нестор', 'Идоменей', 'Тевкр', 'Эант', 'Филоктет',
    'Протесилай', 'Евриал', 'Сфенел', 'Полит', 'Антилох', 'Фоант', 'Леит',
    'Пенелей', 'Клоний', 'Аркесилай', 'Профоенор', 'Схедий', 'Элефенор',
    'Евмен', 'Еврипил', 'Калхант', 'Махаон', 'Подалирий', 'Неоптолем',
    'Феникс', 'Автомедон', 'Алким', 'Бафикл', 'Еврибат', 'Стентор',
    'Талфибий', 'Евримедон', 'Антифат', 'Кикн', 'Гипполох', 'Акамант',
    'Долон', 'Реc', 'Сарпедон', 'Главк'
];

// Создаём 300 ботов
function generateSpartans() {
    let bots = [];
    for (let i = 0; i < 300; i++) {
        let baseName = baseNames[i % baseNames.length];
        let suffix = Math.floor(i / baseNames.length) + 1;
        let name = suffix > 1 ? `${baseName}_${suffix}` : baseName;
        bots.push({
            name: name,
            lastLostStage: null,          // этап, на котором бот проиграл (null – готов проигрывать)
            balance: 400 + Math.floor(Math.random() * 2601) // 400-3000 SRUM
        });
    }
    return bots;
}

// Загружаем или создаём ботов
let spartanBots = JSON.parse(localStorage.getItem('spartanBots'));
if (!spartanBots || spartanBots.length < 300) {
    spartanBots = generateSpartans();
    localStorage.setItem('spartanBots', JSON.stringify(spartanBots));
}

// Глобальная переменная включения (будет объявлена в main.js, но здесь тоже нужна для работы функций)
// Она уже есть в main.js, но если bots.js подключён до main.js, то её может не быть. Проверим:
if (typeof spartansEnabled === 'undefined') {
    var spartansEnabled = JSON.parse(localStorage.getItem('spartansEnabled') || 'true');
}

/**
 * Выбор подходящего бота для игрока с учётом этапа игрока.
 * @param {number} playerStage - этап игрока (1-5)
 * @returns {object|null} { name, speed, botIndex } или null, если нет подходящих
 */
function selectSpartanBot(playerStage) {
    if (!spartansEnabled) return null;

    let botIndex = -1;

    if (playerStage === 5) {
        // Ищем бота, который должен выиграть на 5-м этапе (lastLostStage === 4)
        botIndex = spartanBots.findIndex(bot => bot.lastLostStage === 4);
    } else {
        // Сначала ищем бота, готового проиграть (lastLostStage === null)
        botIndex = spartanBots.findIndex(bot => bot.lastLostStage === null);
        // Если нет – ищем того, кто должен выиграть именно на этом этапе
        if (botIndex === -1) {
            botIndex = spartanBots.findIndex(bot => bot.lastLostStage !== null && bot.lastLostStage + 1 === playerStage);
        }
    }

    if (botIndex === -1) {
        // Если совсем никого нет – берём первого попавшегося (на всякий случай)
        botIndex = 0;
    }

    const bot = spartanBots[botIndex];

    // Определяем, как бот должен сыграть и его скорость
    let shouldWin = (playerStage === 5) || (bot.lastLostStage !== null && bot.lastLostStage + 1 === playerStage);
    let speed;
    if (shouldWin) {
        speed = 500 + Math.floor(Math.random() * 200); // быстрый (должен победить)
    } else {
        speed = 1200 + Math.floor(Math.random() * 300); // медленный (должен проиграть)
    }

    return {
        name: bot.name,
        speed: speed,
        botIndex: botIndex,
        shouldWin: shouldWin
    };
}

/**
 * Обновить состояние бота после завершения дуэли.
 * @param {number} botIndex - индекс бота в массиве spartanBots
 * @param {boolean} botWon - победил ли бот
 * @param {number} stage - этап, на котором прошла дуэль
 * @param {number} penalty - сумма штрафа (если бот проиграл)
 * @param {number} reward - сумма награды (если бот выиграл, в USDT? Но баланс бота в SRUM, награда в USDT. Для простоты будем менять баланс SRUM только при проигрыше/выигрыше SRUM? Награда в USDT не влияет на баланс SRUM бота. Бот может получать USDT? Не будем усложнять, просто при проигрыше снимаем штраф в SRUM с баланса бота, при выигрыше добавляем награду в SRUM (конвертируем USDT->SRUM 1:1).)
 */
function updateSpartanBot(botIndex, botWon, stage, penalty, reward) {
    if (botIndex === undefined || botIndex < 0 || botIndex >= spartanBots.length) return;
    const bot = spartanBots[botIndex];

    if (botWon) {
        bot.lastLostStage = null; // после победы сбрасываем
        bot.balance += reward;    // награда в USDT, но для фейка пусть будет SRUM
    } else {
        bot.lastLostStage = stage; // запоминаем этап проигрыша
        bot.balance = Math.max(0, bot.balance - penalty);
    }
    localStorage.setItem('spartanBots', JSON.stringify(spartanBots));
}

// Сброс всех ботов в начальное состояние
function resetSpartans() {
    spartanBots = generateSpartans();
    localStorage.setItem('spartanBots', JSON.stringify(spartanBots));
    alert('300 спартанцев сброшены до начального состояния.');
}

// Переключение армии
function toggleSpartans() {
    spartansEnabled = !spartansEnabled;
    localStorage.setItem('spartansEnabled', JSON.stringify(spartansEnabled));
    alert(`Армия 300 спартанцев ${spartansEnabled ? 'включена' : 'отключена'}`);
}
