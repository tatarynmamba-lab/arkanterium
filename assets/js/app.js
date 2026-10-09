
'use strict';
(() => {
const {zones, CITY_ZONE} = window.GameData;
const zoneOrder = [CITY_ZONE,...zones.map((_,i)=>i).filter(i=>i!==CITY_ZONE)];
const engine = window.GameEngine.create();
let game = engine.state;
const $ = id => document.getElementById(id);
const xpNeed = () => engine.xpNeed();
const strength = () => engine.strength();
const armor = () => engine.armor();
const escapeText = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
  $('heroLevel').textContent = `Уровень ${game.level} · Побед ${game.kills}`;
  $('hpText').textContent = `${game.hp} / ${game.maxHp}`;
  $('hpBar').style.width = `${100*game.hp/game.maxHp}%`;
  $('energyText').textContent = `${game.energy} / ${game.maxEnergy}`;
  $('energyBar').style.width = `${100*game.energy/game.maxEnergy}%`;
  $('xpText').textContent = `${game.xp} / ${xpNeed()}`;
  $('xpBar').style.width = `${100*game.xp/xpNeed()}%`;
  $('attackText').textContent = strength(); $('defenseText').textContent = armor();
  $('goldText').textContent = game.gold; $('potionsText').textContent = game.potions;
  $('heroNote').textContent = `📍 ${zones[game.zone].name} · Выполнено контрактов: ${game.contractsCompleted} · ${game.shield?'🛡️ Квен активен':'⚪ Квен не активен'}`;
  if ($('zones')) $('zones').innerHTML = zoneOrder.map(i=>{const z=zones[i];return `<button class="zone ${i===game.zone?'selected':''}" data-zone="${i}" ${game.level<z.min||game.enemy?'disabled':''}><span class="zoneInfo"><span class="icon">${z.icon}</span><span><strong>${z.name}</strong><small>${i===game.zone?'Ты здесь':game.level<z.min?'Пока закрыта':'Перейти'}</small></span></span><span class="mini">${z.kind==='city'?'Безопасно':`ур. ${z.min}+`}</span></button>`;}).join('');
  const zone=zones[game.zone];
  if ($('scene')) $('scene').innerHTML = `<span class="sceneEmoji">${zone.icon}</span><div><h3 class="sceneTitle">${zone.name}</h3><p class="sceneText">${zone.description}</p></div>`;
  if ($('gameActions')) {
  if(game.enemy) {
    const e=game.enemy;
    $('gameActions').innerHTML = `<div class="fight"><div class="fightTop"><span class="enemyEmoji">${e.icon}</span><div><div class="enemyTitle">${e.name}</div><div class="enemyStats">Атака: ${e.attack} · Уязвимость: ${e.weak} ${game.shield?'· 🛡️ Квен защищает':''}</div></div></div><div class="barLabel"><span>❤️ Здоровье чудовища</span><strong>${e.hp} / ${e.maxHp}</strong></div><div class="track"><span class="fill hpFill" style="width:${100*e.hp/e.maxHp}%"></span></div></div><div class="controls"><button class="btn" data-action="hit">⚔️ Быстрый удар</button><button class="btn secondary" data-action="power">💥 Сильный удар</button><button class="btn magic" data-action="igni" ${game.energy<2?'disabled':''}>🔥 Игни (2 🔷)</button><button class="btn magic" data-action="quen" ${game.energy<2||game.shield?'disabled':''}>🛡️ Квен (2 🔷)</button><button class="btn secondary" data-action="potion" ${game.potions<1||game.hp===game.maxHp?'disabled':''}>🧪 Ласточка (${game.potions})</button><button class="btn danger" data-action="flee">🏃 Отступить</button></div><p class="note">Быстрый удар возвращает 1 энергию. Сильный удар мощнее, но может промахнуться. Игни наносит огненный урон, Квен блокирует следующую атаку. После хода враг отвечает.</p>`;
  } else if(game.zone===CITY_ZONE) {
    $('gameActions').innerHTML = `<p class="note">Ты в безопасном городе. Чудовища ждут за воротами: выйди к месту контракта или начни охоту в Белом Саду.</p><div class="controls"><a class="btn secondary" href="city.html">🏰 Городская площадь</a><button class="btn" data-action="leaveCity">🚪 Выйти на охоту</button></div>`;
  } else {
    $('gameActions').innerHTML = `<div class="controls"><button class="btn" data-action="explore">🔎 Искать чудовище</button><button class="btn secondary" data-action="potion" ${game.potions<1||game.hp===game.maxHp?'disabled':''}>🧪 Выпить «Ласточку» (${game.potions})</button></div><p class="note">Убивай чудовищ серебряным мечом, собирай снаряжение и бери контракты за кроны.</p>`;
  }
  }
  if ($('contract')) {
  if(game.contract){
    const c=game.contract;
    const here = game.zone===c.zone;
    $('contract').innerHTML = `<div class="contract"><div class="smallCaps">Активный контракт</div><h3 class="contractTitle">«${c.target}»</h3><p>📍 ${zones[c.zone].name} · Награда: <strong>${c.gold} крон и ${c.xp} опыта</strong></p><p>${here?'След найден. Выследи заказанное чудовище.':'Доберись до места контракта, затем иди по следу.'}</p></div><div class="controls">${!here?`<button class="btn" data-action="travelContract" ${game.enemy?'disabled':''}>🚪 Отправиться: ${zones[c.zone].name}</button>`:''}<button class="btn ${here?'':'secondary'}" data-action="track" ${game.enemy||!here?'disabled':''}>🐾 Идти по следу</button><button class="btn secondary" data-action="abandon" ${game.enemy?'disabled':''}>Отказаться</button></div>`;
  } else {
    $('contract').innerHTML = `<div class="contract"><div class="smallCaps">Объявление в ${zone.kind==='city'?'Оксенфурте':zone.name==='Окраины Новиграда'?'окрестностях Новиграда':zone.name==='Скеллиге'?'Скеллиге':zone.name==='Велен'?'Велене':'Белом Саду'}</div><h3 class="contractTitle">«Требуется ведьмак!»</h3><p>${zone.kind==='city'?'На городской доске размещён заказ на чудовище в Белом Саду. Подготовься и отправляйся за стены.':'Местные жители обещают награду за охоту на опасную тварь. Возьми заказ и найди чудовище по следу.'}</p></div><div class="controls"><button class="btn" data-action="accept" ${game.enemy?'disabled':''}>📜 Взять контракт</button></div>`;
  }
  }
  if ($('equipment')) $('equipment').innerHTML = ['weapon','armor'].map(type=>{const it=game.equipment[type];return `<div class="gearline"><div><strong>${type==='weapon'?'⚔️ Серебряный меч':'🛡️ Доспех'}</strong><small>${escapeText(it.name)}</small></div><span class="level">+${it.bonus} ${type==='weapon'?'атаки':'защиты'}</span></div>`}).join('');
  if ($('inventory')) $('inventory').innerHTML = `<hr class="divider"><strong>Сумка (${game.bag.length})</strong>` + (game.bag.length?game.bag.map((it,i)=>`<div class="inventoryRow"><div><div class="itemName">${escapeText(it.name)}</div><small class="muted">+${it.bonus} ${it.type==='weapon'?'атаки':'защиты'}</small></div><button class="equip" data-item="${i}" ${game.enemy?'disabled':''}>Надеть</button></div>`).join(''):'<p class="note">Здесь появятся трофеи и найденное снаряжение.</p>');
  if ($('log')) $('log').innerHTML = game.log.map(e=>`<li>${escapeText(e)}</li>`).join('');


  const feedback = $('feedback');
  feedback.textContent = game.log[0] || 'Добро пожаловать на Тропу охотника.';
  if ($('overview')) $('overview').innerHTML = `<div class="scene"><span class="sceneEmoji">${zone.kind==='city'?'🏰':'🐺'}</span><div><div class="smallCaps">${zone.kind==='city'?'Безопасный город · Начало пути':'Твой путь продолжается'}</div><h2 class="sceneTitle">${zone.name}</h2><p class="sceneText">${game.enemy ? 'Схватка ещё не окончена. Вернись в бой.' : zone.kind==='city'?'Ты на городской площади. Загляни в таверну, возьми контракт и выйди на Тропу.':'Медальон ждёт новой охоты. Подготовь клинки и выбери контракт.'}</p><a class="btn linkButton" href="${zone.kind==='city'?'city.html':'battle.html'}">${game.enemy ? 'Продолжить бой' : zone.kind==='city'?'Открыть город':'Начать охоту'} →</a></div></div>`;
  const inCity=game.zone===CITY_ZONE;
  if ($('cityWelcome')) $('cityWelcome').innerHTML = `<div class="cityScene"><div class="smallCaps">${inCity?'Стартовая локация · Безопасно':'Город за стенами'}</div><h2 class="sceneTitle">🏰 Оксенфурт</h2><p class="sceneText">${inCity?zones[CITY_ZONE].description:`Сейчас ты в локации «${zone.name}». Вернись в город, чтобы оказаться на площади.`}</p><div class="citySquare" aria-label="Городская площадь"><div class="townBuilding">🍺<span>Таверна</span></div><div class="heroSpawn"><div class="avatar">🐺</div><strong>${inCity?'Ты здесь':'Твоя стартовая точка'}</strong><span>Городская площадь</span></div><div class="townBuilding">📜<span>Доска заказов</span></div></div>${inCity?'<button class="btn" data-action="leaveCity">🚪 Выйти на охоту</button>':`<button class="btn" data-action="enterCity" ${game.enemy?'disabled':''}>Войти в город</button><p class="note">${game.enemy?'Сначала закончи бой или отступи.':'Возвращение в город бесплатно и не восстанавливает силы автоматически.'}</p>`}</div>`;
  if ($('cityServices')) $('cityServices').hidden=!inCity;
  document.querySelectorAll('[data-action="rest"]').forEach(el => el.disabled = !!game.enemy || game.gold < 5 || (game.hp === game.maxHp && game.energy === game.maxEnergy));
  document.querySelectorAll('[data-action="buy"]').forEach(el => el.disabled = !!game.enemy || game.gold < 10);
  if ($('battleLink')) $('battleLink').hidden = !game.enemy;
  $('storageWarning').hidden = engine.storageAvailable;
}

engine.subscribe(()=>{game=engine.state;render();});
document.addEventListener('click',ev=>{
  const el=ev.target.closest('button');if(!el||el.disabled)return;
  if(el.dataset.zone!==undefined)engine.chooseZone(Number(el.dataset.zone));
  else if(el.dataset.item!==undefined)engine.equip(Number(el.dataset.item));
  else if(el.dataset.action) {
    engine.action(el.dataset.action);
    if (el.dataset.action==='track' && engine.state.enemy && document.body.dataset.page!=='battle') window.location.href='battle.html';
    if (['leaveCity','travelContract'].includes(el.dataset.action) && engine.state.zone!==CITY_ZONE && document.body.dataset.page!=='battle') window.location.href='battle.html';
  }
});
$('reset').addEventListener('click',()=>{
  if(window.confirm('Начать новую ведьмачью историю? Текущий прогресс будет удалён.')) engine.reset();
});
if ($('exportSave')) $('exportSave').addEventListener('click',()=>{
  const url=URL.createObjectURL(new Blob([engine.exportSave()],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='vedmak-save.json';document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
if ($('importSave')) $('importSave').addEventListener('change',async ev=>{
  const file=ev.target.files[0];if(!file)return;
  const status=$('importStatus');
  try {
    if(file.size>2*1024*1024)throw new Error('Слишком большой файл. Максимум 2 МБ.');
    const raw=await file.text();
    // Validate before prompting, so a broken file never overwrites the current game.
    const parsed=JSON.parse(raw);
    if(parsed && parsed.format==='hunters-path-save' && parsed.version!==1)throw new Error('Неподдерживаемая версия сохранения.');
    if(!window.GameEngine.valid(parsed && parsed.format==='hunters-path-save'?parsed.state:parsed))throw new Error('Некорректный файл сохранения.');
    if(!window.confirm('Заменить текущий прогресс выбранным сохранением?')){status.textContent='Загрузка отменена.';return;}
    engine.importSave(raw);status.textContent='Сохранение загружено.';
  } catch(err){status.textContent=err.message;}
  finally{ev.target.value='';}
});
window.addEventListener('storage',ev=>{if(ev.key===window.GameEngine.KEY)engine.reload();});
window.addEventListener('pageshow',()=>engine.reload());
render();
})();
