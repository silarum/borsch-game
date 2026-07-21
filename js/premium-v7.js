/* Crypto Bespredel V7 — two disciplines, concealed block rewards, balance flight and retro fight audio. */
(function () {
    'use strict';

    const STORAGE_ASSET = 'cryptoBrawlPayoutAsset';
    const SUPER_BLOCK_MAX_USDT = 500000;
    const originalMiningModal = window.showMiningModal;
    let audioContext = null;
    let fightContextHandled = false;

    function preferredAsset() {
        const asset = localStorage.getItem(STORAGE_ASSET);
        return asset === 'TON' ? 'TON' : 'USDT';
    }

    function setPreferredAsset(asset) {
        localStorage.setItem(STORAGE_ASSET, asset === 'TON' ? 'TON' : 'USDT');
    }

    function randomBetween(min, max, decimals) {
        const value = min + Math.random() * (max - min);
        return Number(value.toFixed(decimals));
    }

    function rollBlockReward(baseAmount, requestedAsset) {
        const asset = requestedAsset === 'TON' ? 'TON' : 'USDT';
        const superBlock = Math.random() < 0.001;
        if (superBlock) {
            return {
                currency: 'USDT',
                amount: randomBetween(1000, SUPER_BLOCK_MAX_USDT, 2),
                superBlock: true
            };
        }
        const safeBase = Math.max(0.01, Number(baseAmount) || 0.01);
        return {
            currency: asset,
            amount: asset === 'TON'
                ? Math.max(0.001, Number((safeBase / 5).toFixed(4)))
                : Number(safeBase.toFixed(4)),
            superBlock: false
        };
    }

    function applyReward(reward) {
        if (!reward) return;
        if (reward.currency === 'TON') ton += Number(reward.amount || 0);
        else usdt += Number(reward.amount || 0);
        window.__lastBlockReward = reward;
        if (typeof window.updateUI === 'function') window.updateUI();
        if (typeof window.saveAll === 'function') window.saveAll();
    }

    window.awardReward = function awardReward(baseAmount) {
        const reward = rollBlockReward(baseAmount, preferredAsset());
        applyReward(reward);
        return reward;
    };

    function replaceUserFacingText(root) {
        if (!root) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(function (node) {
            let text = node.nodeValue || '';
            text = text
                .replace(/🧪\s*Демо-пул/gi, 'Активный игровой пул')
                .replace(/Демо-пул/gi, 'Игровой пул')
                .replace(/Серверные суммы появятся после безопасного запуска/gi, 'Пул обновляет доступный баланс и очередь соперников')
                .replace(/(\d+)\s+игроков\s+·\s+(\d+)\s+спартанцев/gi, function (_, players, reserve) {
                    return (Number(players) + Number(reserve)) + ' участников онлайн';
                })
                .replace(/проверенный участник\s*·\s*Спартанец/gi, 'проверенный участник')
                .replace(/локальный резерв\s*300\s*спартанцев/gi, 'резервный участник')
                .replace(/Спартанцы отключены\. Соперник не найден/gi, 'Резерв соперников недоступен. Соперник не найден')
                .replace(/Тренировочный соперник/gi, 'Соперник')
                .replace(/тренировочного соперника/gi, 'соперника')
                .replace(/Тренировочный режим\s*·\s*игровые SRUM/gi, 'Игровая сессия · взнос SILARUM')
                .replace(/Тренировочная группа/gi, 'Группа')
                .replace(/тестовых RUMIR/gi, 'игровых очков')
                .replace(/Награда при победе:\s*[\d.,]+\s*RUM/gi, 'Награда раскрывается только в найденном блоке')
                .replace(/Победителю:\s*[\d.,]+\s*SRUM-экв\.\s*·\s*казне:\s*[\d.,]+\s*SRUM/gi, 'Награда раскрывается только после найденного блока')
                .replace(/намайни больше RUMIR соперника/gi, 'набери больше очков, чем соперник')
                .replace(/демо/gi, 'игровой');
            if (text !== node.nodeValue) node.nodeValue = text;
        });
    }

    function assetSelectorMarkup() {
        const selected = preferredAsset();
        return `<div class="brawl-payout-selector" role="group" aria-label="Актив награды">
            <span>Награда блока</span>
            <button type="button" data-brawl-asset="USDT" class="${selected === 'USDT' ? 'active' : ''}">💵 USDT</button>
            <button type="button" data-brawl-asset="TON" class="${selected === 'TON' ? 'active' : ''}">⚡ TON</button>
        </div>`;
    }

    function bindAssetSelector(root) {
        root.querySelectorAll('[data-brawl-asset]').forEach(function (button) {
            button.addEventListener('click', function () {
                setPreferredAsset(button.dataset.brawlAsset);
                root.querySelectorAll('[data-brawl-asset]').forEach(function (item) {
                    item.classList.toggle('active', item === button);
                });
                playRetroSound('select');
            });
        });
    }

    function renderDisciplineModal() {
        document.querySelectorAll('.quick-duel-modal').forEach(function (modal) { modal.remove(); });
        const modal = document.createElement('div');
        modal.className = 'quick-duel-modal brawl-v7-modal';
        modal.innerHTML = `<div class="quick-duel-box brawl-v7-box">
            <button class="brawl-v7-close" id="brawl-v7-close" aria-label="Закрыть">×</button>
            <div class="brawl-v7-head"><small>CRYPTO BRAWL · GAMEFI ARENA</small><h2>Крипто Беспредел</h2><p>Выбери дисциплину. Размер награды заранее не раскрывается — он появляется только внутри найденного блока.</p></div>
            <div class="brawl-discipline-grid">
                <button id="brawl-borsch-mode" class="brawl-discipline-card borsch">
                    <span class="brawl-card-icon">🥘</span><small>СКОРОСТЬ · РЕАКЦИЯ</small><b>Собрать Крипто Борщ</b><p>Лови крипто-овощи на доске и опереди соперника.</p><i>ОТКРЫТЬ ДОСКУ</i>
                </button>
                <button id="brawl-fight-mode" class="brawl-discipline-card fight">
                    <span class="brawl-card-icon">🐺</span><small>СИЛА · ТАКТИКА</small><b>Сражаться в файтинге</b><p>Выбери бойца, собирай комбо, блокируй и активируй суперприём.</p><i>ВЫБРАТЬ БОЙЦА</i>
                </button>
            </div>
            <div class="super-block-note"><span>◆</span><div><b>СУПЕР-БЛОК</b><p>В найденном блоке может открыться награда до <strong>500 000 USDT</strong>. Сумма появляется только после победы.</p></div></div>
            <div id="brawl-v7-fight-panel"></div>
        </div>`;
        document.getElementById('game-container').appendChild(modal);
        replaceUserFacingText(modal);

        document.getElementById('brawl-v7-close').addEventListener('click', function () { modal.remove(); });
        document.getElementById('brawl-borsch-mode').addEventListener('click', function () {
            modal.remove();
            window.__cryptoBrawlDiscipline = 'borsch';
            if (typeof originalMiningModal === 'function') originalMiningModal();
            window.setTimeout(enhanceBorschModal, 0);
        });
        document.getElementById('brawl-fight-mode').addEventListener('click', function () {
            renderFightEntry(modal);
        });
    }

    function enhanceBorschModal() {
        const cloud = document.querySelector('.quick-duel-modal .pool-cloud');
        if (!cloud) return;
        if (!cloud.querySelector('.brawl-payout-selector')) {
            cloud.insertAdjacentHTML('beforeend', assetSelectorMarkup() + '<div class="super-block-inline">◆ Супер-блок может открыть награду до 500 000 USDT</div>');
            bindAssetSelector(cloud);
        }
        cloud.querySelectorAll('#reward-text').forEach(function (node) {
            node.textContent = 'Награда раскрывается только в найденном блоке';
        });
        replaceUserFacingText(cloud);
    }

    function renderFightEntry(modal) {
        const panel = modal.querySelector('#brawl-v7-fight-panel');
        const fighterId = localStorage.getItem('wolfSelectedFighter') || 'alpha';
        const fighter = Array.isArray(window.WOLF_FIGHTERS)
            ? window.WOLF_FIGHTERS.find(function (item) { return item.id === fighterId; }) || window.WOLF_FIGHTERS[0]
            : null;
        panel.innerHTML = `<section class="brawl-fight-entry">
            <div class="brawl-selected-fighter"><span>🐺</span><div><small>ВЫБРАННЫЙ БОЕЦ</small><b>${window.escapeHtml(fighter?.name || 'RUMIR Alpha')}</b><p>${window.escapeHtml(fighter?.special || 'Волчий суперприём')}</p></div></div>
            ${assetSelectorMarkup()}
            <label class="brawl-stake-label">Взнос SILARUM <strong id="brawl-fight-stake-value">1.00</strong></label>
            <input id="brawl-fight-stake" type="range" min="0.01" max="5" step="0.01" value="1">
            <p class="brawl-hidden-reward">Размер награды и тип найденного блока не показываются до результата боя.</p>
            <button id="start-brawl-fight" class="brawl-fight-start">⚔ ВОЙТИ В БОЙ</button>
        </section>`;
        bindAssetSelector(panel);
        const slider = panel.querySelector('#brawl-fight-stake');
        slider.addEventListener('input', function () {
            panel.querySelector('#brawl-fight-stake-value').textContent = Number(slider.value).toFixed(2);
        });
        panel.querySelector('#start-brawl-fight').addEventListener('click', function () {
            const stake = Number(slider.value) || 1;
            if (srum < stake) return alert('Недостаточно SILARUM для входа в бой');
            srum -= stake;
            window.__cryptoBrawlFight = {
                stake: stake,
                stage: Number(window.miningStage || miningStage || 1),
                asset: preferredAsset(),
                startedAt: Date.now(),
                settled: false
            };
            fightContextHandled = false;
            if (typeof window.updateUI === 'function') window.updateUI();
            if (typeof window.saveAll === 'function') window.saveAll();
            modal.remove();
            playRetroSound('start');
            if (typeof window.openWolfFight === 'function') window.openWolfFight('crypto-brawl', window.__cryptoBrawlFight);
        });
    }

    window.showMiningModal = renderDisciplineModal;

    function createBlockReveal(reward) {
        const node = document.createElement('div');
        node.className = 'found-block-reveal' + (reward.superBlock ? ' super' : '');
        node.innerHTML = `<div class="block-core"><span class="block-rune">${reward.superBlock ? '★' : '◆'}</span><small>${reward.superBlock ? 'СУПЕР-БЛОК' : 'НАЙДЕННЫЙ БЛОК'}</small><strong>${Number(reward.amount).toLocaleString('ru-RU', { maximumFractionDigits: 4 })}</strong><b>${reward.currency}</b><i>Награда подтверждена</i></div>`;
        return node;
    }

    function animateRewardToBalance(source, reward) {
        if (!source || !reward) return;
        const target = document.getElementById(reward.currency === 'TON' ? 'ton-balance-top' : 'usdt-balance-top');
        if (!target) return;
        const from = source.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        const flyer = document.createElement('div');
        flyer.className = 'reward-flight ' + reward.currency.toLowerCase();
        flyer.textContent = reward.currency === 'TON' ? '⚡' : '💵';
        flyer.style.left = (from.left + from.width / 2 - 22) + 'px';
        flyer.style.top = (from.top + from.height / 2 - 22) + 'px';
        flyer.style.setProperty('--flight-x', (to.left + to.width / 2 - (from.left + from.width / 2)) + 'px');
        flyer.style.setProperty('--flight-y', (to.top + to.height / 2 - (from.top + from.height / 2)) + 'px');
        document.body.appendChild(flyer);
        window.setTimeout(function () {
            target.classList.add('balance-received');
            flyer.remove();
            window.setTimeout(function () { target.classList.remove('balance-received'); }, 900);
        }, 1100);
    }

    function decorateMiningResult(result) {
        if (!result || result.dataset.v7Processed === 'true') return;
        replaceUserFacingText(result);
        const reward = window.__lastBlockReward;
        const heading = result.querySelector('h2');
        const won = heading && /добыт|побед|начислено/i.test(result.textContent || '');
        if (!won || !reward) return;
        result.dataset.v7Processed = 'true';
        result.querySelectorAll('p').forEach(function (p) {
            if (/награда|начислено/i.test(p.textContent || '')) p.remove();
        });
        const reveal = createBlockReveal(reward);
        const firstButton = result.querySelector('button');
        result.insertBefore(reveal, firstButton || null);
        playRetroSound(reward.superBlock ? 'super' : 'reward');
        window.setTimeout(function () { animateRewardToBalance(reveal, reward); }, 950);
        window.__lastBlockReward = null;
    }

    function settleFightResult(result) {
        if (!result || result.dataset.v7Processed === 'true') return;
        const context = window.__cryptoBrawlFight;
        if (!context || context.settled || fightContextHandled) return;
        const won = result.classList.contains('win');
        context.settled = true;
        fightContextHandled = true;
        result.dataset.v7Processed = 'true';

        rum = Math.max(0, Number(rum || 0) - (won ? 250 : 0));
        const rate = typeof window.getRewardRate === 'function' ? window.getRewardRate(context.stage) : 0.07;
        const penaltyRate = typeof window.getPenaltyRate === 'function' ? window.getPenaltyRate(context.stage) : 0.10;
        let reward = null;
        if (won) {
            srum += context.stake;
            reward = rollBlockReward(context.stake * rate, context.asset);
            applyReward(reward);
            miningStage = Math.min(5, Number(miningStage || 1) + 1);
        } else {
            const refund = Math.max(0, context.stake - context.stake * penaltyRate);
            srum += refund;
            miningStage = 1;
            if (typeof window.updateUI === 'function') window.updateUI();
            if (typeof window.saveAll === 'function') window.saveAll();
        }

        const paragraph = result.querySelector('p');
        if (paragraph) {
            paragraph.textContent = won
                ? 'Победа подтверждена. Найденный блок раскрывает фактическую награду.'
                : 'Бой завершён. Остаток взноса возвращён в игровой баланс.';
        }
        if (won && reward) {
            const reveal = createBlockReveal(reward);
            const stats = result.querySelector('.result-stats');
            result.insertBefore(reveal, stats || null);
            playRetroSound(reward.superBlock ? 'super' : 'victory');
            speakFight('Победа');
            window.setTimeout(function () { animateRewardToBalance(reveal, reward); }, 1050);
        } else {
            playRetroSound('defeat');
            speakFight('Поражение');
        }
        window.__cryptoBrawlFight = null;
    }

    function getAudioContext() {
        if (audioContext) return audioContext;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioContext = new AudioContextClass();
        return audioContext;
    }

    function playTone(frequency, duration, type, volume, delay) {
        const context = getAudioContext();
        if (!context) return;
        const start = context.currentTime + (delay || 0);
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type || 'square';
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(volume || 0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + duration);
    }

    function playNoise(duration, volume) {
        const context = getAudioContext();
        if (!context) return;
        const length = Math.max(1, Math.floor(context.sampleRate * duration));
        const buffer = context.createBuffer(1, length, context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        gain.gain.value = volume || 0.07;
        source.connect(gain).connect(context.destination);
        source.start();
    }

    function playRetroSound(type) {
        try {
            if (type === 'hit') { playNoise(0.08, 0.1); playTone(90, 0.12, 'square', 0.08); }
            else if (type === 'kick') { playNoise(0.12, 0.12); playTone(65, 0.16, 'sawtooth', 0.1); }
            else if (type === 'block') { playTone(220, 0.07, 'square', 0.06); playTone(150, 0.11, 'square', 0.05, 0.05); }
            else if (type === 'special' || type === 'super') { [110, 165, 220, 440].forEach(function (f, i) { playTone(f, 0.24, 'sawtooth', 0.08, i * 0.05); }); playNoise(0.3, 0.08); }
            else if (type === 'victory' || type === 'reward') { [262, 330, 392, 523].forEach(function (f, i) { playTone(f, 0.2, 'square', 0.06, i * 0.1); }); }
            else if (type === 'defeat') { [220, 174, 130].forEach(function (f, i) { playTone(f, 0.28, 'sawtooth', 0.05, i * 0.14); }); }
            else if (type === 'start') { playTone(220, 0.12, 'square', 0.06); playTone(440, 0.18, 'square', 0.08, 0.13); }
            else { playTone(330, 0.08, 'square', 0.04); }
        } catch (_) { /* Audio is optional. */ }
    }

    function speakFight(text) {
        try {
            if (!window.speechSynthesis) return;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ru-RU';
            utterance.rate = 0.85;
            utterance.pitch = 0.65;
            utterance.volume = 0.9;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } catch (_) { /* Voice is optional. */ }
    }

    document.addEventListener('pointerdown', function () {
        const context = getAudioContext();
        if (context && context.state === 'suspended') context.resume().catch(function () {});
    }, { once: true });

    document.addEventListener('click', function (event) {
        const control = event.target.closest('.fight-control');
        if (!control) return;
        if (control.id === 'kick-btn' || control.id === 'heavy-btn') playRetroSound('kick');
        else if (control.id === 'block-btn') playRetroSound('block');
        else if (control.id === 'special-btn') playRetroSound('special');
        else playRetroSound('hit');
    }, true);

    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (!(node instanceof HTMLElement)) return;
                replaceUserFacingText(node);
                const result = node.matches('.result-overlay') ? node : node.querySelector('.result-overlay');
                if (result) window.setTimeout(function () { decorateMiningResult(result); }, 40);
                const fightResult = node.matches('.fight-result-v2') ? node : node.querySelector('.fight-result-v2');
                if (fightResult) window.setTimeout(function () { settleFightResult(fightResult); }, 60);
                if (node.matches('.fight-impact') || node.querySelector('.fight-impact')) playRetroSound('hit');
                if (node.matches('.wolf-arena-v2') || node.querySelector('.wolf-arena-v2')) {
                    window.setTimeout(function () { playRetroSound('start'); speakFight('Бой'); }, 1200);
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    replaceUserFacingText(document.body);
})();
