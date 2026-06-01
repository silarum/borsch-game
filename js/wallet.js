// ================== TON CONNECT + ВЫВОД USDT ==================
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

// ================== ЗАЯВКА НА ВЫВОД ==================
async function requestWithdrawal() {
    if (!currentWalletAddress) {
        alert('Сначала подключите кошелёк TON');
        return;
    }

    // Определяем лимит в зависимости от статуса
    let limit = 0;
    switch (userStatus) {
        case 'silver': limit = 200; break;
        case 'gold': limit = 500; break;
        case 'platinum': limit = 1000; break;
        default: limit = 50; // базовый лимит для обычных игроков
    }

    const amountSRUM = prompt(`Введите сумму SRUM для вывода (макс. ${limit} SRUM → ${limit * 1} USDT):`);
    if (!amountSRUM || isNaN(amountSRUM) || amountSRUM <= 0) return;
    const amount = parseFloat(amountSRUM);

    if (amount > limit) {
        alert(`Ваш лимит вывода: ${limit} SRUM. Повысьте статус в магазине.`);
        return;
    }

    if (amount > srum) {
        alert('Недостаточно SRUM на балансе');
        return;
    }

    // Создаём заявку в Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/withdrawal_requests`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            user_id: userId,
            nickname: userNickname,
            wallet_address: currentWalletAddress,
            amount: amount,
            usdt_amount: amount * 1, // 1 SRUM = 1 USDT
            status: 'pending',
            created_at: new Date().toISOString()
        })
    });

    if (response.ok) {
        // Блокируем SRUM на время рассмотрения (опционально)
        srum -= amount;
        updateUI();
        alert('✅ Заявка на вывод создана! Ожидайте подтверждения администратора.');
    } else {
        alert('Ошибка при создании заявки. Попробуйте позже.');
    }
}
