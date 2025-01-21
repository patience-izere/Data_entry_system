// Configuration
const CONFIG = {
    USERS_SHEET_NAME: 'Users',
    DATA_SHEET_NAME: 'Data',
    TOKEN_DURATION_HOURS: 24,
    MAX_RECENT_ENTRIES: 10
  };
  
  // Main entry point for web app
  function doPost(e) {
    try {
      const data = JSON.parse(e.postData.getDataAsString());
      const endpoint = e.parameter.endpoint || '';
      
      switch (endpoint) {
        case '/login':
          return handleLogin(data);
        case '/submit':
          return handleDataSubmission(data);
        case '/recent-entries':
          return handleRecentEntries();
        default:
          return createResponse('Invalid endpoint', 400);
      }
    } catch (error) {
      Logger.log(error);
      return createResponse('Server error', 500);
    }
  }
  
  // Authentication handlers
  function handleLogin(data) {
    const { username, password } = data;
    
    if (!username || !password) {
      return createResponse('Missing credentials', 400);
    }
    
    const user = authenticateUser(username, password);
    if (!user) {
      return createResponse('Invalid credentials', 401);
    }
    
    const token = generateToken(username);
    return createResponse({ token, username }, 200);
  }
  
  function authenticateUser(username, password) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName(CONFIG.USERS_SHEET_NAME);
    const users = userSheet.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === username && users[i][1] === Utilities.computeHmacSha256Signature(password, 'salt')) {
        return { username, role: users[i][2] };
      }
    }
    
    return null;
  }
  
  // Data handling
  function handleDataSubmission(data) {
    const { name, email, phone, department } = data;
    
    // Validate required fields
    if (!name || !email) {
      return createResponse('Missing required fields', 400);
    }
    
    // Validate email format
    if (!validateEmail(email)) {
      return createResponse('Invalid email format', 400);
    }
    
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      // Continuing from previous code...

    const sheet = ss.getSheetByName(CONFIG.DATA_SHEET_NAME);
    const timestamp = new Date();
    
    // Append data to sheet
    sheet.appendRow([
      timestamp,
      name,
      email,
      phone || '',
      department || '',
      Session.getActiveUser().getEmail()
    ]);
    
    return createResponse({ 
      message: 'Data submitted successfully',
      timestamp: timestamp.toISOString()
    }, 200);
  } catch (error) {
    Logger.log(error);
    return createResponse('Error saving data', 500);
  }
}

function handleRecentEntries() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.DATA_SHEET_NAME);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return createResponse([], 200);
    }
    
    // Get headers and recent data
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const startRow = Math.max(2, lastRow - CONFIG.MAX_RECENT_ENTRIES + 1);
    const numRows = lastRow - startRow + 1;
    const recentData = sheet.getRange(startRow, 1, numRows, headers.length).getValues();
    
    // Format data as array of objects
    const formattedData = recentData.map(row => {
      const entry = {};
      headers.forEach((header, index) => {
        if (row[index] instanceof Date) {
          entry[header] = row[index].toISOString();
        } else {
          entry[header] = row[index];
        }
      });
      return entry;
    });
    
    return createResponse(formattedData, 200);
  } catch (error) {
    Logger.log(error);
    return createResponse('Error fetching recent entries', 500);
  }
}

// Utility functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateToken(username) {
  const timestamp = new Date().getTime();
  const payload = {
    username,
    timestamp,
    expiresAt: timestamp + (CONFIG.TOKEN_DURATION_HOURS * 60 * 60 * 1000)
  };
  
  return Utilities.base64EncodeWebSafe(
    JSON.stringify(payload)
  );
}

function verifyToken(token) {
  try {
    const payload = JSON.parse(
      Utilities.newBlob(
        Utilities.base64DecodeWebSafe(token)
      ).getDataAsString()
    );
    
    if (payload.expiresAt < new Date().getTime()) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

function createResponse(data, code = 200) {
  return ContentService.createTextOutput(JSON.stringify({
    status: code,
    data: data,
    timestamp: new Date().toISOString()
  }))
  .setMimeType(ContentService.MimeType.JSON);
}

// Sheet initialization and management
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create or get Users sheet
  let usersSheet = ss.getSheetByName(CONFIG.USERS_SHEET_NAME);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(CONFIG.USERS_SHEET_NAME);
    usersSheet.getRange('A1:C1').setValues([['Username', 'Password Hash', 'Role']]);
    usersSheet.setFrozenRows(1);
  }
  
  // Create or get Data sheet
  let dataSheet = ss.getSheetByName(CONFIG.DATA_SHEET_NAME);
  if (!dataSheet) {
    dataSheet = ss.insertSheet(CONFIG.DATA_SHEET_NAME);
    dataSheet.getRange('A1:F1').setValues([
      ['Timestamp', 'Name', 'Email', 'Phone', 'Department', 'Submitted By']
    ]);
    dataSheet.setFrozenRows(1);
  }
  
  // Add data validation for Department column
  const departmentRange = dataSheet.getRange(`E2:E${dataSheet.getMaxRows()}`);
  const departmentRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['HR', 'IT', 'Finance', 'Marketing'], true)
    .build();
  departmentRange.setDataValidation(departmentRule);
}

// Admin functions
function addUser(username, password, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName(CONFIG.USERS_SHEET_NAME);
  
  // Hash password before storing
  const passwordHash = Utilities.computeHmacSha256Signature(password, 'salt');
  
  userSheet.appendRow([username, passwordHash, role]);
}

function deleteUser(username) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName(CONFIG.USERS_SHEET_NAME);
  const data = userSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      userSheet.deleteRow(i + 1);
      return true;
    }
  }
  
  return false;
}

// Backup functionality
function createBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const backupFolder = DriveApp.getFolderById('YOUR_BACKUP_FOLDER_ID'); // Replace with actual folder ID
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd-HH-mm-ss');
  const backupName = `${ss.getName()}_backup_${timestamp}`;
  
  const backup = SpreadsheetApp.create(backupName);
  
  // Copy all sheets to backup
  ss.getSheets().forEach(sheet => {
    sheet.copyTo(backup);
  });
  
  // Delete default Sheet1
  backup.getSheetByName('Sheet1').setName('README');
  
  // Move to backup folder
  const file = DriveApp.getFileById(backup.getId());
  backupFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  
  return backup.getUrl();
}