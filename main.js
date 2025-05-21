const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const mysql = require('mysql2');
const crypto = require('crypto');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// // Add this line at the top of your main.js file
// require('electron-reload')(__dirname, {
//   // Optional: Specify the files/folders to watch
//   electron: require(`${__dirname}/node_modules/electron`)
// });

let mainWindow;
let homeWindow;
let mysqlProcess;


const uploadsDir = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Uploads directory created.');
}


// Determine if we are running in development mode
const isDevelopment = !app.isPackaged;

// Function to establish paths based on the environment
function establishPaths() {
  const basePath = isDevelopment ? __dirname : process.resourcesPath;

  // Set paths for MySQL and Scanner executables
  const mysqlBaseDir = path.join(basePath, 'src','resources', 'mysql');
  const mysqlBinPath = path.join(mysqlBaseDir, 'bin', 'mysqld.exe');
  const configPath = path.join(mysqlBaseDir, 'my.ini');

  const scannerExecutable = path.join(basePath, 'src','resources', 'scanner', 'NAPS2.Console.exe');

  console.log('Paths established:', { basePath, mysqlBaseDir, mysqlBinPath, configPath, scannerExecutable });

  return { basePath, mysqlBaseDir, mysqlBinPath, configPath, scannerExecutable };
}

// Extract paths
const { basePath, mysqlBaseDir, mysqlBinPath, configPath, scannerExecutable } = establishPaths();

