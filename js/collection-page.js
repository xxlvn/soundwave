const IS_ALBUMS = location.pathname.includes('albums.html');

const COL_SWATCH_COLORS = [
  '#c8503a','#2a6b6b','#7a5c2a','#3a3a6e',
  '#5a2a2a','#2a5a3a','#4a3a7a','#3a5a2a',
  '#7a3a3a','#3a6a5a','#5a4a8a','#8a5a2a',
];

document.addEventListener('DOMContentLoaded', () => {
  initPlayerBar();
  IS_ALBUMS ? _initAlbums() : _initPlaylists();
});

function _initPlaylists() {
  _renderPlGrid();
  document.getElementById('btn-new-pl').addEventListener('click', _createPlaylistPrompt);
  document.getElementById('btn-back-pl').addEventListener('click', _backToPlGrid);
  document.getElementById('btn-edit-pl').addEventListener('click', () => _openEditModal('pl', _currentPlId));
  document.getElementById('btn-del-pl').addEventListener('click', _deleteCurrent);
  document.getElementById('btn-add-tracks-pl').addEventListener('click', () => _openAddTrackDialog('pl'));
}

function _renderPlGrid() {
  const grid = document.getElementById('pl-grid-cards');
  const pls  = getPlaylists();
  _showView('pl-grid');

  if (!pls.length) {
    grid.innerHTML = `<div class="empty-state"><p>Плейлистов пока нет</p>
      <button class="btn btn--orange" id="empty-new-pl">+ Создать первый</button></div>`;
    document.getElementById('empty-new-pl').addEventListener('click', _createPlaylistPrompt);
    return;
  }

  grid.innerHTML = pls.map(pl => _buildCard(pl, pl.trackIds.length + ' треков')).join('');
  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => _openPlaylist(card.dataset.id));
  });
  _loadCardCovers(grid);
}

let _currentPlId = null;

function _openPlaylist(id) {
  _currentPlId = id;
  const pl = getPlaylists().find(p => p.id === id);
  if (!pl) return;
  const tracks = getPlaylistTracks(pl);

  _showView('pl-detail');
  _renderDetailHeader(pl, tracks.length, 'pl');
  _renderTrackList(document.getElementById('pl-tracks'), tracks, 'pl', id);
}

function _backToPlGrid()  { _currentPlId = null; _renderPlGrid(); }

function _createPlaylistPrompt() {
  const name = prompt('Название плейлиста:');
  if (!name?.trim()) return;
  const pl = createPlaylist(name);
  _renderPlGrid();
  showNotif('Плейлист «' + pl.name + '» создан');
}


function _initAlbums() {
  _renderAlbGrid();
  document.getElementById('btn-new-alb').addEventListener('click', _createAlbumPrompt);
  document.getElementById('btn-back-alb').addEventListener('click', _backToAlbGrid);
  document.getElementById('btn-edit-alb').addEventListener('click', () => _openEditModal('alb', _currentAlbId));
  document.getElementById('btn-del-alb').addEventListener('click', _deleteCurrent);
  document.getElementById('btn-add-tracks-alb').addEventListener('click', () => _openAddTrackDialog('alb'));
}

function _renderAlbGrid() {
  const grid = document.getElementById('alb-grid-cards');
  const albs = getAlbums();
  _showView('alb-grid');

  if (!albs.length) {
    grid.innerHTML = `<div class="empty-state"><p>Альбомов пока нет</p>
      <button class="btn btn--orange" id="empty-new-alb">+ Создать первый</button></div>`;
    document.getElementById('empty-new-alb').addEventListener('click', _createAlbumPrompt);
    return;
  }

  grid.innerHTML = albs.map(a => _buildCard(a, a.year + ' · ' + a.trackIds.length + ' треков')).join('');
  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => _openAlbum(card.dataset.id));
  });
  _loadCardCovers(grid);
}

let _currentAlbId = null;

function _openAlbum(id) {
  _currentAlbId = id;
  const alb = getAlbums().find(a => a.id === id);
  if (!alb) return;
  const tracks = getAlbumTracks(alb);

  _showView('alb-detail');
  _renderDetailHeader(alb, tracks.length, 'alb');
  _renderTrackList(document.getElementById('alb-tracks'), tracks, 'alb', id);
}

function _backToAlbGrid() { _currentAlbId = null; _renderAlbGrid(); }

function _createAlbumPrompt() {
  const name = prompt('Название альбома:');
  if (!name?.trim()) return;
  const year = parseInt(prompt('Год выхода:')) || new Date().getFullYear();
  const alb = createAlbum(name, year);
  _renderAlbGrid();
  showNotif('Альбом «' + alb.name + '» создан');
}


