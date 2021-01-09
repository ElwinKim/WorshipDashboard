/**************
 *  PAGINATION
 **************/

let i = 10;
// For Hover design, and move to another page
$(document).on('click', '.load-button', function () {
  let length = parseInt(document.querySelector('#currentLength').value);
  let limit = 10 + i;
  if (length % 10 > 0) {
    length += 10;
  }
  if (length < limit) {
    alert('You have been end of data');
  } else {
    $('#albumTable').load(`track-post?page=1&limit=${limit}` + ' #albumTable');
    i += 10;
    $('#albumModal').animate({ scrollTop: 1000000 }, 800);
  }
});
