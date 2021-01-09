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

$(document).on('click', 'Tbody tr', function () {
  var id = $(this).find('input').val();
  $('#songSelect').html('<option>Please Select a Song</option>');
  renderAlbum(id).then((res) => {
    $('#hiddenId').attr('value', `${id}`),
      $('#albumTitle').text('Album Title: ' + res['data'].doc['title']),
      $('#albumArtist').text('Album Artist: ' + res['data'].doc['artist']),
      $('#albumImage').attr({
        src: `/images/album/${res['data'].doc['image']}`,
        width: '200px',
        height: '200px',
      });
    res['data'].doc['songList'].forEach((element) => {
      $('#songSelect').append(`<option value="${element}"> 
          ${element} 
     </option>`);
    });
    // To save every songlist element to new songlist input form
  });
  $('#albumModal').hide();
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
      url: `/admin-onyu/track?${ids}`,
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
  const checked = document.querySelectorAll('.trackCheck:checked');
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
  $('.trackCheck').prop('checked', this.checked);
});
/**********************
 * Edit an Album Section
 ***********************/

//For Editing an album with PATCH REST API
const editTrack = async (id, form) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/admin-onyu/track-edit/${id}`,
      data: form,
    });
    if (res.data.status === 'success')
      location.assign('/admin-onyu/track?q=&page=1&limit=10');
  } catch (err) {
    alert(err.response.data.message);
  }
};

// Get an album from database and set value into input
var trackId = '';

// Edit an target album with data which entered by user
document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();

  let form = new FormData();
  trackId = document.querySelector('.hidden_id').value;
  form.append('songName', document.getElementById('songSelect').value);
  form.append('producer', document.getElementById('producerSelect').value);
  form.append('price', document.getElementById('price').value);
  form.append('priceDiscount', document.getElementById('priceDiscount').value);
  form.append('tracks', document.getElementById('trackFile').files[0]);
  form.append('description', document.getElementById('description').value);
  var btn = document.querySelector('.btn');
  btn.style.background = 'grey';
  btn.innerHTML = 'Loading....';
  btn.disabled = 'true';
  editTrack(trackId, form);
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
    $('.pagination').find('.pageNumber.active').prev().addClass('active');
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
/**************
 *  PAGINATION
 **************/

let i = 10;
// For Hover design, and move to another page
$(document).on('click', '.load-button', function () {
  let length = parseInt(document.querySelector('#currentLength').value);
  let limit = 10 + i;
  if (length % 10 > 0) {
    length += 10;
  }
  if (length < limit) {
    alert('You have been end of data');
  } else {
    $('#albumTable').load(`track-post?page=1&limit=${limit}` + ' #albumTable');
    i += 10;
    $('#albumModal').animate({ scrollTop: 1000000 }, 800);
  }
});
var counter = 0;
const createTrack = async (track) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/admin-onyu/track-post/',
      data: track,
    });

    if (res.data.status === 'success')
      location.assign('/admin-onyu/track?page=1&limit=10');
  } catch (err) {
    console.log(err.response.data.message);
  }
};

document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();
  var songName = document.getElementById('songSelect');
  var producer = document.getElementById('producerSelect');
  let form = new FormData();
  if (songName.value === 'Please Select a Song') {
    alert('Please select album name');
  } else if (producer.value === 'default') {
    // producer.appendChild('<span>Select a song Pleas!</span>');
    alert("Please select producer's name");
  } else {
    form.append('album', document.getElementById('hiddenId').value);
    form.append('songName', songName.value);
    form.append('producer', producer.value);
    form.append('price', document.getElementById('price').value);
    form.append(
      'priceDiscount',
      document.getElementById('priceDiscount').value
    );
    form.append('tracks', document.getElementById('trackFile').files[0]);
    form.append('description', document.getElementById('description').value);

    var btn = document.querySelector('.btn');
    btn.style.background = 'grey';
    btn.innerHTML = 'Loading....';
    btn.disabled = 'true';

    createTrack(form);
  }
});
/****************
 * Search an Album
 *****************/

// getting all required elements
const searchAlbumWrapper = document.querySelector('.search-input');
const inputAlbumBox = searchAlbumWrapper.querySelector('input');
const iconAlbum = document.querySelector('.search-icon');
const suggAlbumBox = searchAlbumWrapper.querySelector('.autocom-box');

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
function albumDelay(fn, ms) {
  let timer = 0;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(fn.bind(this, ...args), ms || 0);
  };
}
// if user press any key and release, query working and refresh only table
inputAlbumBox.onkeyup = albumDelay((e) => {
  let userData = e.target.value; //user enetered data
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
iconAlbum.addEventListener('click', (e) => {
  let userData = inputAlbumBox.value;
  if (userData)
    $('#dynamicTable').load(
      `album?q=${userData}&page=1&limit=10` + ' #dynamicTable'
    );
});
/****************
 * Search an Track
 *****************/

// getting all required elements
const searchTrackWrapper = document.querySelector('.search-input');
const inputTrackBox = searchTrackWrapper.querySelector('input');
const iconTrack = document.querySelector('.search-icon');
const suggtrackBox = searchTrackWrapper.querySelector('.autocom-box');

//To delay every execusion when user typing search keyword.
function trackDelay(fn, ms) {
  let timer = 0;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(fn.bind(this, ...args), ms || 0);
  };
}
// if user press any key and release, query working and refresh only table
inputTrackBox.onkeyup = trackDelay((e) => {
  let userData = e.target.value; //user enetered data
  if (userData) {
    $('#dynamicTable').load(
      `/admin-onyu/track-post?q=${userData}&page=1&limit=10` + ' #dynamicTable'
    );
    window.history.pushState({}, '', `track?q=${userData}&page=1&limit=10`);
  } else {
    $('#dynamicTable').load(`track-post?page=1&limit=10` + ' #dynamicTable');
    window.history.pushState(
      {},
      '',
      `track-post?q=${userData}&page=1&limit=10`
    );
  }
}, 500);

// When user click search icon
iconTrack.addEventListener('click', (e) => {
  let userData = inputTrackBox.value;
  if (userData)
    $('#dynamicTable').load(
      `track-post?q=${userData}&page=1&limit=10` + ' #dynamicTable'
    );
});

function renderAudioFiles(filename, num) {
  var wavesurfer = WaveSurfer.create({
    container: document.querySelector(`#waveform-${num}`),
    waveColor: 'hsl(44, 0%, 70%)',
    progressColor: 'hsl(25, 100%, 63%)',
    height: 100,
    cursorWidth: 3,
    cursorHeight: 3,
    barWidth: 5,
    barHeight: 4, // the height of the wave
    barGap: 1,
    barRadius: 2,
    zIndex: 1,
    plugins: [
      WaveSurfer.regions.create({
        regions: [
          {
            id: `waveform-${num}`,
            start: 40,
            end: 120,
            loop: false,
          },
        ],
      }),
    ],
  });
  wavesurfer.load(`/data/tracks/${id}/${filename}.wav`);
  return wavesurfer;
}
// waveColor: 'hsl(44, 0%, 87%)',
// Rendering waveform that would save uder file name
var wavesurfer = [];
var id;
if (document.querySelector('.hidden_id') !== null) {
  id = document.querySelector('.hidden_id').value;
}

