const STORAGE_KEY = 'sw_tracks';
const DB_NAME     = 'soundwave_media';
const DB_VERSION  = 1;
const STORE_NAME  = 'media';


let _db = null;

function _openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror   = e => reject(e.target.error);
  });
}

function _dbPut(key, value) {
  return _openDB().then(db => new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  }));
}

function _dbGet(key) {
  return _openDB().then(db => new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = e => resolve(e.target.result || null);
    req.onerror   = e => reject(e.target.error);
  }));
}

function _dbDelete(key) {
  return _openDB().then(db => new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(key);
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  }));
}


function saveTrackMedia(trackId, src, coverUrl) {
  return _dbPut(trackId, { src: src || null, coverUrl: coverUrl || null });
}

function getTrackSrc(trackId) {
  const tracks = _getMetadata();
  const t = tracks.find(x => x.id === trackId);
  if (t && t.src) return Promise.resolve(t.src);
  return _dbGet(trackId).then(m => m?.src || '');
}

function deleteTrackMedia(trackId) {
  return _dbDelete(trackId);
}


function _getMetadata() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function _saveMetadata(tracks) {
  const meta = tracks.map(({ src, coverUrl, ...rest }) => rest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
}

function getData() {
  const meta = _getMetadata();
  if (!meta) return initDefaultTracks();
  return meta;
}

function saveData(tracks) {
  _saveMetadata(tracks);
}


function recordPlay(trackId) {
  const tracks = getData();
  const t = tracks.find(x => x.id === trackId);
  if (!t) return;
  t.plays = (t.plays || 0) + 1;
  if (!t.playHistory) t.playHistory = [];
  t.playHistory.push(Date.now());
  const cutoff = Date.now() - 90 * 24 * 3600 * 1000;
  t.playHistory = t.playHistory.filter(ts => ts > cutoff);
  saveData(tracks);
}


function initDefaultTracks() {
  const tracks = [
    { id:'1', title:'Chill Lofi Beat',   artist:'Lo-Fi Studio', genre:'Lo-Fi',      duration:214, liked:false, plays:1247, playHistory:[], addedAt:'2025-01-10T00:00:00.000Z', color:'#c8503a', src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id:'2', title:'Electronic Dreams', artist:'Synth Wave',   genre:'Electronic', duration:198, liked:true,  plays:892,  playHistory:[], addedAt:'2025-01-15T00:00:00.000Z', color:'#2a6b6b', src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id:'3', title:'Jazz Fusion Night', artist:'The Quartet',  genre:'Jazz',       duration:241, liked:false, plays:567,  playHistory:[], addedAt:'2025-01-20T00:00:00.000Z', color:'#7a5c2a', src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id:'4', title:'Ambient Space',     artist:'Cosmos Audio', genre:'Ambient',    duration:305, liked:false, plays:2103, playHistory:[], addedAt:'2025-02-01T00:00:00.000Z', color:'#3a3a6e', src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id:'5', title:'Rock Anthems',      artist:'Thunder Road', genre:'Rock',       duration:188, liked:true,  plays:3441, playHistory:[], addedAt:'2025-02-10T00:00:00.000Z', color:'#5a2a2a', src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    { id:'6', title:'Acoustic Morning',  artist:'Folk & Soul',  genre:'Acoustic',   duration:167, liked:false, plays:789,  playHistory:[], addedAt:'2025-02-20T00:00:00.000Z', color:'#2a5a3a', src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
  return tracks;
}
