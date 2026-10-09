'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const pages=['index','city','guilds','hero','map','battle','contracts','inventory','tavern','journal'];
function memoryStorage(){
  const values=new Map();
  return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
}
function setup({storage=memoryStorage(),random=()=>0.5,classId}={}){
  const context=vm.createContext({window:{localStorage:storage},console});
  vm.runInContext(read('assets/js/data.js'),context);
  vm.runInContext(read('assets/js/engine.js'),context);
  const api=context.window.GameEngine,data=context.window.GameData,game=api.create({storage,random});
  if(classId)game.selectClass(classId);
  return {context,storage,api,data,game};
}
function legacySave(){
  return {level:3,xp:8,maxHp:51,hp:34,energy:2,maxEnergy:3,attack:9,defense:0,gold:85,potions:4,kills:7,contractsCompleted:2,
    zone:1,enemy:{name:'Туманник',hp:19,maxHp:28,attack:7,xp:17,gold:10,icon:'🌫️',weak:'Игни'},
    shield:false,contract:{zone:1,target:'Туманник',gold:22,xp:12},
    equipment:{weapon:{name:'Old weapon',type:'weapon',bonus:7},armor:{name:'Old armor',type:'armor',bonus:3}},
    bag:[{name:'Old reward',type:'armor',bonus:5}],log:['Old story']};
}
test('new game requires a class and cannot start combat or spend money before selection',()=>{
  const {game,data,api}=setup();assert.equal(game.state.classId,null);assert.equal(game.state.zone,data.CITY_ZONE);
  game.action('buy');game.action('leaveCity');game.chooseZone(0);game.action('explore');
  assert.equal(game.state.gold,18);assert.equal(game.state.enemy,null);assert.equal(game.state.zone,4);
  assert.ok(api.valid(game.state));assert.equal(game.selectClass('invalid'),false);
  assert.equal(game.selectClass('constructor'),false);
});
test('three classes have distinct health, mana, weapons and abilities',()=>{
  const observed=[];
  for(const classId of ['warrior','archer','mage']){
    const {game,data,api}=setup({classId});const c=data.classes[classId];
    assert.equal(game.state.hp,c.hp);assert.equal(game.state.mana,c.mana);
    assert.equal(game.state.equipment.weapon.classId,classId);assert.ok(api.valid(game.state));
    assert.equal(game.selectClass('mage'),false);observed.push(game.state.maxMana);
    game.reset();assert.equal(game.state.classId,null);assert.equal(game.state.zone,4);
  }
  assert.deepEqual(observed,[6,9,18]);
});
test('selected class and mana survive page reload',()=>{
  const {game,api,storage}=setup({classId:'mage'});game.state.mana=7;game.action('buy');
  const next=api.create({storage});assert.equal(next.state.classId,'mage');assert.equal(next.state.mana,7);
  assert.equal(next.state.potions,3);assert.equal(next.state.gold,8);
});
test('city is safe and travel never restores health or mana for free',()=>{
  const {game}=setup({classId:'warrior'});game.action('explore');assert.equal(game.state.enemy,null);
  game.action('leaveCity');game.state.hp=17;game.state.mana=1;game.action('enterCity');
  assert.equal(game.state.zone,4);assert.equal(game.state.hp,17);assert.equal(game.state.mana,1);assert.equal(game.state.gold,18);
});
test('city contract leads outside, pays once and grants a level',()=>{
  const {game,storage,api}=setup({classId:'warrior'});game.action('accept');
  assert.equal(game.state.zone,4);assert.equal(game.state.contract.zone,0);game.action('track');assert.equal(game.state.enemy,null);
  const next=api.create({storage,random:()=>0.5});next.action('travelContract');next.action('track');
  while(next.state.enemy)next.action('hit');
  assert.equal(next.state.contractsCompleted,1);assert.equal(next.state.contract,null);assert.equal(next.state.gold,37);
  assert.equal(next.state.level,2);assert.equal(next.state.hp,60);assert.equal(next.state.mana,7);
  assert.equal(next.state.lastResult.gold,19);const gold=next.state.gold;next.action('hit');assert.equal(next.state.gold,gold);
});
test('warrior guard blocks the next attack and insufficient mana prevents a skill turn',()=>{
  const {game}=setup({classId:'warrior'});game.action('leaveCity');game.action('explore');
  const hp=game.state.hp;game.action('guard');assert.equal(game.state.hp,hp);assert.equal(game.state.mana,4);
  game.action('skill');assert.equal(game.state.mana,1);assert.equal(game.state.enemy.hp,3);
  const enemyHp=game.state.enemy.hp,heroHp=game.state.hp;game.action('skill');
  assert.equal(game.state.enemy.hp,enemyHp);assert.equal(game.state.hp,heroHp);
  game.action('hit');assert.equal(game.state.enemy,null);assert.equal(game.state.mana,2);
});
test('archer double shot defeats the starter goblin in one turn',()=>{
  const {game}=setup({classId:'archer'});game.action('leaveCity');game.action('explore');game.action('skill');
  assert.equal(game.state.enemy,null);assert.equal(game.state.mana,4);assert.equal(game.state.hp,38);
});
test('mage fire spell exploits fire weakness and spends mana',()=>{
  function cast(id){
    const {game}=setup({classId:'mage'});game.state.level=2;game.chooseZone(1);
    game.state.enemy={id,hp:id==='spider'?25:28};const before=game.state.enemy.hp;
    game.action('skill');assert.equal(game.state.mana,14);return before-game.state.enemy.hp;
  }
  assert.equal(cast('spider')-cast('wisp'),4);
});
test('combat locks travel, rest, purchases, equipment and class changes',()=>{
  const {game,data}=setup({classId:'warrior'});game.state.bag.push(data.makeItem('sword-1'));game.action('leaveCity');game.action('explore');
  game.action('enterCity');game.action('rest');game.action('buy');game.action('buyMana');game.equip(0);game.selectClass('archer');
  assert.equal(game.state.zone,0);assert.equal(game.state.gold,18);assert.equal(game.state.classId,'warrior');
  assert.equal(game.state.equipment.weapon.id,'sword-0');assert.equal(game.state.bag.length,1);
});
test('class weapon restrictions apply and swapping equipment keeps the previous piece',()=>{
  const {game,data}=setup({classId:'warrior'});game.state.bag.push(data.makeItem('bow-1'),data.makeItem('sword-1'));
  assert.equal(game.equip(0),false);assert.equal(game.state.equipment.weapon.id,'sword-0');
  assert.equal(game.equip(1),true);assert.equal(game.state.equipment.weapon.id,'sword-1');assert.equal(game.strength(),10);
  assert.equal(game.state.bag[1].id,'sword-0');
});
test('health and mana potions do not get wasted at full capacity and consume combat turns',()=>{
  const {game}=setup({classId:'mage'});game.action('potion');game.action('manaPotion');
  assert.equal(game.state.potions,2);assert.equal(game.state.manaPotions,1);
  game.action('leaveCity');game.action('explore');game.action('skill');
  const hp=game.state.hp;game.action('manaPotion');
  assert.equal(game.state.mana,18);assert.equal(game.state.manaPotions,0);assert.ok(game.state.hp<hp);
  game.action('potion');assert.equal(game.state.potions,1);assert.ok(game.state.hp<game.state.maxHp);
});
test('rest and both potion purchases cost the displayed amounts',()=>{
  const {game}=setup({classId:'warrior'});game.state.hp=10;game.state.mana=0;game.state.gold=40;
  game.action('rest');assert.equal(game.state.hp,50);assert.equal(game.state.mana,6);assert.equal(game.state.gold,35);
  game.action('buy');game.action('buyMana');assert.equal(game.state.gold,13);assert.equal(game.state.potions,3);assert.equal(game.state.manaPotions,2);
});
test('death returns to the city and keeps an unfinished contract',()=>{
  const {game}=setup({classId:'warrior'});game.action('accept');game.action('leaveCity');game.action('track');game.state.hp=1;game.action('hit');
  assert.equal(game.state.enemy,null);assert.equal(game.state.zone,4);assert.equal(game.state.gold,12);
  assert.equal(game.state.hp,30);assert.equal(game.state.mana,6);assert.ok(game.state.contract);
});
test('every displayed probability has the same inclusive/exclusive threshold as the actual roll',()=>{
  const {api,data}=setup();
  for(const [id,enemy] of Object.entries(data.enemies)){
    assert.ok(enemy.drops.length);
    for(const drop of enemy.drops){
      assert.ok(drop.chance>0&&drop.chance<=1);assert.equal(data.materials[drop.itemId].type,'material');assert.equal(data.items[drop.itemId],undefined);assert.ok(Number.isInteger(drop.quantity)&&drop.quantity>0);
      assert.ok(api.rollDrops(id,()=>drop.chance-0.000001).some(value=>value.itemId===drop.itemId),id+': just below '+drop.chance);
      assert.equal(api.rollDrops(id,()=>drop.chance).some(value=>value.itemId===drop.itemId),false,id+': exact boundary');
    }
  }
});
test('independent rolls can award every listed item or no items',()=>{
  const {api,data}=setup();
  for(const [id,e] of Object.entries(data.enemies)){
    assert.equal(api.rollDrops(id,()=>0).length,e.drops.length);
    assert.equal(api.rollDrops(id,()=>0.9999).length,0);
  }
});
test('victory grants ingredients with exact quantities and never grants equipment or potions',()=>{
  let roll=0.9;const {game,storage,api}=setup({classId:'warrior',random:()=>roll});
  game.action('leaveCity');game.action('explore');assert.equal(game.state.enemy.id,'goblin');roll=0;
  while(game.state.enemy)game.action('hit');
  assert.equal(game.state.bag.length,0);assert.equal(game.state.manaPotions,1);assert.equal(game.state.potions,2);
  assert.equal(game.state.materials.iron,2);assert.equal(game.state.materials.wood,1);assert.equal(game.state.materials.rune,1);
  assert.equal(game.state.lastResult.drops.length,3);assert.equal(api.create({storage}).state.materials.iron,2);
});
test('level gates remain in force and prevent tracking from another region',()=>{
  const {game}=setup({classId:'warrior'});game.chooseZone(1);assert.equal(game.state.zone,4);
  game.action('accept');game.state.level=2;game.chooseZone(1);game.action('track');assert.equal(game.state.enemy,null);
  game.chooseZone(0);game.action('track');assert.ok(game.state.enemy);
});
test('new save round trip preserves class, mana, battle and drop result metadata',()=>{
  const {game,api}=setup({classId:'archer'});game.action('leaveCity');game.action('explore');game.action('hit');
  const other=api.create({storage:memoryStorage()});other.importSave(game.exportSave());
  assert.equal(other.state.classId,'archer');assert.equal(other.state.enemy.hp,game.state.enemy.hp);
  assert.equal(other.state.mana,game.state.mana);assert.ok(api.valid(other.state));
  const before=other.exportSave();assert.throws(()=>other.importSave('{"hp":-1}'));assert.equal(other.exportSave(),before);
  const future=JSON.parse(game.exportSave());future.version=99;assert.throws(()=>other.importSave(JSON.stringify(future)));
  assert.equal(other.exportSave(),before);
});
test('legacy saves preserve progress and await class selection; class choice preserves damage ratio',()=>{
  const {api,storage,data}=setup();storage.setItem(api.LEGACY_KEY,JSON.stringify(legacySave()));
  storage.setItem(api.KEY,'');const next=api.create({storage});
  assert.equal(next.state.classId,null);assert.equal(next.state.level,3);assert.equal(next.state.gold,85);
  assert.equal(next.state.enemy.id,'wisp');assert.equal(next.state.enemy.hp,19);assert.equal(next.state.contract.targetId,'wisp');
  assert.equal(next.state.bag[0].bonus,5);assert.equal(next.state.equipment.weapon.bonus,7);
  next.selectClass('mage');assert.equal(next.state.maxHp,40);assert.equal(next.state.hp,27);
  assert.equal(next.state.maxMana,24);assert.equal(next.state.mana,16);assert.equal(data.zones[1].name,'Туманное болото');
  assert.ok(api.valid(next.state));assert.ok(storage.getItem(api.LEGACY_KEY));
});
test('malformed save recovery and blocked storage keep the class picker usable',()=>{
  const storage=memoryStorage();storage.setItem('heroes-path-rpg-v4','{broken');
  const {game,api}=setup({storage});assert.equal(game.state.classId,null);assert.ok(api.valid(game.state));
  const {game:blocked}=setup({storage:{getItem(){throw Error('Blocked');},setItem(){throw Error('Blocked');}}});
  assert.equal(blocked.storageAvailable,false);assert.equal(blocked.selectClass('mage'),true);
});
test('all ten pages have valid references, mana indicators and no previous world text',()=>{
  for(const page of pages){
    const html=read(page+'.html');assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
    for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g))assert.ok(fs.existsSync(path.join(root,match[1])));
    for(const id of ['classSelection','classCards','classIntro','gameContent','mainNav','heroName','heroAvatar','manaText','manaBar','manaPotionsText'])assert.ok(html.includes('id="'+id+'"'));
    assert.doesNotMatch(html,/Ведьмак|ведьмач|Оксенфурт|Скеллиге|Игни|Квен|Ласточка|энерги/i);
  }
});
function renderPage(page,{classId,enemy,configure}={}){
  const {context,storage,api,game,data}=setup({classId});
  if(enemy){game.action('leaveCity');game.action('explore');}
  if(configure){configure(game.state,data);storage.setItem(api.KEY,JSON.stringify(game.state));}
  const html=read(page+'.html'),nodes=new Map(),handlers={};
  for(const match of html.matchAll(/id="([^"]+)"/g))nodes.set(match[1],{style:{},addEventListener(){}});
  context.document={getElementById:id=>nodes.get(id)||null,querySelectorAll:()=>[],addEventListener:(type,fn)=>{handlers[type]=fn;},body:{dataset:{page}}};
  context.window.addEventListener=()=>{};context.window.location={};
  vm.runInContext(read('assets/js/app.js'),context);
  return {nodes,context,handlers,storage,api,data};
}
test('class picker is the initial screen on any page and accepts each of the three choices',()=>{
  for(const page of pages){
    const {nodes}=renderPage(page);assert.equal(nodes.get('classSelection').hidden,false);assert.equal(nodes.get('gameContent').hidden,true);
    for(const id of ['warrior','archer','mage'])assert.ok(nodes.get('classCards').innerHTML.includes('data-class="'+id+'"'));
  }
  for(const id of ['warrior','archer','mage']){
    const {handlers,storage,api,context}=renderPage('index');
    const button={disabled:false,dataset:{class:id}};handlers.click({target:{closest:()=>button}});
    assert.equal(api.create({storage}).state.classId,id);assert.equal(context.window.location.href,'city.html');
  }
});
test('chosen classes render every page; combat uses the same drop probabilities as GameData',()=>{
  for(const classId of ['warrior','archer','mage']){
    for(const page of pages){
      const {nodes}=renderPage(page,{classId});
      assert.equal(nodes.get('classSelection').hidden,true);assert.equal(nodes.get('gameContent').hidden,false);
      assert.match(nodes.get('heroNote').textContent,/Светоград/);
      assert.ok(nodes.get('manaText').textContent.includes(' / '));
    }
    const {nodes,data}=renderPage('battle',{classId,enemy:true});
    const html=nodes.get('gameActions').innerHTML;
    assert.ok(html.includes(data.classes[classId].skill));
    for(const drop of data.enemies.goblin.drops){
      assert.ok(html.includes('data-drop="'+drop.itemId+'" data-chance="'+drop.chance+'"'));
      assert.ok(html.includes(String(drop.chance*100)+' %'));
    }
  }
});
function fillRecipe(game,recipe){
  game.state.materials={...recipe.ingredients};game.state.gold=recipe.gold;
  game.state.level=Math.max(game.state.level,recipe.level);
}
test('every recipe is reachable using ingredients available at its required level',()=>{
  const {data}=setup();
  for(const recipe of Object.values(data.recipes)){
    assert.ok(data.guilds[recipe.guildId]);assert.ok(['weapon','armor'].includes(data.items[recipe.itemId].type));
    for(const [id,count] of Object.entries(recipe.ingredients)){
      assert.ok(data.materials[id]);assert.ok(Number.isInteger(count)&&count>0);
      assert.ok(data.zones.some(zone=>zone.min<=recipe.level&&zone.enemies.some(enemyId=>data.enemies[enemyId].drops.some(drop=>drop.itemId===id))),id);
    }
  }
});
test('all twelve recipes create the intended item and consume exactly their listed ingredients and fee',()=>{
  const {data}=setup();assert.equal(Object.keys(data.recipes).length,12);
  for(const [recipeId,recipe] of Object.entries(data.recipes)){
    const classId=data.items[recipe.itemId].classId;
    const {game,api}=setup({classId:classId==='all'?'mage':classId});
    fillRecipe(game,recipe);game.state.materials.leather=(game.state.materials.leather||0)+7;game.state.gold+=9;
    const before={...game.state.materials};assert.equal(game.craftStatus(recipeId).ok,true);
    assert.equal(game.craft(recipeId),true);assert.equal(game.state.gold,9);assert.equal(game.state.crafted,1);
    assert.equal(game.state.bag[0].id,recipe.itemId);
    for(const [id,count] of Object.entries(before))assert.equal(game.state.materials[id],count-(recipe.ingredients[id]||0));
    assert.ok(api.valid(game.state));
  }
});
test('missing ingredients or coins never consume any resources',()=>{
  const {game,data}=setup({classId:'warrior'}),recipe=data.recipes['forge-sword-1'];
  fillRecipe(game,recipe);game.state.materials.fang--;
  let before=game.exportSave();assert.equal(game.craft('forge-sword-1'),false);assert.equal(game.exportSave(),before);
  game.state.materials.fang++;game.state.gold--;before=game.exportSave();
  assert.equal(game.craftStatus('forge-sword-1').reason,'Не хватает монет');
  assert.equal(game.craft('forge-sword-1'),false);assert.equal(game.exportSave(),before);
});
test('crafting requires city access, a chosen class, sufficient level and the matching weapon class',()=>{
  const {game,data}=setup({classId:'warrior'});fillRecipe(game,data.recipes['make-bow-1']);
  let before=game.exportSave();assert.equal(game.craft('make-bow-1'),false);assert.equal(game.exportSave(),before);
  fillRecipe(game,data.recipes['forge-sword-2']);game.state.level=1;before=game.exportSave();
  assert.equal(game.craft('forge-sword-2'),false);assert.equal(game.exportSave(),before);
  fillRecipe(game,data.recipes['forge-sword-1']);game.action('leaveCity');before=game.exportSave();
  assert.equal(game.craft('forge-sword-1'),false);assert.equal(game.exportSave(),before);
  game.action('explore');before=game.exportSave();assert.equal(game.craft('forge-sword-1'),false);assert.equal(game.exportSave(),before);
  const {game:pending}=setup();assert.equal(pending.craft('forge-sword-1'),false);
  assert.equal(pending.craft('constructor'),false);
});
test('a repeated craft with spent ingredients cannot duplicate an item; the new item can be equipped',()=>{
  const {game,data,storage,api}=setup({classId:'warrior'});fillRecipe(game,data.recipes['forge-sword-1']);
  assert.equal(game.craft('forge-sword-1'),true);assert.equal(game.craft('forge-sword-1'),false);
  assert.equal(game.state.bag.length,1);assert.equal(game.state.gold,0);
  const loaded=api.create({storage});assert.equal(loaded.state.crafted,1);assert.equal(loaded.state.materials.iron,0);
  const before=loaded.strength();assert.equal(loaded.equip(0),true);assert.equal(loaded.strength(),before+2);
});
test('version 4 saves keep class, equipment and combat while adding the ingredient store',()=>{
  const {game,data,api,storage}=setup({classId:'mage'});
  const old=JSON.parse(game.exportSave()).state;
  old.schemaVersion=4;delete old.materials;delete old.crafted;old.bag=[data.makeItem('staff-1')];
  old.zone=0;old.enemy={id:'goblin',hp:12};old.gold=91;old.mana=8;
  old.lastResult={enemyId:'wolf',gold:6,xp:9,drops:['bow-1']};
  storage.setItem(api.KEY,JSON.stringify(old));const loaded=api.create({storage});
  assert.equal(loaded.state.schemaVersion,5);assert.equal(loaded.state.classId,'mage');
  assert.equal(loaded.state.bag[0].id,'staff-1');assert.equal(loaded.state.enemy.hp,12);
  assert.equal(loaded.state.gold,91);assert.equal(loaded.state.mana,8);
  assert.equal(Object.keys(loaded.state.materials).length,0);assert.equal(loaded.state.crafted,0);
  assert.equal(loaded.state.lastResult,null);assert.ok(api.valid(loaded.state));
});
test('ingredient quantities and created items survive export, import and reload',()=>{
  const {game,data,api}=setup({classId:'archer'});fillRecipe(game,data.recipes['make-bow-1']);
  game.state.materials.crystal=5;game.craft('make-bow-1');
  const storage=memoryStorage(),other=api.create({storage});other.importSave(game.exportSave());
  assert.equal(other.state.bag[0].id,'bow-1');assert.equal(other.state.materials.crystal,5);
  assert.equal(api.create({storage}).state.crafted,1);
  const bad=JSON.parse(other.exportSave());bad.state.materials.iron=-1;const before=other.exportSave();
  assert.throws(()=>other.importSave(JSON.stringify(bad)));assert.equal(other.exportSave(),before);
  bad.state.materials.iron=1.5;assert.throws(()=>other.importSave(JSON.stringify(bad)));
  delete bad.state.materials.iron;bad.state.materials.unknown=1;assert.throws(()=>other.importSave(JSON.stringify(bad)));
});
test('a complete hunt-to-craft route creates a sword without any direct equipment drop',()=>{
  let random=0;const {game,storage,api}=setup({classId:'warrior',random:()=>random});
  game.action('leaveCity');
  for(const id of ['goblin','goblin','wolf','wolf']){
    random=id==='goblin'?0.9:0;game.action('explore');assert.equal(game.state.enemy.id,id);random=0;
    while(game.state.enemy)game.action('hit');
    assert.equal(game.state.bag.length,0);
  }
  assert.equal(game.state.materials.iron,4);assert.equal(game.state.materials.fang,2);
  game.action('enterCity');const gold=game.state.gold;
  assert.equal(game.craft('forge-sword-1'),true);assert.equal(game.state.gold,gold-8);
  assert.equal(game.state.materials.iron,0);assert.equal(game.state.materials.fang,0);assert.equal(game.state.materials.wood,2);
  assert.equal(api.create({storage}).state.bag[0].id,'sword-1');
});
test('guild UI shows materials, source enemies and a working Create button',()=>{
  const {nodes,handlers,storage,api}=renderPage('guilds',{classId:'warrior',configure:(state,data)=>{
    state.materials={...data.recipes['forge-sword-1'].ingredients};state.gold=8;
  }});
  assert.ok(nodes.get('guildList').innerHTML.includes('Гильдия кузнецов'));
  assert.ok(nodes.get('guildList').innerHTML.includes('Гильдия следопытов'));
  assert.ok(nodes.get('guildList').innerHTML.includes('Круг чародеев'));
  assert.ok(nodes.get('guildList').innerHTML.includes('Лесной волк'));
  assert.ok(nodes.get('guildList').innerHTML.includes('Гоблин-разбойник'));
  assert.match(nodes.get('guildList').innerHTML,/data-recipe="forge-sword-1" >⚒️ Создать/);
  handlers.click({target:{closest:()=>({disabled:false,dataset:{recipe:'forge-sword-1'}})}});
  const next=api.create({storage});assert.equal(next.state.bag[0].id,'sword-1');assert.equal(next.state.materials.fang,0);
  assert.match(nodes.get('feedback').textContent,/Создано: Железный меч/);
  assert.match(nodes.get('guildList').innerHTML,/data-recipe="forge-sword-1" disabled/);
});
test('city provides guild entrances; outside the city all recipes stay locked',()=>{
  const {nodes:city}=renderPage('city',{classId:'warrior'});
  for(const id of ['smiths','rangers','arcanists'])assert.ok(city.get('cityGuilds').innerHTML.includes('guilds.html#guild-'+id));
  const {nodes}=renderPage('guilds',{classId:'warrior',configure:state=>{state.zone=0;}});
  assert.match(nodes.get('guildLocation').innerHTML,/только в городе/);
  assert.match(nodes.get('guildList').innerHTML,/data-recipe="forge-sword-1" disabled>Вернись в Светоград/);
});
