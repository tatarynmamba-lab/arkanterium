'use strict';
(() => {
  const {classes,items,materials,guilds,recipes,enemies,zones,CITY_ZONE}=window.GameData;
  const engine=window.GameEngine.create();
  let game=engine.state;
  const $=id=>document.getElementById(id);
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const put=(id,html)=>{if($(id))$(id).innerHTML=html;};
  const disabled=condition=>condition?'disabled':'';
  const percent=value=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(value*100)+' %';
  const classLabel=id=>id==='all'?'Все классы':classes[id].name;
  function itemInfo(it){
    if(it.type==='potion')return it.effect==='health'?'Восстанавливает здоровье':'Восстанавливает ману';
    return '+'+it.bonus+' '+(it.type==='weapon'?'атаки':'защиты')+' · '+classLabel(it.classId);
  }
  function dropsTable(enemyId){
    return `<div class="dropCard"><h3>🎁 Ингредиенты с противника</h3><table class="dropTable"><thead><tr><th scope="col">Ингредиент</th><th scope="col">Количество</th><th scope="col">Шанс</th></tr></thead><tbody>${enemies[enemyId].drops.map(drop=>`<tr data-drop="${drop.itemId}" data-chance="${drop.chance}" data-quantity="${drop.quantity}"><td><strong>${materials[drop.itemId].icon} ${materials[drop.itemId].name}</strong></td><td>× ${drop.quantity}</td><td>${percent(drop.chance)}</td></tr>`).join('')}</tbody></table><p class="note">С врагов выпадают только ингредиенты. Каждый проверяется отдельно после победы. Снаряжение создаётся в гильдиях Светограда.</p></div>`;
  }
  function materialSources(materialId){
    return Object.entries(enemies).flatMap(([enemyId,e])=>{
      const drop=e.drops.find(row=>row.itemId===materialId);
      return drop?[`${e.name} — ${zones.find(z=>z.enemies.includes(enemyId)).name}, ${percent(drop.chance)}, × ${drop.quantity}`]:[];
    });
  }
  function renderGuilds(){
    put('cityGuilds',Object.entries(guilds).map(([id,guild])=>`<a class="tile guildTile" href="guilds.html#guild-${id}"><strong>${guild.icon} ${guild.name}</strong><span>${guild.description}</span></a>`).join(''));
    const held=Object.entries(materials).filter(([id])=>(game.materials[id]||0)>0);
    const materialList=held.length?held.map(([id,m])=>`<div class="materialRow"><span>${m.icon} ${m.name}</span><strong>× ${game.materials[id]}</strong></div>`).join(''):'<p class="note">Пока нет ингредиентов. Посмотри таблицы добычи на странице боя и отправляйся на охоту.</p>';
    put('materialsInventory',`<h2>Ингредиенты</h2>${materialList}<a class="btn linkButton secondary" href="guilds.html">Открыть гильдии →</a>`);
    put('guildMaterials',`<h2>Твои ингредиенты</h2>${materialList}<p class="note">Создано предметов: ${game.crafted}</p>`);
    const inCity=game.zone===CITY_ZONE;
    put('guildLocation',inCity?'<p class="note">Ты в Светограде. Выбери рецепт в одной из гильдий. Изготовление гарантировано; материалы и плата расходуются один раз.</p>':`<p class="note">Сейчас ты в локации «${zones[game.zone].name}». Создавать снаряжение можно только в городе.</p><button class="btn secondary" data-action="enterCity" ${disabled(game.enemy)}>Вернуться в Светоград</button><p class="note">${game.enemy?'Во время боя создавать предметы и возвращаться в город нельзя.':''}</p>`);
    put('guildList',Object.entries(guilds).map(([guildId,guild])=>`<section class="card guildSection" id="guild-${guildId}"><h2>${guild.icon} ${guild.name}</h2><p class="muted">${guild.description}</p><div class="recipeGrid">${Object.entries(recipes).filter(([,recipe])=>recipe.guildId===guildId).map(([recipeId,recipe])=>{
      const it=items[recipe.itemId],status=engine.craftStatus(recipeId);
      return `<article class="recipeCard" data-recipe-card="${recipeId}"><h3>${it.name}</h3><p class="level">${itemInfo(it)}</p><p class="note">Уровень ${recipe.level}+ · Плата ${recipe.gold} монет · У тебя ${game.gold}</p><ul class="ingredientsList">${Object.entries(recipe.ingredients).map(([id,count])=>`<li><span>${materials[id].icon} ${materials[id].name}</span><strong class="${(game.materials[id]||0)>=count?'enough':'missing'}">${game.materials[id]||0} / ${count}</strong></li>`).join('')}</ul><button class="btn craftButton" data-recipe="${recipeId}" ${disabled(!status.ok)}>${status.ok?'⚒️ Создать':status.reason}</button><details class="recipeSources"><summary>Где добыть ингредиенты</summary>${Object.keys(recipe.ingredients).map(id=>`<p><strong>${materials[id].name}</strong><br>${materialSources(id).map(source=>esc(source)).join('<br>')}</p>`).join('')}</details></article>`;
    }).join('')}</div></section>`).join(''));
  }
  function renderClassSelection(){
    $('classSelection').hidden=game.classId!==null;
    $('gameContent').hidden=game.classId===null;
    $('mainNav').hidden=game.classId===null;
    if(game.classId!==null)return;
    put('classCards',Object.entries(classes).map(([id,c])=>`<button class="classCard" data-class="${id}"><span class="classIcon" aria-hidden="true">${c.icon}</span><strong>${c.name}</strong><span class="classDescription">${c.description}</span><span class="classStats">❤️ ${c.hp} здоровья · 🔷 ${c.mana} маны<br>Атака ${c.attack+items[c.weapon].bonus} · Защита ${c.defense+1}</span><span class="classSkill">${c.skill} · ${c.skillCost} маны</span><span class="btn">Выбрать ${id==='warrior'?'воина':id==='archer'?'лучника':'мага'}</span></button>`).join(''));
    $('classIntro').textContent=game.migration?
      'Твой прогресс перенесён: уровень '+game.level+', монет '+game.gold+'. Выбери класс для продолжения.':
      'Выбери один из трёх классов. Твой герой появится на площади Светограда.';
  }
  function renderBattle(c){
    if(!$('gameActions'))return;
    const zone=zones[game.zone];
    put('scene',`<span class="sceneEmoji">${zone.icon}</span><div><h3 class="sceneTitle">${zone.name}</h3><p class="sceneText">${zone.description}</p></div>`);
    if(game.enemy){
      const e=enemies[game.enemy.id];
      put('gameActions',`<div class="fight"><div class="fightTop"><span class="enemyEmoji">${e.icon}</span><div><div class="enemyTitle">${e.name}</div><div class="enemyStats">Атака ${e.attack} · Награда ${e.gold} монет, ${e.xp} опыта${e.weakness==='fire'?' · Уязвимость к огню':''}</div></div></div><div class="barLabel"><span>Здоровье противника</span><strong>${game.enemy.hp} / ${e.hp}</strong></div><div class="track"><span class="fill hpFill" style="width:${100*game.enemy.hp/e.hp}%"></span></div></div><div class="controls"><button class="btn" data-action="hit">${c.icon} ${c.basic}</button><button class="btn magic" data-action="skill" ${disabled(game.mana<c.skillCost)}>✨ ${c.skill} (${c.skillCost} маны)</button><button class="btn magic" data-action="guard" ${disabled(game.mana<c.guardCost||game.shield)}>🛡️ ${c.guard} (${c.guardCost} маны)</button><button class="btn secondary" data-action="potion" ${disabled(game.potions<1||game.hp===game.maxHp)}>🧪 Лечение (${game.potions})</button><button class="btn secondary" data-action="manaPotion" ${disabled(game.manaPotions<1||game.mana===game.maxMana)}>🔷 Мана (${game.manaPotions})</button><button class="btn danger" data-action="flee">Отступить</button></div><p class="note">Обычная атака восстанавливает 1 ману. Защита блокирует следующую атаку. После умения, атаки или зелья противник отвечает.</p>${dropsTable(game.enemy.id)}`);
    }else if(game.zone===CITY_ZONE){
      put('gameActions','<p class="note">Ты в безопасном городе. Для охоты выйди за ворота.</p><div class="controls"><a class="btn secondary" href="city.html">🏰 Городская площадь</a><button class="btn" data-action="leaveCity">🚪 Выйти на охоту</button></div>');
    }else{
      put('gameActions',`<div class="controls"><button class="btn" data-action="explore">🔎 Найти противника</button><button class="btn secondary" data-action="potion" ${disabled(game.potions<1||game.hp===game.maxHp)}>🧪 Лечение (${game.potions})</button><button class="btn secondary" data-action="manaPotion" ${disabled(game.manaPotions<1||game.mana===game.maxMana)}>🔷 Мана (${game.manaPotions})</button></div>`);
    }
    put('lootPreview',game.enemy?'':zone.enemies.map(id=>`<section class="card"><h2>${enemies[id].icon} ${enemies[id].name}</h2><p class="note">Здоровье ${enemies[id].hp} · Атака ${enemies[id].attack}</p>${dropsTable(id)}</section>`).join(''));
    put('battleResult',game.lastResult?`<div class="victory"><strong>🏆 ${enemies[game.lastResult.enemyId].name} побеждён</strong><p>+${game.lastResult.gold} монет · +${game.lastResult.xp} опыта</p><p>Ингредиенты: ${game.lastResult.drops.length?game.lastResult.drops.map(drop=>materials[drop.itemId].name+' × '+drop.quantity).join(', '):'не выпали'}.</p><a href="guilds.html">Посмотреть рецепты гильдий →</a></div>`:'');
  }
  function renderContract(){
    if(!$('contract'))return;
    if(game.contract){
      const c=game.contract,here=c.zone===game.zone;
      put('contract',`<div class="contract"><div class="smallCaps">Активный контракт</div><h3 class="contractTitle">${enemies[c.targetId].name}</h3><p>📍 ${zones[c.zone].name} · Награда: ${c.gold} монет, ${c.xp} опыта</p><p>${here?'След найден. Можно начать охоту.':'Отправляйся к месту контракта.'}</p></div><div class="controls">${!here?`<button class="btn" data-action="travelContract" ${disabled(game.enemy)}>🚪 Отправиться: ${zones[c.zone].name}</button>`:''}<button class="btn secondary" data-action="track" ${disabled(game.enemy||!here)}>🐾 Идти по следу</button><button class="btn secondary" data-action="abandon" ${disabled(game.enemy)}>Отказаться</button></div>`);
    }else{
      put('contract',`<div class="contract"><div class="smallCaps">Доска объявлений · ${zones[game.zone].name}</div><h3 class="contractTitle">Требуется герой!</h3><p>${game.zone===CITY_ZONE?'Первый заказ отправит тебя в Изумрудный лес за городскими воротами.':'Жители обещают награду за опасного противника в этой локации.'}</p></div><div class="controls"><button class="btn" data-action="accept" ${disabled(game.enemy)}>Взять контракт</button></div>`);
    }
  }
  function render(){
    game=engine.state;renderClassSelection();
    $('storageWarning').hidden=engine.storageAvailable;
    $('feedback').textContent=game.log[0]||'Твоя история продолжается.';
    if(!game.classId)return;
    const c=classes[game.classId],zone=zones[game.zone],inCity=game.zone===CITY_ZONE;
    $('heroName').textContent=c.name;$('heroAvatar').textContent=c.icon;
    $('heroLevel').textContent='Уровень '+game.level+' · Побед '+game.kills;
    for(const [key,value,max] of [['hp',game.hp,game.maxHp],['mana',game.mana,game.maxMana],['xp',game.xp,engine.xpNeed()]]){
      $(key+'Text').textContent=value+' / '+max;
      $(key+'Bar').style.width=(max?100*value/max:0)+'%';
    }
    $('attackText').textContent=engine.strength();$('defenseText').textContent=engine.armor();
    $('goldText').textContent=game.gold;$('potionsText').textContent=game.potions;$('manaPotionsText').textContent=game.manaPotions;
    $('heroNote').textContent='📍 '+zone.name+' · Контрактов: '+game.contractsCompleted+(game.shield?' · Защита активна':'');
    $('battleLink').hidden=!game.enemy;
    const order=[CITY_ZONE,0,1,2,3];
    put('zones',order.map(i=>`<button class="zone ${i===game.zone?'selected':''}" data-zone="${i}" ${disabled(game.enemy||game.level<zones[i].min)}><span class="zoneInfo"><span class="icon">${zones[i].icon}</span><span><strong>${zones[i].name}</strong><small>${i===game.zone?'Ты здесь':game.level<zones[i].min?'Пока закрыта':'Перейти'}</small></span></span><span class="mini">${i===CITY_ZONE?'Безопасно':'ур. '+zones[i].min+'+'}</span></button>`).join(''));
    put('overview',`<div class="scene"><span class="sceneEmoji">${inCity?'🏰':c.icon}</span><div><div class="smallCaps">${inCity?'Безопасный город · Начало пути':'Твой путь продолжается'}</div><h2 class="sceneTitle">${zone.name}</h2><p class="sceneText">${game.enemy?'Схватка продолжается. Вернись в бой.':inCity?'Ты на площади Светограда. Подготовься и возьми первый контракт.':'Найди противника и посмотри, какую добычу можно получить.'}</p><a class="btn linkButton" href="${inCity?'city.html':'battle.html'}">${inCity?'Открыть город':game.enemy?'Продолжить бой':'Начать охоту'} →</a></div></div>`);
    put('cityWelcome',`<div class="cityScene"><div class="smallCaps">${inCity?'Стартовая локация · Безопасно':'Город за стенами'}</div><h2 class="sceneTitle">🏰 Светоград</h2><p class="sceneText">${inCity?zones[CITY_ZONE].description:'Ты сейчас в локации «'+zone.name+'». Можно вернуться на городскую площадь.'}</p><div class="citySquare"><div class="townBuilding">🍺<span>Таверна</span></div><div class="heroSpawn"><div class="avatar">${c.icon}</div><strong>${inCity?'Ты здесь':'Стартовая точка'}</strong><span>${c.name} · Городская площадь</span></div><div class="townBuilding">📜<span>Контракты</span></div></div>${inCity?'<button class="btn" data-action="leaveCity">🚪 Выйти на охоту</button>':`<button class="btn" data-action="enterCity" ${disabled(game.enemy)}>Войти в город</button><p class="note">${game.enemy?'Сначала закончи бой или отступи.':'Возвращение бесплатно; здоровье и мана восстанавливаются отдыхом.'}</p>`}</div>`);
    if($('cityServices'))$('cityServices').hidden=!inCity;
    put('heroSkills',`<h2>${c.icon} Умения: ${c.name}</h2><div class="gearline"><div><strong>${c.skill} · ${c.skillCost} маны</strong><small>${c.skillDescription}</small></div></div><div class="gearline"><div><strong>${c.guard} · ${c.guardCost} маны</strong><small>Блокирует следующую атаку противника.</small></div></div><p class="note">Каждый уровень: +${c.hpGrowth} здоровья, +${c.manaGrowth} маны, +${c.attackGrowth} атаки. Обычная атака возвращает 1 ману.</p>`);
    put('equipment',['weapon','armor'].map(type=>{const it=game.equipment[type];return `<div class="gearline"><div><strong>${type==='weapon'?c.icon+' Оружие':'🛡️ Доспех'}</strong><small>${esc(it.name)}</small></div><span class="level">+${it.bonus} ${type==='weapon'?'атаки':'защиты'}</span></div>`;}).join(''));
    put('inventory',`<h3>Сумка (${game.bag.length})</h3>${game.bag.length?game.bag.map((it,index)=>`<div class="inventoryRow"><div><strong>${esc(it.name)}</strong><small class="muted">${itemInfo(it)}</small></div><button class="equip" data-item="${index}" ${disabled(game.enemy||it.classId!=='all'&&it.classId!==game.classId)}>${it.classId!=='all'&&it.classId!==game.classId?'Другой класс':'Надеть'}</button></div>`).join(''):'<p class="note">Создай снаряжение из ингредиентов в одной из городских гильдий.</p>'}<p class="note">Зелья лечения: ${game.potions} · Зелья маны: ${game.manaPotions}</p>`);
    put('log',game.log.map(message=>'<li>'+esc(message)+'</li>').join(''));
    renderContract();renderBattle(c);renderGuilds();
    document.querySelectorAll('[data-action="rest"]').forEach(el=>el.disabled=!!game.enemy||game.gold<5||game.hp===game.maxHp&&game.mana===game.maxMana);
    document.querySelectorAll('[data-action="buy"]').forEach(el=>el.disabled=!!game.enemy||game.gold<10);
    document.querySelectorAll('[data-action="buyMana"]').forEach(el=>el.disabled=!!game.enemy||game.gold<12);
  }
  engine.subscribe(render);
  document.addEventListener('click',event=>{
    const el=event.target.closest('button');if(!el||el.disabled)return;
    if(el.dataset.class){
      if(engine.selectClass(el.dataset.class))window.location.href=engine.state.enemy?'battle.html':engine.state.zone===CITY_ZONE?'city.html':'index.html';
    }else if(el.dataset.zone!==undefined)engine.chooseZone(Number(el.dataset.zone));
    else if(el.dataset.item!==undefined)engine.equip(Number(el.dataset.item));
    else if(el.dataset.recipe)engine.craft(el.dataset.recipe);
    else if(el.dataset.action){
      const before=engine.state.zone;engine.action(el.dataset.action);
      if(el.dataset.action==='track'&&engine.state.enemy&&document.body.dataset.page!=='battle')window.location.href='battle.html';
      if(['leaveCity','travelContract'].includes(el.dataset.action)&&engine.state.zone!==before&&document.body.dataset.page!=='battle')window.location.href='battle.html';
    }
  });
  $('reset').addEventListener('click',()=>{
    if(window.confirm('Начать новую игру? Текущий прогресс будет удалён.'))engine.reset();
  });
  if($('exportSave'))$('exportSave').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([engine.exportSave()],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='tropa-geroev-save.json';
    document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  if($('importSave'))$('importSave').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>2*1024*1024)throw Error('Максимальный размер — 2 МБ.');
      const raw=await file.text();window.GameEngine.parseSave(raw);
      if(!window.confirm('Заменить текущий прогресс выбранным сохранением?')){$('importStatus').textContent='Загрузка отменена.';return;}
      engine.importSave(raw);$('importStatus').textContent='Сохранение загружено.';
    }catch(err){$('importStatus').textContent=err.message;}
    finally{event.target.value='';}
  });
  window.addEventListener('storage',event=>{if(event.key===window.GameEngine.KEY)engine.reload();});
  window.addEventListener('pageshow',()=>engine.reload());
  render();
})();
