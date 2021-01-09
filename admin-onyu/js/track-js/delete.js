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
