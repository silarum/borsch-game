
// ================== АРМИЯ БОТОВ "300 СПАРТАНЦЕВ" ==================
// Боты используются, когда активность игроков низкая.
// Логика: каждый бот чередует проигрыш и выигрыш.
// Если бот должен проиграть, он не может участвовать в 5-м этапе.
// Если должен выиграть – может участвовать в любом этапе.
// После боя состояние бота переключается.

// Генерация имён для ботов
const spartanNames = [
    'Леонид', 'Ксеркс', 'Ахиллес', 'Гектор', 'Одиссей', 'Аякс', 'Патрокл', 'Диомед',
    'Агамемнон', 'Менелай', 'Нестор', 'Идоменей', 'Тевкр', 'Эант', 'Филоктет',
    'Протесилай', 'Евриал', 'Сфенел', 'Полит', 'Антилох', 'Фоант', 'Леит',
    'Пенелей', 'Клоний', 'Аркесилай', 'Профоенор', 'Схедий', 'Элефенор',
    'Евмен', 'Еврипил', 'Калхант', 'Махаон', 'Подалирий', 'Неоптолем',
    'Феникс', 'Автомедон', 'Алким', 'Бафикл', 'Еврибат', 'Стентор',
    'Талфибий', 'Евримедон', 'Антифат', 'Кикн', 'Гипполох', 'Акамант',
    'Долон', 'Реc', 'Сарпедон', 'Главк'
];

// Состояния ботов
let spartanBots = JSON.parse(localStorage.getItem('spartanBots') || 'null');
if (!spartanBots || spartanBots.length < 50) {
    // Инициализируем 50 ботов, все начинают с проигрыша (nextResult = 'lose')
    spartanBots = spartanNames.map(name => ({ name, nextResult: 'lose' }));
    localStorage.setItem('spartanBots', JSON.stringify(spartanBots));
}

// Функция выбора бота для игрока
// playerStage - этап игрока (1-5)
// Возвращает объект { name, speed } и обновляет состояние бота
function selectSpartanBot(playerStage) {
    if (!spartansEnabled) return null; // если армия выключена, не используем

    // Определяем, какое состояние нам нужно
    let requiredResult = playerStage === 5 ? 'win' : 'lose'; // на 5-м этапе бот должен выигрывать

    // Ищем бота с нужным состоянием
    let botIndex = spartanBots.findIndex(bot => bot.nextResult === requiredResult);
    if (botIndex === -1) {
        // Если нет подходящего, берём первого попавшегося (с неподходящим состоянием)
        botIndex = 0;
    }
    const bot = spartanBots[botIndex];

    // Переключаем состояние бота после использования
    bot.nextResult = bot.nextResult === 'lose' ? 'win' : 'lose';
    localStorage.setItem('spartanBots', JSON.stringify(spartanBots));

    // Скорость зависит от того, должен ли бот выиграть: если должен выиграть, то быстрее
    let speed;
    if (requiredResult === 'lose') {
        speed = 1200 + Math.floor(Math.random() * 300); // медленный
    } else {
        speed = 500 + Math.floor(Math.random() * 200);  // быстрый
    }

    return { name: bot.name, speed };
}

// Сброс всех ботов в начальное состояние (в админке)
function resetSpartans() {
    spartanBots = spartanNames.map(name => ({ name, nextResult: 'lose' }));
    localStorage.setItem('spartanBots', JSON.stringify(spartanBots));
}

// Переключение армии
function toggleSpartans() {
    spartansEnabled = !spartansEnabled;
    localStorage.setItem('spartansEnabled', JSON.stringify(spartansEnabled));
    alert(`Армия 300 спартанцев ${spartansEnabled ? 'включена' : 'отключена'}`);
}
