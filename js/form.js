const SWATCH_COLORS = [
  '#c8503a','#2a6b6b','#7a5c2a','#3a3a6e',
  '#5a2a2a','#2a5a3a','#4a3a7a','#3a5a2a',
];

let _audioBase64 = null;
let _duration    = 0;
let _coverBase64 = null;
let _color       = SWATCH_COLORS[0];

document.addEventListener('DOMContentLoaded', () => {
  initPlayerBar();
  _initSwatches();
  _initDropZone();
  _initCoverUpload();
  _initFields();
  _populateCollectionSelects();

  document.getElementById('btn-cancel').addEventListener('click', () => history.back());
  document.getElementById('btn-save').addEventListener('click', _save);
  document.getElementById('btn-upload-another').addEventListener('click', () => location.reload());
});


function _initSwatches() {
  const container = document.getElementById('color-swatches');
  SWATCH_COLORS.forEach(color => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'color-swatch' + (color === _color ? ' color-swatch--active' : '');
    btn.style.background = color;
    btn.dataset.color = color;
    btn.addEventListener('click', () => _setColor(color));
    container.appendChild(btn);
  });
  document.getElementById('f-color').addEventListener('input', function () {
    _setColor(this.value);
  });
}

function _setColor(color) {
  _color = color;
  document.querySelectorAll('.color-swatch').forEach(b =>
    b.classList.toggle('color-swatch--active', b.dataset.color === color)
  );
  document.getElementById('f-color').value = color;
}


function _initDropZone() {
  const zone      = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) _handleFile(fileInput.files[0]);
  });

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drop-zone--over');
  });
  zone.addEventListener('dragleave', e => {
    if (!zone.contains(e.relatedTarget)) zone.classList.remove('drop-zone--over');
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drop-zone--over');
    const file = e.dataTransfer.files[0];
    if (file && _isAudio(file)) _handleFile(file);
    else _showZoneError('Нужен аудиофайл: MP3, WAV, OGG или FLAC');
  });
}

function _isAudio(file) {
  return file.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|aac|m4a)$/i.test(file.name);
}

function _handleFile(file) {
  const nameNoExt = file.name.replace(/\.[^.]+$/, '');
  const parts = nameNoExt.split(/\s*[-–—]\s*/);
  if (parts.length >= 2) {
    _setField('f-artist', parts[0].trim());
    _setField('f-title',  parts.slice(1).join(' — ').trim());
  } else {
    _setField('f-title', nameNoExt.trim());
  }
  _updateCounters();

  _showProgress();

  const reader = new FileReader();

  reader.onprogress = e => {
    if (e.lengthComputable) _setProgress(e.loaded / e.total);
  };

  reader.onerror = () => _showZoneError('Ошибка чтения файла');

  reader.onload = e => {
    _setProgress(1);
    _audioBase64 = e.target.result;

    const tmp = new Audio(_audioBase64);
    tmp.addEventListener('loadedmetadata', () => {
      _duration = Math.round(tmp.duration) || 0;
    });

    setTimeout(_showAnalyzing, 200);
  };

  reader.readAsDataURL(file);
}

function _showProgress() {
  document.getElementById('upload-progress').hidden  = false;
  document.getElementById('upload-analyzing').hidden = true;
  _setProgress(0);
}

