function doPost(e) {
    try {
      // Get data from the request body
      const data = JSON.parse(e.postData.getDataAsString());
  
      // Check if the user is authenticated
      if (!authenticateUser(data.username, data.password)) {
        return ContentService.createTextOutput('Invalid credentials').setMimeType(ContentService.MimeType.TEXT);
      }
  
      // Sanitize input (example: basic input sanitization)
      data.name = sanitizeInput(data.name);
      data.email = sanitizeInput(data.email);
  
      // Access and validate data (example: check for required fields)
      if (!data.name || !data.email) {
        return ContentService.createTextOutput('Missing required fields').setMimeType(ContentService.MimeType.TEXT);
      }
  
      // Get the active spreadsheet
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('Data'); // Replace 'Sheet1' with your sheet name
  
      // Append data to the sheet
      sheet.appendRow([data.name, data.email]); 
  
      // Return success response
      return ContentService.createTextOutput('Data submitted successfully!').setMimeType(ContentService.MimeType.TEXT);
    } catch (error) {
      Logger.log(error);
      return ContentService.createTextOutput('Error processing data.').setMimeType(ContentService.MimeType.TEXT);
    }
  }
  
  function authenticateUser(username, password) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName('Users'); 
  
    // Find the user in the 'Users' sheet
    const userRange = userSheet.getDataRange();
    const usersData = userRange.getValues();
  
    for (let i = 0; i < usersData.length; i++) {
      if (usersData[i][0] === username && usersData[i][1] === password) {
        return true; // User is authenticated
      }
    }
  
    return false; // Authentication failed
  }
  
  function sanitizeInput(input) {
    // Basic input sanitization (replace with more robust methods)
    return input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }