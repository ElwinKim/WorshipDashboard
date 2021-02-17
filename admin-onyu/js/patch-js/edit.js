/**********************
 * Edit an Album Section
 ***********************/

//For Editing an album with PATCH REST API
const editPatch = async (id, form) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/admin-onyu/patch-edit/${id}`,
      data: form,
    });
    if (res.data.status === 'success')
      location.assign('/admin-onyu/patch?q=&page=1&limit=10');
  } catch (err) {
    alert(err.response.data.message);
  }
};
var patchId = '';

// Edit an target album with data which entered by user
document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();

  let form = new FormData();
  patchId = document.querySelector('.hidden_id').value;
  form.append('producer', document.getElementById('producerSelect').value);
  form.append('category', document.getElementById('category').value);
  form.append('title', document.getElementById('patchName').value);
  form.append('priceDiscount', document.getElementById('priceDiscount').value);
  form.append('price', document.getElementById('price').value);
  form.append('patch', document.getElementById('patchFile').files[0]);
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
  $('#upload-modal').addClass('show');

  var btn = document.querySelector('.btn');
  btn.style.background = 'grey';
  btn.innerHTML = 'Loading....';
  btn.disabled = 'true';

  editPatch(patchId, form);
});

var counter = document.getElementById('counterOfLink').value - 1;
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
