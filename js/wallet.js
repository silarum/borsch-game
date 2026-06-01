// ================== TON CONNECT ==================
let tonConnectUI = null;
let currentWalletAddress = null;

function initTonConnect() {
    if (typeof TON_CONNECT_UI === 'undefined') {
        console.warn('TON Connect UI не загружен');
        return;
    }

    tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://silarum.github.io/borsch-game/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-container'
    });

    tonConnectUI.onStatusChange(async (wallet) => {
        if (wallet) {
            currentWalletAddress = wallet.account.address;
            document.getElementById('wallet-address').textContent = 
                `Кошелёк: ${currentWalletAddress.slice(0, 6)}...${currentWalletAddress.slice(-4)}`;
        } else {
            currentWalletAddress = null;
            document.getElementById('wallet-address').textContent = '';
        }
        updateUI();
    });
}

window.addEventListener('load', () => {
    setTimeout(initTonConnect, 1000);
});
