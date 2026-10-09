(() => {
  'use strict';
  const app = window.Arkanterium;
  const form = document.getElementById('profile-form');
  const fields = ['name', 'business', 'about'];
  const display = data => {
    document.getElementById('profile-name').textContent = data.name || 'Ваше имя';
    document.getElementById('profile-business').textContent = data.business || 'Ваш бизнес';
    document.getElementById('profile-about').textContent = data.about;
    document.getElementById('avatar').textContent = Array.from(data.name.trim())[0]?.toUpperCase() || 'А';
  };
  try {
    const data = app.getProfile();
    fields.forEach(key => { document.getElementById(key).value = data[key]; });
    display(data);
  } catch {
    app.status('profile-status', 'Профиль недоступен: данные повреждены или браузер запретил хранение. Запустите сайт через локальный сервер (README.txt).', true);
    form.querySelector('button').disabled = true;
    return;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(fields.map(key => [key, document.getElementById(key).value.trim()]));
    if (!data.name) { app.status('profile-status', 'Введите имя.', true); return; }
    try {
      app.saveProfile(data);
      display(data);
      app.status('profile-status', 'Профиль сохранён в этом браузере.');
    } catch {
      app.status('profile-status', 'Не удалось сохранить. Браузер запретил хранение или закончилось свободное место.', true);
    }
  });
})();