function _renderDetailHeader(item, trackCount, type) {
  const isAlb = type === 'alb';
  const titleEl = document.getElementById(isAlb ? 'alb-detail-title' : 'pl-detail-title');
  const metaEl  = document.getElementById(isAlb ? 'alb-track-count'  : 'pl-track-count');
  const coverEl = document.getElementById('detail-cover');
  const descEl  = document.getElementById('detail-desc');

  if (titleEl) titleEl.textContent = item.name;
  if (metaEl)  metaEl.textContent  = (isAlb ? item.year + ' · ' : '') + trackCount + ' треков';

  if (coverEl) {
    coverEl.style.background = item.color;
    if (item.coverUrl) {
      coverEl.style.backgroundImage    = 'url(' + item.coverUrl + ')';
      coverEl.style.backgroundSize     = 'cover';
      coverEl.style.backgroundPosition = 'center';
    } else {
      coverEl.style.backgroundImage = 'none';
    }
  }

  if (descEl) {
    descEl.textContent = item.description || '';
    descEl.hidden = !item.description;
  }
}


function _deleteCurrent() {
  if (IS_ALBUMS) {
    const alb = getAlbums().find(a => a.id === _currentAlbId);
    if (!alb || !confirm('Удалить альбом «' + alb.name + '»?')) return;
    deleteAlbum(_currentAlbId);
    showNotif('Альбом удалён');
    _backToAlbGrid();
  } else {
    const pl = getPlaylists().find(p => p.id === _currentPlId);
    if (!pl || !confirm('Удалить плейлист «' + pl.name + '»?')) return;
    deletePlaylist(_currentPlId);
    showNotif('Плейлист удалён');
    _backToPlGrid();
  }
}


function _openEditModal(type, id) {
  const item = type === 'pl'
    ? getPlaylists().find(p => p.id === id)
    : getAlbums().find(a => a.id === id);
  if (!item) return;

  document.getElementById('edit-col-modal')?.remove();

  let editColor    = item.color;
  let editCoverB64 = item.coverUrl || null;
  const isAlb      = type === 'alb';

  const modal = document.createElement('div');
  modal.id        = 'edit-col-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal__header">
        <h2 class="modal__title">Редактировать ${isAlb ? 'альбом' : 'плейлист'}</h2>
        <button class="modal__close" id="ecm-close">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="ecm-body">

        <div class="ecm-cover-row">
          <!-- Превью обложки (не кликабельный) -->
          <div class="ecm-cover" id="ecm-cover"></div>
          <div class="ecm-cover-actions">
            <button class="btn btn--ghost btn--sm" id="ecm-pick-cover">Загрузить обложку</button>
            <button class="btn btn--ghost btn--sm" id="ecm-remove-cover">Убрать обложку</button>
            <input type="file" id="ecm-cover-input" accept="image/*" hidden>
          </div>
        </div>

        <div>
          <p class="ecm-label">Цвет фона</p>
          <div class="color-swatches" id="ecm-swatches"></div>
          <input type="color" id="ecm-color-input" class="color-custom-input" value="${item.color}">
        </div>

        <div>
          <p class="ecm-label">Название *</p>
          <input class="ufield__input" type="text" id="ecm-name" value="${_esc(item.name)}" maxlength="80">
        </div>

        ${isAlb ? `<div>
          <p class="ecm-label">Год</p>
          <input class="ufield__input" type="number" id="ecm-year" value="${item.year}" min="1900" max="2099">
        </div>` : ''}

        <div>
          <p class="ecm-label">Описание</p>
          <textarea class="ufield__input ufield__input--textarea" id="ecm-desc" rows="2" maxlength="300">${_esc(item.description || '')}</textarea>
        </div>

        <p class="ecm-error" id="ecm-error" hidden></p>
      </div>
      <div class="modal__footer">
        <button class="btn btn--ghost" id="ecm-cancel">Отмена</button>
        <button class="btn btn--orange" id="ecm-save">Сохранить</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  _updateEcmCoverPreview(editColor, editCoverB64);

  function closeModal() { modal.remove(); }
  document.getElementById('ecm-close').addEventListener('click',  closeModal);
  document.getElementById('ecm-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  const swatchContainer = document.getElementById('ecm-swatches');
  COL_SWATCH_COLORS.forEach(c => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className   = 'color-swatch' + (c === editColor ? ' color-swatch--active' : '');
    btn.style.background = c;
    btn.dataset.color    = c;
    btn.addEventListener('click', () => {
      editColor = c;
      document.getElementById('ecm-color-input').value = c;
      swatchContainer.querySelectorAll('.color-swatch')
        .forEach(b => b.classList.toggle('color-swatch--active', b.dataset.color === c));
      _updateEcmCoverPreview(editColor, editCoverB64);
    });
    swatchContainer.appendChild(btn);
  });

  document.getElementById('ecm-color-input').addEventListener('input', function () {
    editColor = this.value;
    swatchContainer.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('color-swatch--active'));
    _updateEcmCoverPreview(editColor, editCoverB64);
  });

  const coverInput = document.getElementById('ecm-cover-input');

  document.getElementById('ecm-pick-cover').addEventListener('click', () => {
    coverInput.click();
  });

  coverInput.addEventListener('change', () => {
    const file = coverInput.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = e => {
      editCoverB64 = e.target.result;
      _updateEcmCoverPreview(editColor, editCoverB64);
    };
    r.readAsDataURL(file);
  });

  document.getElementById('ecm-remove-cover').addEventListener('click', () => {
    editCoverB64 = null;
    _updateEcmCoverPreview(editColor, null);
  });

  document.getElementById('ecm-save').addEventListener('click', () => {
    const name = document.getElementById('ecm-name').value.trim();
    if (!name) {
      const errEl = document.getElementById('ecm-error');
      errEl.textContent = 'Введи название';
      errEl.hidden = false;
      return;
    }

    const data = {
      name,
      description: document.getElementById('ecm-desc').value.trim(),
      color:        editColor,
      coverUrl:     editCoverB64,
    };

    if (isAlb) {
      const year = parseInt(document.getElementById('ecm-year')?.value);
      if (year) data.year = year;
      updateAlbum(id, data);
      closeModal();
      showNotif('Альбом сохранён!');
      _openAlbum(id);
    } else {
      updatePlaylist(id, data);
      closeModal();
      showNotif('Плейлист сохранён!');
      _openPlaylist(id);
    }
  });
}

