// ================== TON CONNECT + ОБМЕН SRUM ==================

let tonConnectUI = null;
let currentWalletAddress = null;
let tonConnectInitialized = false;

// Курсы обмена: 1 SRUM = X
const EXCHANGE_RATE = {
    USDT: 1,    // 1 SRUM = 1 USDT
    TON: 0.2    // 1 SRUM = 0.2 TON
};

// Инициализация TON Connect
function initTonConnect() {
    if (typeof TON_CONNECT_UI === 'undefined') {
        console.warn('TON Connect UI не загружен');
        const container = document.getElementById('ton-connect-container');
        if (container) container.innerHTML = '<p style="color:#aaa;text-align:center;">Загрузка кошелька...</p>';
        return;
    }

    try {
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: 'https://silarum.github.io/borsch-game/tonconnect-manifest.json',
            buttonRootId: 'ton-connect-container'
        });

        tonConnectUI.connectionRestored.then((restored) => {
            console.log(restored ? 'Сессия восстановлена' : 'Требуется подключение');
        });

        tonConnectUI.onStatusChange((wallet) => {
            if (wallet) {
                currentWalletAddress = wallet.account.address;
                const shortAddr = `${currentWalletAddress.slice(0, 6)}...${currentWalletAddress.slice(-4)}`;
                document.getElementById('wallet-address').textContent = `Кошелёк: ${shortAddr}`;
                tonConnectInitialized = true;
            } else {
                currentWalletAddress = null;
                document.getElementById('wallet-address').textContent = 'Кошелёк не подключён';
                tonConnectInitialized = false;
            }
            updateExchangeUI();
            updateUI();
        });
    } catch (e) {
        console.error('Ошибка TON Connect:', e);
    }
}

window.addEventListener('load', () => {
    setTimeout(initTonConnect, 1500);
});

// ================== РЕНДЕР КОШЕЛЬКА ==================
function renderWallet() {
    const walletCard = document.getElementById('wallet-card');
    if (!walletCard) return;

    walletCard.innerHTML = `
        <div style="text-align:center;">
            <p style="font-size:1.2rem;">💎 SRUM: <b style="color:#FFD700;">${srum.toFixed(2)}</b></p>
            <p style="font-size:0.9rem;">💵 USDT: <b style="color:#4CAF50;">${usdt.toFixed(2)}</b> | ⚡ TON: <b style="color:#2196F3;">${ton.toFixed(2)}</b></p>
        </div>

        <div id="ton-connect-container" style="display:flex;justify-content:center;margin:15px 0;"></div>
        <p style="font-size:0.8rem;color:#aaa;text-align:center;" id="wallet-address"></p>

        <!-- Обменник -->
        <div style="background:rgba(255,215,0,0.05); border:1px solid rgba(255,215,0,0.2); border-radius:15px; padding:15px; margin-top:15px;">
            <h3 style="color:#FFD700; text-align:center; margin-bottom:10px;">🔄 Обменять SRUM</h3>
            
            <input type="number" id="exchange-amount" placeholder="Введите сумму SRUM" min="0.01" step="0.01" 
                   style="width:100%; padding:14px; margin:8px 0; border-radius:12px; border:1px solid rgba(255,215,0,0.3); 
                          background:rgba(0,0,0,0.5); color:white; font-size:1.2rem; text-align:center;">

            <div style="display:flex; gap:10px; margin-top:12px;">
                <button id="exchange-usdt-btn" class="ex-btn" disabled
                        style="background:linear-gradient(180deg,#4CAF50,#2E7D32);">
                    💵 <span id="usdt-amount">0.00</span> USDT
                </button>
                <button id="exchange-ton-btn" class="ex-btn" disabled
                        style="background:linear-gradient(180deg,#2196F3,#1565C0);">
                    ⚡ <span id="ton-amount">0.0000</span> TON
                </button>
            </div>
            
            <p id="exchange-error" style="font-size:0.75rem; color:#e74c3c; text-align:center; margin-top:8px; min-height:18px;"></p>
        </div>
    `;

    // Стили кнопок
    const style = document.createElement('style');
    style.textContent = `
        .ex-btn {
            flex:1; padding:14px 8px; border:none; border-radius:12px; font-weight:bold; font-size:0.9rem;
            color:white; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.3); transition:transform 0.1s;
        }
        .ex-btn:active { transform:scale(0.96); }
        .ex-btn:disabled { background:#555 !important; color:#999; cursor:not-allowed; box-shadow:none; }
    `;
    document.head.appendChild(style);

    // Обработчик ввода
    document.getElementById('exchange-amount').addEventListener('input', updateExchangeUI);

    // Кнопки обмена
    document.getElementById('exchange-usdt-btn').addEventListener('click', () => doExchange('USDT'));
    document.getElementById('exchange-ton-btn').addEventListener('click', () => doExchange('TON'));

    // Пересоздаём кнопку TON Connect
    if (typeof TON_CONNECT_UI !== 'undefined' && !tonConnectUI) {
        setTimeout(initTonConnect, 500);
    } else if (tonConnectUI) {
        tonConnectUI.buttonRootId = 'ton-connect-container';
    }
}

