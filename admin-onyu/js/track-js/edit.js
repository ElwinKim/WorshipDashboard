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

// Edit an target album with data which entered by user
document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();
  var files = document.getElementById('trackFile').files;
  let form = new FormData();
  trackId = document.querySelector('.hidden_id').value;
  form.append('album', document.getElementById('hiddenId').value);
  form.append('songName', document.getElementById('songSelect').value);
  form.append('producer', document.getElementById('producerSelect').value);
  form.append('price', document.getElementById('price').value);
  form.append('priceDiscount', document.getElementById('priceDiscount').value);
  form.append('description', document.getElementById('description').value);

  if (droppedFiles) {
    Array.from(droppedFiles).forEach((f) => {
      form.append('tracks[]', f);
    });
  } else if (files) {
    for (var i = 0; i < files.length; i++) {
      form.append('tracks[]', files[i]);
    }
  }

  $('#upload-modal').addClass('show');

  var btn = document.querySelector('.btn');
  btn.style.background = 'grey';
  btn.innerHTML = 'Loading....';
  btn.disabled = 'true';
  editTrack(trackId, form);
});