function _updateEcmCoverPreview(color, coverUrl) {
  const el = document.getElementById('ecm-cover');
  if (!el) return;
  el.style.background = color;
  if (coverUrl) {
    el.style.backgroundImage    = 'url(' + coverUrl + ')';
    el.style.backgroundSize     = 'cover';
    el.style.backgroundPosition = 'center';
  } else {
    el.style.backgroundImage = 'none';
  }
}

function _esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


function _renderTrackList(container, tracks, type, collectionId) {
  if (!tracks.length) {
    container.innerHTML = `<div class="empty-state empty-state--compact">
      <p>Коллекция пуста</p>
      <p class="empty-state__hint">Нажми «+ Добавить треки» чтобы выбрать из библиотеки</p>
    </div>`;
    return;
  }

  container.innerHTML = tracks.map(t => _buildCollectionRow(t, collectionId, type)).join('');

  tracks.forEach(t => {
    _dbGet(t.id).then(m => {
      if (!m?.coverUrl) return;
      const artEl = container.querySelector(`.track-row[data-track-id="${t.id}"] .track-art`);
      if (artEl) {
        artEl.style.backgroundImage    = `url(${m.coverUrl})`;
        artEl.style.backgroundSize     = 'cover';
        artEl.style.backgroundPosition = 'center';
      }
    }).catch(() => {});
  });

  container.querySelectorAll('.art-play-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const track = tracks.find(t => t.id === btn.dataset.id);
      if (!track) return;
      Player.getCurrent()?.id === track.id ? Player.toggle() : Player.loadTrack(track, tracks);
    });
  });

  container.querySelectorAll('.track-waveform').forEach(wf => {
    wf.addEventListener('click', e => {
      const track = tracks.find(t => t.id === wf.dataset.id);
      if (!track) return;
      if (Player.getCurrent()?.id === track.id) {
        Player.seek((e.clientX - wf.getBoundingClientRect().left) / wf.offsetWidth);
      } else {
        Player.loadTrack(track, tracks);
      }
    });
  });

  container.querySelectorAll('.btn-remove-from-col').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (type === 'pl') { removeTrackFromPlaylist(collectionId, btn.dataset.id); _openPlaylist(collectionId); }
      else               { removeTrackFromAlbum(collectionId, btn.dataset.id);    _openAlbum(collectionId);    }
      showNotif('Трек убран из коллекции');
    });
  });
}

function _buildCollectionRow(t, collectionId, type) {
  const bars = getWave(t.id, 60).map(h => `<div class="wf-bar" style="height:${h}%"></div>`).join('');
  return `
    <div class="track-row" data-track-id="${t.id}">
      <div class="track-art" style="background:${t.color}">
        <div class="track-art__overlay">
          <button class="art-play-btn" data-id="${t.id}"><span class="icon-play">${Icons.play}</span></button>
        </div>
      </div>
      <div class="track-info">
        <div class="track-info__top">
          <span class="track-info__artist">${t.artist}</span>
          <span class="track-info__sep">·</span>
          <span class="track-info__title">${t.title}</span>
        </div>
      </div>
      <div class="track-waveform" data-id="${t.id}">${bars}</div>
      <div class="track-meta">
        <span class="track-meta__genre">${t.genre}</span>
        <span class="track-meta__duration">${formatDuration(t.duration)}</span>
        <button class="btn-remove-from-col" data-id="${t.id}" title="Убрать">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
    </div>`;
}


