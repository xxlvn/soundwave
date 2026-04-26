const Player = (() => {
  const audio = new Audio();
  let currentTrack = null;
  let playlist     = [];
  let currentIndex = -1;
  let isPlaying    = false;
  let isShuffle    = false;
  let isRepeat     = false;

  audio.addEventListener('timeupdate',     onTimeUpdate);
  audio.addEventListener('ended',          onEnded);
  audio.addEventListener('loadedmetadata', onMetaLoaded);

  function loadTrack(track, list) {
    currentTrack = track;
    playlist     = list || [track];
    currentIndex = playlist.findIndex(t => t.id === track.id);

    updatePlayerInfo();
    highlightActiveRow();
    recordPlay(track.id);

    getTrackSrc(track.id).then(src => {
      if (!src) { console.warn('No src for track', track.id); return; }
      audio.src = src;
      audio.load();
      play();
    });
  }

  function play() {
    audio.play().catch(() => {});
    isPlaying = true;
    refreshPlayIcons();
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    refreshPlayIcons();
  }

  function toggle() {
    if (!currentTrack) return;
    isPlaying ? pause() : play();
  }

  function next() {
    if (!playlist.length) return;
    if (isShuffle) currentIndex = Math.floor(Math.random() * playlist.length);
    else           currentIndex = (currentIndex + 1) % playlist.length;
    loadTrack(playlist[currentIndex], playlist);
  }

  function prev() {
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    if (!playlist.length) return;
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadTrack(playlist[currentIndex], playlist);
  }

  function seek(ratio) {
    if (audio.duration) audio.currentTime = ratio * audio.duration;
  }

  function setVolume(v) { audio.volume = v; }

  function toggleShuffle() {
    isShuffle = !isShuffle;
    document.getElementById('btn-shuffle')?.classList.toggle('active', isShuffle);
  }

  function toggleRepeat() {
    isRepeat = !isRepeat;
    document.getElementById('btn-repeat')?.classList.toggle('active', isRepeat);
  }

  function onEnded() {
    if (isRepeat) { audio.currentTime = 0; play(); }
    else next();
  }

  function onMetaLoaded() {
    const el = document.getElementById('player-dur');
    if (el) el.textContent = formatDuration(audio.duration);
  }

  function onTimeUpdate() {
    if (!audio.duration) return;
    const ratio = audio.currentTime / audio.duration;

    const ct = document.getElementById('player-cur');
    if (ct) ct.textContent = formatDuration(audio.currentTime);

    const bars  = document.querySelectorAll('.player-wf-bar');
    const count = bars.length;
    if (count) {
      const played = Math.floor(ratio * count);
      bars.forEach((b, i) => b.classList.toggle('played', i < played));
    }

    if (currentTrack) {
      const wf = document.querySelector(`.track-waveform[data-id="${currentTrack.id}"]`);
      if (wf) {
        const wb = wf.querySelectorAll('.wf-bar');
        const wp = Math.floor(ratio * wb.length);
        wb.forEach((b, i) => b.classList.toggle('played', i < wp));
      }
    }
  }

  function refreshPlayIcons() {
    const btn = document.getElementById('btn-play');
    if (btn) btn.innerHTML = isPlaying
      ? `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
      : `<svg viewBox="0 0 24 24" class="icon-play-svg"><path d="M8 5v14l11-7z"/></svg>`;

    document.querySelectorAll('.art-play-btn').forEach(b => {
      const isCurrent = b.dataset.id === currentTrack?.id;
      b.innerHTML = isCurrent && isPlaying
        ? `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
        : `<span class="icon-play">${Icons.play}</span>`;
    });
  }

  function highlightActiveRow() {
    document.querySelectorAll('.track-row').forEach(r => {
      r.classList.toggle('track-row--playing', r.dataset.trackId === currentTrack?.id);
    });
  }

  function updatePlayerInfo() {
    if (!currentTrack) return;
    const title  = document.getElementById('player-title');
    const artist = document.getElementById('player-artist');
    const art    = document.getElementById('player-art-color');

    if (title)  title.textContent  = currentTrack.title;
    if (artist) artist.textContent = currentTrack.artist;
    if (art) {
      art.style.background = currentTrack.color;
      _dbGet(currentTrack.id).then(m => {
        if (m?.coverUrl) {
          art.style.backgroundImage    = `url(${m.coverUrl})`;
          art.style.backgroundSize     = 'cover';
          art.style.backgroundPosition = 'center';
        } else {
          art.style.backgroundImage = 'none';
        }
      }).catch(() => {});
    }

    buildPlayerWave();
  }

  function buildPlayerWave() {
    const wf = document.getElementById('player-waveform');
    if (!wf || !currentTrack) return;
    const heights = getWave(currentTrack.id, 120);
    wf.innerHTML  = heights.map(h => `<div class="player-wf-bar" style="height:${h}%"></div>`).join('');
    wf.onclick    = e => {
      const rect = wf.getBoundingClientRect();
      seek((e.clientX - rect.left) / rect.width);
    };
  }

  function getCurrent()   { return currentTrack; }
  function getIsPlaying() { return isPlaying; }

  return { loadTrack, play, pause, toggle, next, prev, seek, setVolume, toggleShuffle, toggleRepeat, getCurrent, getIsPlaying, refreshPlayIcons };
})();
