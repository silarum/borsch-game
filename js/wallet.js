// TON Connect используется только для подключения публичного адреса.
// Обмен, покупка и вывод отключены до запуска проверенного backend.
let tonConnectUI = null;
let currentWalletAddress = null;
let tonConnectInitialized = false;

function setWalletAddress(address) {
    const element = document.getElementById('wallet-address');
    if (!element) return;
    element.textContent = address
        ? `Кошелёк: ${address.slice(0, 6)}...${address.slice(-4)}`
        : 'Кошелёк не подключён';
}

function initTonConnect() {
    const container = document.getElementById('ton-connect-container');
    if (typeof TON_CONNECT_UI === 'undefined') {
        if (container) container.textContent = 'TON Connect не загрузился';
        return;
    }
    if (tonConnectUI) return;

    try {
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: 'https://silarum.github.io/borsch-game/tonconnect-manifest.json',
            buttonRootId: 'ton-connect-container',
            actionsConfiguration: {
                twaReturnUrl: 'https://t.me/crypto_borsch_bot'
            }
        });
        tonConnectUI.onStatusChange((wallet) => {
            currentWalletAddress = wallet?.account?.address || null;
            tonConnectInitialized = Boolean(currentWalletAddress);
            setWalletAddress(currentWalletAddress);
        });
    } catch (error) {
        console.error('TON Connect:', error);
        if (container) container.textContent = 'Не удалось подключить TON Connect';
    }
}

function renderWallet() {
    const walletCard = document.getElementById('wallet-card');
    if (!walletCard) return;
    walletCard.innerHTML = `
        <div style="text-align:center;">
            <p style="font-size:1.2rem;">💎 Игровой SRUM: <b style="color:#FFD700;">${srum.toFixed(2)}</b></p>
            <p style="font-size:0.8rem;color:#aaa;">Баллы не являются криптовалютой и сейчас не подлежат обмену или выводу.</p>
        </div>
        <div id="ton-connect-container" style="display:flex;justify-content:center;margin:15px 0;"></div>
        <p id="wallet-address" style="font-size:0.8rem;color:#aaa;text-align:center;"></p>
        <div class="info-card" style="border-color:#e67e22;text-align:center;">
            🔒 Покупка, обмен и вывод временно отключены до запуска проверенного backend.
        </div>`;
    setWalletAddress(currentWalletAddress);
    if (!tonConnectUI) setTimeout(initTonConnect, 0);
}

function updateExchangeUI() {}
function doExchange() { window.showSafeModeNotice(); }
function requestWithdrawal() { window.showSafeModeNotice(); }

window.addEventListener('load', () => setTimeout(initTonConnect, 500));
