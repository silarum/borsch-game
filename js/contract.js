// ================== ПОКУПКА SRUM ЧЕРЕЗ СЕРВЕР ==================
const ADMIN_WALLET = 'EQAXN7Ibjs-_PjDtfW7uPhifRDU0aqkyyJhqVeZDoaI_4ZCB';
const EDGE_FUNCTION_URL = 'https://hngfpdsnjgdpazmortix.supabase.co/functions/v1/buy-srum';

async function buySRUMWithTON(amountInTon) {
    if (!tonConnectUI || !currentWalletAddress) {
        alert('Сначала подключите кошелёк TON');
        return;
    }

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
            {
                address: ADMIN_WALLET,
                amount: (amountInTon * 1e9).toString(),
                payload: btoa(JSON.stringify({
                    type: 'BuySRUM',
                    buyer: currentWalletAddress,
                    amount: amountInTon
                }))
            }
        ]
    };

    try {
        const result = await tonConnectUI.sendTransaction(transaction);
        console.log('Транзакция отправлена:', result);

        // Отправляем запрос на сервер для начисления SRUM
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                amount: amountInTon,
                tx_hash: result.boc // или другой идентификатор транзакции
            })
        });

        if (response.ok) {
            const data = await response.json();
            window.srum = data.new_balance;
            updateUI();
            alert(`🎉 Вы купили ${amountInTon * 2} SRUM!`);
        } else {
            const err = await response.json();
            alert('Ошибка начисления: ' + (err.error || 'попробуйте позже'));
        }
    } catch (e) {
        console.error('Ошибка транзакции:', e);
        alert('Не удалось выполнить покупку. Попробуйте позже.');
    }
}
