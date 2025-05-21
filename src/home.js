const { ipcRenderer } = require('electron');

// Function to load a new page
function loadPage(htmlUrl, jsUrl, cssUrl) {
  console.log(`Loading page: ${htmlUrl}`);
  fetch(htmlUrl)
    .then(response => {
      console.log(`Fetched HTML for: ${htmlUrl}`);
      return response.text();
    })
    .then(html => {
      // Update the content area with the new HTML
      document.getElementById('content').innerHTML = html;
      console.log(`Updated content area with HTML from: ${htmlUrl}`);
      
      // Load the new JavaScript and CSS files
      loadScripts(jsUrl);
      loadStyles(cssUrl);
    })
    .catch(err => {
      console.error('Failed to load page:', err);
    });
}

// Function to dynamically load a JavaScript file
function loadScripts(scriptUrl) {
  console.log(`Loading script: ${scriptUrl}`);
  const script = document.createElement('script');
  script.src = scriptUrl;
  script.onload = () => console.log(`Loaded script successfully: ${scriptUrl}`);
  script.onerror = () => console.error(`Failed to load script: ${scriptUrl}`);
  document.head.appendChild(script);
}

// Function to dynamically load a CSS file
function loadStyles(stylesheetUrl) {
  console.log(`Loading stylesheet: ${stylesheetUrl}`);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = stylesheetUrl;
  link.onload = () => console.log(`Loaded stylesheet successfully: ${stylesheetUrl}`);
  link.onerror = () => console.error(`Failed to load stylesheet: ${stylesheetUrl}`);
  document.head.appendChild(link);
}

// Add event listeners for buttons to load pages
document.getElementById('btn1').addEventListener('click', async () => {
  console.log('Button 1 clicked. Loading users page...');
  loadPage('pages/users/users.html', 'pages/users/users.js', 'pages/users/users.css');
});

document.getElementById('btn2').addEventListener('click', () => {
  console.log('Button 2 clicked. Loading vhimports page...');
  loadPage('pages/vhimports/vhimports.html', 'pages/vhimports/vhimports.js', 'pages/vhimports/vhimports.css');
});

document.getElementById('btn3').addEventListener('click', () => {
  console.log('Button 3 clicked. Loading vhexports page...');
  loadPage('pages/vhexports/vhexports.html', 'pages/vhexports/vhexports.js', 'pages/vhexports/vhexports.css');
});

document.getElementById('exitButton').addEventListener('click', () => {
  console.log('Exit button clicked. Exiting the app...');
  ipcRenderer.send('exit-app'); // Send a message to the main process to exit the app
});

document.getElementById('btn4').addEventListener('click', () => {
  console.log('Button 4 clicked. Loading addImpoundeds page...');
  loadPage('pages/addImpoundeds/addImpoundeds.html', 'pages/addImpoundeds/addImpoundeds.js', 'pages/addImpoundeds/addImpoundeds.css');
});

document.getElementById('btn5').addEventListener('click', () => {
  console.log('Button 5 clicked. Loading sendImpoundeds page...');
  loadPage('pages/sendImpoundeds/sendImpoundeds.html', 'pages/sendImpoundeds/sendImpoundeds.js', 'pages/sendImpoundeds/sendImpoundeds.css');
});

document.getElementById('btn6').addEventListener('click', () => {
  console.log('Button 6 clicked. Loading bikeimports page...');
  loadPage('pages/bikeimports/bikeimports.html', 'pages/bikeimports/bikeimports.js', 'pages/bikeimports/bikeimports.css');
});

document.getElementById('btn7').addEventListener('click', () => {
  console.log('Button 7 clicked. Loading bikeexports page...');
  loadPage('pages/bikeexports/bikeexports.html', 'pages/bikeexports/bikeexports.js', 'pages/bikeexports/bikeexports.css');
});

document.getElementById('home').addEventListener('click', () => {
  console.log('Home button clicked. Reloading the page...');
  window.location.reload(); // Refreshes the current page
});



// Function to update the date and time
function updateDateTime() {
  const dateTimeElement = document.getElementById('dateTime');
  const now = new Date();
  
  // Format date and time (can be localized to Arabic)
  const date = now.toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const time = now.toLocaleTimeString('ar-IQ');
  
  // Display the formatted date and time
  dateTimeElement.innerHTML = `<strong>التاريخ:</strong> ${date} <br> <strong>الوقت:</strong> ${time}`;
}

// Update date and time every second
setInterval(updateDateTime, 1000);

// Initial call to display date and time immediately on load
updateDateTime();



// Function to fetch counts from the main process
async function fetchImpoundCounts() {
  try {
    const counts = await ipcRenderer.invoke('fetch-impoundeds-count');

    // Update the values in the impound boxes
    document.getElementById('receivedVehicles').innerText = counts.receivedVehicles || 0;
    document.getElementById('receivedBikes').innerText = counts.receivedBikes || 0;
    document.getElementById('deliveredVehicles').innerText = counts.deliveredVehicles || 0;
    document.getElementById('deliveredBikes').innerText = counts.deliveredBikes || 0;
    document.getElementById('archivedVehicles').innerText = counts.archivedVehicles || 0;
    document.getElementById('archivedBikes').innerText = counts.archivedBikes || 0;

  } catch (error) {
    console.error('Error fetching impounded counts:', error);
    alert('Error fetching counts. Please try again later.');
  }
}

// Call the function to fetch and display counts when the page loads
fetchImpoundCounts();


// Logging the initialization of the home.js file
console.log('home.js loaded and ready.');
