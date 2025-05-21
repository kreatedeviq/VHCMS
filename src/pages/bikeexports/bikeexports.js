
(function() {
  const { ipcRenderer } = require('electron');
  const QRCode = require('qrcode');
  const html2canvas = require('html2canvas'); // Use require instead

  let impoundeds = []; // Initialize as an empty array

  async function fetchImpoundeds() {
    try {
      // Fetch only 'Vehicle' type and 'RECIEVED' status
      const vehicleType = 'Bike'; 
      const status = 'DELIVERED'; 
      impoundeds = await ipcRenderer.invoke('fetch-impoundeds', vehicleType, status);
      displayImpoundeds(); // Display all impoundeds after fetching
    } catch (error) {
      console.error('Failed to fetch impoundeds:', error);
    }
  }

  function displayImpoundeds(filteredImpoundeds = impoundeds) {
    const impoundedTable = document.getElementById('impounded-table');
    impoundedTable.innerHTML = ''; // Clear the table before adding new rows

    if (filteredImpoundeds && Array.isArray(filteredImpoundeds)) {
      filteredImpoundeds.forEach(impounded => {
        const row = document.createElement('tr');

        
        // Impounded ID cell (second cell)
        const idCell = document.createElement('td');
        idCell.textContent = impounded.impoundedID; // Display impoundedID
        row.appendChild(idCell);

        // QR Code cell (second cell)
        const qrCodeCell = document.createElement('td');

        // Generate QR code as a data URL
        QRCode.toDataURL(impounded.impoundedUniqueCode, { width: 100, height: 100 }, (err, url) => {
          if (err) {
            console.error('Failed to generate QR code:', err);
            return;
          }

          // Create a container div to hold the image and text
          const qrCodeContainer = document.createElement('div');
          qrCodeContainer.style.textAlign = 'center';  // Center the content

          // Create an image element
          const qrImage = document.createElement('img');
          qrImage.src = url;           // Set the image source to the generated QR code URL
          qrImage.width = 75;         // Set the width of the QR code image
          qrImage.height = 75;        // Set the height of the QR code image

          // Create a text element
          const qrText = document.createElement('div');
          qrText.textContent = impounded.impoundedUniqueCode; // Display impoundedID

          // Append the image and the text to the container
          qrCodeContainer.appendChild(qrImage);
          qrCodeContainer.appendChild(qrText);

          // Append the container to the table cell
          qrCodeCell.appendChild(qrCodeContainer);
        });

        row.appendChild(qrCodeCell);



        const vehicleNumberCell = document.createElement('td');
        vehicleNumberCell.textContent = impounded.impoundedVehicleNumber; // Existing field
        row.appendChild(vehicleNumberCell);

        const vehicleTypeCell = document.createElement('td');
        vehicleTypeCell.textContent = 
            impounded.impoundedVehicleType === 'Vehicle' ? 'عجلة' : 
            impounded.impoundedVehicleType === 'Bike' ? 'دراجة' : ''; // Fallback to empty string
        row.appendChild(vehicleTypeCell);

        const modelCell = document.createElement('td');
        modelCell.textContent = impounded.impoundedModel; // Existing field
        row.appendChild(modelCell);

        const colorCell = document.createElement('td');
        colorCell.textContent = impounded.impoundedColor; // Existing field
        row.appendChild(colorCell);

        // New fields
        const chassisNumberCell = document.createElement('td');
        chassisNumberCell.textContent = impounded.vehicleChassisNumber; // New field
        row.appendChild(chassisNumberCell);

        const plateNumberCell = document.createElement('td');
        plateNumberCell.textContent = impounded.vehiclePlateNumber; // New field
        row.appendChild(plateNumberCell);

        const customsCaseNumberCell = document.createElement('td');
        customsCaseNumberCell.textContent = impounded.impoundedCustomsCaseNumber; // New field
        row.appendChild(customsCaseNumberCell);

        const receptionDateCell = document.createElement('td');
        // Assuming impounded.impoundedReceptionDate is a Date object or a string that can be parsed into a Date
        const receptionDate = new Date(impounded.impoundedReceptionDate);
        // Format the date to dd-mm-yyyy
        const formattedDate = `${String(receptionDate.getDate()).padStart(2, '0')}-${String(receptionDate.getMonth() + 1).padStart(2, '0')}-${receptionDate.getFullYear()}`;
        receptionDateCell.textContent = formattedDate; // Display the formatted date
        row.appendChild(receptionDateCell);
        

        const parkingSpotNumberCell = document.createElement('td');
        parkingSpotNumberCell.textContent = impounded.impoundedParkingSpotNumber; // New field
        row.appendChild(parkingSpotNumberCell);

        const bookNumberCell = document.createElement('td');
        bookNumberCell.textContent = impounded.impoundedBookNumber; // New field
        row.appendChild(bookNumberCell);

        const bookQuantityCell = document.createElement('td');
        bookQuantityCell.textContent = impounded.impoundedBookQuantity; // New field
        row.appendChild(bookQuantityCell);

        const receptionAuthorityCell = document.createElement('td');
        receptionAuthorityCell.textContent = impounded.impoundedRecieptionAuthority; // New field
        row.appendChild(receptionAuthorityCell);

        const damagePercentageCell = document.createElement('td');
        damagePercentageCell.textContent = impounded.impoundedDamagePercentage; // New field
        row.appendChild(damagePercentageCell);
        
        // Attachments button
        const attachmentsCell = document.createElement('td');
        if (impounded.impoundedReceptionAttachments && impounded.impoundedReceptionAttachments.length > 0) {
          const attachmentsButton = document.createElement('button');
          attachmentsButton.className = 'btn btn-info btn-sm';
          attachmentsButton.textContent = 'عرض المرفقات';
          attachmentsButton.onclick = () => showAttachmentsModal(impounded.impoundedReceptionAttachments);
          attachmentsCell.appendChild(attachmentsButton);
        }
        row.appendChild(attachmentsCell);

        // Scanned document button
        const documentsCell = document.createElement('td');
        if (impounded.impoundedReceptionDocuments && impounded.impoundedReceptionDocuments !== '') {
          const documentButton = document.createElement('button');
          documentButton.className = 'btn btn-info btn-sm';
          documentButton.textContent = 'عرض المستند';
          documentButton.onclick = () => showDocumentsModal(impounded.impoundedReceptionDocuments);
          documentsCell.appendChild(documentButton);
        }
        row.appendChild(documentsCell);

        // Edit button
        const editCell = document.createElement('td');
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-warning btn-sm';
        editButton.textContent = 'تعديل';
        editButton.onclick = () => editImpounded(impounded);
        editCell.appendChild(editButton);
        row.appendChild(editCell);

        // Delete button
        const deleteCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm';
        deleteButton.textContent = 'حذف';
        deleteButton.onclick = () => deleteImpounded(impounded.impoundedID);
        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        // Print buttons
        const printSizes = ['A4'];
        printSizes.forEach(size => {
          const printCell = document.createElement('td');
          const printButton = document.createElement('button');
          printButton.className = 'btn btn-info btn-sm';
          printButton.textContent = `طبع ${size}`;
          printButton.onclick = () => printImpoundedDetails(impounded, size);
          printCell.appendChild(printButton);
          row.appendChild(printCell);
        });

        impoundedTable.appendChild(row);
      });
    }
  }

  function showAttachmentsModal(attachments) {
    const { shell } = require('electron'); // Import shell from Electron
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const attachmentsModal = document.getElementById('attachmentsModal');
    const attachmentsList = document.getElementById('attachments-list');
    let downloadMessage = document.createElement('p'); // Create a paragraph for the download message
    downloadMessage.style.color = 'green'; // Set text color to green for success message
    downloadMessage.id = 'download-message'; // Add an ID for easy access

    // Clear previous list and append new attachments
    attachmentsList.innerHTML = '';
    const files = JSON.parse(attachments);

    files.forEach(file => {
        const correctedPath = file.replace(/\\([^\\]+)\\\1/, '\\$1'); 

        const listItem = document.createElement('li');
        const fileLink = document.createElement('a');
        fileLink.href = '#';
        fileLink.textContent = correctedPath.split('\\').pop();

        // Open the file natively
        fileLink.onclick = (event) => {
            event.preventDefault();
            shell.openPath(correctedPath);
        };

        // Create a "Download" button
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download';
        downloadButton.className = 'btn btn-secondary btn-sm';

        downloadButton.onclick = (event) => {
            event.preventDefault();

            // Get the default downloads folder path
            const downloadsFolder = path.join(os.homedir(), 'Downloads');
            const fileName = path.basename(correctedPath); 
            const destinationPath = path.join(downloadsFolder, fileName); 

            // Copy the file to the downloads folder
            fs.copyFile(correctedPath, destinationPath, (err) => {
                if (err) {
                    console.error(`Failed to download file ${correctedPath}:`, err);
                    downloadMessage.textContent = 'Failed to download the file.'; // Set failure message
                    downloadMessage.style.color = 'red'; // Set text color to red for error
                } else {
                    console.log(`File downloaded to ${destinationPath}`);
                    downloadMessage.textContent = `File downloaded successfully`; // Success message
                    downloadMessage.style.color = 'green'; // Set text color to green for success
                }

                // Show the message and hide it after 1.5 seconds
                attachmentsList.appendChild(downloadMessage);
                clearTimeout(downloadMessage.timer); // Clear previous timer if set
                downloadMessage.timer = setTimeout(() => {
                    if (downloadMessage) {
                        downloadMessage.remove(); // Hide the message after 1.5 seconds
                    }
                }, 1500);
            });
        };

        listItem.appendChild(fileLink);
        listItem.appendChild(downloadButton);
        attachmentsList.appendChild(listItem);
    });

    // Show the modal
    attachmentsModal.style.display = 'block';

    // Close the modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == attachmentsModal) {
            attachmentsModal.style.display = 'none';
        }
    };

    // Close the modal on close button click
    document.querySelector('#attachmentsModal .close').onclick = () => {
        attachmentsModal.style.display = 'none';
    };
}



