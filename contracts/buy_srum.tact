// ================== СМАРТ-КОНТРАКТ ПОКУПКИ SRUM ==================
// Принимает TON от игроков, записывает транзакцию в лог.
// Админ может выводить накопленные TON.

// Админ-кошелёк — сюда выводятся накопленные TON
const ADMIN_WALLET: Address = address("UQCM95PSNxwcJi-IX_bAAs4-_6Txde_XxitDP09n2PhFcPIM");

// Курс обмена: сколько SRUM даётся за 1 TON (умножается на 10^9, т.к. TON в нанотонах)
const EXCHANGE_RATE: Int = 2;

// Баланс контракта в нанотонах
let totalTonBalance: Int = 0;

// Событие-лог при покупке (будет видно в транзакциях)
event BuySrumLog {
    buyer: Address;
    tonAmount: Int;
    srumAmount: Int;
}

// Приём любого сообщения с TON (игрок просто отправляет TON на контракт)
receive() {
    let tonAmount = context().value;
    
    // Проверяем, что отправили больше 0
    require(tonAmount > 0, "Отправьте TON для покупки SRUM");
    
    // Вычисляем количество SRUM: делим нанотоны на 10^9 и умножаем на курс
    let srumAmount = (tonAmount / 1000000000) * EXCHANGE_RATE;
    
    // Увеличиваем баланс контракта
    totalTonBalance += tonAmount;
    
    // Записываем событие в лог блокчейна
    self.forward(context().sender, 0, BuySrumLog{
        buyer: context().sender,
        tonAmount: tonAmount,
        srumAmount: srumAmount
    });
}

// Вывод TON админом
receive("withdraw") {
    require(context().sender == ADMIN_WALLET, "Только админ может выводить TON");
    
    let amount = totalTonBalance;
    totalTonBalance = 0;
    
    // Отправляем весь баланс админу
    nativeSendMessage(ADMIN_WALLET, amount, null);
}

// Геттер: текущий баланс контракта в TON (для удобства отображения)
get fun balance(): Int {
    return totalTonBalance;
}

// Геттер: курс обмена
get fun exchangeRate(): Int {
    return EXCHANGE_RATE;
}
