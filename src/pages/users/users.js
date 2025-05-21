(function() {
  const { ipcRenderer } = require('electron');
  let users = [];

  async function fetchUsers() {
    try {
      const fetchedUsers = await ipcRenderer.invoke('fetch-users');
      return fetchedUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  function displayUsers() {
    const userTable = document.getElementById('user-table');
    if (users && Array.isArray(users)) {
      userTable.innerHTML = '';

      users.forEach(user => {
        const row = document.createElement('tr');

        // Checkbox for selecting users
        const selectCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'select-user';
        checkbox.value = user.userID;
        selectCell.appendChild(checkbox);
        row.appendChild(selectCell);

        const idCell = document.createElement('td');
        idCell.textContent = user.userID;
        row.appendChild(idCell);

        const nameCell = document.createElement('td');
        nameCell.textContent = user.userFullName;
        row.appendChild(nameCell);

        const usernameCell = document.createElement('td');
        usernameCell.textContent = user.userName;
        row.appendChild(usernameCell);

        const createdAtCell = document.createElement('td');
        createdAtCell.textContent = new Date(user.created_at).toLocaleString();
        row.appendChild(createdAtCell);

        // Edit button
        const editCell = document.createElement('td');
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-warning btn-sm';
        editButton.textContent = 'تعديل';
        editButton.onclick = () => editUser(user);
        editCell.appendChild(editButton);
        row.appendChild(editCell);

        // Delete button
        const deleteCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm';
        deleteButton.textContent = 'حذف';
        deleteButton.onclick = () => deleteUser(user.userID);
        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        // Print buttons
        const printSizes = ['A4', 'A5', '80mm'];
        printSizes.forEach(size => {
          const printCell = document.createElement('td');
          const printButton = document.createElement('button');
          printButton.className = 'btn btn-info btn-sm';
          printButton.textContent = `طبع ${size}`;
          printButton.onclick = () => printUserDetails(user, size);
          printCell.appendChild(printButton);
          row.appendChild(printCell);
        });

        userTable.appendChild(row);
      });
    }
  }

  function printUserDetails(user, size) {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print User Details</title>');

    printWindow.document.write('<style>');
    if (size === 'A4') {
      printWindow.document.write('@media print { @page { size: A4; margin: 0; } body { margin: 0; } }');
    } else if (size === 'A5') {
      printWindow.document.write('@media print { @page { size: A5; margin: 0; } body { margin: 0; } }');
    } else if (size === '80mm') {
      printWindow.document.write('@media print { @page { width: 80mm; margin: 0; } body { margin: 0; } }');
    }
    printWindow.document.write('</style>');

    printWindow.document.write('</head><body>');
    printWindow.document.write('<div>');
    printWindow.document.write('<h1>Invoice</h1>');
    printWindow.document.write('<p>User ID: ' + user.userID + '</p>');
    printWindow.document.write('<p>User Name: ' + user.userName + '</p>');
    printWindow.document.write('<p>Full Name: ' + user.userFullName + '</p>');
    printWindow.document.write('<p>Created At: ' + new Date(user.created_at).toLocaleString() + '</p>');
    printWindow.document.write('</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  }

  function editUser(user) {
    const modal = document.getElementById('editUserModal');
    const closeButton = modal.querySelector('.close');
    const saveButton = document.getElementById('saveEditButton');
    const newFullNameInput = document.getElementById('newFullName');
    
    // Show the modal
    modal.style.display = 'block';
    
    // Pre-fill the input with the current user full name
    newFullNameInput.value = user.userFullName;
    
    // Close the modal when clicking on the close button
    closeButton.onclick = function () {
      modal.style.display = 'none';
    };
    
    // Close the modal when clicking outside the modal content
    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    };
    
    // Save the new name when the user clicks "Save"
    saveButton.onclick = function () {
      const newFullName = newFullNameInput.value.trim();
      if (newFullName && newFullName !== user.userFullName) {
        ipcRenderer.invoke('edit-user', user.userID, newFullName).then(() => {
          // Update the user in the users array
          user.userFullName = newFullName;
  
          // Only update the table without reloading the page
          displayUsers();
  
          // Close the modal after saving
          modal.style.display = 'none';
        }).catch(error => {
          console.error('Failed to edit user:', error);
        });
      }
    };
  }
  
  function deleteUser(userID) {
    if (confirm('هل انت متأكد من الحذف ؟?')) {
      ipcRenderer.invoke('delete-user', userID).then(() => {
        // Remove the user from the users array
        users = users.filter(user => user.userID !== userID);
  
        // Only update the table without reloading the page
        displayUsers();
      }).catch(error => {
        console.error('Failed to delete user:', error);
      });
    }
  }
  

  document.getElementById('filter-button').addEventListener('click', () => {
    const filterName = document.getElementById('filter-name').value.toLowerCase();
    const filterUsername = document.getElementById('filter-username').value.toLowerCase();
    const filterCreated = document.getElementById('filter-created').value;

    const filteredUsers = users.filter(user => {
      const matchesName = user.userFullName.toLowerCase().includes(filterName);
      const matchesUsername = user.userName.toLowerCase().includes(filterUsername);
      const matchesCreated = filterCreated ? user.created_at.startsWith(filterCreated) : true;
      return matchesName && matchesUsername && matchesCreated;
    });

    users = filteredUsers;
    displayUsers();
  });

  (async () => {
    try {
      users = await fetchUsers();
      displayUsers();
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  })();

  document.addEventListener('DOMContentLoaded', () => {
    displayUsers();
  });
})();
