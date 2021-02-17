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
var inputPads = document.querySelector('#padFile');
var dropFileForm = document.getElementById('pad-files');
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

inputPads.addEventListener('change', (e) => {
  const fileList = inputPads.files;
  if (fileList.length > 1) {
    fileLabelText.innerText = fileList.length + ' files selected';
  } else {
    fileLabelText.innerText = fileList[0].name;
  }
});

document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();
  var padName = document.getElementById('padName');
  var producer = document.getElementById('producerSelect');
  var files = document.getElementById('padFile').files;
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
    if (droppedFiles) {
      Array.from(droppedFiles).forEach((f) => {
        form.append('pads[]', f);
      });
    } else if (files) {
      for (var i = 0; i < files.length; i++) {
        form.append('pads[]', files[i]);
      }
    }

    $('#upload-modal').addClass('show');
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
