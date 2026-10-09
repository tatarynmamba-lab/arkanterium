(() => {
  'use strict';
  const log = document.getElementById('chat-log');
  const input = document.getElementById('message');
  const addMessage = (text, user = false) => {
    const message = document.createElement('div');
    message.className = 'message' + (user ? ' user' : '');
    const author = document.createElement('small');
    author.textContent = user ? 'Вы' : 'Демопомощник';
    const content = document.createElement('div');
    content.textContent = text;
    message.append(author, content);
    log.append(message);
    while (log.children.length > 60) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  };
  const answer = message => {
    const text = message.toLocaleLowerCase('ru-RU');
    if (/замет|иде[яию]/.test(text)) return 'Откройте страницу «Заметки», добавьте заголовок и текст, затем нажмите «Сохранить». Кнопка «Скачать все заметки» сохранит копию на устройство.';
    if (/файл|документ|загруз/.test(text)) return 'На странице «Файлы» нажмите «Добавить файлы». Можно выбрать несколько документов. Пока доступен только список: загрузка на сервер ещё не подключена.';
    if (/вход|регистра|парол|аккаунт/.test(text)) return 'Регистрация и вход пока не подключены. Страницы доступны без аккаунта, а заметки и профиль сохраняются только в вашем браузере.';
    if (/профил|имя|бизнес/.test(text)) return 'На странице «Профиль» укажите имя и название бизнеса, затем сохраните. Этот профиль доступен только в вашем браузере.';
    if (/поиск|найти|искать/.test(text)) return 'Перейдите в «Поиск» и введите слово из названия раздела или вашей заметки. Для общего хранения заметок между страницами запускайте сайт через локальный сервер.';
    if (/привет|здравств/.test(text)) return 'Привет! Я демонстрационный помощник Аркантериума. Подскажу, как использовать заметки, файлы, поиск и профиль.';
    return 'Пока я отвечаю на несколько вопросов по заранее заданным правилам. Спросите про заметки, файлы, профиль, поиск или вход.';
  };
  const send = message => {
    if (!message.trim()) return;
    addMessage(message.trim(), true);
    addMessage(answer(message));
    input.value = '';
  };
  document.getElementById('chat-form').addEventListener('submit', event => { event.preventDefault(); send(input.value); input.focus(); });
  document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => send(button.dataset.prompt)));
  addMessage('Добро пожаловать! Подскажу, где найти заметки, файлы и настройки профиля.');
})();
