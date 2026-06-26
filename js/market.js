// ================== МАГАЗИН ==================

const defaultShopItems = [
    { id: 1,  name: 'Бустер x2',          icon: '⚡',       price: 1,     currency: 'SRUM',  description: 'Удваивает награду на 24 часа' },
    { id: 2,  name: 'Бустер x3',          icon: '⚡⚡',     price: 2,     currency: 'SRUM',  description: 'Утраивает награду на 24 часа' },
    { id: 3,  name: 'Бустер x5',          icon: '⚡⚡⚡',   price: 3,     currency: 'SRUM',  description: 'Увеличивает награду в 5 раз на 24 часа' },
    { id: 4,  name: 'Статус Серебро',     icon: '🥈',       price: 100,   currency: 'SRUM',  description: '+1M RUM, вывод от 200 SRUM' },
    { id: 5,  name: 'Статус Золото',      icon: '🥇',       price: 200,   currency: 'SRUM',  description: '+2M RUM, вывод от 100 SRUM' },
    { id: 6,  name: 'Статус Платина',     icon: '💠',       price: 300,   currency: 'SRUM',  description: '+3M RUM, вывод от 25 SRUM' },
    { id: 7,  name: 'Обменять TON → SRUM', icon: '⚡→💎',    price: 1,     currency: 'TON',   description: '1 TON = 2 SRUM (через кошелёк)' },
    { id: 8,  name: 'Обменять RUM → SRUM', icon: '🪙→💎',    price: 10000, currency: 'RUM',   description: '10 000 RUM = 1 SRUM (раз в 24 часа)' },
    { id: 9,  name: 'Обменять Stars → SRUM', icon: '⭐→💎',   price: 50,    currency: 'STARS', description: '50 Stars = 1 SRUM (оплата картой)' }
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

        let priceDisplay = '';
        switch (item.currency) {
            case 'TON':   priceDisplay = `⚡ ${item.price} TON`; break;
            case 'STARS': priceDisplay = `⭐ ${item.price} Stars`; break;
            case 'RUM':   priceDisplay = `🪙 ${item.price.toLocaleString()} RUM`; break;
            case 'SRUM':  priceDisplay = `💎 ${item.price} SRUM`; break;
            default:      priceDisplay = `${item.price} ${item.currency}`;
        }

        card.innerHTML = `
            <div class="icon">${item.icon}</div>
            <div class="name">${item.name}</div>
            <div class="price">${priceDisplay}</div>
            <div style="font-size:0.7rem;color:#aaa;margin:4px 0;">${item.description}</div>
            <button class="buy-btn" data-id="${item.id}">Обменять</button>
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
    if (item.currency === 'TON') {
        if (!currentWalletAddress) {
            alert('Подключите TON кошелёк в разделе 👛 Кошелёк');
            return;
        }
        const tonNeeded = item.price;
        if (ton < tonNeeded) {
            alert(`Недостаточно TON. Нужно ${tonNeeded.toFixed(2)} TON, у вас ${ton.toFixed(2)} TON`);
            return;
        }
        if (!confirm(`Обменять ${tonNeeded} TON → ${tonNeeded * 2} SRUM?`)) return;
        const success = await buySRUMWithTON(item.price);
        if (success) {
            ton -= tonNeeded;
            srum += tonNeeded * 2;
            updateUI();
            saveAll();
        }
        return;
    }

    if (item.currency === 'STARS') {
        buyWithStars(item.price);
        return;
    }

    if (item.id === 8) {
        const now = Date.now();
        const lastExchange = parseInt(localStorage.getItem('lastRumExchange') || '0');
        if (now - lastExchange < 86400000) {
            const remaining = Math.ceil((86400000 - (now - lastExchange)) / 3600000);
            alert(`Обмен доступен раз в 24 часа. Осталось ~${remaining} ч.`);
            return;
        }
        if (rum < 10000) return alert('Недостаточно RUM (нужно 10 000)');
        if (!confirm('Обменять 10 000 RUM → 1 SRUM?')) return;
        rum -= 10000;
        srum += 1;
        localStorage.setItem('lastRumExchange', now.toString());
        if (userId && typeof saveUserData === 'function') {
            saveUserData(userId, { rum, srum }).catch(console.error);
        }
        alert('✅ Обменяно! 10 000 RUM → 1 SRUM');
        updateUI();
        return;
    }

    let balance = item.currency === 'SRUM' ? window.srum : window.rum;
    if (balance < item.price) return alert(`Недостаточно ${item.currency}`);

    if (!confirm(`Приобрести «${item.name}» за ${item.price} ${item.currency}?`)) return;

    if (item.currency === 'SRUM') window.srum -= item.price;
    else window.rum -= item.price;

    applyItemEffect(item);
}

function applyItemEffect(item) {
    if (item.id === 1)      { activeBoost = { type: 2, endTime: Date.now() + 86400000 }; alert('Бустер x2 на 24 часа!'); }
    else if (item.id === 2) { activeBoost = { type: 3, endTime: Date.now() + 86400000 }; alert('Бустер x3 на 24 часа!'); }
    else if (item.id === 3) { activeBoost = { type: 5, endTime: Date.now() + 86400000 }; alert('Бустер x5 на 24 часа!'); }
    else if (item.id === 4) { rum += 1000000; userStatus = 'silver';  alert('Статус Серебро! +1M RUM'); }
    else if (item.id === 5) { rum += 2000000; userStatus = 'gold';    alert('Статус Золото! +2M RUM'); }
    else if (item.id === 6) { rum += 3000000; userStatus = 'platinum'; alert('Статус Платина! +3M RUM'); }
    else { alert(`«${item.name}» получено!`); }
    updateUI();
}

async function buyWithStars(amount) {
    if (!window.Telegram || !Telegram.WebApp) {
        alert('Оплата Stars доступна только в Telegram');
        return;
    }

    Telegram.WebApp.openInvoice({
        title: 'Обмен Stars → SRUM',
        description: `${amount} Stars → ${amount * 1} SRUM`,
        payload: JSON.stringify({ type: 'buy_srum', amount: amount }),
        provider_token: '',
        currency: 'XTR',
        prices: [{ label: 'SRUM', amount: amount }]
    }, async (status) => {
        if (status === 'paid') {
            srum += amount;
            updateUI();
            saveAll();
            if (userId && typeof saveUserData === 'function') {
                saveUserData(userId, { srum }).catch(console.error);
            }
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
                        user_id: userId, type: 'buy_srum_stars', amount: amount,
                        currency: 'STARS', srum_amount: amount,
                        tx_hash: 'stars_' + Date.now(), created_at: new Date().toISOString()
                    })
                });
            } catch(e) {}
            alert(`✅ Обменяно! ${amount} Stars → ${amount} SRUM`);
        } else if (status === 'failed') {
            alert('Платёж не прошёл. Попробуйте ещё раз.');
        }
    });
}

const shopScreenObserver = new MutationObserver(() => {
    if (document.getElementById('shop-screen').classList.contains('active')) renderShop();
});
shopScreenObserver.observe(document.getElementById('shop-screen'), { attributes: true });
if (document.getElementById('shop-screen').classList.contains('active')) renderShop();
