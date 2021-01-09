/****************
 * Search an Album
 *****************/

// getting all required elements
const searchWrapper = document.querySelector('.search-input');
const inputBox = searchWrapper.querySelector('input');
const icon = document.querySelector('.search-icon');
const suggBox = searchWrapper.querySelector('.autocom-box');

function activeNumber() {
  console.log('haha');
  var pageNum = document.getElementById('currentPage').value;
  var content = document.querySelector('.content-wrapper');
  var pages = document.querySelectorAll('.pageNumber');

  pages.forEach((element) => {
    console.log(pageNum);
    console.log(element.querySelector('.span').innerHTM);
    if (pageNum === element.querySelector('.span').innerHTML) {
      element.classList.add('active');
    }
  });
}

//To delay every execusion when user typing search keyword.
function delay(fn, ms) {
  let timer = 0;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(fn.bind(this, ...args), ms || 0);
  };
}

// if user press any key and release, query working and refresh only table
inputBox.onkeyup = delay((e) => {
  let userData = e.target.value; //user enetered data
  userData = $.trim(userData);
  if (userData) {
    $('#dynamicTable').load(
      `/admin-onyu/album?q=${userData}&page=1&limit=10` + ' #dynamicTable',
      function () {
        var pageNum = document.getElementById('currentPage').value;
        var content = document.querySelector('.content-wrapper');
        var pages = document.querySelectorAll('.pageNumber');

        pages.forEach((element) => {
          if (pageNum === element.querySelector('.span').innerHTML) {
            element.classList.add('active');
          }
        });
      }
    );
    window.history.pushState({}, '', `album?q=${userData}&page=1&limit=10`);
  } else {
    $('#dynamicTable').load(
      `album?q=&page=1&limit=10` + ' #dynamicTable',
      function () {
        var pageNum = document.getElementById('currentPage').value;
        var content = document.querySelector('.content-wrapper');
        var pages = document.querySelectorAll('.pageNumber');

        pages.forEach((element) => {
          if (pageNum === element.querySelector('.span').innerHTML) {
            element.classList.add('active');
          }
        });
      }
    );
    window.history.pushState({}, '', `album?q=${userData}&page=1&limit=10`);
  }
}, 500);

// When user click search icon
icon.addEventListener('click', (e) => {
  let userData = inputBox.value;
  if (userData)
    $('#dynamicTable').load(
      `album?q=${userData}&page=1&limit=10` + ' #dynamicTable'
    );
});

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
    alert(err.response.data.message);
  }
};

//For Editing an album with PATCH REST API
const editAlbum = async (id, form) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/admin-onyu/album/${id}`,
      data: form,
    });
    if (res.data.status === 'success') location.reload();
  } catch (err) {
    alert(err.response.data.message);
  }
};

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

/******************
 * Delete Album
 * @param {*} ids
 ******************/

// Call API to delete albums
const deleteAlbum = async (ids) => {
  try {
    const res = await axios({
      method: 'DELETE',
      url: `/admin-onyu/album?${ids}`,
    });
    location.reload();
  } catch (err) {
    alert(err.response.data.message);
  }
};

// To delete albums. If there is multiple choices, then concatenate ids into query and pass
document.querySelector('.delete-button').addEventListener('click', (e) => {
  var ids = [];
  var i = 1;
  e.preventDefault();
  const checked = document.querySelectorAll('.albumCheck:checked');
  if (checked) {
    checked.forEach((vl) => {
      ids.push(`id${i}=` + vl.value);
      i++;
    });
    var resultId = ids.join('&');
    deleteAlbum(resultId);
  }
});

$('#checkAll').click(function () {
  $('.albumCheck').prop('checked', this.checked);
});
/**************
 *  PAGINATION
 **************/

$(document).ready(function () {
  var pageNum = document.getElementById('currentPage').value;
  var content = document.querySelector('.content-wrapper');
  var pages = document.querySelectorAll('.pageNumber');
  pages.forEach((element) => {
    if (pageNum === element.querySelector('.span').innerHTML) {
      element.classList.add('active');
    }
  });
});

// For Hover design, and move to another page
$(document).on('click', '.next', function () {
  var pageNum = parseInt(document.getElementById('currentPage').value);
  var query = document.getElementById('currentQuery').value;
  if (
    $('.pagination').find('.pageNumber.active').next().attr('class') ===
    'pageSkip'
  ) {
    $('.pagination').find('.pageNumber.active').prev().removeClass('active');
    window.location.href = `/admin-onyu/album?q=${query}&page=${
      pageNum + 1
    }&limit=10`;
  } else {
    $('.pagination').find('.pageNumber.active').next().addClass('active');
    $('.pagination').find('.pageNumber.active').prev().removeClass('active');
    var href = $('.pageNumber.active').find('.number').attr('href');
    $('#table').load(href + ' #table');
    document.getElementById('currentPage').value = pageNum + 1;
  }
});
$(document).on('click', '.prev', function () {
  var pageNum = parseInt(document.getElementById('currentPage').value);
  var query = document.getElementById('currentQuery').value;
  if (
    $('.pagination').find('.pageNumber.active').prev().attr('class') ===
    'pageSkip'
  ) {
    $('.pagination').find('.pageNumber.active').next().removeClass('active');
    window.location.href = `/admin-onyu/album?q=${query}&page=${
      pageNum - 1
    }&limit=10`;
  } else {
    $('.pagination').find('.pageNumber.active').prev().addClass('active');
    $('.pagination').find('.pageNumber.active').next().removeClass('active');
    var href = $('.pageNumber.active').find('.number').attr('href');
    $('#table').load(href + ' #table');
    document.getElementById('currentPage').value = pageNum - 1;
  }
});
