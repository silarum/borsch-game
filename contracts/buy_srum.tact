// ================== СМАРТ-КОНТРАКТ ПОКУПКИ SRUM ==================
// Принимает TON от игроков и эмитит событие для начисления SRUM через бэкенд.
// Админ может выводить накопленные TON.

import "@stdlib/deploy";

// Админ-кошелёк (тот же, что во фронтенде)
const ADMIN_WALLET: Address = address("UQCM95PSNxwcJi-IX_bAAs4-_6Txde_XxitDP09n2PhFcPIM");

// Цена: 1 TON = 2 SRUM (настраивается админом)
let exchangeRate: Int as uint32 = 2;

// Суммарный баланс контракта в нанотонах
let totalTonBalance: Int as coins = 0;

// Событие: игрок купил SRUM
message BuySRUM {
    buyer: Address;
    tonAmount: Int as coins;
    srumAmount: Int as uint32;
}

// Инициализация контракта
init() {
    // Контракт может принимать только сообщения
}

// Приём внешнего сообщения (от кошелька игрока)
receive(msg: BuySRUM) {
    // Вычисляем количество SRUM по курсу
    let srumAmount = msg.tonAmount * exchangeRate;
    
    // Добавляем TON в баланс контракта
    totalTonBalance += msg.tonAmount;
    
    // Эмитим событие для бэкенда (Supabase Edge Function слушает его)
    emit(msg);
}

// Только админ может выводить TON
receive("Withdraw") {
    require(sender() == ADMIN_WALLET, "Только админ может выводить TON");
    send(SendParameters{
        to: ADMIN_WALLET,
        value: totalTonBalance,
        mode: SendRemainingValue
    });
    totalTonBalance = 0;
}

// Геттер: получить текущий курс обмена
get fun exchangeRate(): Int {
    return exchangeRate;
}

// Геттер: получить баланс контракта
get fun balance(): Int {
    return totalTonBalance;
}
