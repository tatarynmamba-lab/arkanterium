'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname,'..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
function memoryStorage() {
  const map=new Map();
  return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
}
function setup(storage=memoryStorage(),random=()=>0.5) {
  const context=vm.createContext({window:{localStorage:storage},console});
  vm.runInContext(read('assets/js/data.js'),context);
  vm.runInContext(read('assets/js/engine.js'),context);
  return {context,storage,api:context.window.GameEngine,game:context.window.GameEngine.create({storage,random})};
}
test('a new hero and a reset spawn on the safe city square',()=>{
  const {game,context,api}=setup();
  const city=context.window.GameData.CITY_ZONE;
  assert.equal(game.state.zone,city);assert.equal(game.state.enemy,null);
  assert.equal(context.window.GameData.zones[city].kind,'city');
  assert.ok(api.valid(game.state));
  game.action('leaveCity');game.action('accept');game.reset();
  assert.equal(game.state.zone,city);assert.equal(game.state.contract,null);
  assert.equal(game.state.gold,18);assert.equal(game.state.hp,35);
});
test('exploration cannot spawn a monster inside the city',()=>{
  const {game}=setup();const hp=game.state.hp,gold=game.state.gold;
  game.action('explore');game.action('hit');
  assert.equal(game.state.zone,4);assert.equal(game.state.enemy,null);
  assert.equal(game.state.hp,hp);assert.equal(game.state.gold,gold);
});
test('city contracts point outside and do not change location until departure',()=>{
  const {game}=setup();game.action('accept');
  assert.equal(game.state.zone,4);assert.equal(game.state.contract.zone,0);
  assert.equal(game.state.contract.gold,12);assert.equal(game.state.contract.xp,7);
  game.action('track');assert.equal(game.state.enemy,null);
  game.action('travelContract');assert.equal(game.state.zone,0);
  game.action('track');assert.ok(game.state.enemy);
});
test('return to the city costs nothing and never grants automatic healing',()=>{
  const {game}=setup();game.action('leaveCity');game.state.hp=13;game.state.energy=1;
  game.action('enterCity');assert.equal(game.state.zone,4);
  assert.equal(game.state.hp,13);assert.equal(game.state.energy,1);assert.equal(game.state.gold,18);
  game.action('rest');assert.equal(game.state.hp,35);assert.equal(game.state.gold,13);
});
test('a legacy save retains battle, contract and original region indices',()=>{
  const {game,storage,api,context}=setup();
  const legacy=JSON.parse(game.exportSave()).state;
  legacy.level=6;legacy.gold=127;legacy.zone=3;
  const monster=context.window.GameData.zones[3].enemies[0];
  legacy.enemy={...monster,hp:30,maxHp:monster.hp};
  legacy.contract={zone:3,target:monster.name,gold:42,xp:22};
  storage.setItem(api.KEY,JSON.stringify(legacy));
  const loaded=api.create({storage});
  assert.equal(loaded.state.zone,3);assert.equal(loaded.state.enemy.hp,30);
  assert.equal(loaded.state.contract.zone,3);assert.equal(loaded.state.gold,127);
  assert.equal(context.window.GameData.zones[3].name,'Скеллиге');
});
test('a contract survives a page change and pays out exactly once',()=>{
  const {game,storage,api}=setup();
  game.action('accept');const target=game.state.contract.target;
  const next=api.create({storage,random:()=>0.5});
  assert.equal(next.state.contract.target,target);
  next.action('leaveCity');next.action('track');
  const battle=api.create({storage,random:()=>0.5});
  assert.equal(battle.state.enemy.name,target);
  while(battle.state.enemy) battle.action('hit');
  assert.equal(battle.state.contractsCompleted,1);
  assert.equal(battle.state.contract,null);
  assert.equal(battle.state.kills,1);
  assert.equal(battle.state.gold,37);
  assert.equal(battle.state.level,2);
  assert.equal(battle.state.hp,battle.state.maxHp);
  const gold=battle.state.gold;battle.action('hit');assert.equal(battle.state.gold,gold);
});
test('Quen blocks the counterattack and Igni spends two energy',()=>{
  const {game}=setup();game.action('leaveCity');game.action('explore');
  const hp=game.state.hp;game.action('quen');
  assert.equal(game.state.hp,hp);assert.equal(game.state.energy,1);
  const enemyHp=game.state.enemy.hp;game.action('igni');
  assert.equal(game.state.enemy.hp,enemyHp);
  game.action('hit');assert.equal(game.state.energy,2);
  game.action('igni');assert.equal(game.state.enemy,null);
});
test('fight locks travel, equipment changes, rest and shop',()=>{
  const {game}=setup();game.state.level=6;
  game.state.bag.push({name:'Test sword',type:'weapon',bonus:10});
  game.action('leaveCity');game.action('explore');const gold=game.state.gold;
  game.chooseZone(1);game.action('enterCity');game.equip(0);game.action('rest');game.action('buy');
  assert.equal(game.state.zone,0);assert.equal(game.state.equipment.weapon.bonus,2);
  assert.equal(game.state.gold,gold);assert.equal(game.state.bag.length,1);
});
test('zone level gates and contract tracking in the wrong zone',()=>{
  const {game}=setup();game.chooseZone(1);assert.equal(game.state.zone,4);
  game.action('accept');game.state.level=2;game.chooseZone(1);game.action('track');
  assert.equal(game.state.enemy,null);assert.equal(game.state.contract.zone,0);
  game.chooseZone(0);game.action('track');assert.ok(game.state.enemy);
});
test('equipment swap returns the old piece to the bag',()=>{
  const {game}=setup();game.state.bag.push({name:'Improved sword',type:'weapon',bonus:4});
  game.equip(0);assert.equal(game.strength(),9);
  assert.equal(game.state.bag[0].bonus,2);assert.equal(game.state.bag.length,1);
});
test('potions heal, cost a turn, and cannot be spent at full health',()=>{
  const {game}=setup();game.action('potion');assert.equal(game.state.potions,2);
  game.action('leaveCity');game.action('explore');game.action('hit');game.action('potion');
  assert.equal(game.state.potions,1);assert.ok(game.state.hp<game.state.maxHp);
});
test('death clears combat, deducts crowns and keeps the contract',()=>{
  const {game}=setup();game.action('accept');game.action('leaveCity');game.action('track');
  game.state.hp=1;game.state.energy=0;game.action('hit');
  assert.equal(game.state.enemy,null);assert.equal(game.state.gold,12);
  assert.equal(game.state.hp,21);assert.equal(game.state.energy,3);
  assert.ok(game.state.contract);assert.equal(game.state.zone,4);
});
test('rest and potion buying deduct the stated amount',()=>{
  const {game}=setup();game.state.hp=5;game.state.energy=0;
  game.action('rest');assert.equal(game.state.hp,35);assert.equal(game.state.gold,13);
  game.action('buy');assert.equal(game.state.gold,3);assert.equal(game.state.potions,3);
  game.action('buy');assert.equal(game.state.potions,3);
});
test('export and import preserve combat; invalid import leaves progress intact',()=>{
  const {game,api}=setup();game.action('leaveCity');game.action('explore');game.action('hit');
  const raw=game.exportSave();const other=api.create({storage:memoryStorage()});
  other.importSave(raw);assert.equal(other.state.enemy.hp,game.state.enemy.hp);
  const before=other.exportSave();assert.throws(()=>other.importSave('{"hp":-1}'));
  assert.equal(other.exportSave(),before);
  const future=JSON.parse(raw);future.version=9;
  assert.throws(()=>other.importSave(JSON.stringify(future)));assert.equal(other.exportSave(),before);
});
test('malformed stored JSON recovers without crashing',()=>{
  const storage=memoryStorage();storage.setItem('witcher-hunters-path-fan-v2','{bad');
  const {game,api}=setup(storage);assert.equal(game.state.level,1);assert.ok(api.valid(game.state));
  const invalid=JSON.parse(game.exportSave()).state;invalid.zone=999;
  storage.setItem(api.KEY,JSON.stringify(invalid));
  const recovered=api.create({storage});assert.equal(recovered.state.zone,4);
});
test('blocked storage permits play and exposes a warning state',()=>{
  const {game}=setup({getItem(){throw Error('Blocked');},setItem(){throw Error('Blocked');}});
  assert.equal(game.storageAvailable,false);game.action('leaveCity');game.action('explore');assert.ok(game.state.enemy);
});
test('all nine pages have valid navigation and local asset references',()=>{
  const pages=['index','city','hero','map','battle','contracts','inventory','tavern','journal'];
  for(const page of pages) {
    const html=read(`${page}.html`);
    assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
    for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      assert.ok(fs.existsSync(path.join(root,match[1])),`${page}: ${match[1]}`);
    }
    for(const id of ['heroLevel','hpText','hpBar','energyText','energyBar','xpText','xpBar','attackText','defenseText','goldText','potionsText','heroNote','feedback','storageWarning','reset'])assert.ok(html.includes(`id="${id}"`),`${page}: missing ${id}`);
    assert.ok(html.includes('name="viewport"'));
  }
});
test('page rendering initializes without missing elements on every page',()=>{
  for(const page of ['index','city','hero','map','battle','contracts','inventory','tavern','journal']) {
    const {context,storage,api}=setup();
    // Minimal DOM harness verifies conditional render targets; this is not a browser layout test.
    const html=read(`${page}.html`);const nodes=new Map();
    for(const match of html.matchAll(/id="([^"]+)"/g))nodes.set(match[1],{style:{},addEventListener(){}});
    context.document={getElementById:id=>nodes.get(id)||null,querySelectorAll:()=>[],addEventListener(){},body:{dataset:{page}}};
    context.window.addEventListener=()=>{};
    vm.runInContext(read('assets/js/app.js'),context);
    assert.match(nodes.get('heroLevel').textContent,/Уровень 1/);
    assert.equal(nodes.get('storageWarning').hidden,true);
    assert.ok(nodes.get('feedback').textContent.length);
    assert.match(nodes.get('heroNote').textContent,/Оксенфурт/);
    if(page==='city'){assert.equal(nodes.get('cityServices').hidden,false);assert.match(nodes.get('cityWelcome').innerHTML,/Ты здесь/);}
    if(page==='battle'){assert.match(nodes.get('gameActions').innerHTML,/Выйти на охоту/);assert.doesNotMatch(nodes.get('gameActions').innerHTML,/data-action="explore"/);}
    const fresh=api.create({storage,random:()=>0.5});fresh.action('accept');fresh.action('leaveCity');fresh.action('track');
    vm.runInContext(read('assets/js/app.js'),context);
    assert.equal(nodes.get('battleLink').hidden,false);
    if(page==='battle')assert.match(nodes.get('gameActions').innerHTML,/Быстрый удар/);
    if(page==='city'){assert.equal(nodes.get('cityServices').hidden,true);assert.match(nodes.get('cityWelcome').innerHTML,/Сначала закончи бой/);}
  }
});
