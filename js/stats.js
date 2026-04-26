document.addEventListener('DOMContentLoaded', () => {
  const tracks = getData();

  document.getElementById('stat-total').textContent = tracks.length;
  document.getElementById('stat-liked').textContent = tracks.filter(t => t.liked).length;
  document.getElementById('stat-plays').textContent = formatPlays(tracks.reduce((s, t) => s + (t.plays || 0), 0));
  document.getElementById('stat-playlists').textContent = getPlaylists().length;
  document.getElementById('stat-albums').textContent    = getAlbums().length;

  const top = [...tracks].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 5);
  document.getElementById('top-list').innerHTML = top.map((t, i) => `
    <div class="top-track-row">
      <span class="top-rank">${i + 1}</span>
      <div class="top-art" style="background:${t.color}"></div>
      <div class="top-info">
        <strong>${t.title}</strong>
        <span>${t.artist}</span>
      </div>
      <span class="top-plays">${formatPlays(t.plays || 0)}</span>
    </div>`).join('');

  const now = Date.now();
  const DAY = 86400000;
  const days = Array(7).fill(0);
  tracks.forEach(t => {
    (t.playHistory || []).forEach(ts => {
      const age = Math.floor((now - ts) / DAY);
      if (age < 7) days[6 - age]++;
    });
  });

  const dayLabels = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const todayDow = new Date().getDay();
  const labels = Array(7).fill(0).map((_, i) => {
    const dow = (todayDow - (6 - i) + 7) % 7;
    return dayLabels[dow === 0 ? 6 : dow - 1];
  });

  const maxVal = Math.max(...days, 1);
  document.getElementById('week-chart').innerHTML = days.map((v, i) => `
    <div class="week-col">
      <div class="week-bar-wrap">
        <div class="week-bar" style="height:${Math.round((v / maxVal) * 100)}%" title="${v} прослушиваний">
          ${v > 0 ? `<span class="week-bar__val">${v}</span>` : ''}
        </div>
      </div>
      <div class="week-label">${labels[i]}</div>
    </div>`).join('');

  const weekTracks = tracks.map(t => {
    const cnt = (t.playHistory || []).filter(ts => now - ts < 7 * DAY).length;
    return { ...t, weekPlays: cnt };
  }).filter(t => t.weekPlays > 0).sort((a, b) => b.weekPlays - a.weekPlays).slice(0, 5);

  const weekList = document.getElementById('week-top-list');
  weekList.innerHTML = weekTracks.length
    ? weekTracks.map((t, i) => `
        <div class="top-track-row">
          <span class="top-rank">${i + 1}</span>
          <div class="top-art" style="background:${t.color}"></div>
          <div class="top-info">
            <strong>${t.title}</strong>
            <span>${t.artist}</span>
          </div>
          <span class="top-plays">+${t.weekPlays} за неделю</span>
        </div>`).join('')
    : '<p class="stats-empty">Нет прослушиваний за последние 7 дней. Слушай треки — они появятся здесь!</p>';

  const genreMap = {};
  tracks.forEach(t => { genreMap[t.genre] = (genreMap[t.genre] || 0) + 1; });
  const maxG = Math.max(...Object.values(genreMap), 1);
  document.getElementById('genre-list').innerHTML = Object.entries(genreMap)
    .sort((a, b) => b[1] - a[1])
    .map(([g, c]) => `
      <div class="genre-row">
        <span class="genre-lbl">${g}</span>
        <div class="genre-track"><div class="genre-fill" style="width:${(c / maxG) * 100}%"></div></div>
        <span class="genre-cnt">${c}</span>
      </div>`).join('');

  initPlayerBar();
});
