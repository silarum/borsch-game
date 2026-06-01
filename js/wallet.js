// ================== TON CONNECT ==================
let tonConnectUI = null;
let currentWalletAddress = null;

// Инициализация TON Connect после загрузки игры
function initTonConnect() {
    if (typeof TON_CONNECT_UI === 'undefined') {
        console.warn('TON Connect UI не загружен');
        return;
    }

    tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://silarum.github.io/borsch-game/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-container'
    });

    // Отслеживаем изменения статуса кошелька
    tonConnectUI.onStatusChange(async (wallet) => {
        if (wallet) {
            currentWalletAddress = wallet.account.address;
            document.getElementById('wallet-address').textContent = 
                `Кошелёк: ${currentWalletAddress.slice(0, 6)}...${currentWalletAddress.slice(-4)}`;
            // Здесь можно запросить реальный баланс TON через API
        } else {
            currentWalletAddress = null;
            document.getElementById('wallet-address').textContent = '';
        }
        updateUI();
    });
}

// Вызываем после старта игры
window.addEventListener('load', () => {
    // Небольшая задержка, чтобы DOM точно был готов
    setTimeout(initTonConnect, 1000);
});
