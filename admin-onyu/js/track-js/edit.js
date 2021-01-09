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
