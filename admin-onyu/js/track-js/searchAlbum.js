/****************
 * Search an Album
 *****************/

// getting all required elements
const searchWrapper = document.querySelector('.search-input');
const inputBox = searchWrapper.querySelector('input');
const icon = document.querySelector('.search-icon');
const suggBox = searchWrapper.querySelector('.autocom-box');

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
      `/admin-onyu/track-post?q=${userData}&page=1&limit=10` + ' #dynamicTable'
    );
    window.history.pushState({}, '', `track?q=${userData}&page=1&limit=10`);
  } else {
    $('#dynamicTable').load(`track-post?page=1&limit=10` + ' #dynamicTable');
    window.history.pushState(
      {},
      '',
      `track-post?q=${userData}&page=1&limit=10`
    );
  }
}, 500);

// When user click search icon
icon.addEventListener('click', (e) => {
  let userData = inputBox.value;
  if (userData)
    $('#dynamicTable').load(
      `track-post?q=${userData}&page=1&limit=10` + ' #dynamicTable'
    );
});