// Обновление сумм при вводе
function updateExchangeUI() {
    const input = document.getElementById('exchange-amount');
    const usdtSpan = document.getElementById('usdt-amount');
    const tonSpan = document.getElementById('ton-amount');
    const usdtBtn = document.getElementById('exchange-usdt-btn');
    const tonBtn = document.getElementById('exchange-ton-btn');
    const errorP = document.getElementById('exchange-error');

    if (!input) return;

    const amount = parseFloat(input.value) || 0;
    
    if (usdtSpan) usdtSpan.textContent = (amount * EXCHANGE_RATE.USDT).toFixed(2);
    if (tonSpan) tonSpan.textContent = (amount * EXCHANGE_RATE.TON).toFixed(4);

    // Валидация
    let errorMsg = '';
    let valid = true;

    if (amount <= 0) {
        valid = false;
    } else if (amount > srum) {
        errorMsg = 'Недостаточно SRUM';
        valid = false;
    } else {
        // Проверка лимита по статусу
        let limit = 50;
        switch (userStatus) {
            case 'silver': limit = 200; break;
            case 'gold': limit = 500; break;
            case 'platinum': limit = 1000; break;
        }
        if (amount > limit) {
            errorMsg = `Лимит: ${limit} SRUM/сутки. Повысьте статус в Магазине.`;
            valid = false;
        }
    }

    if (usdtBtn) usdtBtn.disabled = !valid;
    if (tonBtn) tonBtn.disabled = !valid;
    if (errorP) errorP.textContent = errorMsg;
}

// Выполнение обмена
async function doExchange(currency) {
    const input = document.getElementById('exchange-amount');
    const amount = parseFloat(input?.value) || 0;

    if (amount <= 0 || amount > srum) return;

    let received, receivedCurrency;
    if (currency === 'USDT') {
        received = amount * EXCHANGE_RATE.USDT;
        receivedCurrency = 'USDT';
    } else {
        received = amount * EXCHANGE_RATE.TON;
        receivedCurrency = 'TON';
    }

    // Подтверждение
    const confirmed = confirm(
        `Обменять ${amount.toFixed(2)} SRUM?\n\n` +
        `Вы получите: ${received.toFixed(currency === 'TON' ? 4 : 2)} ${receivedCurrency}\n\n` +
        `Подтвердите операцию.`
    );

    if (!confirmed) return;

    // Списываем SRUM, начисляем валюту
    srum -= amount;
    if (currency === 'USDT') {
        usdt += received;
    } else {
        ton += received;
    }

    updateUI();
    saveAll();

    // Сохраняем в облако
    if (typeof saveUserData === 'function' && userId) {
        saveUserData(userId, { srum, usdt, ton }).catch(() => {});
    }

    // Логируем транзакцию
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                user_id: userId,
                type: 'exchange',
                amount: amount,
                currency: 'SRUM',
                srum_amount: -amount,
                tx_hash: 'exchange_' + receivedCurrency + '_' + Date.now(),
                created_at: new Date().toISOString()
            })
        });
    } catch (e) {
        console.error('Ошибка логирования:', e);
    }

    // Обновляем интерфейс
    renderWallet();
    alert(`✅ Готово! ${amount.toFixed(2)} SRUM → ${received.toFixed(currency === 'TON' ? 4 : 2)} ${receivedCurrency}`);
}

// ================== ЗАПРОС ВЫВОДА СРЕДСТВ ==================
async function requestWithdrawal() {
    if (!currentWalletAddress) {
        alert('Сначала подключите кошелёк TON');
        return;
    }

    let limit = 50;
    switch (userStatus) {
        case 'silver': limit = 200; break;
        case 'gold': limit = 500; break;
        case 'platinum': limit = 1000; break;
    }

    const amountSRUM = prompt(`Введите сумму SRUM для вывода (макс. ${limit}):`);
    if (!amountSRUM || isNaN(amountSRUM) || parseFloat(amountSRUM) <= 0) return;
    const amount = parseFloat(amountSRUM);

    if (amount > limit) {
        alert(`Лимит: ${limit} SRUM/сутки.`);
        return;
    }
    if (amount > srum) {
        alert('Недостаточно SRUM');
        return;
    }

    try {
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
                usdt_amount: amount,
                status: 'pending',
                created_at: new Date().toISOString()
            })
        });

        if (response.ok) {
            srum -= amount;
            updateUI();
            saveAll();
            if (typeof saveUserData === 'function' && userId) {
                saveUserData(userId, { srum }).catch(() => {});
            }
            alert('✅ Заявка на вывод создана!');
        } else {
            alert('Ошибка создания заявки.');
        }
    } catch (e) {
        console.error(e);
        alert('Ошибка соединения.');
    }
}
