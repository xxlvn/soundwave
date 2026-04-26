const PLAYLISTS_KEY = 'sw_playlists';
const ALBUMS_KEY    = 'sw_albums';


function getPlaylists() {
  try { return JSON.parse(localStorage.getItem(PLAYLISTS_KEY) || '[]'); }
  catch { return []; }
}
function savePlaylists(list) {
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(list));
}
function getAlbums() {
  try { return JSON.parse(localStorage.getItem(ALBUMS_KEY) || '[]'); }
  catch { return []; }
}
function saveAlbums(list) {
  localStorage.setItem(ALBUMS_KEY, JSON.stringify(list));
}


function createPlaylist(name, description) {
  const pl = {
    id: generateId(), name: name.trim(),
    description: (description || '').trim(),
    coverUrl: null, color: _rndColor(),
    trackIds: [], createdAt: new Date().toISOString(),
  };
  const list = getPlaylists();
  list.unshift(pl);
  savePlaylists(list);
  return pl;
}

function updatePlaylist(id, data) {
  const list = getPlaylists();
  const pl   = list.find(p => p.id === id);
  if (!pl) return;
  if (data.name        !== undefined) pl.name        = data.name.trim();
  if (data.description !== undefined) pl.description = data.description.trim();
  if (data.color       !== undefined) pl.color       = data.color;
  if (data.coverUrl    !== undefined) pl.coverUrl    = data.coverUrl;
  savePlaylists(list);
  return pl;
}

function deletePlaylist(id) {
  savePlaylists(getPlaylists().filter(p => p.id !== id));
}

function addTrackToPlaylist(plId, trackId) {
  const list = getPlaylists();
  const pl   = list.find(p => p.id === plId);
  if (!pl || pl.trackIds.includes(trackId)) return;
  pl.trackIds.push(trackId);
  savePlaylists(list);
}

function removeTrackFromPlaylist(plId, trackId) {
  const list = getPlaylists();
  const pl   = list.find(p => p.id === plId);
  if (!pl) return;
  pl.trackIds = pl.trackIds.filter(id => id !== trackId);
  savePlaylists(list);
}

function getPlaylistTracks(pl) {
  const all = getData();
  return pl.trackIds.map(id => all.find(t => t.id === id)).filter(Boolean);
}


function createAlbum(name, year, description) {
  const alb = {
    id: generateId(), name: name.trim(),
    year: year || new Date().getFullYear(),
    description: (description || '').trim(),
    coverUrl: null, color: _rndColor(),
    trackIds: [], createdAt: new Date().toISOString(),
  };
  const list = getAlbums();
  list.unshift(alb);
  saveAlbums(list);
  return alb;
}

function updateAlbum(id, data) {
  const list = getAlbums();
  const alb  = list.find(a => a.id === id);
  if (!alb) return;
  if (data.name        !== undefined) alb.name        = data.name.trim();
  if (data.year        !== undefined) alb.year        = data.year;
  if (data.description !== undefined) alb.description = data.description.trim();
  if (data.color       !== undefined) alb.color       = data.color;
  if (data.coverUrl    !== undefined) alb.coverUrl    = data.coverUrl;
  saveAlbums(list);
  return alb;
}

function deleteAlbum(id) {
  saveAlbums(getAlbums().filter(a => a.id !== id));
}

function addTrackToAlbum(albId, trackId) {
  const list = getAlbums();
  const alb  = list.find(a => a.id === albId);
  if (!alb || alb.trackIds.includes(trackId)) return;
  alb.trackIds.push(trackId);
  saveAlbums(list);
}

function removeTrackFromAlbum(albId, trackId) {
  const list = getAlbums();
  const alb  = list.find(a => a.id === albId);
  if (!alb) return;
  alb.trackIds = alb.trackIds.filter(id => id !== trackId);
  saveAlbums(list);
}

function getAlbumTracks(alb) {
  const all = getData();
  return alb.trackIds.map(id => all.find(t => t.id === id)).filter(Boolean);
}


function _rndColor() {
  const c = ['#c8503a','#3a7a5a','#3a4a8a','#7a3a8a','#8a6a2a','#2a6a8a','#8a3a5a','#4a7a3a'];
  return c[Math.floor(Math.random() * c.length)];
}
