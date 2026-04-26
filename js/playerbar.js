function initPlayerBar() {
  const btnPlay    = document.getElementById('btn-play');
  const btnPrev    = document.getElementById('btn-prev');
  const btnNext    = document.getElementById('btn-next');
  const btnShuffle = document.getElementById('btn-shuffle');
  const btnRepeat  = document.getElementById('btn-repeat');
  const volSlider  = document.getElementById('vol-slider');

  if (btnPlay)    btnPlay.addEventListener('click', () => Player.toggle());
  if (btnPrev)    btnPrev.addEventListener('click', () => Player.prev());
  if (btnNext)    btnNext.addEventListener('click', () => Player.next());
  if (btnShuffle) btnShuffle.addEventListener('click', () => Player.toggleShuffle());
  if (btnRepeat)  btnRepeat.addEventListener('click', () => Player.toggleRepeat());
  if (volSlider)  volSlider.addEventListener('input', () => Player.setVolume(volSlider.value / 100));
}
