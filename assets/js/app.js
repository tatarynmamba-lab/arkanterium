/* Общая навигация для всех страниц. */
(() => {
  'use strict';
  const toggle = document.querySelector('.menu');
  const nav = document.querySelector('#navigation');
  const setMenu = open => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('header')) setMenu(false);
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.getElementById('year').textContent = new Date().getFullYear();
  if (location.protocol === 'file:' && !['index', 'login', 'chats', 'files'].includes(document.body.dataset.page)) {
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'Быстрый просмотр из файла. Для общего хранения данных между страницами запустите сайт по инструкции README.txt.';
    document.getElementById('main').prepend(hint);
  }
})();
