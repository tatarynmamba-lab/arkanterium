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
  const materials = {
    leather:{name:'Мягкая кожа',icon:'🟤',type:'material'},
    fang:{name:'Звериный клык',icon:'🦷',type:'material'},
    iron:{name:'Железные осколки',icon:'⛓️',type:'material'},
    wood:{name:'Прочная древесина',icon:'🪵',type:'material'},
    rune:{name:'Рунная пыль',icon:'✨',type:'material'},
    silk:{name:'Паучий шёлк',icon:'🕸️',type:'material'},
    venom:{name:'Ядовитая железа',icon:'🧪',type:'material'},
    crystal:{name:'Кристалл духа',icon:'💎',type:'material'},
    core:{name:'Каменное ядро',icon:'🪨',type:'material'},
    feather:{name:'Морозное перо',icon:'🪶',type:'material'},
    ice:{name:'Ледяная руда',icon:'❄️',type:'material'}
  };
  const guilds = {
    smiths:{name:'Гильдия кузнецов',icon:'⚒️',description:'Мастера огня и стали. Создают мечи для воинов и доспехи для всех классов.'},
    rangers:{name:'Гильдия следопытов',icon:'🏹',description:'Мастера дерева и тетивы. Создают луки для лучников.'},
    arcanists:{name:'Круг чародеев',icon:'🔮',description:'Хранители рун и кристаллов. Создают посохи для магов.'}
  };
  const recipes = {
    'forge-sword-1':{guildId:'smiths',itemId:'sword-1',level:1,gold:8,ingredients:{iron:4,fang:2}},
    'forge-sword-2':{guildId:'smiths',itemId:'sword-2',level:4,gold:18,ingredients:{iron:8,core:1}},
    'forge-sword-3':{guildId:'smiths',itemId:'sword-3',level:6,gold:30,ingredients:{iron:12,ice:3,crystal:2}},
    'forge-armor-1':{guildId:'smiths',itemId:'armor-1',level:1,gold:6,ingredients:{leather:4,iron:2}},
    'forge-armor-2':{guildId:'smiths',itemId:'armor-2',level:2,gold:16,ingredients:{leather:6,silk:4,iron:6}},
    'forge-armor-3':{guildId:'smiths',itemId:'armor-3',level:6,gold:30,ingredients:{leather:8,core:2,ice:4}},
    'make-bow-1':{guildId:'rangers',itemId:'bow-1',level:1,gold:8,ingredients:{wood:3,leather:2}},
    'make-bow-2':{guildId:'rangers',itemId:'bow-2',level:2,gold:18,ingredients:{wood:5,silk:4,venom:2}},
    'make-bow-3':{guildId:'rangers',itemId:'bow-3',level:6,gold:30,ingredients:{wood:8,feather:4,ice:2}},
    'enchant-staff-1':{guildId:'arcanists',itemId:'staff-1',level:1,gold:8,ingredients:{wood:2,rune:3}},
    'enchant-staff-2':{guildId:'arcanists',itemId:'staff-2',level:2,gold:18,ingredients:{wood:4,rune:6,crystal:2}},
    'enchant-staff-3':{guildId:'arcanists',itemId:'staff-3',level:6,gold:30,ingredients:{wood:6,rune:8,ice:3,crystal:3}}
  };
  // Only ingredients drop. Each entry is an independent probability with a fixed quantity.
  const enemies = {
    wolf:{name:'Лесной волк',icon:'🐺',hp:15,attack:4,xp:9,gold:6,weakness:null,
      drops:[{itemId:'leather',chance:0.80,quantity:1},{itemId:'fang',chance:0.50,quantity:1}]},
    goblin:{name:'Гоблин-разбойник',icon:'👺',hp:18,attack:5,xp:11,gold:7,weakness:null,
      drops:[{itemId:'iron',chance:0.70,quantity:2},{itemId:'wood',chance:0.60,quantity:1},{itemId:'rune',chance:0.45,quantity:1}]},
    spider:{name:'Болотный паук',icon:'🕷️',hp:25,attack:7,xp:15,gold:9,weakness:'fire',
      drops:[{itemId:'silk',chance:0.80,quantity:2},{itemId:'venom',chance:0.50,quantity:1},{itemId:'leather',chance:0.25,quantity:1}]},
    wisp:{name:'Блуждающий огонёк',icon:'👻',hp:28,attack:7,xp:17,gold:10,weakness:null,
      drops:[{itemId:'rune',chance:0.85,quantity:2},{itemId:'crystal',chance:0.35,quantity:1}]},
    raider:{name:'Разбойник крепости',icon:'🗡️',hp:38,attack:9,xp:24,gold:14,weakness:null,
      drops:[{itemId:'iron',chance:0.85,quantity:3},{itemId:'wood',chance:0.75,quantity:2},{itemId:'leather',chance:0.50,quantity:2}]},
    guardian:{name:'Каменный страж',icon:'🗿',hp:42,attack:10,xp:27,gold:16,weakness:null,
      drops:[{itemId:'core',chance:0.65,quantity:1},{itemId:'iron',chance:0.75,quantity:3},{itemId:'crystal',chance:0.45,quantity:1}]},
    harpy:{name:'Снежная гарпия',icon:'🦅',hp:52,attack:12,xp:34,gold:20,weakness:'fire',
      drops:[{itemId:'feather',chance:0.70,quantity:2},{itemId:'leather',chance:0.60,quantity:2},{itemId:'crystal',chance:0.35,quantity:1}]},
    giant:{name:'Ледяной великан',icon:'❄️',hp:65,attack:14,xp:42,gold:25,weakness:'fire',
      drops:[{itemId:'ice',chance:0.80,quantity:2},{itemId:'core',chance:0.60,quantity:1},{itemId:'crystal',chance:0.60,quantity:2}]}
  };
  const zones = [
    {name:'Изумрудный лес',icon:'🌳',min:1,description:'Тропы за городскими воротами. Между деревьями рыщут волки и гоблины.',enemies:['wolf','goblin']},
    {name:'Туманное болото',icon:'🌫️',min:2,description:'Над водой плывут огоньки, а в камышах прячутся ядовитые твари.',enemies:['spider','wisp']},
    {name:'Забытая крепость',icon:'🏚️',min:4,description:'Разбойники делят древние руины с каменными стражами.',enemies:['raider','guardian']},
    {name:'Ледяные вершины',icon:'⛰️',min:6,description:'Последний рубеж дороги: холод, гарпии и могучие великаны.',enemies:['harpy','giant']},
    {name:'Светоград',icon:'🏰',min:1,kind:'city',description:'Твой путь начинается на городской площади. Здесь ждут гильдии мастеров, таверна, лавка алхимика и первые контракты.',enemies:[]}
  ];
  const CITY_ZONE=4;
  const makeItem=(id,bonus)=>({id,...items[id],...(bonus===undefined?{}:{bonus})});
  return {classes,items,materials,guilds,recipes,enemies,zones,CITY_ZONE,makeItem};
})();
