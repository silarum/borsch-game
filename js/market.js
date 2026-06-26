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

// Стили магазина (добавляем один раз)
function injectShopStyles() {
    if (document.getElementById('shop-custom-styles')) return;
    const style = document.createElement('style');
    style.id = 'shop-custom-styles';
    style.textContent = `
        .shop-screen-inner { padding:10px 10px 80px; width:100%; max-width:420px; margin:0 auto; }
        .shop-grid-new { display:flex; flex-direction:column; gap:12px; }
        .shop-card-new { 
            background:linear-gradient(145deg, #1a1a3e 0%, #252550 100%);
            border:1px solid rgba(255,215,0,0.15);
            border-radius:16px; padding:16px; display:flex; align-items:center; gap:14px;
            box-shadow:0 4px 20px rgba(0,0,0,0.3); transition:all 0.3s ease;
            position:relative; overflow:hidden;
        }
        .shop-card-new::before {
            content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%;
            background:radial-gradient(circle, rgba(255,215,0,0.03) 0%, transparent 70%);
            pointer-events:none;
        }
        .shop-card-new:active { transform:scale(0.98); border-color:rgba(255,215,0,0.4); }
        .shop-card-icon { 
            font-size:2.5rem; min-width:50px; text-align:center;
            filter:drop-shadow(0 0 8px rgba(255,215,0,0.4));
        }
        .shop-card-info { flex:1; }
        .shop-card-info .name { font-weight:bold; font-size:0.9rem; color:#FFD700; margin-bottom:2px; }
        .shop-card-info .desc { font-size:0.65rem; color:#888; margin-bottom:4px; line-height:1.3; }
        .shop-card-info .price { font-size:0.95rem; font-weight:900; }
        .shop-card-info .price .val { color:#fff; }
        .shop-card-info .price .cur { font-size:0.7rem; color:#aaa; margin-left:3px; }
        .shop-card-btn {
            padding:10px 16px; border:none; border-radius:10px; font-weight:bold; font-size:0.8rem;
            cursor:pointer; min-width:70px; text-align:center; transition:all 0.2s;
            background:linear-gradient(180deg,#FFD700,#FFA500); color:#000;
            box-shadow:0 4px 0 #b8860b, 0 0 12px rgba(255,215,0,0.3);
        }
        .shop-card-btn:active { transform:translateY(2px); box-shadow:0 1px 0 #b8860b, 0 0 6px rgba(255,215,0,0.3); }
        .shop-card-btn:disabled { background:#555; box-shadow:none; color:#999; }
        .shop-card-badge {
            position:absolute; top:8px; right:8px; font-size:0.6rem; padding:2px 8px; border-radius:6px;
            font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;
        }
        .badge-hot { background:#e74c3c; color:white; }
        .badge-new { background:#27ae60; color:white; }
        .badge-pop { background:#8e44ad; color:white; }
    `;
    document.head.appendChild(style);
}

function renderShop() {
    injectShopStyles();

    const screen = document.getElementById('shop-screen');
    if (!screen) return;
    
    // Очищаем экран и создаём новую структуру
    const backBtn = screen.querySelector('.back-btn');
    const title = screen.querySelector('h2');
    screen.innerHTML = '';
    if (backBtn) screen.appendChild(backBtn);
    if (title) screen.appendChild(title);

    const inner = document.createElement('div');
    inner.className = 'shop-screen-inner';
    
    const grid = document.createElement('div');
    grid.className = 'shop-grid-new';

    shopItems.forEach((item, index) => {
        let priceDisplay = '';
        let priceColor = '#fff';
        switch (item.currency) {
            case 'TON':   priceDisplay = `${item.price} <span class="cur">TON</span>`; priceColor = '#2196F3'; break;
            case 'STARS': priceDisplay = `${item.price} <span class="cur">Stars</span>`; priceColor = '#FFD700'; break;
            case 'RUM':   priceDisplay = `${item.price.toLocaleString()} <span class="cur">RUM</span>`; priceColor = '#4CAF50'; break;
            case 'SRUM':  priceDisplay = `${item.price} <span class="cur">SRUM</span>`; priceColor = '#FFD700'; break;
            default:      priceDisplay = `${item.price} <span class="cur">${item.currency}</span>`;
        }

        // Бейджи для товаров
        let badge = '';
        if (index < 3) badge = '<span class="shop-card-badge badge-hot">ХИТ</span>';
        else if (index === 8) badge = '<span class="shop-card-badge badge-new">NEW</span>';
        else if (index >= 4 && index <= 6) badge = '<span class="shop-card-badge badge-pop">ТОП</span>';

        const card = document.createElement('div');
        card.className = 'shop-card-new';
        card.innerHTML = `
            ${badge}
            <div class="shop-card-icon">${item.icon}</div>
            <div class="shop-card-info">
                <div class="name">${item.name}</div>
                <div class="desc">${item.description}</div>
                <div class="price"><span class="val" style="color:${priceColor}">${priceDisplay}</span></div>
            </div>
            <button class="shop-card-btn" data-id="${item.id}">Обменять</button>
        `;
        grid.appendChild(card);
    });

    inner.appendChild(grid);
    screen.appendChild(inner);

    // Обработчики кнопок
    screen.querySelectorAll('.shop-card-btn').forEach(btn => {
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

// Наблюдатель за открытием экрана магазина
const shopScreenObserver = new MutationObserver(() => {
    if (document.getElementById('shop-screen').classList.contains('active')) {
        renderShop();
    }
});
shopScreenObserver.observe(document.getElementById('shop-screen'), { attributes: true });
if (document.getElementById('shop-screen').classList.contains('active')) renderShop();
