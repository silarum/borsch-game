// ================== МАГАЗИН ==================
document.getElementById('buy-boost-x2').addEventListener('click', ()=>{ if(srum<1) return; srum-=1; activeBoost={type:2, endTime:Date.now()+86400000}; updateUI(); });
document.getElementById('buy-boost-x3').addEventListener('click', ()=>{ if(srum<2) return; srum-=2; activeBoost={type:3, endTime:Date.now()+86400000}; updateUI(); });
document.getElementById('buy-boost-x5').addEventListener('click', ()=>{ if(srum<3) return; srum-=3; activeBoost={type:5, endTime:Date.now()+86400000}; updateUI(); });
document.getElementById('buy-srum-ton').addEventListener('click', ()=>{ if(ton<1) return alert('Нужен 1 TON'); ton-=1; srum+=2; updateUI(); });
document.getElementById('buy-srum-usdt').addEventListener('click', ()=>{ if(usdt<1) return alert('Нужен 1 USDT'); usdt-=1; srum+=1; updateUI(); });
document.getElementById('swap-srum-ton').addEventListener('click', ()=>{ if(srum<1) return alert('Минимум 1 SRUM'); srum-=1; ton+=0.5; updateUI(); });
document.getElementById('swap-srum-usdt').addEventListener('click', ()=>{ if(srum<1) return alert('Минимум 1 SRUM'); srum-=1; usdt+=1; updateUI(); });

// Статусы
document.getElementById('buy-status-silver')?.addEventListener('click', ()=>{ if(srum<100) return; srum-=100; rum+=1000000; userStatus='silver'; updateUI(); alert('Статус Серебро активирован!'); });
document.getElementById('buy-status-gold')?.addEventListener('click', ()=>{ if(srum<200) return; srum-=200; rum+=2000000; userStatus='gold'; updateUI(); alert('Статус Золото активирован!'); });
document.getElementById('buy-status-platinum')?.addEventListener('click', ()=>{ if(srum<300) return; srum-=300; rum+=3000000; userStatus='platinum'; updateUI(); alert('Статус Платина активирован!'); });

// TON Connect (заглушка)
document.getElementById('connect-ton-btn')?.addEventListener('click', ()=>{
    alert('Подключение TON кошелька будет доступно после интеграции TON Connect. Пока используется тестовый баланс.');
});
