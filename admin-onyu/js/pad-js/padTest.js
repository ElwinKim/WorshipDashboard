// When click play button, audio sources will play simultaneously
$('.fa-play-circle').click(function () {
  var id = this.id.split('-')[1];
  var pad = document.getElementById(`audio-${id}`);
  if (this.className === 'far fa-pause-circle') {
    this.className = 'far fa-play-circle';
    pad.pause();
  } else {
    this.className = 'far fa-pause-circle';
    pad.play();
  }
});
