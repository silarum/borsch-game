// ================== TON CONNECT + ВЫВОД USDT ==================

// Глобальные переменные для TON Connect
let tonConnectUI = null;         // Экземпляр TonConnectUI
let currentWalletAddress = null; // Адрес подключённого кошелька
let tonConnectInitialized = false; // Флаг успешной инициализации

// ================== ИНИЦИАЛИЗАЦИЯ TON CONNECT ==================
function initTonConnect() {
    // Проверяем, загружена ли библиотека TON Connect UI
    if (typeof TON_CONNECT_UI === 'undefined') {
        console.warn('TON Connect UI не загружен. Кошелёк будет недоступен.');
        // Показываем заглушку в контейнере кошелька
        const container = document.getElementById('ton-connect-container');
        if (container) {
            container.innerHTML = '<p style="color:#aaa;text-align:center;">Загрузка кошелька...</p>';
        }
        return;
    }

    try {
        // Создаём экземпляр TonConnectUI с манифестом
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: 'https://silarum.github.io/borsch-game/tonconnect-manifest.json',
            buttonRootId: 'ton-connect-container'
        });

        // Восстанавливаем сессию — если кошелёк был подключён ранее, подхватится автоматически
        tonConnectUI.connectionRestored.then((restored) => {
            if (restored) {
                console.log('Сессия TON Connect восстановлена');
            } else {
                console.log('Сессия не восстановлена — требуется ручное подключение');
            }
        });

        // Отслеживаем изменения статуса кошелька
        tonConnectUI.onStatusChange((wallet) => {
            if (wallet) {
                // Кошелёк подключён
                currentWalletAddress = wallet.account.address;
                const shortAddr = `${currentWalletAddress.slice(0, 6)}...${currentWalletAddress.slice(-4)}`;
                document.getElementById('wallet-address').textContent = `Кошелёк: ${shortAddr}`;
                console.log('Кошелёк подключён:', shortAddr);
                tonConnectInitialized = true;
            } else {
                // Кошелёк отключён
                currentWalletAddress = null;
                document.getElementById('wallet-address').textContent = 'Кошелёк не подключён';
                console.log('Кошелёк отключён');
                tonConnectInitialized = false;
            }
            updateUI(); // Обновляем интерфейс
        });

    } catch (e) {
        console.error('Ошибка инициализации TON Connect:', e);
        const container = document.getElementById('ton-connect-container');
        if (container) {
            container.innerHTML = '<p style="color:#ff6666;text-align:center;">Ошибка загрузки кошелька</p>';
        }
    }
}

// Запускаем инициализацию после полной загрузки страницы
window.addEventListener('load', () => {
    // Небольшая задержка, чтобы убедиться, что DOM и внешние скрипты готовы
    setTimeout(initTonConnect, 1500);
});

// ================== ВЫВОД USDT ==================

/**
 * Создаёт заявку на вывод USDT через Supabase.
 * Проверяет подключение кошелька, лимиты статуса и баланс.
 */
async function requestWithdrawal() {
    // Проверка: подключён ли кошелёк
    if (!currentWalletAddress) {
        alert('Сначала подключите кошелёк TON (кнопка в разделе "Кошелёк")');
        return;
    }

    // Определяем дневной лимит вывода в зависимости от статуса
    let limit = 50; // Базовый лимит для обычных игроков
    switch (userStatus) {
        case 'silver':  limit = 200; break;
        case 'gold':    limit = 500; break;
        case 'platinum': limit = 1000; break;
        default:        limit = 50;  break;
    }

    // Запрашиваем сумму у пользователя
    const amountSRUM = prompt(
        `Введите сумму SRUM для вывода:\n` +
        `Ваш лимит: ${limit} SRUM (1 SRUM = 1 USDT)\n` +
        `Ваш баланс: ${srum.toFixed(2)} SRUM`
    );

    // Проверка: введено ли число
    if (!amountSRUM || isNaN(amountSRUM) || parseFloat(amountSRUM) <= 0) {
        return; // Пользователь нажал "Отмена" или ввёл не число
    }

    const amount = parseFloat(amountSRUM);

    // Проверка: не превышен ли лимит
    if (amount > limit) {
        alert(`Ваш лимит вывода: ${limit} SRUM в сутки. Повысьте статус в Магазине.`);
        return;
    }

    // Проверка: хватает ли баланса
    if (amount > srum) {
        alert(`Недостаточно SRUM на балансе. У вас: ${srum.toFixed(2)} SRUM`);
        return;
    }

    // Отправляем заявку в Supabase
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
                usdt_amount: amount, // 1 SRUM = 1 USDT
                status: 'pending',
                created_at: new Date().toISOString()
            })
        });

        if (response.ok) {
            // Списываем SRUM с баланса
            srum -= amount;
            updateUI();
            alert(`✅ Заявка на вывод ${amount} USDT создана!\nОжидайте подтверждения администратором.`);
        } else {
            const errText = await response.text();
            console.error('Ошибка создания заявки:', errText);
            alert('Ошибка при создании заявки. Попробуйте позже.');
        }
    } catch (e) {
        console.error('Ошибка сети при создании заявки:', e);
        alert('Ошибка соединения с сервером. Проверьте интернет.');
    }
}
