const loginForm = document.getElementById('loginForm');
const dataForm = document.getElementById('dataForm');
const loginDiv = document.getElementById('login');
const dataEntryDiv = document.getElementById('dataEntry');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const loginData = Object.fromEntries(formData);

  try {
    const response = await fetch('https://docs.google.com/spreadsheets/d/1a8XzNpLMn9Ib5FmE193nd8jylug2ec3qJjgAnYd7NWU/edit?gid=581216585#gid=581216585_URL', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData) 
    });

    if (response.ok) {
      loginDiv.style.display = 'none';
      dataEntryDiv.style.display = 'block';
      resultDiv.textContent = await response.text();
    } else {
      resultDiv.textContent = 'Invalid credentials.';
    }
  } catch (error) {
    resultDiv.textContent = 'Network error.';
  } finally {
    loadingDiv.style.display = 'none'; // Hide loading indicator
  }
});

dataForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  loadingDiv.style.display = 'block'; // Show loading indicator

  const formData = new FormData(dataForm);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch('https://docs.google.com/spreadsheets/d/1a8XzNpLMn9Ib5FmE193nd8jylug2ec3qJjgAnYd7NWU/edit?gid=581216585#gid=581216585', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data) 
    });

    if (response.ok) {
      resultDiv.textContent = await response.text();
    } else {
      resultDiv.textContent = 'Error submitting data.';
    }
  } catch (error) {
    resultDiv.textContent = 'Network error.';
  } finally {
    loadingDiv.style.display = 'none'; // Hide loading indicator
  }
});