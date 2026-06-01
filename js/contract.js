// ================== ПОКУПКА ТОВАРОВ ЗА TON/USDT (СМАРТ-КОНТРАКТ) ==================
const ADMIN_WALLET = 'EQAXN7Ibjs-_PjDtfW7uPhifRDU0aqkyyJhqVeZDoaI_4ZCB';

async function purchaseWithCrypto(amount, currency) {
    if (!tonConnectUI || !currentWalletAddress) {
        alert('Сначала подключите кошелёк TON');
        return;
    }

    if (currency !== 'TON' && currency !== 'USDT') {
        alert('Эта валюта не поддерживается');
        return;
    }

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
            {
                address: ADMIN_WALLET,
                amount: (amount * 1e9).toString(),
                payload: btoa(JSON.stringify({
                    type: 'Purchase',
                    buyer: currentWalletAddress,
                    amount: amount,
                    currency: currency
                }))
            }
        ]
    };

    try {
        const result = await tonConnectUI.sendTransaction(transaction);
        console.log('Транзакция отправлена:', result);
        return true;
    } catch (e) {
        console.error('Ошибка транзакции:', e);
        alert('Не удалось выполнить оплату. Попробуйте позже.');
        return false;
    }
}
