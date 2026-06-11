// ================== ПОКУПКА SRUM ЧЕРЕЗ TON CONNECT ==================

// Админ-кошелёк — сюда поступают TON от игроков при покупке SRUM
const ADMIN_WALLET = 'UQCM95PSNxwcJi-IX_bAAs4-_6Txde_XxitDP09n2PhFcPIM';

// URL Supabase Edge Function для начисления SRUM после транзакции
const EDGE_FUNCTION_URL = 'https://hngfpdsnjgdpazmortix.supabase.co/functions/v1/buy-srum';

/**
 * Отправляет транзакцию TON через подключённый кошелёк и запрашивает начисление SRUM.
 * Вызывается из магазина при покупке товара с валютой TON.
 * @param {number} amountInTon — сумма TON для покупки
 * @returns {boolean} — успешность операции
 */
async function buySRUMWithTON(amountInTon) {
    // Проверка: инициализирован ли TON Connect
    if (!tonConnectUI) {
        alert('TON Connect ещё загружается. Попробуйте через пару секунд.');
        return false;
    }

    // Проверка: подключён ли кошелёк
    if (!currentWalletAddress) {
        alert('Сначала подключите кошелёк TON в разделе "Кошелёк" 👛');
        return false;
    }

    // Формируем транзакцию
    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // Действительна 10 минут
        messages: [
            {
                address: ADMIN_WALLET,                     // Админ-кошелёк
                amount: (amountInTon * 1e9).toString(),   // Сумма в нанотонах (1 TON = 10^9 нанотонов)
                payload: btoa(JSON.stringify({            // Закодированное сообщение
                    type: 'BuySRUM',
                    buyer: currentWalletAddress,
                    amount: amountInTon
                }))
            }
        ]
    };

    try {
        // Отправляем транзакцию через кошелёк пользователя
        const result = await tonConnectUI.sendTransaction(transaction);
        console.log('Транзакция отправлена, boc:', result.boc);

        // Запрашиваем сервер начислить SRUM
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                amount: amountInTon,
                tx_hash: result.boc // Идентификатор транзакции для проверки
            })
        });

        if (response.ok) {
            const data = await response.json();
            window.srum = data.new_balance; // Обновляем глобальный баланс
            updateUI();                      // Обновляем интерфейс
            alert(`🎉 Вы купили ${amountInTon * 2} SRUM!`);
            return true;
        } else {
            const err = await response.json();
            console.error('Ошибка начисления SRUM:', err);
            alert('Ошибка начисления: ' + (err.error || 'попробуйте позже'));
            return false;
        }
    } catch (e) {
        console.error('Ошибка транзакции:', e);
        
        // Особая обработка: пользователь отменил транзакцию в кошельке
        if (e.message && e.message.includes('cancel')) {
            alert('Транзакция отменена.');
        } else {
            alert('Не удалось выполнить покупку. Попробуйте позже.');
        }
        return false;
    }
}
