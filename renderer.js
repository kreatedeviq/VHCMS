const { ipcRenderer } = require('electron');

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  ipcRenderer.send('login-request', { username, password });
});

ipcRenderer.on('login-response', (event, response) => {
  const messageElement = document.getElementById('message');
  messageElement.innerText = response.message;

  if (response.success) {
    messageElement.style.color = 'green';

    // Save userID and userFullName to localStorage
    localStorage.setItem('user', JSON.stringify({
      userID: response.user.userID,
      userFullName: response.user.userFullName
    }));

    console.log('Login successful!');
  } else {
    messageElement.style.color = 'red';
  }

  // Clear the message after 3 seconds
  setTimeout(() => {
    messageElement.innerText = '';
  }, 3000);
});

// Add event listener for the "Check MySQL Connection" button
document.getElementById('checkConnectionButton').addEventListener('click', () => {
  ipcRenderer.send('check-mysql-connection');
});

// Add event listener for the "Start MySQL" button
document.getElementById('startMySQLButton').addEventListener('click', () => {
  ipcRenderer.send('start-mysql');
  document.getElementById('message2').innerText = 'Starting MySQL...'; // Provide immediate feedback

  // Clear the starting message after 3 seconds
  setTimeout(() => {
    document.getElementById('message2').innerText = '';
  }, 3000);
});

// Handle MySQL connection check response
ipcRenderer.on('mysql-connection-response', (event, isConnected) => {
  const connectionMessageElement = document.getElementById('connectionMessage');
  if (isConnected) {
    connectionMessageElement.innerText = 'تم الاتصال بنجاح !';
    connectionMessageElement.style.color = 'green';
  } else {
    connectionMessageElement.innerText = 'فشل في الاتصال.';
    connectionMessageElement.style.color = 'red';
  }

  // Clear the connection message after 3 seconds
  setTimeout(() => {
    connectionMessageElement.innerText = '';
  }, 3000);
});

// Handle MySQL start responses
ipcRenderer.on('mysql-start-response', (event, message) => {
  const message2Element = document.getElementById('message2');
  message2Element.innerText = message;
  console.log('MySQL Start Response:', message); // Log each response message to the console

  // Clear the start response message after 3 seconds
  setTimeout(() => {
    message2Element.innerText = '';
  }, 3000);
});

// Handle sequential MySQL update messages
ipcRenderer.on('mysql-update-message', (event, message) => {
  const message2Element = document.getElementById('message2');
  message2Element.innerText = message;
  console.log('MySQL Update Message:', message); // Log each update message to the console

  // Clear the update message after 3 seconds
  setTimeout(() => {
    message2Element.innerText = '';
  }, 3000);
});


document.getElementById('exitButton').addEventListener('click', () => {
  console.log('Exit button clicked. Exiting the app...');
  ipcRenderer.send('exit-app'); // Send a message to the main process to exit the app
});