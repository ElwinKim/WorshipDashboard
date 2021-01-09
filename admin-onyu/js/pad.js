/******************
 * Delete Album
 * @param {*} ids
 ******************/

// Call API to delete albums
const deleteAlbum = async (ids) => {
  try {
    const res = await axios({
      method: 'DELETE',
      url: `/admin-onyu/pad?${ids}`,
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
  const checked = document.querySelectorAll('.padCheck:checked');
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
  $('.padCheck').prop('checked', this.checked);
});
/**********************
 * Edit an Album Section
 ***********************/

//For Editing an album with PATCH REST API
const editPad = async (id, form) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/admin-onyu/pad-edit/${id}`,
      data: form,
    });
    if (res.data.status === 'success')
      location.assign('/admin-onyu/pad?q=&page=1&limit=10');
  } catch (err) {
    alert(err.response.data.message);
  }
};
var padId = '';

// Edit an target album with data which entered by user
document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();

  let form = new FormData();

  padId = document.querySelector('.hidden_id').value;
  form.append('producer', document.getElementById('producerSelect').value);
  form.append('title', document.getElementById('padName').value);
  form.append('priceDiscount', document.getElementById('priceDiscount').value);
  form.append('price', document.getElementById('price').value);
  form.append('pads', document.getElementById('padFile').files[0]);
  form.append('image', document.getElementById('image').files[0]);
  form.append('description', document.getElementById('description').value);
  var youtubeLink = document.querySelectorAll('.youtubeLink');
  var links = [];
  youtubeLink.forEach((element) => {
    links.push(element.value);
  });
  for (var i = 0; i < links.length; i++) {
    form.append('youtubeLink', links[i]);
  }
  var btn = document.querySelector('.btn');
  btn.style.background = 'grey';
  btn.innerHTML = 'Loading....';
  btn.disabled = 'true';

  editPad(padId, form);
});
var counter;
if (document.getElementById('counterOfLink') !== null) {
  console.log(document.getElementById('counterOfLink').value);
  counter = document.getElementById('counterOfLink').value - 1;
}

(function () {
  var btn = document.querySelector('.fa-plus-square');
  var form = document.querySelector('.youtube-wrapper');
  var addInput = function () {
    counter++;
    var input = document.createElement('input');
    input.id = 'youtubeLink-' + counter;
    input.className = 'youtubeLink';
    input.type = 'text';
    input.name = 'youtube';
    input.placeholder = 'Enter the Youtube link ' + counter;
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
      document.getElementById('youtubeLink-' + counter).remove();
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
/**************
 *  PAGINATION
 **************/

// To get current page number and add active to focus current page number
// document.querySelector('.number').addEventListener('reload', (e) => {
//   console.log('query');
//   var pageNum = document.getElementById('currentPage').value;
//   var pages = document.querySelectorAll('.pageNumber');
//   pages.forEach((element) => {
//     if (pageNum === element.querySelector('.span').innerHTML) {
//       element.classList.add('active');
//     }
//   });
// });
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
    window.location.href = `/admin-onyu/pad?q=${query}&page=${
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
    $('.pagination').find('.pageNumber.active').prev().addClass('active');
    $('.pagination').find('.pageNumber.active').next().removeClass('active');
    window.location.href = `/admin-onyu/pad?q=${query}&page=${
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
var counter = 0;
const createPad = async (pad) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/admin-onyu/pad-post/',
      data: pad,
    });
    if (res.data.status === 'success')
      location.assign('/admin-onyu/pad?page=1&limit=10');
  } catch (err) {
    console.log(err.response.data.message);
  }
};

document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();
  var padName = document.getElementById('padName');
  var producer = document.getElementById('producerSelect');
  let form = new FormData();
  if (producer.value === 'default') {
    // producer.appendChild('<span>Select a song Pleas!</span>');
    alert("Please select producer's name");
  } else {
    form.append('title', padName.value);
    form.append('producer', producer.value);
    form.append('price', document.getElementById('price').value);
    form.append(
      'priceDiscount',
      document.getElementById('priceDiscount').value
    );
    form.append('pads', document.getElementById('padFile').files[0]);
    form.append('image', document.getElementById('image').files[0]);
    form.append('description', document.getElementById('description').value);
    var youtube = document.querySelectorAll('.youtubeLink');
    var links = [];
    youtube.forEach((element) => {
      links.push(element.value);
    });
    for (var i = 0; i < links.length; i++) {
      form.append('youtubeLink[]', links[i]);
    }
    var btn = document.querySelector('.btn');
    btn.style.background = 'grey';
    btn.innerHTML = 'Loading....';
    btn.disabled = 'true';

    createPad(form);
  }
});

(function () {
  var btn = document.querySelector('.fa-plus-square');
  var form = document.querySelector('.youtube-wrapper');
  var addInput = function () {
    counter++;
    var input = document.createElement('input');
    input.id = 'youtubeLink-' + counter;
    input.className = 'youtubeLink';
    input.type = 'text';
    input.name = 'youtube';
    input.placeholder = 'Enter the Youtube link ' + counter;
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
      document.getElementById('youtubeLink-' + counter).remove();
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
/****************
 * Search an Album
 *****************/

// getting all required elements
const searchPadWrapper = document.querySelector('.search-input');
const inputBox = searchPadWrapper.querySelector('input');
const icon = document.querySelector('.search-icon');
const suggBox = searchPadWrapper.querySelector('.autocom-box');

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
  if (userData) {
    $('#dynamicTable').load(
      `/admin-onyu/pad?q=${userData}&page=1&limit=10` + ' #dynamicTable',
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
    window.history.pushState({}, '', `pad?q=${userData}&page=1&limit=10`);
  } else {
    $('#dynamicTable').load(
      `pad?q=&page=1&limit=10` + ' #dynamicTable',
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
      `pad?q=${userData}&page=1&limit=10` + ' #dynamicTable'
    );
});
