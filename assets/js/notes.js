(() => {
  'use strict';
  const app = window.Arkanterium;
  const form = document.getElementById('note-form');
  const title = document.getElementById('note-title');
  const text = document.getElementById('note-text');
  const list = document.getElementById('notes-list');
  const exportButton = document.getElementById('export-notes');
  let notes = [], editing = null, dirty = false;
  try { notes = app.getNotes(); }
  catch {
    app.status('note-status', 'Заметки недоступны: данные повреждены или браузер запретил хранение. Исходные данные не изменены.', true);
    form.querySelector('button[type="submit"]').disabled = true;
    exportButton.disabled = true;
    return;
  }
  const mayDiscard = () => !dirty || confirm('В редакторе есть несохранённые изменения. Продолжить без сохранения?');
  const resetEditor = () => {
    editing = null;
    form.reset();
    dirty = false;
    document.getElementById('editor-heading').textContent = 'Новая заметка';
  };
  const edit = note => {
    if (!mayDiscard()) return;
    editing = note.id;
    title.value = note.title;
    text.value = note.text;
    dirty = false;
    document.getElementById('editor-heading').textContent = 'Редактирование заметки';
    app.status('note-status', '');
    title.focus();
  };
  const save = next => {
    try { app.saveNotes(next); notes = next; return true; }
    catch {
      app.status('note-status', 'Не удалось сохранить. Текст остался в редакторе. Скопируйте его или освободите место в браузере.', true);
      return false;
    }
  };
  const render = () => {
    list.replaceChildren();
    document.getElementById('note-count').textContent = notes.length;
    exportButton.disabled = notes.length === 0;
    if (!notes.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Здесь появится ваша первая заметка.';
      list.append(empty);
    }
    [...notes].reverse().forEach(note => {
      const item = document.createElement('article');
      item.className = 'item';
      const heading = document.createElement('h3');
      heading.textContent = note.title;
      const preview = document.createElement('p');
      preview.textContent = note.text.slice(0, 250) + (note.text.length > 250 ? '…' : '');
      const date = document.createElement('small');
      const timestamp = new Date(note.updatedAt);
      date.textContent = Number.isNaN(timestamp.getTime()) ? '' : timestamp.toLocaleString('ru-RU');
      const toolbar = document.createElement('div');
      toolbar.className = 'toolbar';
      const editButton = document.createElement('button');
      editButton.className = 'secondary';
      editButton.textContent = 'Редактировать';
      editButton.setAttribute('aria-label', 'Редактировать: ' + note.title);
      editButton.addEventListener('click', () => edit(note));
      const deleteButton = document.createElement('button');
      deleteButton.className = 'secondary danger';
      deleteButton.textContent = 'Удалить';
      deleteButton.setAttribute('aria-label', 'Удалить: ' + note.title);
      deleteButton.addEventListener('click', () => {
        if (editing === note.id && !mayDiscard()) return;
        if (!confirm('Удалить заметку «' + note.title + '»?')) return;
        if (save(notes.filter(entry => entry.id !== note.id))) {
          if (editing === note.id) resetEditor();
          render();
          app.status('note-status', 'Заметка удалена.');
        }
      });
      toolbar.append(editButton, deleteButton);
      item.append(heading, preview, date, toolbar);
      list.append(item);
    });
  };
  form.addEventListener('input', () => { dirty = true; });
  window.addEventListener('beforeunload', event => {
    if (dirty) { event.preventDefault(); event.returnValue = ''; }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!title.value.trim() || !text.value.trim()) {
      app.status('note-status', 'Добавьте заголовок и текст заметки.', true);
      return;
    }
    const record = { id: editing || app.newId(), title: title.value.trim(), text: text.value.trim(), updatedAt: new Date().toISOString() };
    const next = editing ? notes.map(note => note.id === editing ? record : note) : [...notes, record];
    if (save(next)) {
      resetEditor(); render();
      app.status('note-status', 'Заметка сохранена в этом браузере.');
    }
  });
  document.getElementById('new-note').addEventListener('click', () => {
    if (mayDiscard()) { resetEditor(); app.status('note-status', ''); title.focus(); }
  });
  exportButton.addEventListener('click', () => {
    const content = notes.map(note => note.title + '\n' + '—'.repeat(30) + '\n' + note.text + '\n').join('\n\n');
    app.download('arkanterium-notes.txt', '\uFEFF' + content);
  });
  render();
  const requested = new URLSearchParams(location.search).get('note');
  const found = notes.find(note => note.id === requested);
  if (found) edit(found);
})();
