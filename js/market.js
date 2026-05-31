// ================== МАГАЗИН ==================
const defaultShopItems = [
    { id: 1, name: 'Бустер x2', icon: '⚡', price: 1, currency: 'SRUM', description: 'Удваивает награду на 24 часа' },
    { id: 2, name: 'Бустер x3', icon: '⚡⚡', price: 2, currency: 'SRUM', description: 'Утраивает награду на 24 часа' },
    { id: 3, name: 'Бустер x5', icon: '⚡⚡⚡', price: 3, currency: 'SRUM', description: 'Увеличивает награду в 5 раз на 24 часа' },
    { id: 4, name: 'Статус Серебро', icon: '🥈', price: 100, currency: 'SRUM', description: '+1M RUM, вывод от 200 SRUM' },
    { id: 5, name: 'Статус Золото', icon: '🥇', price: 200, currency: 'SRUM', description: '+2M RUM, вывод от 100 SRUM' },
    { id: 6, name: 'Статус Платина', icon: '💠', price: 300, currency: 'SRUM', description: '+3M RUM, вывод от 25 SRUM' },
    { id: 7, name: 'Купить SRUM за TON', icon: '💱', price: 1, currency: 'TON', description: 'Получите 2 SRUM за 1 TON' },
    { id: 8, name: 'Купить SRUM за USDT', icon: '💱', price: 1, currency: 'USDT', description: 'Получите 1 SRUM за 1 USDT' },
    { id: 9, name: 'Обменять SRUM на TON', icon: '💱', price: 1, currency: 'SRUM', description: 'Получите 0.5 TON за 1 SRUM' },
    { id: 10, name: 'Обменять SRUM на USDT', icon: '💱', price: 1, currency: 'SRUM', description: 'Получите 1 USDT за 1 SRUM' }
];

let shopItems = JSON.parse(localStorage.getItem('shopItems')) || defaultShopItems;
if (!localStorage.getItem('shopItems')) {
    localStorage.setItem('shopItems', JSON.stringify(defaultShopItems));
}

// Рендер сетки товаров
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

    // Обработчики кнопок
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const item = shopItems.find(i => i.id === id);
            if (!item) return;
            purchaseItem(item);
        });
    });
}

// Логика покупки
function purchaseItem(item) {
    let balance = 0;
    switch (item.currency) {
        case 'RUM': balance = window.rum; break;
        case 'SRUM': balance = window.srum; break;
        case 'TON': balance = window.ton; break;
        case 'USDT': balance = window.usdt; break;
    }
    if (balance < item.price) {
        alert(`Недостаточно ${item.currency}`);
        return;
    }

    switch (item.currency) {
        case 'RUM': window.rum -= item.price; break;
        case 'SRUM': window.srum -= item.price; break;
        case 'TON': window.ton -= item.price; break;
        case 'USDT': window.usdt -= item.price; break;
    }

    if (item.id === 1) { window.activeBoost = { type: 2, endTime: Date.now() + 86400000 }; }
    else if (item.id === 2) { window.activeBoost = { type: 3, endTime: Date.now() + 86400000 }; }
    else if (item.id === 3) { window.activeBoost = { type: 5, endTime: Date.now() + 86400000 }; }
    else if (item.id === 4) { window.rum += 1000000; window.userStatus = 'silver'; alert('Статус Серебро активирован!'); }
    else if (item.id === 5) { window.rum += 2000000; window.userStatus = 'gold'; alert('Статус Золото активирован!'); }
    else if (item.id === 6) { window.rum += 3000000; window.userStatus = 'platinum'; alert('Статус Платина активирован!'); }
    else if (item.id === 7) { window.srum += 2; }
    else if (item.id === 8) { window.srum += 1; }
    else if (item.id === 9) { window.ton += 0.5; }
    else if (item.id === 10) { window.usdt += 1; }
    else {
        alert(`Вы приобрели "${item.name}"!`);
    }

    updateUI();
}

// Инициализация магазина при открытии экрана
const shopScreenObserver = new MutationObserver(() => {
    if (document.getElementById('shop-screen').classList.contains('active')) {
        renderShop();
    }
});
shopScreenObserver.observe(document.getElementById('shop-screen'), { attributes: true });

if (document.getElementById('shop-screen').classList.contains('active')) {
    renderShop();
}
