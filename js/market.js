// ================== МАГАЗИН ==================
const defaultShopItems = [
    { id: 1, name: 'Бустер x2', icon: '⚡', price: 1, currency: 'SRUM', description: 'Удваивает награду на 24 часа' },
    { id: 2, name: 'Бустер x3', icon: '⚡⚡', price: 2, currency: 'SRUM', description: 'Утраивает награду на 24 часа' },
    { id: 3, name: 'Бустер x5', icon: '⚡⚡⚡', price: 3, currency: 'SRUM', description: 'Увеличивает награду в 5 раз на 24 часа' },
    { id: 4, name: 'Статус Серебро', icon: '🥈', price: 100, currency: 'SRUM', description: '+1M RUM, вывод от 200 SRUM' },
    { id: 5, name: 'Статус Золото', icon: '🥇', price: 200, currency: 'SRUM', description: '+2M RUM, вывод от 100 SRUM' },
    { id: 6, name: 'Статус Платина', icon: '💠', price: 300, currency: 'SRUM', description: '+3M RUM, вывод от 25 SRUM' },
    { id: 7, name: 'Купить SRUM за TON', icon: '💎', price: 1, currency: 'TON', description: '2 SRUM за 1 TON' },
    { id: 8, name: 'Обмен RUM → SRUM (раз в сутки)', icon: '🔄', price: 10000, currency: 'RUM', description: '10 000 RUM = 1 SRUM (раз в 24 часа)' }
];

let shopItems = JSON.parse(localStorage.getItem('shopItems')) || defaultShopItems;
if (!localStorage.getItem('shopItems')) localStorage.setItem('shopItems', JSON.stringify(defaultShopItems));

function renderShop() {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;
    grid.innerHTML = '';
    shopItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'shop-card';
        card.innerHTML = `
            <div class="icon">${item.icon}</div>
            <div class="name">${item.name}</div>
            <div class="price">${item.price} <span class="currency">${item.currency}</span></div>
            <button class="buy-btn" data-id="${item.id}">Купить</button>
        `;
        grid.appendChild(card);
    });

    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.target.dataset.id);
            const item = shopItems.find(i => i.id === id);
            if (!item) return;
            purchaseItem(item);
        });
    });
}

async function purchaseItem(item) {
    // Товары за TON – через смарт-контракт
    if (item.currency === 'TON') {
        const success = await buySRUMWithTON(item.price);
        if (success) applyItemEffect(item);
        return;
    }

    // Ежедневный обмен RUM → SRUM
    if (item.id === 8) {
        const now = Date.now();
        const lastExchange = parseInt(localStorage.getItem('lastRumExchange') || '0');
        if (now - lastExchange < 86400000) {
            const remaining = Math.ceil((86400000 - (now - lastExchange)) / 3600000);
            alert(`Обмен доступен раз в 24 часа. Осталось примерно ${remaining} ч.`);
            return;
        }
        if (rum < 10000) {
            alert('Недостаточно RUM (нужно 10 000)');
            return;
        }
        rum -= 10000;
        srum += 1;
        localStorage.setItem('lastRumExchange', now.toString());
        // Сохраняем в облаке
        if (userId) {
            saveUserData(userId, { rum, srum, last_rum_exchange: new Date(now).toISOString() }).catch(console.error);
        }
        alert('✅ Обменяно! 10 000 RUM → 1 SRUM');
        updateUI();
        return;
    }

    // Товары за SRUM или RUM – внутренний баланс
    let balance = item.currency === 'SRUM' ? window.srum : window.rum;
    if (balance < item.price) {
        alert(`Недостаточно ${item.currency}`);
        return;
    }

    if (item.currency === 'SRUM') window.srum -= item.price;
    else window.rum -= item.price;

    applyItemEffect(item);
}

function applyItemEffect(item) {
    if (item.id === 1) window.activeBoost = { type: 2, endTime: Date.now() + 86400000 };
    else if (item.id === 2) window.activeBoost = { type: 3, endTime: Date.now() + 86400000 };
    else if (item.id === 3) window.activeBoost = { type: 5, endTime: Date.now() + 86400000 };
    else if (item.id === 4) { window.rum += 1000000; window.userStatus = 'silver'; alert('Статус Серебро активирован!'); }
    else if (item.id === 5) { window.rum += 2000000; window.userStatus = 'gold'; alert('Статус Золото активирован!'); }
    else if (item.id === 6) { window.rum += 3000000; window.userStatus = 'platinum'; alert('Статус Платина активирован!'); }
    else if (item.id === 7) { /* handled by contract */ }
    else { alert(`Вы приобрели "${item.name}"!`); }
    updateUI();
}

const shopScreenObserver = new MutationObserver(() => {
    if (document.getElementById('shop-screen').classList.contains('active')) renderShop();
});
shopScreenObserver.observe(document.getElementById('shop-screen'), { attributes: true });
if (document.getElementById('shop-screen').classList.contains('active')) renderShop();
