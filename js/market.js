// ================== МАГАЗИН ==================

const defaultShopItems = [
    { id: 1,  name: 'Бустер x2',          icon: '⚡',       price: 1,     currency: 'SRUM',  description: 'Удваивает награду на 24 часа' },
    { id: 2,  name: 'Бустер x3',          icon: '⚡⚡',     price: 2,     currency: 'SRUM',  description: 'Утраивает награду на 24 часа' },
    { id: 3,  name: 'Бустер x5',          icon: '⚡⚡⚡',   price: 3,     currency: 'SRUM',  description: 'Увеличивает награду в 5 раз на 24 часа' },
    { id: 4,  name: 'Статус Серебро',     icon: '🥈',       price: 100,   currency: 'SRUM',  description: '+1M игровых RUM и статус Серебро' },
    { id: 5,  name: 'Статус Золото',      icon: '🥇',       price: 200,   currency: 'SRUM',  description: '+2M игровых RUM и статус Золото' },
    { id: 6,  name: 'Статус Платина',     icon: '💠',       price: 300,   currency: 'SRUM',  description: '+3M игровых RUM и статус Платина' },
    { id: 7,  name: 'SRUM за TON',        icon: '⚡→💎',    price: 1,     currency: 'TON',   description: 'Временно отключено: требуется проверенный платёжный сервер' },
    { id: 8,  name: 'Добыть SRUM за RUM', icon: '🪙→💎',    price: 10000, currency: 'RUM',   description: '10 000 RUM = 1 SRUM (раз в 24 часа)' },
    { id: 9,  name: 'SRUM за Stars',      icon: '⭐→💎',    price: 50,    currency: 'STARS', description: 'Временно отключено: требуется проверенный платёжный сервер' }
];

const shopItems = defaultShopItems;

function injectShopStyles() {
    if (document.getElementById('shop-custom-styles')) return;
    const style = document.createElement('style');
    style.id = 'shop-custom-styles';
    style.textContent = `
        .shop-inner { padding:10px 10px 80px; width:100%; max-width:420px; margin:0 auto; overflow-y:auto; -webkit-overflow-scrolling:touch; }
        .shop-list { display:flex; flex-direction:column; gap:12px; }
        .shop-item { background:linear-gradient(145deg,#1a1a3e,#252550); border:1px solid rgba(255,215,0,0.15); border-radius:16px; padding:16px; display:flex; align-items:center; gap:14px; box-shadow:0 4px 20px rgba(0,0,0,0.3); position:relative; overflow:hidden; }
        .shop-item:active { transform:scale(0.98); border-color:rgba(255,215,0,0.4); }
        .shop-icon { font-size:2.5rem; min-width:50px; text-align:center; filter:drop-shadow(0 0 8px rgba(255,215,0,0.4)); }
        .shop-info { flex:1; }
        .shop-info .sname { font-weight:bold; font-size:0.9rem; color:#FFD700; margin-bottom:2px; }
        .shop-info .sdesc { font-size:0.65rem; color:#888; margin-bottom:4px; line-height:1.3; }
        .shop-info .sprice { font-size:0.95rem; font-weight:900; }
        .shop-info .sprice .sval { color:#fff; }
        .shop-info .sprice .scur { font-size:0.7rem; color:#aaa; margin-left:3px; }
        .shop-btn { padding:10px 16px; border:none; border-radius:10px; font-weight:bold; font-size:0.8rem; cursor:pointer; min-width:70px; text-align:center; background:linear-gradient(180deg,#FFD700,#FFA500); color:#000; box-shadow:0 4px 0 #b8860b,0 0 12px rgba(255,215,0,0.3); }
        .shop-btn:active { transform:translateY(2px); box-shadow:0 1px 0 #b8860b,0 0 6px rgba(255,215,0,0.3); }
        .shop-badge { position:absolute; top:8px; right:8px; font-size:0.6rem; padding:2px 8px; border-radius:6px; font-weight:bold; }
        .badge-hot { background:#e74c3c; color:white; }
        .badge-new { background:#27ae60; color:white; }
        .badge-top { background:#8e44ad; color:white; }
    `;
    document.head.appendChild(style);
}

