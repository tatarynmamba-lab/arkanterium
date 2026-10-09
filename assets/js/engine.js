'use strict';
window.GameEngine = (() => {
  const KEY='heroes-path-rpg-v4';
  const LEGACY_KEY='witcher-hunters-path-fan-v2'; // Read-only migration from the previous prototype.
  const {classes,items,enemies,zones,CITY_ZONE,makeItem}=window.GameData;
  const known=(obj,key)=>typeof key==='string'&&Object.hasOwn(obj,key);
  const integer=(v,min=0,max=100000000)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
  const text=v=>typeof v==='string'&&v.length>0&&v.length<1500;
  const clone=v=>JSON.parse(JSON.stringify(v));
  const fresh=()=>({
    schemaVersion:4,classId:null,level:1,xp:0,maxHp:1,hp:1,maxMana:0,mana:0,attack:0,defense:0,
    gold:18,potions:2,manaPotions:1,kills:0,contractsCompleted:0,zone:CITY_ZONE,enemy:null,
    shield:false,contract:null,equipment:{weapon:null,armor:null},bag:[],migration:null,lastResult:null,
    log:['🏰 Добро пожаловать в Светоград. Выбери класс, чтобы начать свою историю.']
  });
  function validItem(it,type) {
    return !!it&&known(items,it.id)&&['weapon','armor'].includes(items[it.id].type)&&
      it.type===items[it.id].type&&(!type||it.type===type)&&integer(it.bonus)&&text(it.name)&&
      it.classId===items[it.id].classId&&
      (it.id.startsWith('legacy-')||it.bonus===items[it.id].bonus);
  }
  function valid(s) {
    if(!s||s.schemaVersion!==4||!(s.classId===null||known(classes,s.classId)))return false;
    for(const key of ['xp','attack','defense','gold','potions','manaPotions','kills','contractsCompleted'])if(!integer(s[key]))return false;
    if(!integer(s.level,1,100000)||!integer(s.maxHp,1)||!integer(s.hp,1,s.maxHp)||!integer(s.maxMana,0)||!integer(s.mana,0,s.maxMana))return false;
    if(!integer(s.zone,0,zones.length-1)||s.level<zones[s.zone].min||typeof s.shield!=='boolean')return false;
    if(!s.equipment)return false;
    for(const type of ['weapon','armor']){
      const it=s.equipment[type];
      if(s.classId===null&&it===null)continue;
      if(!validItem(it,type)||s.classId&&it.classId!=='all'&&it.classId!==s.classId)return false;
    }
    if(!Array.isArray(s.bag)||s.bag.length>5000||!s.bag.every(it=>validItem(it)))return false;
    if(!Array.isArray(s.log)||s.log.length>18||!s.log.every(text))return false;
    if(s.enemy!==null&&(!s.enemy||!known(enemies,s.enemy.id)||!zones[s.zone].enemies.includes(s.enemy.id)||!integer(s.enemy.hp,1,enemies[s.enemy.id].hp)))return false;
    if(s.contract!==null){
      const c=s.contract;
      if(!c||!integer(c.zone,0,zones.length-1)||!zones[c.zone].enemies.includes(c.targetId)||!integer(c.gold)||!integer(c.xp))return false;
    }
    if(s.migration!==null&&(!s.migration||!['hpRatio','manaRatio'].every(k=>Number.isFinite(s.migration[k])&&s.migration[k]>=0&&s.migration[k]<=1)))return false;
    if(s.lastResult!==null){
      const r=s.lastResult;
      if(!r||!known(enemies,r.enemyId)||!integer(r.gold)||!integer(r.xp)||!Array.isArray(r.drops)||r.drops.length>10||!r.drops.every(id=>known(items,id)))return false;
    }
    return true;
  }
  const legacyNames=[
    ['Утопец','Гуль'],['Полуденница','Туманник'],['Накер','Водяная баба'],['Сирена','Ледяной тролль'],[]
  ];
  function migrate(old) {
    if(!old||!integer(old.level,1,100000)||!integer(old.zone,0,4)||old.level<zones[old.zone].min)throw Error('Некорректное сохранение.');
    for(const k of ['xp','attack','defense','gold','potions','kills','contractsCompleted'])if(!integer(old[k]))throw Error('Некорректное сохранение.');
    if(!integer(old.maxHp,1)||!integer(old.hp,1,old.maxHp)||!integer(old.maxEnergy,1)||!integer(old.energy,0,old.maxEnergy))throw Error('Некорректное сохранение.');
    const convertItem=(it,type)=>{
      if(!it||!['weapon','armor'].includes(it.type)||(type&&it.type!==type)||!integer(it.bonus))throw Error('Некорректное снаряжение.');
      return makeItem('legacy-'+it.type,it.bonus);
    };
    if(!old.equipment||!Array.isArray(old.bag)||old.bag.length>5000)throw Error('Некорректное снаряжение.');
    const game=fresh();
    for(const k of ['level','xp','attack','defense','gold','potions','kills','contractsCompleted','zone','hp','maxHp'])game[k]=old[k];
    game.mana=old.energy;game.maxMana=old.maxEnergy;
    game.equipment={weapon:convertItem(old.equipment.weapon,'weapon'),armor:convertItem(old.equipment.armor,'armor')};
    game.bag=old.bag.map(it=>convertItem(it));
    game.migration={hpRatio:old.hp/old.maxHp,manaRatio:old.energy/old.maxEnergy};
    if(old.enemy){
      const index=legacyNames[old.zone].indexOf(old.enemy.name);
      const id=zones[old.zone].enemies[index];
      if(!id||!integer(old.enemy.hp,1,enemies[id].hp))throw Error('Некорректный противник.');
      game.enemy={id,hp:old.enemy.hp};
    }
    if(old.contract){
      const c=old.contract;
      if(!integer(c.zone,0,3)||!integer(c.gold)||!integer(c.xp))throw Error('Некорректный контракт.');
      const id=zones[c.zone].enemies[legacyNames[c.zone].indexOf(c.target)];
      if(!id)throw Error('Некорректный контракт.');
      game.contract={zone:c.zone,targetId:id,gold:c.gold,xp:c.xp};
    }
    game.log=['📖 Прогресс перенесён в новый мир: уровень, монеты, предметы и задания сохранены. Выбери класс.'];
    if(!valid(game))throw Error('Не удалось перенести сохранение.');
    return game;
  }
  function parseSave(raw) {
    const parsed=JSON.parse(raw);
    let state=parsed;
    if(parsed&&Object.hasOwn(parsed,'format')){
      if(!['heroes-path-save','hunters-path-save'].includes(parsed.format)||parsed.version!==1)throw Error('Неподдерживаемая версия сохранения.');
      state=parsed.state;
    }
    if(state&&state.schemaVersion===4){
      if(!valid(state))throw Error('Некорректное сохранение.');
      return clone(state);
    }
    return migrate(state);
  }
  function rollDrops(enemyId,random=Math.random) {
    if(!known(enemies,enemyId))return [];
    return enemies[enemyId].drops.filter(drop=>random()<drop.chance).map(drop=>drop.itemId);
  }
  function create({storage,random=Math.random}={}) {
    let storageAvailable=true;
    if(storage===undefined){try{storage=window.localStorage;}catch{storage=null;}}
    let game=fresh();
    try{
      const current=storage&&storage.getItem(KEY);
      const legacy=!current&&storage&&storage.getItem(LEGACY_KEY);
      if(current||legacy)game=parseSave(current||legacy);
    }catch{game.log.unshift('Сохранение повреждено или недоступно. Можно загрузить резервную копию в журнале.');}
    const listeners=[];
    const rnd=(a,b)=>Math.floor(random()*(b-a+1))+a;
    const note=message=>{game.log.unshift(message);game.log=game.log.slice(0,18);};
    const heroClass=()=>classes[game.classId]||null;
    const xpNeed=()=>16+(game.level-1)*11;
    const strength=()=>game.attack+(game.equipment.weapon?game.equipment.weapon.bonus:0);
    const armor=()=>game.defense+(game.equipment.armor?game.equipment.armor.bonus:0);
    function commit(){
      try{if(!storage)throw Error();storage.setItem(KEY,JSON.stringify(game));storageAvailable=true;}catch{storageAvailable=false;}
      listeners.forEach(fn=>fn());
    }
    function selectClass(id){
      if(game.classId!==null||!known(classes,id))return false;
      const c=classes[id],level=game.level-1;
      game.classId=id;game.maxHp=c.hp+level*c.hpGrowth;game.maxMana=c.mana+level*c.manaGrowth;
      game.attack=c.attack+level*c.attackGrowth;game.defense=c.defense;
      game.hp=game.migration?Math.max(1,Math.round(game.maxHp*game.migration.hpRatio)):game.maxHp;
      game.mana=game.migration?Math.round(game.maxMana*game.migration.manaRatio):game.maxMana;
      if(!game.equipment.weapon)game.equipment.weapon=makeItem(c.weapon);
      if(!game.equipment.armor)game.equipment.armor=makeItem('armor-0');
      game.migration=null;
      note(c.icon+' Твой класс: '+c.name+'. Приготовься к приключению.');commit();return true;
    }
    function chooseZone(index){
      if(!game.classId||game.enemy||!integer(index,0,zones.length-1)||game.level<zones[index].min)return false;
      game.zone=index;game.lastResult=null;
      note(index===CITY_ZONE?'🏰 Ты вернулся на площадь Светограда.':'🗺️ Ты прибыл в '+zones[index].name+'.');commit();return true;
    }
    function equip(index){
      if(!game.classId||game.enemy)return false;
      const it=game.bag[index];if(!it)return false;
      if(it.classId!=='all'&&it.classId!==game.classId){note('Этот предмет предназначен для класса «'+classes[it.classId].name+'».');commit();return false;}
      game.bag.splice(index,1);game.bag.push(game.equipment[it.type]);game.equipment[it.type]=it;
      note('✨ Надето: '+it.name+'.');commit();return true;
    }
    function levelUp(){
      const c=heroClass();
      while(game.xp>=xpNeed()){
        game.xp-=xpNeed();game.level++;game.maxHp+=c.hpGrowth;game.maxMana+=c.manaGrowth;game.attack+=c.attackGrowth;
        game.hp=game.maxHp;game.mana=game.maxMana;
        note('⭐ Уровень '+game.level+'! Здоровье и мана восстановлены.');
      }
    }
    function win(){
      const id=game.enemy.id,e=enemies[id];
      let gold=e.gold,xp=e.xp;game.kills++;
      if(game.contract&&game.contract.zone===game.zone&&game.contract.targetId===id){
        gold+=game.contract.gold;xp+=game.contract.xp;game.contractsCompleted++;game.contract=null;
        note('📜 Контракт выполнен. Награда начислена.');
      }
      game.gold+=gold;game.xp+=xp;
      const drops=rollDrops(id,random);
      for(const itemId of drops){
        const it=items[itemId];
        if(it.type==='potion'){if(it.effect==='health')game.potions++;else game.manaPotions++;}
        else game.bag.push(makeItem(itemId));
        note('🎁 Добыча: '+it.name+'.');
      }
      game.lastResult={enemyId:id,gold,xp,drops};game.enemy=null;game.shield=false;
      note('🏆 '+e.name+' побеждён. +'+xp+' опыта, +'+gold+' монет.');levelUp();
    }
    function enemyTurn(){
      if(!game.enemy)return;
      const e=enemies[game.enemy.id];
      if(game.shield){game.shield=false;note('🛡️ '+heroClass().guard+' поглотил атаку.');return;}
      const damage=Math.max(1,rnd(e.attack-2,e.attack+2)-armor());
      game.hp=Math.max(0,game.hp-damage);note('💢 '+e.name+' наносит '+damage+' урона.');
      if(game.hp===0){
        const lost=Math.min(6,game.gold);game.gold-=lost;game.hp=Math.max(1,Math.floor(game.maxHp*0.6));game.mana=game.maxMana;
        game.enemy=null;game.shield=false;game.zone=CITY_ZONE;game.lastResult=null;
        note('☠️ Поражение. Потеряно '+lost+' монет. Ты очнулся в таверне Светограда.');
      }
    }
    function startFight(id){
      game.enemy={id,hp:enemies[id].hp};game.shield=false;game.lastResult=null;
      note('⚔️ Тебе преграждает путь: '+enemies[id].name+'.');
    }
    function action(name){
      if(!game.classId)return;
      const c=heroClass();
      if(name==='enterCity')return chooseZone(CITY_ZONE);
      if(name==='leaveCity'){if(game.zone!==CITY_ZONE)return false;return chooseZone(game.contract?game.contract.zone:0);}
      if(name==='travelContract'){if(!game.contract)return false;return chooseZone(game.contract.zone);}
      if(name==='explore'){
        if(game.enemy)return;
        const ids=zones[game.zone].enemies;
        if(!ids.length){note('🏰 В городе безопасно. Для охоты выйди за ворота.');return commit();}
        startFight(ids[rnd(0,ids.length-1)]);
      }else if(['hit','skill','guard'].includes(name)){
        if(!game.enemy)return;
        let damage=0;
        if(name==='hit'){
          damage=Math.max(1,rnd(strength()-2,strength()+2));game.mana=Math.min(game.maxMana,game.mana+1);
          note(c.icon+' '+c.basic+': '+damage+' урона, +1 мана.');
        }else if(name==='skill'){
          if(game.mana<c.skillCost)return;
          game.mana-=c.skillCost;
          if(game.classId==='warrior')damage=strength()+6+game.level;
          else if(game.classId==='archer')damage=Math.max(1,rnd(strength()-1,strength()+1))+Math.max(1,rnd(strength()-1,strength()+1));
          else damage=rnd(7+game.level*3,10+game.level*3)+(enemies[game.enemy.id].weakness==='fire'?4:0);
          note('✨ '+c.skill+': '+damage+' урона, −'+c.skillCost+' маны.');
        }else{
          if(game.mana<c.guardCost||game.shield)return;
          game.mana-=c.guardCost;game.shield=true;note('🛡️ '+c.guard+': следующая атака будет поглощена.');
        }
        game.enemy.hp=Math.max(0,game.enemy.hp-damage);
        if(game.enemy.hp===0)win();else enemyTurn();
      }else if(name==='potion'||name==='manaPotion'){
        const health=name==='potion';
        if(health?(game.potions<1||game.hp===game.maxHp):(game.manaPotions<1||game.mana===game.maxMana))return;
        if(health){game.potions--;const value=Math.min(20+game.level*2,game.maxHp-game.hp);game.hp+=value;note('🧪 Зелье лечения: +'+value+' здоровья.');}
        else{game.manaPotions--;const value=Math.min(8+game.level*2,game.maxMana-game.mana);game.mana+=value;note('🔷 Зелье маны: +'+value+' маны.');}
        if(game.enemy)enemyTurn();
      }else if(name==='flee'){
        if(!game.enemy)return;
        if(random()<0.8){note('🏃 Ты отступил от противника.');game.enemy=null;game.shield=false;}else{note('Не удалось отступить.');enemyTurn();}
      }else if(name==='rest'){
        if(game.enemy||game.gold<5||game.hp===game.maxHp&&game.mana===game.maxMana)return;
        game.gold-=5;game.hp=game.maxHp;game.mana=game.maxMana;game.shield=false;note('🍺 Отдых восстановил здоровье и ману.');
      }else if(name==='buy'||name==='buyMana'){
        const cost=name==='buy'?10:12;if(game.enemy||game.gold<cost)return;
        game.gold-=cost;if(name==='buy')game.potions++;else game.manaPotions++;
        note('🧪 Куплено '+(name==='buy'?'зелье лечения.':'зелье маны.'));
      }else if(name==='accept'){
        if(game.enemy||game.contract)return;
        const zone=game.zone===CITY_ZONE?0:game.zone,ids=zones[zone].enemies;
        game.contract={zone,targetId:ids[rnd(0,ids.length-1)],gold:12+zone*10,xp:7+zone*5};
        note('📜 Новый контракт: '+enemies[game.contract.targetId].name+'. Место: '+zones[zone].name+'.');
      }else if(name==='track'){
        if(game.enemy||!game.contract||game.contract.zone!==game.zone)return;
        startFight(game.contract.targetId);
      }else if(name==='abandon'){
        if(game.enemy||!game.contract)return;
        game.contract=null;note('📜 Контракт отменён.');
      }else return;
      commit();
    }
    function reload(){
      try{const next=JSON.parse(storage.getItem(KEY));if(valid(next)){game=next;listeners.forEach(fn=>fn());}}catch{}
    }
    commit();
    return {
      get state(){return game;},get storageAvailable(){return storageAvailable;},
      selectClass,action,chooseZone,equip,xpNeed,strength,armor,reload,
      subscribe(fn){listeners.push(fn);},
      reset(){game=fresh();commit();},
      exportSave(){return JSON.stringify({format:'heroes-path-save',version:1,state:game},null,2);},
      importSave(raw){const next=parseSave(raw);game=next;note('📖 Сохранение загружено.');commit();}
    };
  }
  return {KEY,LEGACY_KEY,create,valid,parseSave,rollDrops};
})();