var files = [];
files = document.querySelectorAll('#filename');
var waveNum = 0;

// To render wave controllers and waveform.
files.forEach((el) => {
  var filename = el.innerHTML;
  var waveForm = document.querySelectorAll('.wave-form');
  var waveConWrapper = document.querySelectorAll('.wave-control-wrapper');
  var controlDiv = document.createElement('div');
  var waveDiv = document.createElement('div');

  // Wave controller such as mute and solo
  var controller = waveConWrapper[waveNum].appendChild(controlDiv);
  controller.id = 'wave-controller';
  controller.className = 'wave-controller';

  // Generate mute button
  var muteBtn = document.createElement('label');
  var muteCheck = document.createElement('input');
  muteCheck.type = 'checkbox';
  muteCheck.id = `mute-check-${waveNum}`;
  muteCheck.className = 'mute-check';
  muteCheck.value = filename;
  muteBtn.id = 'mute-btn';
  muteBtn.innerHTML = 'Mute';
  muteBtn.setAttribute('for', `mute-check-${waveNum}`);
  controller.appendChild(muteCheck);
  controller.appendChild(muteBtn);

  // Generate solo button
  var soloBtn = document.createElement('label');
  var soloCheck = document.createElement('input');
  soloCheck.type = 'checkbox';
  soloCheck.id = `solo-check-${waveNum}`;
  soloCheck.className = 'solo-check';
  soloCheck.value = filename;
  soloBtn.id = 'solo-btn';
  soloBtn.innerHTML = 'Solo';
  soloBtn.setAttribute('for', `solo-check-${waveNum}`);
  controller.appendChild(soloCheck);
  controller.appendChild(soloBtn);

  // Generate Select checkbox
  var selectDiv = document.createElement('div');
  var selectCheck = document.createElement('input');
  var selectBtn = document.createElement('label');
  selectDiv.className = 'select-wrapper';
  selectCheck.type = 'checkbox';
  selectCheck.id = `select-check-${waveNum}`;
  selectCheck.className = 'select-check';
  selectCheck.value = filename;
  selectBtn.id = 'select-btn';
  selectBtn.innerHTML = 'Select';
  selectBtn.setAttribute('for', `select-check-${waveNum}`);
  selectDiv.appendChild(selectCheck);
  selectDiv.appendChild(selectBtn);
  controller.appendChild(selectDiv);

  // Wave from
  var wave = waveForm[waveNum].appendChild(waveDiv);
  wave.id = `waveform-${waveNum}`;
  wave.className = 'wave';

  // Rendering
  wavesurfer[wave.id] = renderAudioFiles(filename, waveNum);

  waveNum++;
});

