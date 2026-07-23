// Veggie Brawl Top-Down: shared state, lobby and arena renderer.
(function () {
    'use strict';
    const legacy = window.VeggieBrawl;
    if (!legacy || window.VBTD) return;
    const R = window.VBTD = {
        version: '20260724a', modes: legacy.modes, veggies: legacy.veggies,
        weapons: legacy.weapons.map(function (x, i) { return Object.assign({}, x, { range: [10.5, 11.5, 12.5, 9.5, 13][i] || 10 }); }),
        powerups: legacy.powerups,
        obstacles: [{x:29,y:28,r:6,icon:'🥘'},{x:71,y:28,r:6,icon:'🛢️'},{x:29,y:72,r:6,icon:'🧺'},{x:71,y:72,r:6,icon:'📦'}],
        clubs: ['Крипто-Кухня','TON Огород','Банда Борща'],
        selectedMode: localStorage.getItem('veggieBrawlMode') || 'pear_duel',
        selectedVeggie: localStorage.getItem('veggieBrawlFighter') || 'cabbage',
        pendingMode: 'training', context: null, battle: null, timer: null, timeouts: [], pickupId: 0,
        input: {x:0,y:0,left:false,right:false,up:false,down:false}, pointerId: null,
        baseOpen: window.openWolfFight, baseStop: window.stopWolfFight
    };
    R.veg = function (id) { return R.veggies.find(function (x) { return x.id === id; }) || R.veggies[0]; };
    R.other = function (side) { return side === 'left' ? 'right' : 'left'; };
    R.all = function () { return R.battle ? R.battle.left.fighters.concat(R.battle.right.fighters) : []; };
    R.player = function () { return R.battle?.left.fighters[0] || null; };
    R.enemies = function (side) { return R.battle?.[R.other(side)].fighters || []; };
    R.dist = function (a,b) { return Math.hypot(a.x-b.x,a.y-b.y); };
    R.norm = function (x,y) { const l=Math.hypot(x,y); return l?{x:x/l,y:y/l}:{x:0,y:0}; };
    R.clamp = function (v,min,max) { return Math.max(min,Math.min(max,v)); };
    R.random = function (min,max) { return Math.floor(Math.random()*(max-min+1))+min; };
    R.later = function (fn,ms) { const id=setTimeout(function(){R.timeouts=R.timeouts.filter(function(x){return x!==id;});fn();},ms);R.timeouts.push(id); };
    R.randomVeg = function (exclude) { const a=R.veggies.filter(function(x){return x.id!==exclude;});return a[R.random(0,a.length-1)]; };
    R.randomUnused = function (used) { const a=R.veggies.filter(function(x){return !used.has(x.id);});return a.length?a[R.random(0,a.length-1)]:R.veggies[R.random(0,R.veggies.length-1)]; };

    R.renderLobby = function () {
        R.stop?.();
        const root=document.getElementById('fight-content'); if(!root)return;
        const chosen=R.veg(R.selectedVeggie);
        root.innerHTML=`<section class="td-hero"><div><small>HUNGRY WOLVES FIGHT CLUB</small><h1>Овощной беспредел</h1><p>Вид сверху: свободно бегай по всей арене, догоняй грушу и перехватывай бонусы.</p></div><span>🐺</span></section><section class="td-lobby"><h2>Выбери баталию</h2><div class="td-modes">${Object.values(R.modes).map(R.modeCard).join('')}</div><h2>Выбери овоща</h2><div class="td-roster">${R.veggies.map(R.vegCard).join('')}</div><div class="td-selected" style="--veg:${chosen.color}"><b>${chosen.emoji}</b><span><strong>${chosen.name}</strong><small>${chosen.role} · HP ${chosen.hp} · Скорость ${chosen.speed}</small></span><button data-td-start>НА АРЕНУ</button></div></section>`;
    };
    R.modeCard = function (m) { return `<button class="td-mode ${R.selectedMode===m.id?'active':''}" data-td-mode="${m.id}"><b>${m.badge} ${m.name}</b><small>${m.teamSize}×${m.teamSize} · до ${m.goal} монет</small></button>`; };
    R.vegCard = function (v) { return `<button class="td-veg ${R.selectedVeggie===v.id?'active':''}" data-td-veg="${v.id}" style="--veg:${v.color}"><b>${v.emoji}</b><small>${v.name}</small></button>`; };

    R.start = function () {
        R.stop(); const mode=R.modes[R.selectedMode]||R.modes.pear_duel;
        R.battle={mode:mode,left:R.makeTeam('left',mode.teamSize,R.veg(R.selectedVeggie)),right:R.makeTeam('right',mode.teamSize,R.randomVeg(R.selectedVeggie)),pear:{x:50,y:50,tx:50,ty:50,nextTurn:Date.now()+1500,face:'😜',hitUntil:0},pickups:[],ready:false,done:false,seconds:mode.seconds,ends:0,last:Date.now(),nextPickup:Date.now()+1800};
        R.renderArena(); R.announce('3'); R.later(function(){R.announce('2');},450); R.later(function(){R.announce('1');},900);
        R.later(function(){if(!R.battle)return;R.battle.ready=true;R.battle.ends=Date.now()+mode.seconds*1000;R.battle.last=Date.now();R.announce('РАЗБЕЖАЛИСЬ!');},1350);
        R.timer=setInterval(R.tick,40);
    };
    R.makeTeam = function (side,count,leader) {
        const used=new Set([leader.id]),fighters=[];
        for(let i=0;i<count;i++){const t=i?R.randomUnused(used):leader;used.add(t.id);const row=i%3,col=Math.floor(i/3);fighters.push({id:'td-'+side+'-'+i,side:side,slot:i,controlled:side==='left'&&i===0,template:t,x:side==='left'?12+col*7:88-col*7,y:27+row*(count>3?22:25),fx:side==='left'?1:-1,fy:0,hp:t.hp,maxHp:t.hp,weapon:null,uses:0,block:0,shield:0,rage:0,speed:0,double:0,magnet:0,stunned:0,knocked:0,invulnerable:0,dash:0,lastAttack:0,nextAi:Date.now()+R.random(350,750),target:'pear',transient:''});}
        return {side:side,name:side==='left'?(R.pendingMode==='tournament'?'Голодные Волки':'Твоя команда'):(R.pendingMode==='tournament'?R.clubs[R.random(0,R.clubs.length-1)]:'Овощные задиры'),score:0,ko:0,fighters:fighters};
    };
    R.renderArena = function () {
        const root=document.getElementById('fight-content');
        root.innerHTML=`<section class="td-arena"><header>${R.scoreHtml('left')}<div class="td-goal"><small>ПЕРВЫМ ДО</small><b>${R.battle.mode.goal} 🪙</b><i id="td-clock">${R.battle.mode.seconds}</i></div>${R.scoreHtml('right')}</header><div class="td-announcer hide" id="td-announcer"></div><div class="td-map" id="td-map"><div class="td-grid"></div>${R.obstacles.map(R.obstacleHtml).join('')}<div id="td-pickups"></div><button id="td-pear" class="td-pear" data-td-target="pear"><b>🍐</b><i>😜</i></button><div id="td-fighters">${R.all().map(R.fighterHtml).join('')}</div></div></section><section class="td-console"><div class="td-status"><b>${R.player().template.emoji}</b><span><strong>${R.player().template.name}</strong><i><em id="td-hp"></em></i><small id="td-item">Ищи предметы по всей карте</small></span></div><div class="td-controls"><div class="td-joystick" id="td-joystick"><span id="td-knob"></span><small>ДВИЖЕНИЕ</small></div><div class="td-actions"><button data-td-action="light">👊<b>ШЛЁП</b></button><button data-td-action="heavy">💥<b>БАБАХ</b></button><button data-td-action="weapon">🍳<b>ПРЕДМЕТ</b></button><button data-td-action="dash">💨<b>РЫВОК</b></button><button data-td-action="block">🛡️<b>БЛОК</b></button></div></div><div class="td-targets"><button class="active" data-td-aim="pear">🍐 Груша</button><button data-td-aim="enemy">😵 Враги</button></div><p id="td-tip">Двигай стик в любую сторону. Бонусы появляются в случайных местах.</p></section>`;R.sync();
    };
    R.scoreHtml=function(side){const t=R.battle[side];return `<div class="td-score ${side}"><small>${t.name}</small><b id="td-${side}-score">0</b><span>🪙 · KO <i id="td-${side}-ko">0</i></span></div>`;};
    R.obstacleHtml=function(o){return `<span class="td-obstacle" style="--x:${o.x}%;--y:${o.y}%"><b>${o.icon}</b></span>`;};
    R.fighterHtml=function(f){return `<button id="${f.id}" class="td-fighter ${f.side} ${f.controlled?'controlled':''}" data-td-target="${f.id}" style="--x:${f.x}%;--y:${f.y}%;--veg:${f.template.color};--z:${Math.round(f.y)}"><span class="td-marker">${f.controlled?'ТЫ':f.slot+1}</span><i class="td-shadow"></i><b class="td-body"><em>•ᴗ•</em><span>${f.template.emoji}</span><u></u></b><small>${f.template.name}</small><i class="td-mini-hp"><em></em></i></button>`;};
})();
