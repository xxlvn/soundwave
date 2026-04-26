let activeFilter = 'all';
let searchQuery  = '';

function renderItems() {
  const container = document.getElementById('tracks-container');
  if (!container) return;

  let tracks = getData();

  if (activeFilter !== 'all') tracks = tracks.filter(t => t.genre === activeFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    tracks = tracks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q)
    );
  }

  const counter = document.getElementById('track-counter');
  if (counter) counter.textContent = tracks.length + ' трек' + _ending(tracks.length);

  if (!tracks.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Треки не найдены</p>
        <a href="pages/form.html" class="btn btn--orange">+ Добавить трек</a>
      </div>`;
    return;
  }

  container.innerHTML = tracks.map(t => _buildRow(t)).join('');

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

  _attachEvents(tracks);
}

function _buildRow(t) {
  const bars = getWave(t.id, 80).map(h => `<div class="wf-bar" style="height:${h}%"></div>`).join('');
  return `
  <div class="track-row" data-track-id="${t.id}">
    <div class="track-art" style="background:${t.color}">
      <div class="track-art__overlay">
        <button class="art-play-btn" data-id="${t.id}" title="Воспроизвести">
          <span class="icon-play">${Icons.play}</span>
        </button>
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
      <span class="track-meta__plays">${Icons.plays} ${formatPlays(t.plays)}</span>
      <span class="track-meta__duration">${formatDuration(t.duration)}</span>
      <button class="like-btn ${t.liked ? 'liked' : ''}" data-id="${t.id}">${Icons.heart}</button>
      <button class="add-btn" data-id="${t.id}" title="Добавить в плейлист / альбом">
        <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
      </button>
      <button class="delete-btn" data-id="${t.id}" title="Удалить">${Icons.trash}</button>
    </div>
  </div>`;
}

function _attachEvents(tracks) {
  document.querySelectorAll('.art-play-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const track = tracks.find(t => t.id === btn.dataset.id);
      if (!track) return;
      Player.getCurrent()?.id === track.id ? Player.toggle() : Player.loadTrack(track, tracks);
    });
  });

  document.querySelectorAll('.track-waveform').forEach(wf => {
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

  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const all = getData();
      const t   = all.find(x => x.id === btn.dataset.id);
      if (t) {
        t.liked = !t.liked;
        saveData(all);
        btn.classList.toggle('liked', t.liked);
        showNotif(t.liked ? 'Добавлено в избранное' : 'Убрано из избранного');
      }
    });
  });

  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openAddToDialog(btn.dataset.id);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Удалить трек?')) return;
      const id = btn.dataset.id;
      deleteTrackMedia(id);
      saveData(getData().filter(t => t.id !== id));
      showNotif('Трек удалён');
      renderItems();
    });
  });
}

function initSearch() {
  const inp = document.getElementById('search-input');
  if (inp) inp.addEventListener('input', function () {
    searchQuery = this.value.trim();
    renderItems();
  });
}

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      activeFilter = this.dataset.genre;
      renderItems();
    });
  });
}

function _ending(n) {
  if (n % 10 === 1 && n % 100 !== 11) return '';
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'а';
  return 'ов';
}

document.addEventListener('DOMContentLoaded', () => {
  renderItems();
  initSearch();
  initFilters();
  initPlayerBar();
});
