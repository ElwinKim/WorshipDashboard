/**********************
 * Edit an Album Section
 ***********************/

//For rendering an album using GET API
const renderAlbum = async (id) => {
  try {
    const res = await axios({
      method: 'GET',
      url: `/admin-onyu/album/${id}`,
    });
    const data = res.data;
    return data;
  } catch (err) {
    console.log(err.response.data.message);
  }
};

//For Editing an album with PATCH REST API
const editAlbum = async (id, form) => {
  try {
    console.log(form);
    const res = await axios({
      method: 'PATCH',
      url: `/admin-onyu/album/${id}`,
      data: form,
    });
    if (res.data.status === 'success') location.reload();
  } catch (err) {
    console.log(err.response.data.message);
  }
};
var modalImage = document.querySelector('.modalImage');
var imageChild = document.createElement('img');
modalImage.appendChild(imageChild);
// Get an album from database and set value into input
var id = ''; //global id variable
$(document).on('click', '.edit-button', function () {
  id = $(this).data('id');
  var index = 0;
  var title = document.querySelector('#title');
  var artist = document.querySelector('#artist');
  var albumFileName = document.querySelector('#albumFileName');

  // To render album to edit form. And data from Promises result
  renderAlbum(id).then((res) => {
    (title.value = res['data'].doc['title']),
      (artist.value = res['data'].doc['artist']),
      (albumFileName.innerHTML = res['data'].doc['image']),
      (imageChild.src = `https://elwinadmin.blob.core.windows.net/albumimages/${res['data'].doc['image']}`),
      (imageChild.width = '150'),
      (imageChild.height = '150');
    // To save every songlist element to new songlist input form
    res['data'].doc['songList'].forEach((element) => {
      // when user get new edit popup, pre-loaded datas will be there. So, this will remove them
      if (document.querySelector(`#songList-${index}`)) {
        var songLength = document.querySelectorAll('.songList').length;
        for (var i = 0; i < songLength; i++) {
          document.querySelector(`#songList-${i}`).remove();
        }
      }

      // Filling up input fields with data from DB
      var form = document.querySelector('.right');
      var input = document.createElement('input');
      input.id = 'songList-' + index;
      input.className = 'songList';
      input.type = 'text';
      input.name = 'name';
      input.placeholder = '';
      input.required = true;
      form.appendChild(input); //To make new input fields for song list data
      document.querySelector(`#songList-${index}`).value = element;
      index++;
    });
  });
});

// To add more Song list fields when user push plus icon
var counter = 0;
document.querySelector('.fa-plus-square').addEventListener('click', (e) => {
  e.preventDefault();
  var songs = document.querySelectorAll('.songList');
  counter = songs.length;
  var form = document.querySelector('.right');
  var input = document.createElement('input');

  input.id = 'songList-' + counter;
  input.className = 'songList';
  input.type = 'text';
  input.name = 'name';
  input.placeholder = 'Enter the song list ' + counter;
  form.appendChild(input);
});

// To remove Song List fields when user push minus icon
document.querySelector('.fa-minus-square').addEventListener('click', (e) => {
  e.preventDefault();
  var songs = document.querySelectorAll('.songList');
  counter = songs.length;
  // Only one fields remain, then do nothing. One field is required
  if (counter !== 1) {
    document.getElementById('songList-' + (counter - 1)).remove();
    counter--;
  }
});

// Edit an target album with data which entered by user
document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();
  var form = new FormData();
  form.append('title', document.getElementById('title').value);
  form.append('artist', document.getElementById('artist').value);

  if (document.getElementById('image').files[0]) {
    form.append('image', document.getElementById('image').files[0]);
  }

  var songList = document.querySelectorAll('.songList');
  var songs = [];
  songList.forEach((element) => {
    songs.push(element.value);
  });
  for (var i = 0; i < songs.length; i++) {
    form.append('songList', songs[i]);
  }
  editAlbum(id, form);
});