function renderShop() {
    injectShopStyles();
    const screen = document.getElementById('shop-screen');
    if (!screen) return;
    
    const backBtn = screen.querySelector('.back-btn');
    const title = screen.querySelector('h2');
    screen.innerHTML = '';
    if (backBtn) screen.appendChild(backBtn);
    if (title) screen.appendChild(title);

    const inner = document.createElement('div');
    inner.className = 'shop-inner';
    const list = document.createElement('div');
    list.className = 'shop-list';

    shopItems.forEach((item, i) => {
        let priceColor = '#fff';
        if (item.currency === 'TON') priceColor = '#2196F3';
        else if (item.currency === 'RUM') priceColor = '#4CAF50';
        else if (item.currency === 'SRUM' || item.currency === 'STARS') priceColor = '#FFD700';

        let badge = '';
        if (i < 3) badge = '<span class="shop-badge badge-hot">ХИТ</span>';
        else if (i === 8) badge = '<span class="shop-badge badge-new">NEW</span>';
        else if (i >= 4 && i <= 6) badge = '<span class="shop-badge badge-top">ТОП</span>';

        const card = document.createElement('div');
        card.className = 'shop-item';
        card.innerHTML = `
            ${badge}
            <div class="shop-icon">${item.icon}</div>
            <div class="shop-info">
                <div class="sname">${item.name}</div>
                <div class="sdesc">${item.description}</div>
                <div class="sprice"><span class="sval" style="color:${priceColor}">${item.price.toLocaleString()} <span class="scur">${item.currency}</span></span></div>
            </div>
            <button class="shop-btn" data-id="${item.id}">Добыть</button>
        `;
        list.appendChild(card);
    });

    inner.appendChild(list);
    screen.appendChild(inner);

    screen.querySelectorAll('.shop-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.target.dataset.id);
            const item = shopItems.find(i => i.id === id);
            if (!item) return;
            purchaseItem(item);
        });
    });
}

async function purchaseItem(item) {
    if (item.currency === 'TON' || item.currency === 'STARS') {
        window.showSafeModeNotice();
        return;
    }
    if (item.id === 8) {
        const now = Date.now();
        const lastExchange = parseInt(localStorage.getItem('lastRumExchange') || '0');
        if (now - lastExchange < 86400000) { alert(`Добыча раз в 24 часа. Осталось ~${Math.ceil((86400000-(now-lastExchange))/3600000)} ч.`); return; }
        if (rum < 10000) return alert('Недостаточно RUM');
        if (!confirm('Добыть 1 SRUM за 10 000 RUM?')) return;
        rum -= 10000; srum += 1;
        localStorage.setItem('lastRumExchange', now.toString());
        if (userId && typeof saveUserData === 'function') { saveUserData(userId, { rum, srum }).catch(console.error); }
        alert('✅ Добыто!'); updateUI();
        return;
    }
    let balance = item.currency === 'SRUM' ? srum : rum;
    if (balance < item.price) return alert(`Недостаточно ${item.currency}`);
    if (!confirm(`Приобрести «${item.name}» за ${item.price} ${item.currency}?`)) return;
    if (item.currency === 'SRUM') srum -= item.price; else rum -= item.price;
    applyItemEffect(item);
}

function applyItemEffect(item) {
    if (item.id === 1) { activeBoost = { type: 2, endTime: Date.now() + 86400000 }; alert('Бустер x2!'); }
    else if (item.id === 2) { activeBoost = { type: 3, endTime: Date.now() + 86400000 }; alert('Бустер x3!'); }
    else if (item.id === 3) { activeBoost = { type: 5, endTime: Date.now() + 86400000 }; alert('Бустер x5!'); }
    else if (item.id === 4) { rum += 1000000; userStatus = 'silver'; alert('Статус Серебро!'); }
    else if (item.id === 5) { rum += 2000000; userStatus = 'gold'; alert('Статус Золото!'); }
    else if (item.id === 6) { rum += 3000000; userStatus = 'platinum'; alert('Статус Платина!'); }
    else { alert(`«${item.name}» получено!`); }
    updateUI();
}

async function buyWithStars(amount) {
    void amount;
    window.showSafeModeNotice();
}

// Запуск при открытии
const shopObserver = new MutationObserver(() => {
    if (document.getElementById('shop-screen').classList.contains('active')) renderShop();
});
shopObserver.observe(document.getElementById('shop-screen'), { attributes: true });
if (document.getElementById('shop-screen').classList.contains('active')) renderShop();
