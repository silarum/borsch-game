// Прозрачные тренировочные боты. Исход матча заранее не назначается:
// скорость выбирается случайно в понятном диапазоне с учётом этапа.
const trainingBotNames = [
    'Леонид', 'Ахиллес', 'Гектор', 'Одиссей', 'Аякс',
    'ТокенМастер', 'Борщехлёб', 'CryptoWhale', 'Майнер69', 'Лампа'
];

function selectSpartanBot(playerStage) {
    if (!spartansEnabled) return null;
    const stage = Math.max(1, Math.min(5, Number(playerStage) || 1));
    const name = trainingBotNames[Math.floor(Math.random() * trainingBotNames.length)];
    const baseSpeed = 1200 - (stage - 1) * 90;
    const speed = Math.max(500, baseSpeed + Math.floor(Math.random() * 350));
    return { name, speed, botIndex: -1, shouldWin: false };
}

function updateSpartanBot() {
    const matches = Number(localStorage.getItem('trainingBotMatches') || 0);
    localStorage.setItem('trainingBotMatches', String(matches + 1));
}

function resetSpartans() {
    localStorage.removeItem('trainingBotMatches');
}

function toggleSpartans() {
    spartansEnabled = !spartansEnabled;
    localStorage.setItem('spartansEnabled', JSON.stringify(spartansEnabled));
}
