(function() {
    const { ipcRenderer } = require('electron');
    const QRCode = require('qrcode');
    const html2canvas = require('html2canvas');
    

    document.getElementById('searchImpoundedButton').addEventListener('click', async () => {
        const impoundedUniqueCode = document.getElementById('impoundedUniqueCode').value;

        if (!impoundedUniqueCode) {
            alert('يرجى إدخال كود المحجوزة.'); // Prompt user to enter code
            return;
        }

        try {
            const impoundedDetails = await ipcRenderer.invoke('get-impounded-details', impoundedUniqueCode);
            console.log('Impounded details received:', impoundedDetails);

            if (impoundedDetails) {
                // Populate the form with retrieved details
                document.getElementById('vehicleNumber').value = impoundedDetails.impoundedVehicleNumber || '';
                document.getElementById('vehicleType').value = impoundedDetails.impoundedVehicleType || '';
                document.getElementById('model').value = impoundedDetails.impoundedModel || '';
                document.getElementById('color').value = impoundedDetails.impoundedColor || '';
                document.getElementById('vehicleChassisNumber').value = impoundedDetails.impoundedVehicleChassisNumber || '';
                document.getElementById('vehiclePlateNumber').value = impoundedDetails.impoundedVehiclePlateNumber || '';
            } else {
                alert('لم يتم العثور على تفاصيل المحجوزة.'); // No details found
            }
        } catch (error) {
            console.error('Error fetching impounded details:', error);
            alert('حدث خطأ أثناء استرجاع تفاصيل المحجوزة.'); // Error message
        }
    });

    document.getElementById('updateImpoundedButton').addEventListener('click', async () => {
        const impoundedUniqueCode = document.getElementById('impoundedUniqueCode').value;
        const impoundedBookNumberSent = document.getElementById('impoundedBookNumberSent').value;
        const impoundedBookQuantitySent = document.getElementById('impoundedBookQuantitySent').value;
        const impoundedBuyerName = document.getElementById('impoundedBuyerName').value;
        const impoundedDeliveryDate = document.getElementById('impoundedDeliveryDate').value;
        const impoundedSaleFormNumber = document.getElementById('impoundedSaleFormNumber').value;

        // Create an object to send to the main process
        const updateData = {
            impoundedBookNumberSent,
            impoundedBookQuantitySent,
            impoundedBuyerName,
            impoundedDeliveryDate,
            impoundedSaleFormNumber
        };

        try {
            const response = await ipcRenderer.invoke('update-impounded', impoundedUniqueCode, updateData);
            
            if (response.success) {
                alert(response.message); // Show success message
            } else {
                alert('فشل في تحديث البيانات.'); // Show failure message
            }
        } catch (error) {
            console.error('Error updating impounded details:', error);
            alert('حدث خطأ أثناء تحديث البيانات.'); // Error message
        }
    });

     // Update and print impounded details
     document.getElementById('updateAndPrintButton').addEventListener('click', async (event) => {
        event.preventDefault(); // Prevent the default form submission behavior

        const impoundedUniqueCode = document.getElementById('impoundedUniqueCode').value;
        const impoundedBookNumberSent = document.getElementById('impoundedBookNumberSent').value;
        const impoundedBookQuantitySent = document.getElementById('impoundedBookQuantitySent').value;
        const impoundedBuyerName = document.getElementById('impoundedBuyerName').value;
        const impoundedDeliveryDate = document.getElementById('impoundedDeliveryDate').value;
        const impoundedSaleFormNumber = document.getElementById('impoundedSaleFormNumber').value;

        // Create an object to send to the main process
        const updateData = {
            impoundedBookNumberSent,
            impoundedBookQuantitySent,
            impoundedBuyerName,
            impoundedDeliveryDate,
            impoundedSaleFormNumber
        };

        try {
            const response = await ipcRenderer.invoke('update-impounded', impoundedUniqueCode, updateData);
            
            if (response.success) {
                alert(response.message); // Show success message
                // Here you can add your print logic using html2canvas and QRCode
                await printImpoundedDetails(response.data); // Assuming you have a method to print
            } else {
                alert('حدث خطأ أثناء تحديث تفاصيل المحجوزة.'); // Error message
            }
        } catch (error) {
            console.error('Error updating impounded details:', error);
            alert('حدث خطأ أثناء تحديث تفاصيل المحجوزة.'); // Error message
        }
    });


    
 // Function to print impounded details
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
})();
