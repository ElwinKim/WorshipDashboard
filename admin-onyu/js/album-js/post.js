var counter = 0;

const createAlbum = async (form) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/admin-onyu/album-post/',
      data: form,
    });
    if (res.data.status === 'success') {
      location.assign('/admin-onyu/album?page=1&limit=10');
    }
  } catch (err) {
    alert(err.response.data.message);
  }
};

document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();

  let form = new FormData();
  form.append('image', document.getElementById('image').files[0]);
  form.append('title', document.getElementById('title').value);
  form.append('artist', document.getElementById('artist').value);
  // var image = document.getElementById('albumImg').value;
  var songList = document.querySelectorAll('.songList');
  var songs = [];
  songList.forEach((element) => {
    songs.push(element.value);
  });
  for (var i = 0; i < songs.length; i++) {
    form.append('songList', songs[i]);
  }

  createAlbum(form);

  // uploadAlbumImage(id, form);
  // const password = document.getElementById('password').value;
});

(function () {
  var btn = document.querySelector('.fa-plus-square');
  var form = document.querySelector('.right');
  var addInput = function () {
    counter++;
    var input = document.createElement('input');
    input.id = 'songList-' + counter;
    input.className = 'songList';
    input.type = 'text';
    input.name = 'name';
    input.placeholder = 'Enter the song list ' + counter;
    form.appendChild(input);
  };
  btn.addEventListener(
    'click',
    function () {
      addInput();
    }.bind(this)
  );
})();

(function () {
  var btn = document.querySelector('.fa-minus-square');
  var removeInput = function () {
    if (counter === 0) {
      //do nothing
    } else {
      document.getElementById('songList-' + counter).remove();
      counter--;
    }
  };
  btn.addEventListener(
    'click',
    function () {
      removeInput();
    }.bind(this)
  );
})();