function _openAddTrackDialog(type) {
  const collectionId = type === 'pl' ? _currentPlId : _currentAlbId;
  if (!collectionId) return;

  const collection = type === 'pl'
    ? getPlaylists().find(p => p.id === collectionId)
    : getAlbums().find(a => a.id === collectionId);
  if (!collection) return;

  const alreadyIn  = new Set(collection.trackIds);
  const available  = getData().filter(t => !alreadyIn.has(t.id));
  const selected   = new Set();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'add-tracks-modal';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal__header">
        <h2 class="modal__title">Добавить треки в «${_esc(collection.name)}»</h2>
        <button class="modal__close" id="atm-close">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal__search">
        <input type="text" class="modal__search-input" id="atm-search" placeholder="Поиск по названию или исполнителю…">
      </div>
      <div class="modal__track-list" id="atm-list"></div>
      <div class="modal__footer">
        <span class="modal__selected-count" id="atm-count">Выбрано: 0</span>
        <button class="btn btn--ghost" id="atm-cancel">Отмена</button>
        <button class="btn btn--orange" id="atm-add">Добавить</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  function renderList(q) {
    const f = (q || '').toLowerCase();
    const filtered = available.filter(t =>
      !f || t.title.toLowerCase().includes(f) || t.artist.toLowerCase().includes(f)
    );
    const listEl = document.getElementById('atm-list');
    if (!filtered.length) {
      listEl.innerHTML = `<p class="modal__empty">${available.length ? 'Ничего не найдено' : 'Все треки уже в этой коллекции'}</p>`;
      return;
    }
    listEl.innerHTML = filtered.map(t => {
      const artStyle = t.coverUrl
        ? `background:${t.color};background-image:url(${t.coverUrl});background-size:cover;background-position:center`
        : `background:${t.color}`;
      return `
        <div class="modal-track-item${selected.has(t.id) ? ' modal-track-item--selected' : ''}" data-id="${t.id}">
          <div class="modal-track-item__art" style="${artStyle}"></div>
          <div class="modal-track-item__info">
            <span class="modal-track-item__title">${t.title}</span>
            <span class="modal-track-item__artist">${t.artist} · ${t.genre}</span>
          </div>
          <div class="modal-track-item__check">
            <svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
          </div>
        </div>`;
    }).join('');

    listEl.querySelectorAll('.modal-track-item').forEach(item => {
      item.addEventListener('click', () => {
        const tid = item.dataset.id;
        selected.has(tid) ? selected.delete(tid) : selected.add(tid);
        item.classList.toggle('modal-track-item--selected', selected.has(tid));
        document.getElementById('atm-count').textContent = 'Выбрано: ' + selected.size;
      });
    });
  }

  renderList('');
  document.getElementById('atm-search').addEventListener('input', function () { renderList(this.value); });

  function closeModal() { overlay.remove(); }
  document.getElementById('atm-close').addEventListener('click',  closeModal);
  document.getElementById('atm-cancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  document.getElementById('atm-add').addEventListener('click', () => {
    if (!selected.size) { closeModal(); return; }
    selected.forEach(tid => {
      type === 'pl' ? addTrackToPlaylist(collectionId, tid) : addTrackToAlbum(collectionId, tid);
    });
    const n = selected.size;
    showNotif('Добавлено ' + n + ' трек' + (n % 10 === 1 && n % 100 !== 11 ? '' : [2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100) ? 'а' : 'ов'));
    closeModal();
    type === 'pl' ? _openPlaylist(collectionId) : _openAlbum(collectionId);
  });
}


function _showView(activeId) {
  const all = IS_ALBUMS
    ? ['alb-grid', 'alb-detail']
    : ['pl-grid',  'pl-detail'];
  all.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = (id !== activeId);
  });
}

function _buildCard(item, meta) {
  return `
    <div class="card" data-id="${item.id}">
      <div class="card__art" data-item-id="${item.id}" style="background:${item.color}"></div>
      <div class="card__body">
        <div class="card__name">${item.name}</div>
        <div class="card__meta">${meta}</div>
      </div>
    </div>`;
}

function _loadCardCovers(container) {
  const isAlb = IS_ALBUMS;
  container.querySelectorAll('.card__art[data-item-id]').forEach(artEl => {
    const id   = artEl.dataset.itemId;
    const item = isAlb
      ? getAlbums().find(a => a.id === id)
      : getPlaylists().find(p => p.id === id);
    if (item?.coverUrl) {
      artEl.style.backgroundImage    = `url(${item.coverUrl})`;
      artEl.style.backgroundSize     = 'cover';
      artEl.style.backgroundPosition = 'center';
    }
  });
}
