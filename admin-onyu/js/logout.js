const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout',
    });
    if (res.data.status === 'success') location.assign('/admin-onyu/');
  } catch (err) {
    alert('Error logging out! Try again.');
  }
};

document.querySelector('.logout-btn').addEventListener('click', logout);