function showDocumentsModal(scannedDocumentPath) {
  const { shell } = require('electron'); // Import shell module from Electron

  // Open the scanned document directly in the system's default application
  shell.openPath(scannedDocumentPath)
      .then(result => {
          if (result) {
              console.error(`Failed to open document: ${result}`);
          }
      });
}

function editImpounded(impounded) {
  const modal = document.getElementById('editImpoundedModal');
  const closeButton = modal.querySelector('.close');
  const saveButton = document.getElementById('saveEditButton');
  const newVehicleNumberInput = document.getElementById('newVehicleNumber');

  // Show the modal
  modal.style.display = 'block';

  // Pre-fill the input with the current vehicle number
  newVehicleNumberInput.value = impounded.impoundedVehicleNumber;

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

  // Save the new vehicle number when the user clicks "Save"
  saveButton.onclick = function () {
    const newVehicleNumber = newVehicleNumberInput.value.trim();
    if (newVehicleNumber && newVehicleNumber !== impounded.impoundedVehicleNumber) {
      ipcRenderer.invoke('edit-impounded', impounded.impoundedID, newVehicleNumber).then(() => {
        // Update the impounded in the impoundeds array
        impounded.impoundedVehicleNumber = newVehicleNumber;

        // Only update the table without reloading the page
        displayImpoundeds();

        // Close the modal after saving
        modal.style.display = 'none';
      }).catch(error =>          {
        console.error('Failed to edit impounded:', error);
      });
    }
  };
}

