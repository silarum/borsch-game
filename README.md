# 🍲 Крипто Борщ — GameFi-экосистема в Telegram

**Крипто Борщ** — это Telegram Mini App на блокчейне TON, где ты фармишь RUM, сражаешься за USDT в PvP-майнинге, создаёшь клубы и прокачиваешь крипто-статус. Всё в одном окне мессенджера.

---

## 🎮 Геймплей

| Режим | Описание |
|-------|----------|
| 🍲 Тапалка RUM | Нажимай на овощи — получай RUM. Серии попаданий удваивают награду. 3 игры в час. |
| ⛏️ Криптобеспредел (PvP) | Ставка SRUM, дуэль 20 сек. Победитель забирает USDT, проигравший теряет мощность. 5 этапов риска. |
| 🔒 Выжить в тюрьме | Хардкор-турнир с особыми этапами: от Новичка до Смотрящего. |
| 🐺 Бойцовский клуб | Создавай клуб, приглашай бойцов, назначай офицеров. |
| 📋 Задания | Выполняй официальные и пользовательские задания за RUM и SRUM. |
| 👥 Рефералы | Приглашай друзей — получай бонусы. |
| 🛍️ Магазин | Бустеры ×2/×3/×5, статусы (Серебро/Золото/Платина), обмен валют. |

---

## ⚙️ Технологии

- **Фронтенд:** Чистый JavaScript (ES6+), HTML5 Canvas, CSS3
- **Блокчейн:** TON (The Open Network)
- **Кошелёк:** TON Connect (Tonkeeper)
- **Смарт-контракты:** Tact / FunC (в разработке)
- **Бэкенд:** Supabase (PostgreSQL + Edge Functions)
- **Платформа:** Telegram Mini App (Web App SDK)

---

## 📁 Структура проекта

```

borsch-game/
├── index.html
├── tonconnect-manifest.json
├── README.md
├── css/
│   └── styles.css
├── js/
│   ├── api.js
│   ├── arena.js
│   ├── bonus.js
│   ├── bots.js
│   ├── club.js
│   ├── contract.js
│   ├── game-engine.js
│   ├── lang.js
│   ├── main.js
│   ├── market.js
│   ├── profile.js
│   ├── referrals.js
│   ├── tasks.js
│   └── wallet.js

```


---

## 🚀 Быстрый старт

1. Клонируй репозиторий: git clone https://github.com/silarum/borsch-game.git
2. Открой index.html в браузере или задеплой на GitHub Pages.
3. Для Telegram: подключи Mini App к боту через BotFather, указав URL деплоя.
4. Supabase: создай проект, таблицы users и withdrawal_requests, включи Edge Functions.

---

## 🔗 Контакты

- Канал: @crypto_borsch_channel
- Группа: @criptoniany
- Бот: @crypto_borsch_bot

---

> Крипто Борщ — это не просто игра. Это кухня, где варятся твои USDT.
