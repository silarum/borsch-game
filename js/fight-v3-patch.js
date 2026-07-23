// Hungry Wolves V3: mobile movement, distance hitboxes and synthesized fight audio.
(function () {
    'use strict';

    const fighters = Array.isArray(window.WOLF_FIGHTERS) ? window.WOLF_FIGHTERS : [];
    if (!fighters.length || window.WolfFightV3) return;

    const actions = {
        punch: { pose: 'punch', cost: 7, power: .78, accuracy: .95, meter: 11, cooldown: 300, range: 20, lunge: 1.8 },
        kick: { pose: 'kick', cost: 13, power: 1.08, accuracy: .86, meter: 16, cooldown: 470, range: 26, lunge: 2.7 },
        heavy: { pose: 'punch', cost: 20, power: 1.48, accuracy: .72, meter: 23, cooldown: 680, range: 21, lunge: 3.2, stun: .24 },
        block: { pose: 'idle', cost: 5, cooldown: 360 },
        dodge: { pose: 'kick', cost: 16, cooldown: 620 },
        special: { pose: 'special', cost: 24, power: 2.35, accuracy: 1, meter: 0, cooldown: 1050, range: 35, lunge: 5, stun: .5 }
    };
    const frames = { idle: ['0%', '0%'], punch: ['-100%', '0%'], kick: ['0%', '-100%'], special: ['-100%', '-100%'] };
    const input = { left: false, right: false };
    const baseRender = window.renderFightScreen;
    const baseOpen = window.openWolfFight;
    const baseStop = window.stopWolfFight;
    let battle = null;
    let timer = null;
    let timeouts = [];
    let mode = 'training';
    let context = null;
    let audio = null;

    function fighter(id) {
        return fighters.find(function (item) { return item.id === id; }) || fighters[0];
    }

    function state(item, side) {
        return Object.assign({}, item, {
            side: side, hpNow: item.hp, stamina: 100, meter: 0, combo: 0,
            x: side === 'player' ? 24 : 76, y: 0, vy: 0, grounded: true,
            lastAction: 0, lastHit: 0, blocking: 0, dodging: 0, crouching: 0, stunned: 0, transient: ''
        });
    }

    function sprite(item, side) {
        return `<span class="fighter-sprite battle-sprite" style="--fighter-color:${item.color};--frame-x:0%;--frame-y:0%" role="img" aria-label="${item.name}">
            <span class="fighter-fallback" aria-hidden="true">🐺</span>
            <img class="fighter-sprite-image" src="${item.sprite}?v=20260723a" alt="" draggable="false" decoding="async">
        </span><span class="fighter-shadow"></span>`;
    }

    function start() {
        stop();
        const selected = fighter(localStorage.getItem('wolfSelectedFighter') || 'alpha');
        const pool = fighters.filter(function (item) { return item.id !== selected.id; });
        const enemy = pool[Math.floor(Math.random() * pool.length)];
        battle = {
            player: state(selected, 'player'), enemy: state(enemy, 'enemy'), ready: false, finished: false,
            seconds: 60, endsAt: 0, nextEnemyAt: 0, lastTick: Date.now()
        };
        ensureAudio();
        renderBattle();
        sound('round');
        later(function () { announce('3'); }, 100);
        later(function () { announce('2'); }, 550);
        later(function () { announce('1'); }, 1000);
        later(function () {
            if (!battle) return;
            battle.ready = true;
            battle.endsAt = Date.now() + 60000;
            battle.nextEnemyAt = Date.now() + 800;
            battle.lastTick = Date.now();
            announce('FIGHT!');
            sound('fight');
            speakFight();
        }, 1450);
        timer = setInterval(tick, 50);
    }

    function renderBattle() {
        const root = document.getElementById('fight-content');
        if (!root || !battle) return;
        root.innerHTML = `<section class="wolf-arena-v2 wolf-arena-v3" id="wolf-arena" aria-label="Бойцовская арена">
            <div class="arena-lights" aria-hidden="true"></div><div class="arena-crowd" aria-hidden="true"></div>
            <div class="fight-hud-v2">${health('player', battle.player)}<div class="round-clock"><small>ROUND 1</small><b id="fight-clock">60</b></div>${health('enemy', battle.enemy)}</div>
            <div class="distance-indicator"><span id="fight-distance">52</span><small>ДИСТАНЦИЯ</small></div>
            <div class="fight-announcer-v2 hide" id="fight-announcer" aria-live="polite">FIGHT!</div><div class="combo-callout" id="combo-callout"></div>
            <div class="combatants-v3">
                <div class="combatant-track player" id="player-track"><div class="combatant-v3 player" id="player-combatant">${sprite(battle.player, 'player')}</div></div>
                <div class="combatant-track enemy" id="enemy-track"><div class="combatant-v3 enemy" id="enemy-combatant">${sprite(battle.enemy, 'enemy')}</div></div>
            </div><div class="battle-floor" aria-hidden="true"></div>
        </section>
        <section class="fight-console fight-console-v3">
            <div class="meter-row"><div class="stamina-meter"><small>ВЫНОСЛИВОСТЬ</small><i><span id="stamina-fill"></span></i></div><div class="special-meter-v2"><small>ВОЛЧЬЯ ЭНЕРГИЯ</small><i><span id="special-fill"></span></i></div></div>
            <div class="fight-mobile-controls">
                <div class="movement-pad" aria-label="Передвижение">${moveButton('jump','↑','Прыжок')}${moveButton('left','←','Назад')}${moveButton('crouch','↓','Присесть')}${moveButton('right','→','Вперёд')}</div>
                <div class="fight-controls-v2 fight-attacks" aria-label="Удары и защита">${attackButton('punch','J','Джеб','ближний')}${attackButton('kick','K','Кик','средний')}${attackButton('heavy','H','Силовой','урон')}${attackButton('block','B','Блок','защита')}${attackButton('dodge','V','Уклон','манёвр')}${attackButton('special','S',battle.player.special,'100%',true)}</div>
            </div>
            <p class="fight-help"><b id="battle-tip">Подойди стрелкой → и атакуй с нужной дистанции.</b><span>Прыжок и приседание помогают уходить от ударов.</span></p>
        </section>`;
        prepareImages(root);
        sync();
    }

    function health(side, item) {
        return `<div class="health-block-v2 ${side}"><div><b>${item.name}</b><small>${item.role}</small></div><i><span id="${side}-health"></span></i></div>`;
    }
    function moveButton(action, icon, label) {
        return `<button class="move-control move-${action}" data-v3-move="${action}" aria-label="${label}"><span>${icon}</span><small>${label}</small></button>`;
    }
    function attackButton(action, key, label, hint, special) {
        return `<button class="fight-control ${special ? 'special' : ''}" id="v3-${action}" data-v3-action="${action}" aria-label="${label}"><span>${key}</span><b>${label}</b><small>${hint}</small></button>`;
    }

    function prepareImages(root) {
        root.querySelectorAll('.fighter-sprite-image').forEach(function (image) {
            const frame = image.closest('.fighter-sprite');
            const done = function () { frame?.classList.toggle('art-ready', image.complete && image.naturalWidth > 0); };
            image.addEventListener('load', done, { once: true });
            image.addEventListener('error', done, { once: true });
            if (image.complete) done();
        });
    }

    function tick() {
        if (!battle || battle.finished) return;
        const now = Date.now();
        const dt = Math.min(.08, Math.max(.016, (now - battle.lastTick) / 1000));
        battle.lastTick = now;
        if (battle.ready) {
            battle.seconds = Math.max(0, Math.ceil((battle.endsAt - now) / 1000));
            recover(battle.player, dt); recover(battle.enemy, dt);
            movePlayer(dt, now); moveEnemy(dt, now);
            vertical(battle.player, dt); vertical(battle.enemy, dt); bounds();
            if (now >= battle.nextEnemyAt) enemyAction();
            if (battle.seconds <= 0) finish(battle.player.hpNow >= battle.enemy.hpNow);
        }
        sync();
    }

    function recover(item, dt) {
        item.stamina = Math.min(100, item.stamina + (9 + item.speed / 13) * dt * (item.archetype === 'rushdown' ? 1.22 : 1));
    }
    function movePlayer(dt, now) {
        const p = battle.player;
        if (now < p.stunned || now < p.blocking || p.transient.includes('acting')) return;
        const axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        if (axis) p.x += axis * (16 + p.speed * .075) * dt;
    }
    function moveEnemy(dt, now) {
        const e = battle.enemy;
        if (now < e.stunned || now < e.blocking || e.transient.includes('acting')) return;
        const d = distance();
        const preferred = ['grappler','tank'].includes(e.archetype) ? 17 : (e.archetype === 'rushdown' ? 20 : 24);
        if (d > preferred + 4) e.x -= (13 + e.speed * .055) * dt;
        else if (d < preferred - 5 && (e.stamina < 36 || Math.random() < .12)) e.x += (13 + e.speed * .055) * dt;
    }
    function vertical(item, dt) {
        if (item.grounded) return;
        item.y += item.vy * dt; item.vy -= 900 * dt;
        if (item.y <= 0) { item.y = 0; item.vy = 0; item.grounded = true; }
    }
    function bounds() {
        const p = battle.player, e = battle.enemy;
        p.x = clamp(p.x, 8, 79); e.x = clamp(e.x, 21, 92);
        if (e.x - p.x < 13) { const m = (p.x + e.x) / 2; p.x = m - 6.5; e.x = m + 6.5; }
    }
    function distance() { return Math.abs(battle.enemy.x - battle.player.x); }

    function movement(type) {
        if (!battle?.ready || battle.finished) return;
        const p = battle.player, now = Date.now();
        if (now < p.stunned) return;
        if (type === 'jump' && p.grounded && now >= p.crouching) {
            p.grounded = false; p.vy = 345 + p.speed * .45; p.blocking = 0; sound('jump'); haptic('light');
        } else if (type === 'crouch' && p.grounded) {
            p.crouching = now + 620; p.blocking = 0; tip('Приседание: джебы проходят над головой.'); sound('move');
        }
        sync();
    }

    function act(side, type) {
        if (!battle?.ready || battle.finished) return false;
        const now = Date.now(), actor = battle[side], targetSide = side === 'player' ? 'enemy' : 'player', target = battle[targetSide], action = actions[type];
        if (!action || now < actor.stunned || now - actor.lastAction < Math.max(170, action.cooldown - actor.speed * 1.7)) return false;
        if (type === 'special' && actor.meter < 100) return false;
        if (actor.stamina < action.cost) { if (side === 'player') tip('Не хватает выносливости — отступи или поставь блок.'); return false; }
        actor.stamina = Math.max(0, actor.stamina - adjustedCost(actor, type, action.cost)); actor.lastAction = now; actor.crouching = 0;
        if (type === 'block') { actor.blocking = now + (actor.archetype === 'counter' ? 900 : 720); pose(side,'idle','blocking',520); sound('blockReady'); return true; }
        if (type === 'dodge') { actor.dodging = now + (actor.archetype === 'trickster' ? 780 : 610); pose(side,'kick','dodging',540); sound('dodge'); return true; }
        if (type === 'special') actor.meter = 0;
        actor.x += actor.x < target.x ? action.lunge : -action.lunge; bounds(); pose(side,action.pose,'acting action-'+type,action.cooldown); sound(type); haptic(type === 'special' ? 'heavy' : 'light');
        later(function () { if (battle && !battle.finished) resolve(side,targetSide,type,actor,target,action); }, type === 'heavy' ? 260 : (type === 'special' ? 300 : 150));
        return true;
    }
    function adjustedCost(item, type, cost) {
        if (item.archetype === 'grappler' && type === 'block') return Math.max(2,cost-3);
        if (item.archetype === 'rushdown' && type === 'punch') return Math.max(2,cost-2);
        return cost;
    }

    function resolve(attackerSide, defenderSide, type, attacker, defender, action) {
        const now = Date.now(), d = Math.abs(attacker.x - defender.x);
        if (d > action.range + (attacker.y > 20 ? 2 : 0)) return miss(attackerSide,defenderSide,'ДАЛЕКО','Удар не достал. Подойди ближе стрелкой →.');
        if (defender.y > 72 && type !== 'special') return miss(attackerSide,defenderSide,'ПРЫЖОК');
        if (now < defender.crouching && (type === 'punch' || type === 'heavy')) return miss(attackerSide,defenderSide,'НИЖЕ УДАРА');
        if (now < defender.dodging) { defender.meter = Math.min(100,defender.meter+16); return miss(attackerSide,defenderSide,'УКЛОН',defenderSide === 'player' ? 'Отличный уклон! Контратакуй.' : ''); }
        let accuracy = action.accuracy + (attacker.speed - defender.speed) / 500;
        if (attacker.archetype === 'trickster' && type === 'kick') accuracy += .08;
        if (Math.random() > Math.min(1,accuracy)) return miss(attackerSide,defenderSide,'ПРОМАХ');
        const blocked = now < defender.blocking, chain = attacker.archetype === 'technical' ? 1750 : 1350;
        attacker.combo = now - attacker.lastHit <= chain ? attacker.combo + 1 : 1; attacker.lastHit = now;
        const bonus = 1 + Math.min(.32,Math.max(0,attacker.combo-1)*.07);
        let damage = Math.max(2,Math.round(attacker.attack*action.power*(.075+Math.random()*.026)*bonus));
        if (blocked) { const reduction = .5 + defender.guard/250; damage = Math.max(1,Math.round(damage*(1-Math.min(.8,reduction)))); defender.blocking=0; defender.meter=Math.min(100,defender.meter+(defender.archetype==='counter'?24:14)); showNote(defenderSide,'БЛОК'); sound('blockedHit'); }
        else sound(type === 'special' ? 'specialHit' : 'hit');
        defender.hpNow = Math.max(0,defender.hpNow-damage); defender.x += attackerSide === 'player' ? Math.min(4.5,damage/5) : -Math.min(4.5,damage/5); bounds();
        attacker.meter = Math.min(100,attacker.meter+(action.meter||0)+Math.min(10,attacker.combo*2));
        if (!blocked && action.stun && Math.random() < action.stun + (attacker.archetype === 'pressure' ? .08 : 0)) { defender.stunned=now+(type==='special'?950:620); pose(defenderSide,'idle','stunned',600); announce('ОГЛУШЕНИЕ'); }
        else hit(defenderSide,damage,type);
        if (attackerSide === 'player' && attacker.combo >= 2) combo(attacker.combo);
        sync(); if (defender.hpNow <= 0) finish(attackerSide === 'player');
    }

    function miss(attackerSide, defenderSide, message, playerTip) {
        battle[attackerSide].combo = 0; showNote(defenderSide,message); sound('miss'); if (playerTip) tip(playerTip); sync();
    }
    function enemyAction() {
        if (!battle?.ready || battle.finished) return;
        const e=battle.enemy,p=battle.player,now=Date.now(),d=distance(); let type='punch';
        if (p.transient.includes('action-punch') && e.grounded && Math.random()<.28) { e.crouching=now+520; battle.nextEnemyAt=now+500; return; }
        if (d>30 && e.grounded && Math.random()<.12) { e.grounded=false; e.vy=330+e.speed*.35; sound('jump'); battle.nextEnemyAt=now+620; return; }
        if (e.meter>=100 && e.stamina>=actions.special.cost && d<=actions.special.range && Math.random()<.72) type='special';
        else if (p.combo>=2 && Math.random()<.34) type=Math.random()<.55?'block':'dodge';
        else if (e.stamina<20) type='block';
        else if (d>actions.kick.range) { battle.nextEnemyAt=now+360; return; }
        else { const r=Math.random(); type=r<.18?'block':r<.30?'dodge':r<.53?'punch':r<.79?'kick':'heavy'; }
        act('enemy',type); battle.nextEnemyAt=now+Math.max(540,1080-e.speed*4.1+Math.random()*310);
    }

    function pose(side, frame, transient, duration) {
        const item=battle[side], node=document.getElementById(side+'-combatant'), image=node?.querySelector('.fighter-sprite'); if(!item||!node)return;
        item.transient=transient||''; setFrame(image,frame); refresh(side);
        later(function(){ if(!battle?.[side]||!node.isConnected)return; battle[side].transient=''; setFrame(image,'idle'); refresh(side); },duration||380);
    }
    function setFrame(node, frame) { const f=frames[frame]||frames.idle; node?.style.setProperty('--frame-x',f[0]); node?.style.setProperty('--frame-y',f[1]); }
    function refresh(side) {
        const item=battle?.[side],node=document.getElementById(side+'-combatant'); if(!item||!node)return;
        const c=['combatant-v3',side]; if(item.transient)c.push.apply(c,item.transient.split(' ')); if(!item.grounded)c.push('airborne'); if(Date.now()<item.crouching)c.push('crouching'); node.className=c.join(' ');
    }
    function sync() {
        if(!battle)return; width('player-health',battle.player.hpNow/battle.player.hp*100); width('enemy-health',battle.enemy.hpNow/battle.enemy.hp*100); width('stamina-fill',battle.player.stamina); width('special-fill',battle.player.meter);
        const clock=document.getElementById('fight-clock'),d=document.getElementById('fight-distance'); if(clock)clock.textContent=battle.seconds;if(d)d.textContent=Math.round(distance()); track('player',battle.player);track('enemy',battle.enemy);refresh('player');refresh('enemy');
        Object.keys(actions).forEach(function(type){const button=document.getElementById('v3-'+type);if(!button)return;const a=actions[type];button.disabled=!battle.ready||battle.finished||battle.player.stamina<a.cost||(type==='special'&&battle.player.meter<100);if(type==='special')button.classList.toggle('ready',battle.player.meter>=100);});
    }
    function track(side,item){const node=document.getElementById(side+'-track');if(node){node.style.setProperty('--fighter-x',item.x+'%');node.style.setProperty('--fighter-y',(-item.y)+'px');}}
    function width(id,value){const node=document.getElementById(id);if(node)node.style.width=clamp(value,0,100)+'%';}
    function tip(text){const node=document.getElementById('battle-tip');if(node)node.textContent=text;}
    function announce(text){const node=document.getElementById('fight-announcer');if(!node)return;node.textContent=text;node.classList.remove('hide');later(function(){if(node.isConnected)node.classList.add('hide');},430);}
    function showNote(side,text){const arena=document.getElementById('wolf-arena');if(!arena)return;const note=document.createElement('span');note.className='fight-miss '+side;note.textContent=text;arena.appendChild(note);later(function(){note.remove();},650);}
    function combo(value){const node=document.getElementById('combo-callout');if(!node)return;node.innerHTML=`<b>${value} HIT</b><span>COMBO</span>`;node.classList.remove('show');void node.offsetWidth;node.classList.add('show');}
    function hit(side,damage,type){const node=document.getElementById(side+'-combatant'),arena=document.getElementById('wolf-arena');if(node){node.classList.add('hit');later(function(){node.classList.remove('hit');},240);}if(arena){arena.classList.remove('camera-hit','camera-special');void arena.offsetWidth;arena.classList.add(type==='special'?'camera-special':'camera-hit');}const impact=document.createElement('span');impact.className='fight-impact '+side+' '+type;impact.innerHTML=`<b>-${damage}</b><i></i><i></i><i></i><i></i>`;arena?.appendChild(impact);later(function(){impact.remove();},700);haptic(type==='special'||type==='heavy'?'heavy':'medium');}

    function finish(won) {
        if(!battle||battle.finished)return; battle.finished=true; clearInputs(); clearInterval(timer);timer=null;sound(won?'victory':'defeat');
        const stats=window.readLocalJson('wolfFightStats',{rating:1200,clubRating:1680,wins:0,losses:0,streak:0,bestCombo:0});
        stats.bestCombo=Math.max(Number(stats.bestCombo||0),battle.player.combo||0);
        if(won){stats.wins+=1;stats.streak+=1;stats.rating+=28+Math.min(12,stats.streak*2);stats.clubRating+=8;window.rum=(window.rum||0)+(mode==='tournament'?1000:250);}else{stats.losses+=1;stats.streak=0;stats.rating=Math.max(100,stats.rating-18);stats.clubRating=Math.max(100,stats.clubRating-3);}
        localStorage.setItem('wolfFightStats',JSON.stringify(stats));window.updateUI?.();window.saveAll?.();
        const tournament=mode==='tournament'&&window.ClubLeaguePlatform?window.ClubLeaguePlatform.recordFightResult(won,context):null;
        let message=won?'Рейтинг растёт. Начислено '+(mode==='tournament'?'1 000':'250')+' тестовых RUMIR.':'Поражение записано. Работай ногами, держи дистанцию и возвращайся.';
        let repeat='РЕВАНШ';if(tournament?.status==='checked_in'){message=`Раунд выигран: ${Number(tournament.roundWins)}/2.`;repeat='СЛЕДУЮЩИЙ РАУНД';}if(tournament?.status==='winner'){message=`Ты выиграл турнир. Награда «${window.escapeHtml(tournament.prize||'приз клуба')}» оформлена.`;repeat='ТУРНИР ЗАВЕРШЁН';}if(tournament?.status==='eliminated'){message='Ты выбыл из турнира.';repeat='ВЫБРАТЬ БОЙЦА';}if(tournament?.status==='submitted'){message='Результат отправлен судье клуба.';repeat='ЖДАТЬ РЕШЕНИЯ';}
        const root=document.getElementById('fight-content'),p=battle.player;root.innerHTML=`<section class="fight-result-v2 ${won?'win':'lose'}" style="--fighter-color:${p.color}"><small>${mode==='tournament'?'ТУРНИР ВОЛЧЬЕЙ СОТНИ':'РЕЙТИНГОВЫЙ БОЙ'}</small><div class="result-verdict"><span>${won?'VICTORY':'DEFEAT'}</span><h1>${won?'ПОБЕДА':'ПОРАЖЕНИЕ'}</h1></div><p>${message}</p><div class="result-stats"><span><small>Рейтинг</small><b>${stats.rating}</b></span><span><small>Лучшая серия</small><b>${stats.bestCombo} HIT</b></span><span><small>Сезон</small><b>${stats.wins}–${stats.losses}</b></span></div><button class="fight-start" data-v3-result="rematch">${repeat}</button><button class="fight-ranking-link" data-v3-result="roster">Вернуться к девяти бойцам</button></section>`;
    }

    function stop(){clearInterval(timer);timer=null;timeouts.forEach(clearTimeout);timeouts=[];clearInputs();battle=null;try{window.speechSynthesis?.cancel();}catch(_){}}
    function clearInputs(){input.left=false;input.right=false;}
    function later(fn,delay){const id=setTimeout(function(){timeouts=timeouts.filter(function(x){return x!==id;});fn();},delay);timeouts.push(id);return id;}
    function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
    function haptic(type){try{const f=window.Telegram?.WebApp?.HapticFeedback;if(!f)return;if(type==='selection')f.selectionChanged();else f.impactOccurred(type||'light');}catch(_){}}

    function ensureAudio(){if(audio){audio.state==='suspended'&&audio.resume().catch(function(){});return audio;}const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{audio=new C();return audio;}catch(_){return null;}}
    function sound(type){const c=ensureAudio();if(!c)return;const p={round:[180,.08,'sine',.08],fight:[420,.22,'sawtooth',.12],punch:[150,.07,'square',.05],kick:[110,.11,'sawtooth',.06],heavy:[72,.16,'square',.09],special:[520,.26,'sawtooth',.1],hit:[95,.09,'square',.08],specialHit:[58,.24,'sawtooth',.13],blockedHit:[260,.08,'triangle',.05],blockReady:[310,.06,'sine',.03],dodge:[680,.05,'sine',.025],jump:[360,.08,'triangle',.035],move:[240,.04,'sine',.02],miss:[760,.035,'sine',.018],victory:[660,.34,'triangle',.09],defeat:[92,.4,'sawtooth',.07]}[type]||[95,.09,'square',.06];try{const o=c.createOscillator(),g=c.createGain();o.type=p[2];o.frequency.setValueAtTime(p[0],c.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(45,p[0]*(['fight','special','victory'].includes(type)?1.6:.55)),c.currentTime+p[1]);g.gain.setValueAtTime(p[3],c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+p[1]);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+p[1]);}catch(_){}}
    function speakFight(){try{if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance('Fight!');u.lang='en-US';u.rate=.78;u.pitch=.72;u.volume=.85;window.speechSynthesis.speak(u);}catch(_){}}

    document.addEventListener('click',function(event){
        const fightScreen=document.getElementById('fight-screen');if(!fightScreen?.classList.contains('active'))return;
        const oldStart=event.target.closest('[data-fight-action="start"]');if(oldStart&&!battle){event.preventDefault();event.stopImmediatePropagation();start();return;}
        const action=event.target.closest('[data-v3-action]');if(action&&battle){event.preventDefault();event.stopImmediatePropagation();act('player',action.dataset.v3Action);return;}
        const result=event.target.closest('[data-v3-result]');if(result){event.preventDefault();event.stopImmediatePropagation();if(result.dataset.v3Result==='rematch')start();else{stop();baseRender?.();}}
    },true);
    document.addEventListener('pointerdown',function(event){const button=event.target.closest('[data-v3-move]');if(!button||!battle)return;event.preventDefault();const m=button.dataset.v3Move;if(m==='left'||m==='right')input[m]=true;else movement(m);},true);
    ['pointerup','pointercancel'].forEach(function(name){document.addEventListener(name,function(event){const button=event.target.closest?.('[data-v3-move]');if(!button)return;const m=button.dataset.v3Move;if(m==='left'||m==='right')input[m]=false;},true);});
    document.addEventListener('keydown',function(event){if(!battle||!document.getElementById('fight-screen')?.classList.contains('active'))return;const held={ArrowLeft:'left',ArrowRight:'right'},map={KeyJ:'punch',KeyK:'kick',KeyH:'heavy',KeyB:'block',KeyV:'dodge',KeyS:'special',Space:'special'};if(held[event.code]){input[held[event.code]]=true;event.preventDefault();return;}if(event.repeat)return;if(event.code==='ArrowUp'||event.code==='KeyW'){movement('jump');event.preventDefault();}else if(event.code==='ArrowDown'){movement('crouch');event.preventDefault();}else if(map[event.code]){act('player',map[event.code]);event.preventDefault();}});
    document.addEventListener('keyup',function(event){if(event.code==='ArrowLeft')input.left=false;if(event.code==='ArrowRight')input.right=false;});

    window.openWolfFight=function(nextMode,nextContext){mode=nextMode||'training';context=nextContext||null;return baseOpen?.(nextMode,nextContext);};
    window.stopWolfFight=function(){stop();return baseStop?.();};
    window.WolfFightV3={start:start,stop:stop,version:'20260723a'};
})();
