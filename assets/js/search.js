(() => {
  'use strict';
  const app = window.Arkanterium;
  const input = document.getElementById('query');
  const results = document.getElementById('search-results');
  const sections = [
    ['index.html', 'Главная', 'Обзор рабочего пространства и возможностей'],
    ['profile.html', 'Профиль', 'Имя, бизнес и личная информация'],
    ['chats.html', 'Чаты', 'Демонстрационный помощник по сайту'],
    ['notes.html', 'Заметки', 'Идеи, планы и задачи'],
    ['files.html', 'Файлы', 'Выбор документов и изображений'],
    ['login.html', 'Вход', 'Статус регистрации и аккаунтов']
  ].map(([href, title, text]) => ({ href, title, text, type: 'Раздел' }));
  input.value = new URLSearchParams(location.search).get('q') || '';
  const render = () => {
    const query = input.value.trim().toLocaleLowerCase('ru-RU');
    let notes = [], storageError = false;
    try {
      notes = app.getNotes().map(note => ({ href: 'notes.html?note=' + encodeURIComponent(note.id), title: note.title, text: note.text, type: 'Заметка' }));
    } catch { storageError = true; }
    const matches = [...sections, ...notes].filter(entry => (entry.title + ' ' + entry.text).toLocaleLowerCase('ru-RU').includes(query));
    results.replaceChildren();
    for (const match of matches) {
      const link = document.createElement('a');
      link.className = 'item search-link';
      link.href = match.href;
      const kind = document.createElement('small');
      kind.textContent = match.type;
      const title = document.createElement('h3');
      title.textContent = match.title + ' →';
      const text = document.createElement('p');
      text.textContent = match.text.slice(0, 160) + (match.text.length > 160 ? '…' : '');
      link.append(kind, title, text);
      results.append(link);
    }
    app.status('search-status', (matches.length ? 'Найдено: ' + matches.length : 'Ничего не найдено. Попробуйте другое слово.') + (storageError ? ' Заметки недоступны; поиск выполнен только по разделам.' : ''));
  };
  input.addEventListener('input', render);
  document.getElementById('search-form').addEventListener('submit', event => {
    event.preventDefault(); render();
    const url = new URL(location.href);
    if (input.value.trim()) url.searchParams.set('q', input.value.trim());
    else url.searchParams.delete('q');
    try { history.replaceState(null, '', url); } catch { /* file:// может ограничивать History API. */ }
  });
  render();
})();