function deleteImpounded(impoundedID) {
  if (confirm('هل انت متأكد من الحذف ؟?')) {
    ipcRenderer.invoke('delete-impounded', impoundedID).then(() => {
      // Remove the impounded from the impoundeds array
      impoundeds = impoundeds.filter(impounded => impounded.impoundedID !== impoundedID);

      // Only update the table without reloading the page
      displayImpoundeds();
    }).catch(error => {
      console.error('Failed to delete impounded:', error);
    });
  }
}


function filterImpoundeds() {
  document.getElementById('reset-button').style.display = 'inline-block'; // Show the cancel button

  const filterVehicleNumber = document.getElementById('filter-vehicle-number').value.toLowerCase();
  const filterVehicleType = document.getElementById('filter-vehicle-type').value.toLowerCase();
  const filterModel = document.getElementById('filter-model').value.toLowerCase();
  const filterColor = document.getElementById('filter-color').value.toLowerCase();
  const filterChassisNumber = document.getElementById('filter-chassis-number').value.toLowerCase();
  const filterPlateNumber = document.getElementById('filter-plate-number').value.toLowerCase();
  const filterCustomsCaseNumber = document.getElementById('filter-customs-case-number').value.toLowerCase();
  const filterReceptionDate = document.getElementById('filter-reception-date').value;
  const filterParkingSpot = document.getElementById('filter-parking-spot').value.toLowerCase();
  const filterBookNumber = document.getElementById('filter-book-number').value.toLowerCase();
  const filterBookQuantity = document.getElementById('filter-book-quantity').value.toLowerCase();
  const filterReceptionAuthority = document.getElementById('filter-reception-authority').value.toLowerCase();
  const filterDamagePercentage = document.getElementById('filter-damage-percentage').value.toLowerCase();

  const filteredImpoundeds = impoundeds.filter(impounded => {
    const matchesVehicleNumber = filterVehicleNumber && impounded.impoundedVehicleNumber.toLowerCase().includes(filterVehicleNumber);
    const matchesVehicleType = filterVehicleType && impounded.impoundedVehicleType.toLowerCase().includes(filterVehicleType);
    const matchesModel = filterModel && impounded.impoundedModel.toLowerCase().includes(filterModel);
    const matchesColor = filterColor && impounded.impoundedColor.toLowerCase().includes(filterColor);
    const matchesChassisNumber = filterChassisNumber && impounded.impoundedChassisNumber.toLowerCase().includes(filterChassisNumber);
    const matchesPlateNumber = filterPlateNumber && impounded.impoundedPlateNumber.toLowerCase().includes(filterPlateNumber);
    const matchesCustomsCaseNumber = filterCustomsCaseNumber && impounded.impoundedCustomsCaseNumber.toLowerCase().includes(filterCustomsCaseNumber);
    const matchesReceptionDate = filterReceptionDate && impounded.impoundedReceptionDate.startsWith(filterReceptionDate);
    const matchesParkingSpot = filterParkingSpot && impounded.impoundedParkingSpotNumber.toLowerCase().includes(filterParkingSpot);
    const matchesBookNumber = filterBookNumber && impounded.impoundedBookNumber.toLowerCase().includes(filterBookNumber);
    const matchesBookQuantity = filterBookQuantity && impounded.impoundedBookQuantity.toLowerCase().includes(filterBookQuantity);
    const matchesReceptionAuthority = filterReceptionAuthority && impounded.impoundedRecieptionAuthority.toLowerCase().includes(filterReceptionAuthority);
    const matchesDamagePercentage = filterDamagePercentage && impounded.impoundedDamagePercentage.toLowerCase().includes(filterDamagePercentage);

    // Return true if any of the filters match (OR condition)
    return (
      matchesVehicleNumber ||
      matchesVehicleType ||
      matchesModel ||
      matchesColor ||
      matchesChassisNumber ||
      matchesPlateNumber ||
      matchesCustomsCaseNumber ||
      matchesReceptionDate ||
      matchesParkingSpot ||
      matchesBookNumber ||
      matchesBookQuantity ||
      matchesReceptionAuthority ||
      matchesDamagePercentage
    );
  });

  displayImpoundeds(filteredImpoundeds);
}


