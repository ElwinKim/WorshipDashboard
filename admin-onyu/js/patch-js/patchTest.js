// When click play button, audio sources will play simultaneously
$('.fa-play-circle').click(function () {
  var id = this.id.split('-')[1];
  var patch = document.getElementById(`audio-${id}`);
  if (this.className === 'far fa-pause-circle') {
    this.className = 'far fa-play-circle';
    patch.pause();
  } else {
    this.className = 'far fa-pause-circle';
    patch.play();
  }

  console.log(id);
});
