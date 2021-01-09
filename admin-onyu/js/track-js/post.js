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
