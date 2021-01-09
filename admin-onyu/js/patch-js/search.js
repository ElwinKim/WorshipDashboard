/****************
 * Search an Album
 *****************/

// getting all required elements
const searchWrapper = document.querySelector('.search-input');
const inputBox = searchWrapper.querySelector('input');
const icon = document.querySelector('.search-icon');
const suggBox = searchWrapper.querySelector('.autocom-box');

function activeNumber() {
  console.log('haha');
  var pageNum = document.getElementById('currentPage').value;
  var content = document.querySelector('.content-wrapper');
  var pages = document.querySelectorAll('.pageNumber');

  pages.forEach((element) => {
    console.log(pageNum);
    console.log(element.querySelector('.span').innerHTM);
    if (pageNum === element.querySelector('.span').innerHTML) {
      element.classList.add('active');
    }
  });
}

//To delay every execusion when user typing search keyword.
function delay(fn, ms) {
  let timer = 0;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(fn.bind(this, ...args), ms || 0);
  };
}
// if user press any key and release, query working and refresh only table
inputBox.onkeyup = delay((e) => {
  let userData = e.target.value; //user enetered data
  if (userData) {
    $('#dynamicTable').load(
      `/admin-onyu/patch?q=${userData}&page=1&limit=10` + ' #dynamicTable',
      function () {
        var pageNum = document.getElementById('currentPage').value;
        var content = document.querySelector('.content-wrapper');
        var pages = document.querySelectorAll('.pageNumber');

        pages.forEach((element) => {
          if (pageNum === element.querySelector('.span').innerHTML) {
            element.classList.add('active');
          }
        });
      }
    );
    window.history.pushState({}, '', `patch?q=${userData}&page=1&limit=10`);
  } else {
    $('#dynamicTable').load(
      `patch?q=&page=1&limit=10` + ' #dynamicTable',
      function () {
        var pageNum = document.getElementById('currentPage').value;
        var content = document.querySelector('.content-wrapper');
        var pages = document.querySelectorAll('.pageNumber');

        pages.forEach((element) => {
          if (pageNum === element.querySelector('.span').innerHTML) {
            element.classList.add('active');
          }
        });
      }
    );
    window.history.pushState({}, '', `album?q=${userData}&page=1&limit=10`);
  }
}, 500);

// When user click search icon
icon.addEventListener('click', (e) => {
  let userData = inputBox.value;
  if (userData)
    $('#dynamicTable').load(
      `patch?q=${userData}&page=1&limit=10` + ' #dynamicTable'
    );
});
