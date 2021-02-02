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
        src: `https://elwinadmin.blob.core.windows.net/albumimages/${res['data'].doc['image']}`,
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