function _setProgress(ratio) {
  const pct  = Math.round(ratio * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent  = pct + '%';
  const msgs = ['Читаем файл…', 'Декодируем…', 'Почти готово…'];
  document.getElementById('progress-text').textContent = msgs[ratio < 0.4 ? 0 : ratio < 0.8 ? 1 : 2];
}

function _showAnalyzing() {
  document.getElementById('upload-progress').hidden  = true;
  document.getElementById('upload-analyzing').hidden = false;
  setTimeout(_goToStep2, 1200);
}

function _showZoneError(msg) {
  const zone = document.getElementById('drop-zone');
  const sub  = zone.querySelector('.drop-zone__sub');
  zone.classList.add('drop-zone--error');
  if (sub) sub.textContent = msg;
  setTimeout(() => {
    zone.classList.remove('drop-zone--error');
    if (sub) sub.textContent = 'или нажми, чтобы выбрать файл';
  }, 3000);
}


function _goToStep2() {
  document.getElementById('step-1').hidden = true;
  document.getElementById('step-2').hidden = false;
  _setStepActive(2);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function _goToStep3(title) {
  document.getElementById('step-2').hidden = true;
  document.getElementById('step-3').hidden = false;
  _setStepActive(3);

  document.getElementById('success-title').textContent = '«' + title + '» опубликован!';

  const plId  = document.getElementById('f-playlist').value;
  const albId = document.getElementById('f-album').value;
  const parts = [];
  if (plId)  parts.push('плейлист');
  if (albId) parts.push('альбом');
  document.getElementById('success-sub').textContent = parts.length
    ? 'Добавлен в ' + parts.join(' и ') + '.'
    : 'Трек добавлен в библиотеку.';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function _setStepActive(n) {
  [1, 2, 3].forEach(i => {
    const el = document.getElementById('step-dot-' + i);
    if (!el) return;
    el.classList.toggle('upload-step--active', i === n);
    el.classList.toggle('upload-step--done',   i < n);
  });
}


function _initCoverUpload() {
  const area  = document.getElementById('cover-upload');
  const input = document.getElementById('cover-input');
  area.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    if (!input.files[0]) return;
    const r = new FileReader();
    r.onload = e => {
      _coverBase64 = e.target.result;
      const img = document.getElementById('cover-preview-img');
      img.src    = _coverBase64;
      img.hidden = false;
      document.getElementById('cover-placeholder').hidden = true;
    };
    r.readAsDataURL(input.files[0]);
  });
}


function _initFields() {
  document.getElementById('f-title').addEventListener('input', _updateCounters);
  document.getElementById('f-desc').addEventListener('input',  _updateCounters);
}

function _updateCounters() {
  document.getElementById('title-len').textContent = document.getElementById('f-title').value.length;
  document.getElementById('desc-len').textContent  = document.getElementById('f-desc').value.length;
}

function _setField(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}


function _populateCollectionSelects() {
  const plSel  = document.getElementById('f-playlist');
  const albSel = document.getElementById('f-album');

  getPlaylists().forEach(pl => {
    const opt = document.createElement('option');
    opt.value       = pl.id;
    opt.textContent = pl.name;
    plSel.appendChild(opt);
  });

  getAlbums().forEach(alb => {
    const opt = document.createElement('option');
    opt.value       = alb.id;
    opt.textContent = alb.name + ' (' + alb.year + ')';
    albSel.appendChild(opt);
  });
}


function _save() {
  const title  = document.getElementById('f-title').value.trim();
  const artist = document.getElementById('f-artist').value.trim();
  const genre  = document.getElementById('f-genre').value;

  if (!title)       { _fieldError('f-title',  'Введи название');    return; }
  if (!artist)      { _fieldError('f-artist', 'Введи исполнителя'); return; }
  if (!genre)       { _fieldError('f-genre',  'Выбери жанр');        return; }
  if (!_audioBase64){ alert('Файл ещё читается, подожди секунду.');  return; }

  const saveBtn = document.getElementById('btn-save');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span>Сохраняем…</span>';

  const id = generateId();

  saveTrackMedia(id, _audioBase64, _coverBase64)
    .then(() => {
      const track = {
        id,
        title,
        artist,
        genre,
        duration:    _duration || 0,
        color:       _color,
        liked:       false,
        plays:       0,
        playHistory: [],
        desc:        document.getElementById('f-desc').value.trim(),
        year:        parseInt(document.getElementById('f-year').value) || null,
        addedAt:     new Date().toISOString(),
      };

      const tracks = getData();
      tracks.unshift(track);
      saveData(tracks);

      const plId  = document.getElementById('f-playlist').value;
      const albId = document.getElementById('f-album').value;
      if (plId)  addTrackToPlaylist(plId,  id);
      if (albId) addTrackToAlbum(albId, id);

      _goToStep3(title);
    })
    .catch(err => {
      console.error('IndexedDB save error:', err);
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg><span>Опубликовать</span>';
      alert('Ошибка сохранения: ' + err.message);
    });
}

function _fieldError(id, msg) {
  const el = document.getElementById(id);
  el.classList.add('ufield__input--error');
  el.placeholder = msg;
  el.addEventListener('focus', () => el.classList.remove('ufield__input--error'), { once: true });
}
