// ================== TON CONNECT (без внешнего манифеста) ==================
let tonConnectUI = null;
let currentWalletAddress = null;

function initTonConnect() {
    if (typeof TON_CONNECT_UI === 'undefined') {
        console.warn('TON Connect UI не загружен');
        return;
    }

    tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        // не указываем manifestUrl – работает без него
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
