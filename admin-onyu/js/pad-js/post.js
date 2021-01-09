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
