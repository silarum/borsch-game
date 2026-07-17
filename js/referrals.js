// ================== РЕФЕРАЛЫ ==================
function generateRefCode() {
    let seed = localStorage.getItem('ref_seed');
    if (!seed) {
        seed = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
        localStorage.setItem('ref_seed', seed);
    }
    return 'ref' + seed;
}
const myRefCode = generateRefCode();
document.getElementById('ref-link').value = `https://t.me/crypto_borsch_bot?start=${encodeURIComponent(myRefCode)}`;
window.copyRef = function() {
    navigator.clipboard.writeText(document.getElementById('ref-link').value);
    alert('Ссылка скопирована!');
};
window.applyRefCode = function() {
    let code = document.getElementById('ref-code-input').value.trim();
    if (!code) return;
    if (code === myRefCode) return alert('Нельзя использовать свой код');
    let refs = window.readLocalArray('ref_used');
    if (refs.includes(code)) return alert('Код уже активирован');
    refs.push(code);
    localStorage.setItem('ref_used', JSON.stringify(refs));
    let allRefs = window.readLocalArray('referrals');
    let found = allRefs.find(r => r.code === code);
    if (found) {
        found.bonus = (found.bonus || 0) + 100;
        localStorage.setItem('referrals', JSON.stringify(allRefs));
        alert('Реферальный код активирован! Реферер получил 100 RUM.');
    } else {
        allRefs.push({ code: code, bonus: 100 });
        localStorage.setItem('referrals', JSON.stringify(allRefs));
        alert('Код активирован!');
    }
    updateUI();
};
function renderReferralList() {
    let html = '';
    let refs = window.readLocalArray('referrals');
    refs.forEach(r => { html += `<div>Код: ${escapeHtml(r.code)} | Бонусов: ${Number(r.bonus) || 0} RUM</div>`; });
    document.getElementById('referral-list').innerHTML = html || 'Нет рефералов';
}
document.getElementById('referral-screen').addEventListener('click', renderReferralList);
