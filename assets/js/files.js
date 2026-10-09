(() => {
  'use strict';
  const input = document.getElementById('file-input');
  const list = document.getElementById('file-list');
  const clear = document.getElementById('clear-files');
  let files = [];
  const size = value => value < 1024 ? value + ' Б' : value < 1048576 ? (value / 1024).toFixed(1) + ' КБ' : (value / 1048576).toFixed(1) + ' МБ';
  const render = () => {
    list.replaceChildren();
    clear.disabled = files.length === 0;
    document.getElementById('file-total').textContent = files.length ? 'Выбрано: ' + files.length + ' · ' + size(files.reduce((sum, file) => sum + file.size, 0)) : 'Файлы ещё не выбраны';
    files.forEach((file, index) => {
      const row = document.createElement('div');
      row.className = 'item file-row';
      const details = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = file.name;
      const meta = document.createElement('p');
      meta.textContent = size(file.size);
      details.append(name, meta);
      const remove = document.createElement('button');
      remove.className = 'secondary';
      remove.textContent = 'Убрать';
      remove.setAttribute('aria-label', 'Убрать ' + file.name);
      remove.addEventListener('click', () => { files.splice(index, 1); render(); });
      row.append(details, remove);
      list.append(row);
    });
  };
  input.addEventListener('change', () => {
    for (const file of input.files) {
      if (!files.some(existing => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified)) files.push(file);
    }
    input.value = '';
    render();
    window.Arkanterium.status('file-status', 'Список обновлён. Файлы остались на вашем устройстве.');
  });
  clear.addEventListener('click', () => { files = []; render(); window.Arkanterium.status('file-status', 'Список очищен.'); });
})();
