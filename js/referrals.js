// ================== РЕФЕРАЛЫ ==================
function generateRefCode() { return 'ref' + (localStorage.getItem('ref_seed') || Math.floor(Math.random()*1000000)); }
const myRefCode = generateRefCode();
document.getElementById('ref-link').value = `https://t.me/crypto_borsch_bot?start=${myRefCode}`;
window.copyRef = function() {
    navigator.clipboard.writeText(document.getElementById('ref-link').value);
    alert('Ссылка скопирована!');
};
window.applyRefCode = function() {
    let code = document.getElementById('ref-code-input').value.trim();
    if (!code) return;
    if (code === myRefCode) return alert('Нельзя использовать свой код');
    let refs = JSON.parse(localStorage.getItem('ref_used') || '[]');
    if (refs.includes(code)) return alert('Код уже активирован');
    refs.push(code);
    localStorage.setItem('ref_used', JSON.stringify(refs));
    let allRefs = JSON.parse(localStorage.getItem('referrals') || '[]');
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
    let refs = JSON.parse(localStorage.getItem('referrals') || '[]');
    refs.forEach(r => { html += `<div>Код: ${r.code} | Бонусов: ${r.bonus || 0} RUM</div>`; });
    document.getElementById('referral-list').innerHTML = html || 'Нет рефералов';
}
document.getElementById('referral-screen').addEventListener('click', renderReferralList);
