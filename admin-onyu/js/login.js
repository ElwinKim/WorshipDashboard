// const axios = require('axios');
const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      location.assign('/admin-onyu/main');
    }
  } catch (err) {
    if (document.querySelector('.login-err')) {
    } else {
      const errorMessage = `<div class="login-err"> ${err.response.data.message} </div>`;
      document
        .querySelector('.form')
        .insertAdjacentHTML('afterbegin', errorMessage);
    }
  }
};

document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
});
