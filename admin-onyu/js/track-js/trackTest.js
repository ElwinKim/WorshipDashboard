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
  wavesurfer.load(
    `https://elwinadmin.blob.core.windows.net/track-${id}/${filename}.wav`
  );
  return wavesurfer;
}
// waveColor: 'hsl(44, 0%, 87%)',
// Rendering waveform that would save uder file name
var wavesurfer = [];
const id = document.querySelector('.hidden_id').value;
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
cursor.style.zIndex = 4;
cursor.style.height = `${152 * waveNum}px`;
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

// /*************
//  * Merge Files
//  **************/
// const mergeTracks = async (files, duration) => {
//   try {
//     const res = await axios({
//       method: 'POST',
//       url: `/admin-onyu/merge-track`,
//       data: {
//         files,
//         duration,
//       },
//     });
//     if (res.data.status === 'success') {
//       location.reload;
//     }
//   } catch (err) {
//     alert(err.response.data.message);
//   }
// };

// var keyNum = 0;
// var mergeButton = document.querySelector('.merge-btn');
// var checkedBox = [];
// var query = '';

// mergeButton.addEventListener('click', (e) => {
//   var selected = document.querySelectorAll('.select-check');
//   var realDuration = Math.floor(duration / 60) * 1000;
//   realDuration = realDuration * 100;
//   selected.forEach((el) => {
//     if (el.checked) {
//       checkedBox.push(el.value);
//       keyNum++;
//     }
//   });

//   mergeTracks(checkedBox, realDuration);
// });
