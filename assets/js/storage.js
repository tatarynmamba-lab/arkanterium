/* Хранение локальных данных. Сервер и сторонние библиотеки не требуются. */
(() => {
  'use strict';
  const app = window.Arkanterium = {};
  const keys = { notes: 'arkanterium.notes.v2', profile: 'arkanterium.profile.v2' };

  app.getProfile = () => {
    const raw = localStorage.getItem(keys.profile);
    if (raw === null) return { name: '', business: '', about: '' };
    const data = JSON.parse(raw);
    if (!data || ['name', 'business', 'about'].some(key => typeof data[key] !== 'string')) {
      throw new Error('Повреждены данные профиля. Сохранение отключено, чтобы не перезаписать их.');
    }
    return data;
  };

  app.saveProfile = profile => localStorage.setItem(keys.profile, JSON.stringify(profile));

  app.getNotes = () => {
    const raw = localStorage.getItem(keys.notes);
    if (raw === null) {
      // Подхватываем заметку первой версии, если адрес сайта не изменился.
      const legacy = localStorage.getItem('arkanterium.note');
      return legacy ? [{ id: 'first-version-note', title: 'Заметка из первой версии', text: legacy, updatedAt: new Date().toISOString() }] : [];
    }
    const notes = JSON.parse(raw);
    if (!Array.isArray(notes) || notes.some(note => !note ||
      ['id', 'title', 'text', 'updatedAt'].some(key => typeof note[key] !== 'string')) ||
      new Set(notes.map(note => note.id)).size !== notes.length) {
      throw new Error('Не удалось прочитать заметки. Сохранение отключено, чтобы не перезаписать их.');
    }
    return notes;
  };

  app.saveNotes = notes => localStorage.setItem(keys.notes, JSON.stringify(notes));
  app.newId = () => window.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
  app.status = (id, text, isError = false) => {
    const element = document.getElementById(id);
    element.textContent = text;
    element.classList.toggle('error', isError);
  };
  app.download = (name, contents, type = 'text/plain;charset=utf-8') => {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
})();