// Function to reset all filter fields and fetch impoundeds again
function resetFilters() {
  document.getElementById('filter-vehicle-number').value = '';
  document.getElementById('filter-vehicle-type').value = '';
  document.getElementById('filter-model').value = '';
  document.getElementById('filter-color').value = '';
  document.getElementById('filter-chassis-number').value = '';
  document.getElementById('filter-plate-number').value = '';
  document.getElementById('filter-customs-case-number').value = '';
  document.getElementById('filter-reception-date').value = '';
  document.getElementById('filter-parking-spot').value = '';
  document.getElementById('filter-book-number').value = '';
  document.getElementById('filter-book-quantity').value = '';
  document.getElementById('filter-reception-authority').value = '';
  document.getElementById('filter-damage-percentage').value = '';

  // Re-fetch impoundeds
  fetchImpoundeds();
}

// Event listener for the reset button
document.getElementById('reset-button').addEventListener('click', resetFilters);



 // Initial fetch of impoundeds when the page loads
 (async () => {
  await fetchImpoundeds(); // Fetch all impoundeds
  document.getElementById('filter-button').addEventListener('click', filterImpoundeds); // Attach filter event listener
})();





async function printImpoundedDetails(impounded) {
  const qrCodeDataUrl = await QRCode.toDataURL(impounded.impoundedUniqueCode);
  
  // Construct the A4 print layout content
  const printContent = `
    <html lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Print Document</title>
        <link rel="stylesheet" href="./resources/assets/styles/bootstrap/css/bootstrap.min.css">
        <style>
          @media print {
                  @page {
                      size: A4; /* A4 size */
                      margin: 20mm; /* Adjust margins as needed */
                  }
              }
            .dotted {
                display: inline-block;
                min-width: 140px;
                border-bottom: 2px dotted lightgray;
                vertical-align: bottom;
                text-align: center;
                font-weight: bold;
            }
            .table-bordered th, .table-bordered td {
                border: 1px solid black !important;
            }
            .first-column {
                width: 200px !important;
                font-weight: bold;
                font-size: 20px;
            }
            .merged-header {
                text-align: center;
                font-weight: bold;
                font-size: 20px;
            }
            .chassis-cells {
                letter-spacing :  10px;
            }
        </style>
    </head>
    <body>
       <div class="row" style="padding-right: 30px; padding-left: 30px; margin: 0px;">
          <div class="col-4" style="line-height: 10px; direction: ltr; padding-top: 30px;">
            <h4>Republic of Iraq</h4>
            <h6>Ministry Of Finance</h6>
            <h6>General Commission For Customs</h6>
            <h6>Department Customs Region-Middle</h6>
          </div>
          <div class="col-4">
            <img src="./resources/assets/images/print-Logo.png" style="display: block; width: 200px; height: auto; margin: 0 auto;">
          </div>
          <div class="col-4" style="line-height: 10px; direction: rtl; padding-top: 30px;">
            <h4>جمهورية العراق</h4>
            <h6>وزارة المالية</h6>
            <h6>الهيئة العامة للكَمارك</h6>
            <h6>مديرية كمارك المنطقة الوسطى</h6>
          </div>
       </div>
       <div style="display: block; width: 97%; height: 2px; background-color: #d4d4d4; margin: 0 auto;"></div>
       <img src="${qrCodeDataUrl}" style="position: absolute; width: 150px; height: auto; left: 30px; top: 225px">
       <div class="row" style="padding-right: 30px; padding-left: 30px; padding-top: 20px; margin: 0px;">
          <div class="col-12">
            <h4 style="text-align: center;">( استلام عجلة )</h4>
          </div>
       </div>
       <div class="row" style="padding-right: 30px; padding-left: 30px; padding-top: 20px; margin: 0px; direction: rtl;">
          <div class="col-10">
            <p style="font-size: 20px; line-height: 50px;">
              كتاب رقم: <span class="dotted">${impounded.impoundedBookNumber}</span>
              العدد: <span class="dotted">${impounded.impoundedBookQuantity}</span>
              وقرار السيد قاضي التحقيق: <span class="dotted">${impounded.judgeName}</span>
              بالدعوى الكمركية المرقمة: <span class="dotted">${impounded.customsCaseNumber}</span>
              الجهة الواردة منها العجلة: <span class="dotted">${impounded.sourceAuthority}</span>
            </p>
            <p style="font-size: 24px; font-weight: bold;">
              تم استلام العجلة الموصولة أدناه وأودعت الى ساحة حجز مديرية كمرك المنطقة الوسطى
            </p>
            <p style="font-size: 24px; font-weight: bold;">
              ........ مـــــــــــــع الــــتــــقديـــــــر
            </p>
          </div>
          <div class="col-2"></div>
       </div>
       <table class="table table-bordered text-center" style="direction: rtl; margin: 20px auto; width: 100%;">
          <thead>
              <tr>
                  <th colspan="2" style="text-align: center; font-weight: bold; font-size: 20px;">المواصفات</th>
              </tr>
          </thead>
          <tbody>
              <tr>
                  <td class="first-column">رقم العجلة</td>
                  <td>${impounded.impoundedVehicleNumber || ''}</td>
              </tr>
              <tr>
                  <td class="first-column">نوع العجلة</td>
                  <td>
                      ${impounded.impoundedVehicleType === 'Vehicle' ? 'عجلة' : 
                        impounded.impoundedVehicleType === 'Bike' ? 'دراجة' : ''}
                  </td>
              </tr>
              <tr>
                  <td class="first-column">الموديل</td>
                  <td>${impounded.impoundedModel || ''}</td>
              </tr>
              <tr>
                  <td class="first-column">اللون</td>
                  <td>${impounded.impoundedColor || ''}</td>
              </tr>
              <tr>
                 <td class="first-column">رقم الشاصي</td>
                 <td class="chassis-cells" style="direction: ltr;">${impounded.chassisNumber || ''}</td>
              </tr>
              <tr>
                  <td class="first-column">بلد</td>
                  <td>${impounded.country || ''}</td>
              </tr>
              <tr>
                  <td class="first-column">رقم المحرك</td>
                  <td>${impounded.engineNumber || ''}</td>
              </tr>
              <tr>
                  <td class="first-column">نسبة الأضرار</td>
                  <td>${impounded.damagePercentage || ''}</td>
              </tr>
          </tbody>
      </table>
      <div style="text-align: center; margin-top: 30px;">
          <p style="font-size: 20px;">مسؤول ساحة الحجز والمصادرة</p>
          <p style="font-size: 20px; font-weight: bold;">2024 / 09 / </p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write(printContent);
  printWindow.document.close();

  // Use html2canvas to take a screenshot of the content
  await new Promise((resolve) => {
    printWindow.onload = () => {
      html2canvas(printWindow.document.body).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');

        // Create a new window for printing
        const imgWindow = window.open('', '', 'height=600,width=800');
        imgWindow.document.write(`<img src="${imgData}" style="width: 100%;">`);
        imgWindow.document.close();
        imgWindow.print();
        imgWindow.close();

        resolve();
      });
    };
  });
}



document.addEventListener('DOMContentLoaded', () => {
  displayImpoundeds();
});
})();