// Request a single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function generateMyIni(mysqlBaseDir) {
    console.log('Attempting to generate my.ini...');
    const basedir = mysqlBaseDir.replace(/\\/g, '/');
    const datadir = path.join(basedir, 'data').replace(/\\/g, '/');

    const myIniContent = `
[mysqld]
basedir=${basedir}
datadir=${datadir}
port=3306
skip-networking=0
bind-address=127.0.0.1
sql_mode=NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES
    `;

    try {
      fs.writeFileSync(path.join(mysqlBaseDir, 'my.ini'), myIniContent, 'utf-8');
      console.log('my.ini generated successfully.');
    } catch (err) {
      console.error('Failed to generate my.ini file:', err);
      showErrorDialog('MySQL Error', `Failed to generate my.ini file: ${err.message}`);
    }
  }

  function showErrorDialog(title, message) {
    if (!isDevelopment && BrowserWindow.getAllWindows().length > 0) {
      dialog.showErrorBox(title, message);
    }
  }

  function stopMySQL() {
    if (mysqlProcess) {
      console.log('Stopping MySQL process...');
      mysqlProcess.kill();
      mysqlProcess = null;
    } else {
      console.log('No MySQL process to stop.');
    }
  }

  function createMySQLConnection() {
    return mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'vhcms',
    });
  }

  async function initializeDatabase() {
    const connection = createMySQLConnection();

    connection.connect(async (err) => {
      if (err) {
        console.error('Error connecting to MySQL:', err);
        showErrorDialog('Database Error', `Error connecting to MySQL: ${err.message}`);
        setTimeout(initializeDatabase, 3000);
        return;
      }

      console.log('Connected to MySQL server.');

      try {
        await executeQuery('CREATE DATABASE IF NOT EXISTS vhcms');
        console.log('Database created or already exists.');

        connection.changeUser({ database: 'vhcms' }, async (err) => {
          if (err) {
            console.error('Error switching to database:', err);
            showErrorDialog('Database Error', `Error switching to database: ${err.message}`);
            return;
          }

          const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
              userID INT(11) NOT NULL AUTO_INCREMENT,
              userName VARCHAR(50) NOT NULL,
              userPassword VARCHAR(255) NOT NULL,
              userFullName VARCHAR(255) NOT NULL,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (userID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
          `;

          await executeQuery(createTableQuery);
          console.log('Table created or already exists.');

          const insertAdminQuery = `
            INSERT INTO users (userName, userPassword, userFullName)
            SELECT * FROM (SELECT 'admin', SHA2('admin', 256), 'المدير العام') AS tmp
            WHERE NOT EXISTS (
              SELECT userName FROM users WHERE userName = 'admin'
            ) LIMIT 1;
          `;

          await executeQuery(insertAdminQuery);
          console.log('Default admin user inserted or already exists.');


          // Create impoundeds table
        const createImpoundedsTableQuery = `
        CREATE TABLE IF NOT EXISTS impoundeds (
          impoundedID INT AUTO_INCREMENT PRIMARY KEY,
          impoundedCreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          impoundedAddedBy INT, -- Foreign key referencing users table
          impoundedVehicleNumber VARCHAR(50),
          impoundedVehicleType ENUM('Bike', 'Vehicle'),
          impoundedModel VARCHAR(100),
          impoundedColor VARCHAR(50),
          impoundedVehicleChassisNumber VARCHAR(100),
          impoundedVehiclePlateNumber VARCHAR(50),
          impoundedCarriageChassisNumber VARCHAR(100),
          impoundedDeliveryDate DATE,
          impoundedBuyerName VARCHAR(255),
          impoundedSaleFormNumber VARCHAR(50),
          impoundedDeliveryDocuments TEXT,
          impoundedDeliveryAttachments TEXT,
          impoundedStatus ENUM('RECIEVED', 'DELIVERED', 'ARCHIVE') DEFAULT 'RECIEVED',
          impoundedReceptionDate DATE,
          impoundedBookNumber VARCHAR(50),
          impoundedBookNumberSent VARCHAR(50),
          impoundedRecieptionAuthority VARCHAR(50),
          impoundedBookQuantity VARCHAR(50),
          impoundedBookQuantitySent VARCHAR(50),
          impoundedCustomsCaseNumber VARCHAR(50),
          impoundedReceptionDocuments TEXT,
          impoundedReceptionAttachments TEXT,
          impoundedDamagePercentage DECIMAL(5,2),
          impoundedParkingSpotNumber VARCHAR(10),
          impoundedUniqueCode VARCHAR(8) UNIQUE,
          CONSTRAINT fk_user FOREIGN KEY (impoundedAddedBy) REFERENCES users(userID)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `;

      await executeQuery(createImpoundedsTableQuery);
      console.log('Impoundeds table created or already exists.');
      
          connection.end();
        });
      } catch (error) {
        console.error('Error setting up database:', error);
      }
    });
  }

  function createMainWindow() {
    mainWindow = new BrowserWindow({
      width: 600,
      height: 600,
      fullscreen: false,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: true,
      },
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // startMySQL();
  }

  function createHomeWindow() {
    homeWindow = new BrowserWindow({
      width: 1920,
      height: 1080,
      fullscreen: true,
      frame: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: true,
      },
    });

    homeWindow.loadFile('src/home.html');

    homeWindow.on('closed', () => {
      homeWindow = null;
    });
  }

  ipcMain.on('exit-app', () => {
    stopMySQL();
    app.quit();
  });

  ipcMain.on('check-mysql-connection', (event) => {
    const connection = createMySQLConnection();
  
    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to MySQL:', err);
        event.reply('mysql-connection-response', false);
      } else {
        console.log('Successfully connected to MySQL.');
        event.reply('mysql-connection-response', true);
      }
      connection.end(); // Close the connection after the check
    });
  });

  ipcMain.on('start-mysql', (event) => {
    function sendResponse(message) {
      event.reply('mysql-start-response', message);
    }
  
    // Function to check if MySQL is already running
    const checkIfMySQLIsRunning = (callback) => {
      const connection = createMySQLConnection();
      connection.connect((err) => {
        if (err) {
          console.error('MySQL is not running:', err.message);
          callback(false); // MySQL is not running
        } else {
          console.log('MySQL is already running.');
          connection.end(); // Close the connection after checking
          callback(true); // MySQL is running
        }
      });
    };
  
    checkIfMySQLIsRunning((isRunning) => {
      if (isRunning) {
        sendResponse('MySQL is already running.');
        initializeDatabase(); // Initialize the database since MySQL is already running
        return;
      }
  
      sendResponse('Starting MySQL...');
  
      const startMySQLProcess = () => {
        console.log('Base Path:', basePath);
        console.log('MySQL Base Directory:', mysqlBaseDir);
        console.log('MySQL Bin Path:', mysqlBinPath);
        console.log('MySQL Config Path:', configPath);
  
        if (!fs.existsSync(mysqlBaseDir)) {
          const errorMessage = `MySQL base directory does not exist: ${mysqlBaseDir}`;
          console.error(errorMessage);
          showErrorDialog('MySQL Error', errorMessage);
          sendResponse(errorMessage);
          return;
        }
  
        generateMyIni(mysqlBaseDir);
  
        if (isDevelopment) {
          console.log('Starting MySQL with spawn (development mode)');
          mysqlProcess = spawn(mysqlBinPath, [`--defaults-file=${configPath}`], { stdio: 'inherit' });
  
          mysqlProcess.on('error', (err) => {
            const errorMessage = `Failed to start MySQL process with spawn: ${err.message}`;
            console.error(errorMessage);
            showErrorDialog('MySQL Error', errorMessage);
            sendResponse(errorMessage);
          });
  
          mysqlProcess.on('close', (code) => {
            mysqlProcess = null; // Reset process variable
            const message = `MySQL process exited with code ${code}`;
            console.log(message);
            if (code !== 0) {
              console.error('MySQL failed to start or crashed.');
              showErrorDialog('MySQL Error', 'MySQL failed to start or crashed.');
              sendResponse('MySQL failed to start or crashed.');
            } else {
              sendResponse('MySQL started successfully.');
              initializeDatabase(); // Initialize the database after MySQL starts successfully
            }
          });
  
        } else {
          console.log('Starting MySQL with exec (production mode)');
          const mysqlCommand = `${mysqlBinPath} --defaults-file=${configPath}`;
  
          mysqlProcess = exec(mysqlCommand, (error, stdout, stderr) => {
            if (error) {
              const errorMessage = `Failed to start MySQL process: ${error.message}`;
              console.error(errorMessage);
              showErrorDialog('MySQL Error', errorMessage);
              sendResponse(errorMessage);
              return;
            }
            if (stdout) {
              console.log('MySQL stdout:', stdout);
              sendResponse(`MySQL stdout: ${stdout}`);
            }
            if (stderr) {
              console.error('MySQL stderr:', stderr);
              showErrorDialog('MySQL Error', `MySQL stderr: ${stderr}`);
              sendResponse(`MySQL stderr: ${stderr}`);
            } else {
              sendResponse('MySQL started successfully.');
              initializeDatabase(); // Initialize the database after MySQL starts successfully
            }
          });
  
          mysqlProcess.on('error', (err) => {
            const errorMessage = `Error running exec for MySQL: ${err.message}`;
            console.error(errorMessage);
            showErrorDialog('MySQL Error', errorMessage);
            sendResponse(errorMessage);
          });
  
          mysqlProcess.on('close', (code) => {
            mysqlProcess = null; // Reset process variable
            const message = `MySQL process exited with code ${code}`;
            console.log(message);
            if (code !== 0) {
              console.error('MySQL failed to start or crashed.');
              showErrorDialog('MySQL Error', 'MySQL failed to start or crashed.');
              sendResponse('MySQL failed to start or crashed.');
            }
          });
        }
      };
  
      startMySQLProcess();
    });
  });
  
  
  

  ipcMain.on('login-request', (event, credentials) => {
    const { username, password } = credentials;
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const connection = createMySQLConnection();

    connection.query(
      'SELECT userID, userName as userFullName FROM users WHERE userName = ? AND userPassword = ?',
      [username, hashedPassword],
      (error, results) => {
        if (error) {
          event.reply('login-response', { success: false, message: 'Database error' });
        } else if (results.length > 0) {
          const user = results[0];
          event.reply('login-response', { success: true, message: 'Login successful', user });

          setTimeout(() => {
            mainWindow.close();
            createHomeWindow();
          }, 100);
        } else {
          event.reply('login-response', { success: false, message: 'Invalid credentials' });
        }
        connection.end();
      }
    );
  });

  ipcMain.handle('fetch-users', async () => {
    try {
      const users = await fetchUsers();
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  });

  // Handler to edit a user
ipcMain.handle('edit-user', async (event, userID, newFullName) => {
  try {
    const query = `UPDATE users SET userFullName = ? WHERE userID = ?`;
    await executeQuery(query, [newFullName, userID]);
    console.log(`User ${userID} updated successfully.`);
    return { success: true, message: 'User updated successfully.' };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, message: 'Failed to update user.' };
  }
});

// Handler to delete a user
ipcMain.handle('delete-user', async (event, userID) => {
  try {
    const query = `DELETE FROM users WHERE userID = ?`;
    await executeQuery(query, [userID]);
    console.log(`User ${userID} deleted successfully.`);
    return { success: true, message: 'User deleted successfully.' };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: 'Failed to delete user.' };
  }
});


// Handler to fetch impoundeds with filtering by type
ipcMain.handle('fetch-impoundeds', async (event, vehicleType,status) => {
  try {
    const impoundeds = await fetchImpoundeds(vehicleType,status); // Pass the type filter to the function
    return impoundeds;
  } catch (error) {
    console.error('Error fetching impoundeds:', error);
    throw error;
  }
});

// Handler to fetch counts of impoundeds based on vehicleType and status
ipcMain.handle('fetch-impoundeds-count', async (event) => {
  try {
    // Fetch counts based on specific statuses and vehicle types
    const impoundedCounts = {
      receivedVehicles: await fetchImpoundedCount('RECIEVED', 'Vehicle'),
      receivedBikes: await fetchImpoundedCount('RECIEVED', 'Bike'),
      deliveredVehicles: await fetchImpoundedCount('DELIVERED', 'Vehicle'),
      deliveredBikes: await fetchImpoundedCount('DELIVERED', 'Bike'),
      archivedVehicles: await fetchImpoundedCount('ARCHIVE', 'Vehicle'),
      archivedBikes: await fetchImpoundedCount('ARCHIVE', 'Bike')
    };

    return impoundedCounts; // Return all counts
  } catch (error) {
    console.error('Error fetching impoundeds count:', error);
    throw error;
  }
});




// Handle adding impounded data and saving files

// Function to generate a random unique code
function generateUniqueCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Function to check if the unique code already exists
async function checkUniqueCodeExists(uniqueCode) {
  const query = `SELECT COUNT(*) as count FROM impoundeds WHERE impoundedUniqueCode = ?`;
  const result = await executeQuery(query, [uniqueCode]);
  return result[0].count > 0;
}

// Function to generate a truly unique code by checking the table
async function generateUniqueCodeForImpounded() {
  let uniqueCode = generateUniqueCode();
  while (await checkUniqueCodeExists(uniqueCode)) {
    uniqueCode = generateUniqueCode();
  }
  return uniqueCode;
}


// Handle adding impounded data and saving files
ipcMain.handle('add-impounded', async (event, data) => {
  const {
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
    files, // Array of file objects with { name, buffer }
    scannedDocumentPath // Scanned document path
  } = data;

  // Generate a unique impounded code
  const impoundedUniqueCode = await generateUniqueCodeForImpounded();

  // Insert the impounded data into the database and get the new impoundedID
  const query = `
    INSERT INTO impoundeds (
      impoundedVehicleNumber,
      impoundedVehicleType,
      impoundedModel,
      impoundedColor,
      impoundedVehicleChassisNumber,
      impoundedVehiclePlateNumber,
      impoundedCustomsCaseNumber,
      impoundedReceptionDate,
      impoundedParkingSpotNumber,
      impoundedBookNumber,
      impoundedBookQuantity,
      impoundedRecieptionAuthority,
      impoundedDamagePercentage,
      impoundedReceptionAttachments,
      impoundedReceptionDocuments,  -- Store the scanned document path here
      impoundedUniqueCode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  try {
    const result = await executeQuery(query, [
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
      '[]', // Empty JSON array for file paths initially
      scannedDocumentPath || '', // Insert scanned document path
      impoundedUniqueCode
    ]);

    const impoundedID = result.insertId; // Get the newly inserted impoundedID
    const folderName = `${impoundedID}-${impoundedUniqueCode}`;
    const folderPath = path.join(__dirname, 'uploads', folderName);

    // Ensure the folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    const filePaths = [];

    // Save each file to the specific folder
    files.forEach((file) => {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = path.join(folderPath, fileName);
      filePaths.push(path.join(folderPath,folderName, fileName)); // Store relative path

      // Write the file buffer to disk
      fs.writeFileSync(filePath, file.buffer);
    });

    // Update the impounded record with file paths
    const updateQuery = `
      UPDATE impoundeds SET impoundedReceptionAttachments = ? WHERE impoundedID = ?`;
    const attachmentsAsString = JSON.stringify(filePaths);
    await executeQuery(updateQuery, [attachmentsAsString, impoundedID]);

    return { success: true, message: '  تم اضافة المستند بنجاح', impoundedID, impoundedUniqueCode };
  } catch (error) {
    console.error('Error adding impounded:', error);
    return { success: false, message: 'فشل في اضافة المستند   ' };
  }
});



ipcMain.handle('scan-document', async (event) => {
  const outputFile = path.join(__dirname, 'uploads', `scanned-${Date.now()}.pdf`);

  // Command to scan and save the file as PDF
  const command = `"${scannerExecutable}" -o "${outputFile}" -f pdf`;

  return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
          if (error) {
              console.error(`Error executing scan: ${error.message}`);
              reject(new Error('Scanning failed.'));
              return;
          }

          if (stderr) {
              console.error(`Scan error: ${stderr}`);
              reject(new Error('Scanning encountered an error.'));
              return;
          }

          console.log(`Scanned document saved to: ${outputFile}`);
          resolve(outputFile); // Return the file path for insertion into the database
      });
  });
});

// ipcMain.handle('scan-document', async (event) => {
//   const outputFile = path.join(__dirname, 'uploads', `scanned-${Date.now()}.pdf`);

//   // Simulate scanning by creating a dummy PDF
//   const dummyPdfContent = 'This is a simulated scanned document.';

//   return new Promise((resolve, reject) => {
//     fs.writeFile(outputFile, dummyPdfContent, (err) => {
//       if (err) {
//         console.error(`Error creating dummy PDF: ${err.message}`);
//         reject(new Error('Simulated scanning failed.'));
//         return;
//       }

//       console.log(`Simulated scanned document saved to: ${outputFile}`);
//       resolve(outputFile); // Return the file path for further processing
//     });
//   });
// });



// Handler to get impounded details by unique code
ipcMain.handle('get-impounded-details', async (event, impoundedUniqueCode) => {
  try {
    const query = 'SELECT * FROM impoundeds WHERE impoundedStatus = "RECIEVED" AND impoundedUniqueCode = ?';
    const result = await executeQuery(query, [impoundedUniqueCode]);

    // Log the received result
    console.log('Received impounded details:', result);

    if (result.length > 0) {
      return result[0]; // Return the first matching result
    } else {
      return null; // No results found
    }
  } catch (error) {
    console.error('Error fetching impounded details:', error);
    throw error; // Rethrow to handle in renderer
  }
});

// Handler to update impounded details using unique code
ipcMain.handle('update-impounded', async (event, impoundedUniqueCode, updateData) => {
  try {
    const { 
      impoundedBookNumberSent, 
      impoundedBookQuantitySent, 
      impoundedBuyerName, 
      impoundedDeliveryDate, 
      impoundedSaleFormNumber 
    } = updateData;

    const query = `
      UPDATE impoundeds 
      SET 
        impoundedBookNumberSent = ?, 
        impoundedBookQuantitySent = ?, 
        impoundedBuyerName = ?, 
        impoundedDeliveryDate = ?, 
        impoundedSaleFormNumber = ?, 
        impoundedStatus = 'DELIVERED' 
      WHERE impoundedUniqueCode = ?`;

    const params = [
      impoundedBookNumberSent, 
      impoundedBookQuantitySent, 
      impoundedBuyerName, 
      impoundedDeliveryDate, 
      impoundedSaleFormNumber, 
      impoundedUniqueCode
    ];

    await executeQuery(query, params);
    console.log(`Impounded with unique code ${impoundedUniqueCode} updated successfully.`);
    return { success: true, message: 'تم تحديث البيانات بنجاح !' };
  } catch (error) {
    console.error('Error updating impounded:', error);
    return { success: false, message: 'فشل في تحديث البيانات !' };
  }
});


// Handler to edit an impounded record
ipcMain.handle('edit-impounded', async (event, impoundedID, newVehicleNumber) => {
  try {
    const query = `UPDATE impoundeds SET impoundedVehicleNumber = ? WHERE impoundedID = ?`;
    await executeQuery(query, [newVehicleNumber, impoundedID]);
    console.log(`Impounded ${impoundedID} updated successfully.`);
    return { success: true, message: 'Impounded updated successfully.' };
  } catch (error) {
    console.error('Error updating impounded:', error);
    return { success: false, message: 'Failed to update impounded.' };
  }
});

// Handler to delete an impounded record
ipcMain.handle('delete-impounded', async (event, impoundedID) => {
  try {
    const query = `DELETE FROM impoundeds WHERE impoundedID = ?`;
    await executeQuery(query, [impoundedID]);
    console.log(`Impounded ${impoundedID} deleted successfully.`);
    return { success: true, message: 'Impounded deleted successfully.' };
  } catch (error) {
    console.error('Error deleting impounded:', error);
    return { success: false, message: 'Failed to delete impounded.' };
  }
});



  // async function executeQuery(query, params = []) {
  //   return new Promise((resolve, reject) => {
  //     const connection = createMySQLConnection();
  //     connection.query(query, params, (error, results) => {
  //       connection.end();
  //       if (error) {
  //         console.error('Query error:', error);
  //         return reject(error);
  //       }
  //       resolve(results);
  //     });
  //   });
  // }

  async function executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        const connection = createMySQLConnection(); // Ensure this function creates a valid MySQL connection

        console.log('Executing query:', query, 'with parameters:', params); // Log query and params for debugging

        connection.query(query, params, (error, results) => {
            connection.end(); // Ensure the connection is closed after the query

            if (error) {
                console.error('Query error:', error); // Log error to the console
                return reject(error); // Reject the promise with the error
            }

            resolve(results); // Resolve the promise with the results
        });
    });
}

  async function fetchUsers() {
    const query = `SELECT * FROM users`;
    return executeQuery(query);
  }
  

// Define the function to fetch impoundeds from the database with filtering
async function fetchImpoundeds(vehicleType, status) {
  let query = `SELECT * FROM impoundeds WHERE impoundedStatus = ?`;
  const params = [status];

  // If vehicleType is provided (not empty or null), filter by vehicle type
  if (vehicleType && vehicleType !== '') {
    query += ` AND impoundedVehicleType = ?`;
    params.push(vehicleType);
  }

  // Add ordering by impoundedID in descending order
  query += ` ORDER BY impoundedID DESC`;

  return executeQuery(query, params);
}


// Define a function to fetch the count of impoundeds based on type and status
async function fetchImpoundedCount(status, vehicleType) {
  let query = `SELECT COUNT(*) as count FROM impoundeds WHERE impoundedStatus = ? AND impoundedVehicleType = ?`;
  const params = [status, vehicleType];

  const result = await executeQuery(query, params);
  return result[0].count; // Return the count of the impounded vehicles
}

  app.whenReady().then(() => {
    createMainWindow();
    // startMySQL();
  });

  app.on('window-all-closed', () => {
    stopMySQL();
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  app.on('before-quit', () => {
    stopMySQL();
  });
}
