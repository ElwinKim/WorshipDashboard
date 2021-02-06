var counter = 0;
const createTrack = async (track) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/admin-onyu/track-post/',
      data: track,
    });
  } catch (err) {
    console.log(err.response.data.message);
  }
};

// Drag and Drop functions
var fileLabel = document.querySelector('#fileLabel');
fileLabel.addEventListener('dragover', (e) => {
  overrideDefault(e);
  fileHover();
});
fileLabel.addEventListener('dragenter', (e) => {
  overrideDefault(e);
  fileHover();
});
fileLabel.addEventListener('dragleave', (e) => {
  overrideDefault(e);
  fileHoverEnd();
});
fileLabel.addEventListener('drop', (e) => {
  overrideDefault(e);
  fileHoverEnd();
  addFiles(e);
});
var inputTracks = document.querySelector('#trackFile');
var dropFileForm = document.getElementById('track-files');
var fileLabelText = document.getElementById('fileLabelText');
var droppedFiles;
function overrideDefault(event) {
  event.preventDefault();
  event.stopPropagation();
}
function fileHover() {
  dropFileForm.classList.add('fileHover');
}
function fileHoverEnd() {
  dropFileForm.classList.remove('fileHover');
}
function addFiles(event) {
  droppedFiles =
    event.target.files || (event.dataTransfer && event.dataTransfer.files);
  showFiles(droppedFiles);
}
function showFiles(files) {
  if (files.length > 1) {
    fileLabelText.innerText = files.length + ' files selected';
  } else {
    fileLabelText.innerText = files[0].name;
  }
}

inputTracks.addEventListener('change', (e) => {
  const fileList = inputTracks.files;
  if (fileList.length > 1) {
    fileLabelText.innerText = fileList.length + ' files selected';
  } else {
    fileLabelText.innerText = fileList[0].name;
  }
});

document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();
  var songName = document.getElementById('songSelect');
  var producer = document.getElementById('producerSelect');
  var files = document.getElementById('trackFile').files;
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
    if (droppedFiles) {
      Array.from(droppedFiles).forEach((f) => {
        form.append('tracks[]', f);
      });
    } else if (files) {
      for (var i = 0; i < files.length; i++) {
        form.append('tracks[]', files[i]);
      }
    }

    form.append('description', document.getElementById('description').value);
    var btn = document.querySelector('.btn');
    btn.style.background = 'grey';
    btn.innerHTML = 'Loading....';
    btn.disabled = 'true';
    createTrack(form);
  }
});
