'use strict';
window.GameData = (() => {
  const classes = {
    warrior: {
      name:'Воин', icon:'⚔️', description:'Крепкий боец с мечом. Переносит больше ударов и прикрывается щитом.',
      hp:50, mana:6, attack:6, defense:2, hpGrowth:10, manaGrowth:1, attackGrowth:2,
      weapon:'sword-0', basic:'Удар мечом', skill:'Сокрушение', skillCost:3,
      skillDescription:'Мощный удар: атака + 6 + уровень.', guard:'Блок щитом', guardCost:2
    },
    archer: {
      name:'Лучник', icon:'🏹', description:'Охотник с луком. Наносит два удара за один ход и уклоняется от атаки.',
      hp:38, mana:9, attack:6, defense:1, hpGrowth:7, manaGrowth:2, attackGrowth:2,
      weapon:'bow-0', basic:'Выстрел', skill:'Двойной выстрел', skillCost:5,
      skillDescription:'Два выстрела по противнику за один ход.', guard:'Уклонение', guardCost:3
    },
    mage: {
      name:'Маг', icon:'🔮', description:'Заклинатель с посохом. Большой запас маны, огонь и магический барьер.',
      hp:30, mana:18, attack:3, defense:0, hpGrowth:5, manaGrowth:3, attackGrowth:1,
      weapon:'staff-0', basic:'Удар посохом', skill:'Огненный шар', skillCost:4,
      skillDescription:'Огненный урон растёт с уровнем. Противники с уязвимостью к огню получают +4 урона.',
      guard:'Магический барьер', guardCost:4
    }
  };
  const items = {
    'sword-0':{name:'Учебный меч',type:'weapon',bonus:2,classId:'warrior'},
    'sword-1':{name:'Железный меч',type:'weapon',bonus:4,classId:'warrior'},
    'sword-2':{name:'Меч хранителя',type:'weapon',bonus:7,classId:'warrior'},
    'sword-3':{name:'Клинок северной стали',type:'weapon',bonus:10,classId:'warrior'},
    'bow-0':{name:'Охотничий лук',type:'weapon',bonus:3,classId:'archer'},
    'bow-1':{name:'Лук следопыта',type:'weapon',bonus:4,classId:'archer'},
    'bow-2':{name:'Лук ветров',type:'weapon',bonus:7,classId:'archer'},
    'bow-3':{name:'Лук ледяного сокола',type:'weapon',bonus:10,classId:'archer'},
    'staff-0':{name:'Посох ученика',type:'weapon',bonus:2,classId:'mage'},
    'staff-1':{name:'Посох искр',type:'weapon',bonus:4,classId:'mage'},
    'staff-2':{name:'Посох древних рун',type:'weapon',bonus:7,classId:'mage'},
    'staff-3':{name:'Посох полярной звезды',type:'weapon',bonus:10,classId:'mage'},
    'armor-0':{name:'Дорожная одежда',type:'armor',bonus:1,classId:'all'},
    'armor-1':{name:'Кожаный доспех',type:'armor',bonus:3,classId:'all'},
    'armor-2':{name:'Доспех стража',type:'armor',bonus:5,classId:'all'},
    'armor-3':{name:'Доспех северного хранителя',type:'armor',bonus:8,classId:'all'},
    'health-potion':{name:'Зелье лечения',type:'potion',effect:'health'},
    'mana-potion':{name:'Зелье маны',type:'potion',effect:'mana'},
    'legacy-weapon':{name:'Трофейное оружие',type:'weapon',bonus:0,classId:'all'},
    'legacy-armor':{name:'Трофейный доспех',type:'armor',bonus:0,classId:'all'}
  };
  // Independent probability per defeated enemy. No hidden class or level multiplier.
  const enemies = {
    wolf:{name:'Лесной волк',icon:'🐺',hp:15,attack:4,xp:9,gold:6,weakness:null,
      drops:[{itemId:'armor-1',chance:0.25},{itemId:'bow-1',chance:0.08},{itemId:'health-potion',chance:0.30}]},
    goblin:{name:'Гоблин-разбойник',icon:'👺',hp:18,attack:5,xp:11,gold:7,weakness:null,
      drops:[{itemId:'sword-1',chance:0.18},{itemId:'bow-1',chance:0.15},{itemId:'staff-1',chance:0.12},{itemId:'mana-potion',chance:0.25}]},
    spider:{name:'Болотный паук',icon:'🕷️',hp:25,attack:7,xp:15,gold:9,weakness:'fire',
      drops:[{itemId:'armor-2',chance:0.18},{itemId:'bow-2',chance:0.10},{itemId:'health-potion',chance:0.35}]},
    wisp:{name:'Блуждающий огонёк',icon:'👻',hp:28,attack:7,xp:17,gold:10,weakness:null,
      drops:[{itemId:'staff-2',chance:0.16},{itemId:'sword-2',chance:0.10},{itemId:'mana-potion',chance:0.40}]},
    raider:{name:'Разбойник крепости',icon:'🗡️',hp:38,attack:9,xp:24,gold:14,weakness:null,
      drops:[{itemId:'sword-2',chance:0.25},{itemId:'bow-2',chance:0.20},{itemId:'armor-2',chance:0.25},{itemId:'health-potion',chance:0.30}]},
    guardian:{name:'Каменный страж',icon:'🗿',hp:42,attack:10,xp:27,gold:16,weakness:null,
      drops:[{itemId:'staff-2',chance:0.25},{itemId:'armor-3',chance:0.12},{itemId:'mana-potion',chance:0.35}]},
    harpy:{name:'Снежная гарпия',icon:'🦅',hp:52,attack:12,xp:34,gold:20,weakness:'fire',
      drops:[{itemId:'bow-3',chance:0.15},{itemId:'staff-3',chance:0.10},{itemId:'health-potion',chance:0.40}]},
    giant:{name:'Ледяной великан',icon:'❄️',hp:65,attack:14,xp:42,gold:25,weakness:'fire',
      drops:[{itemId:'sword-3',chance:0.18},{itemId:'armor-3',chance:0.22},{itemId:'staff-3',chance:0.12},{itemId:'mana-potion',chance:0.40}]}
  };
  const zones = [
    {name:'Изумрудный лес',icon:'🌳',min:1,description:'Тропы за городскими воротами. Между деревьями рыщут волки и гоблины.',enemies:['wolf','goblin']},
    {name:'Туманное болото',icon:'🌫️',min:2,description:'Над водой плывут огоньки, а в камышах прячутся ядовитые твари.',enemies:['spider','wisp']},
    {name:'Забытая крепость',icon:'🏚️',min:4,description:'Разбойники делят древние руины с каменными стражами.',enemies:['raider','guardian']},
    {name:'Ледяные вершины',icon:'⛰️',min:6,description:'Последний рубеж дороги: холод, гарпии и могучие великаны.',enemies:['harpy','giant']},
    {name:'Светоград',icon:'🏰',min:1,kind:'city',description:'Твой путь начинается на городской площади. Здесь ждут таверна, лавка алхимика и первые контракты.',enemies:[]}
  ];
  const CITY_ZONE=4;
  const makeItem=(id,bonus)=>({id,...items[id],...(bonus===undefined?{}:{bonus})});
  return {classes,items,enemies,zones,CITY_ZONE,makeItem};
})();
