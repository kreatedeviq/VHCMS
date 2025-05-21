(function() {
    const { ipcRenderer } = require('electron');
  const QRCode = require('qrcode');
  const html2canvas = require('html2canvas'); // Use require instead

    let scannedDocumentPath = null;

    document.getElementById('addImpoundedForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await submitImpoundment(false); // Normal submit
    });

    document.getElementById('submitPrintButton').addEventListener('click', async () => {
        await submitImpoundment(true); // Submit & Print
    });

    document.getElementById('scanButton').addEventListener('click', async () => {
        await scanDocument();
    });

    async function submitImpoundment(printAfterSubmit) {
        const vehicleNumber = document.getElementById('vehicleNumber').value;
        const vehicleType = document.getElementById('vehicleType').value;
        const model = document.getElementById('model').value;
        const color = document.getElementById('color').value;
        const vehicleChassisNumber = document.getElementById('vehicleChassisNumber').value;
        const vehiclePlateNumber = document.getElementById('vehiclePlateNumber').value;
        const impoundedCustomsCaseNumber = document.getElementById('impoundedCustomsCaseNumber').value;
        const impoundedReceptionDate = document.getElementById('impoundedReceptionDate').value;
        const impoundedParkingSpotNumber = document.getElementById('impoundedParkingSpotNumber').value;
        const impoundedBookNumber = document.getElementById('impoundedBookNumber').value;
        const impoundedBookQuantity = document.getElementById('impoundedBookQuantity').value;
        const impoundedRecieptionAuthority = document.getElementById('impoundedRecieptionAuthority').value;
        const impoundedDamagePercentage = document.getElementById('impoundedDamagePercentage').value;

        const files = document.getElementById('receptionAttachments').files;

        // Display loader
        document.getElementById('loader').style.display = 'block';

        const fileArray = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fileArray.push({ name: file.name, buffer });
        }

        ipcRenderer.invoke('add-impounded', {
            vehicleNumber,
            vehicleType,
            model,
            color,
            vehicleChassisNumber,
            vehiclePlateNumber,
            impoundedCustomsCaseNumber,
            impoundedReceptionDate,
            impoundedParkingSpotNumber,
            impoundedBookNumber,
            impoundedBookQuantity,
            impoundedRecieptionAuthority,
            impoundedDamagePercentage,
            files: fileArray,
            scannedDocumentPath // Send scanned document path as well
        }).then(async (response) => {
            document.getElementById('loader').style.display = 'none';
            if (response.success) {
                const { impoundedID, impoundedUniqueCode } = response;

                document.getElementById('message').textContent = `تمت إضافة المركبة بنجاح. Folder: ${impoundedID}-${impoundedUniqueCode}`;
                document.getElementById('message').style.color = 'green';

                

                if (printAfterSubmit) {
                    await generateAndPrintA4Document(impoundedID, impoundedUniqueCode, {
                        vehicleNumber,
                        vehicleType,
                        model,
                        color,
                        vehicleChassisNumber,
                        vehiclePlateNumber,
                        impoundedCustomsCaseNumber,
                        impoundedReceptionDate,
                        impoundedParkingSpotNumber,
                        impoundedBookNumber,
                        impoundedBookQuantity,
                        impoundedRecieptionAuthority,
                        impoundedDamagePercentage
                    });
                }

                // // Reset the form
                // document.getElementById('addImpoundedForm').reset();

                // // Optionally, clear the message after a few seconds
                // setTimeout(() => {
                //     document.getElementById('message').textContent = '';
                // }, 5000);
                
            } else {
                // Updated error message handling
                document.getElementById('message').textContent = response.message; // Display the error message from the backend
                document.getElementById('message').style.color = 'red';
            }
        }).catch((error) => {
            document.getElementById('loader').style.display = 'none';
            document.getElementById('message').textContent = 'حدث خطأ غير متوقع أثناء إضافة المركبة'; // Generic error message
            document.getElementById('message').style.color = 'red';
            console.error('Failed to add impounded:', error);
        });
    }

    async function generateAndPrintA4Document(impoundedID, impoundedUniqueCode, details) {
        const qrCodeDataUrl = await QRCode.toDataURL(impoundedUniqueCode);
    
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
                        كتاب رقم: <span class="dotted">${details.impoundedBookNumber}</span>
                        العدد: <span class="dotted">${details.impoundedBookQuantity}</span>
                        وقرار السيد قاضي التحقيق: <span class="dotted">${details.judgeName}</span>
                        بالدعوى الكمركية المرقمة: <span class="dotted">${details.customsCaseNumber}</span>
                        الجهة الواردة منها العجلة: <span class="dotted">${details.sourceAuthority}</span>
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
                            <td>${details.impoundedVehicleNumber || ''}</td>
                        </tr>
                        <tr>
                            <td class="first-column">نوع العجلة</td>
                            <td>${details.impoundedVehicleType || ''}</td>
                        </tr>
                        <tr>
                            <td class="first-column">الموديل</td>
                            <td>${details.impoundedModel || ''}</td>
                        </tr>
                        <tr>
                            <td class="first-column">اللون</td>
                            <td>${details.impoundedColor || ''}</td>
                        </tr>
                        <tr>
                        <td class="first-column">رقم الشاصي</td>
                        <td class="chassis-cells" style="direction: ltr;">${details.chassisNumber || ''}</td>
                        </tr>
                        <tr>
                            <td class="first-column">بلد</td>
                            <td>${details.country || ''}</td>
                        </tr>
                        <tr>
                            <td class="first-column">رقم المحرك</td>
                            <td>${details.engineNumber || ''}</td>
                        </tr>
                        <tr>
                            <td class="first-column">نسبة الأضرار</td>
                            <td>${details.damagePercentage || ''}</td>
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
    
    

    async function scanDocument() {
        ipcRenderer.invoke('scan-document').then((filePath) => {
            if (filePath) {
                scannedDocumentPath = filePath; // Store the scanned document path
                document.getElementById('message').textContent = `تم المسح الضوئي بنجاح: ${filePath}`;
                document.getElementById('message').style.color = 'green';
            } else {
                document.getElementById('message').textContent = 'فشل في المسح الضوئي';
                document.getElementById('message').style.color = 'red';
            }
        }).catch((error) => {
            console.error('Scanning failed:', error);
        });
    }    
})();