// formatTime(start, end) {
//   if (this.formatTimeCallback) {
//       return this.formatTimeCallback(start, end);
//   }
//   return (start == end ? [start] : [start, end])
//       .map((time) =>
//           [
//               Math.floor((time % 3600) / 60), // minutes
//               ('00' + Math.floor(time % 60)).slice(-2) // seconds
//           ].join(':')
//       )
//       .join('-');
// }
var cursor = document.querySelector('.cursor');
if (cursor !== null) {
  cursor.style.zIndex = 4;
  cursor.style.height = `${152 * waveNum}px`;
}

var wave = document.querySelectorAll('.wave');
var playChecker = document.getElementById('playChecker');

function delay(delayInms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
  });
}
async function playToPause() {
  document.getElementById('playbtn').className = 'fas fa-spinner';
  let delayers = await delay(8000);
  document.getElementById('playPause').checked = false;
  document.getElementById('playbtn').className = 'far fa-play-circle';
}
playToPause();

// When click play button, audio sources will play simultaneously
document.getElementById('playbtn').addEventListener('click', function () {
  if (playChecker.checked && wavesurfer['waveform-0'].getCurrentTime() === 0) {
    playChecker.checked = false;
  }
  if (playChecker.checked) {
    wave.forEach(async (track) => {
      if (Math.floor(wavesurfer[track.id].getCurrentTime()) === 120) {
        await wavesurfer[track.id].setCurrentTime(40);
        playChecker.checked = false;
      }
      if (wavesurfer[track.id].isPlaying()) {
        await wavesurfer[track.id].pause();
      } else {
        if (await wavesurfer[track.id].isReady) {
          document.getElementById('playbtn').className = 'fas fa-spinner';
          setTimeout(function () {
            wavesurfer[track.id].play(
              wavesurfer[track.id].getCurrentTime(),
              120
            );
          }, 3000);
        }
      }
    });
  } else {
    wave.forEach(async (track) => {
      if (Math.floor(wavesurfer[track.id].getCurrentTime()) === 120) {
        await wavesurfer[track.id].setCurrentTime(40);
        playChecker.checked = false;
      }
      if (wavesurfer[track.id].isPlaying()) {
        await wavesurfer[track.id].pause();
        playChecker.checked = true;
      } else {
        if (await wavesurfer[track.id].isReady) {
          wavesurfer[track.id].regions.list[track.id].play();
          // wavesurfer[track.id].playPause();
        }
      }
    });
  }
});

// This is kind of trick, 'waveform-0' is always working, even if it is muted
// when audio files are playing, pause icon will appear.
wavesurfer['waveform-0'].on('play', function () {
  document.getElementById('playPause').checked = true;
  document.getElementById('playbtn').className = 'far fa-pause-circle';
});

// when audio files are paused, play icon will appear.
wavesurfer['waveform-0'].on('pause', function () {
  document.getElementById('playPause').checked = false;
  document.getElementById('playbtn').className = 'far fa-play-circle';
});

var trackField = document.querySelector('.track-testfield');
var currentPos;
var percentage;
var offsetX = 390;

// When mouse moves on track-testfield div, cursor will move.
trackField.addEventListener('mousemove', (e) => {
  cursor.style.left = e.x - offsetX + 'px';
  if (e.x - offsetX <= 122) {
    cursor.style.left = '122px';
    currentPos = 1;
  }
});
var duration = 0;
// To set time for playing that clicked section.
trackField.addEventListener('click', (e) => {
  playChecker.checked = true;
  duration = wavesurfer['waveform-0'].getDuration();
  percentage = ((e.x - 510) / 500) * 100;
  currentPos = (percentage * duration) / 100;
  if (currentPos >= 40 && currentPos <= 120) {
    wave.forEach(async (track) => {
      if (wavesurfer[track.id].isPlaying()) {
        await wavesurfer[track.id].setCurrentTime(currentPos);
        await wavesurfer[track.id].play(
          wavesurfer[track.id].getCurrentTime(),
          120
        );
      } else {
        if (await wavesurfer[track.id].isReady) {
          wavesurfer[track.id].setCurrentTime(currentPos);
        }
      }
    });
  }
});

// To mute a audio file.
$('input.mute-check:checkbox').click(function () {
  var id = $(this).attr('id').split('-')[2];
  wavesurfer[`waveform-${id}`].toggleMute();
});

// Only an audio file play, otherwise mute.
$('input.solo-check:checkbox').click(function () {
  var soloCheck = document.querySelectorAll('.solo-check');
  var muteCheck = document.querySelectorAll('.mute-check');
  var id = {};

  soloCheck.forEach((element) => {
    id = element.id.split('-')[2];
    if (this.checked === false) {
      element.checked = false;
      muteCheck[id].checked = false;
      wavesurfer[`waveform-${id}`].setMute(false);
    } else {
      if ($(this).attr('id') !== element.id) {
        element.checked = false;

        muteCheck[id].checked = true;
        wavesurfer[`waveform-${id}`].setMute(true);
      } else {
        muteCheck[id].checked = false;
        wavesurfer[`waveform-${id}`].setMute(false);
      }
    }
  });
  $(this).checked = true;
});
