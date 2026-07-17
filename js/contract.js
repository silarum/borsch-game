// Покупки намеренно заблокированы до появления backend, который:
// 1) проверяет Telegram initData; 2) проверяет TON-транзакцию в блокчейне;
// 3) атомарно и идемпотентно начисляет SRUM.
async function buySRUMWithTON() {
    window.showSafeModeNotice();
    return false;
}
