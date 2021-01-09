/**************
 *  PAGINATION
 **************/

// To get current page number and add active to focus current page number
// document.querySelector('.number').addEventListener('reload', (e) => {
//   console.log('query');
//   var pageNum = document.getElementById('currentPage').value;
//   var pages = document.querySelectorAll('.pageNumber');
//   pages.forEach((element) => {
//     if (pageNum === element.querySelector('.span').innerHTML) {
//       element.classList.add('active');
//     }
//   });
// });
$(document).ready(function () {
  var pageNum = document.getElementById('currentPage').value;
  var content = document.querySelector('.content-wrapper');
  var pages = document.querySelectorAll('.pageNumber');
  pages.forEach((element) => {
    if (pageNum === element.querySelector('.span').innerHTML) {
      element.classList.add('active');
    }
  });
});

// For Hover design, and move to another page
$(document).on('click', '.next', function () {
  var pageNum = parseInt(document.getElementById('currentPage').value);
  var query = document.getElementById('currentQuery').value;
  if (
    $('.pagination').find('.pageNumber.active').next().attr('class') ===
    'pageSkip'
  ) {
    $('.pagination').find('.pageNumber.active').prev().removeClass('active');
    window.location.href = `/admin-onyu/pad?q=${query}&page=${
      pageNum + 1
    }&limit=10`;
  } else {
    $('.pagination').find('.pageNumber.active').next().addClass('active');
    $('.pagination').find('.pageNumber.active').prev().removeClass('active');
    var href = $('.pageNumber.active').find('.number').attr('href');
    $('#table').load(href + ' #table');
    document.getElementById('currentPage').value = pageNum + 1;
  }
});
$(document).on('click', '.prev', function () {
  var pageNum = parseInt(document.getElementById('currentPage').value);
  var query = document.getElementById('currentQuery').value;
  if (
    $('.pagination').find('.pageNumber.active').prev().attr('class') ===
    'pageSkip'
  ) {
    $('.pagination').find('.pageNumber.active').prev().addClass('active');
    $('.pagination').find('.pageNumber.active').next().removeClass('active');
    window.location.href = `/admin-onyu/pad?q=${query}&page=${
      pageNum - 1
    }&limit=10`;
  } else {
    $('.pagination').find('.pageNumber.active').prev().addClass('active');
    $('.pagination').find('.pageNumber.active').next().removeClass('active');
    var href = $('.pageNumber.active').find('.number').attr('href');
    $('#table').load(href + ' #table');
    document.getElementById('currentPage').value = pageNum - 1;
  }
});
