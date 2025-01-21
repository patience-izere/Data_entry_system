// Constants
const API_URL = 'https://script.google.com/macros/s/AKfycbzhFRqx6oOyUCIoZVaM8BrQbGgNtufco9nj57_-JR5wromzM8jMA-fVZoGKalK0VjUk/exec';
const STORAGE_KEY = 'dataEntryApp_session';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const dataForm = document.getElementById('dataForm');
const loginDiv = document.getElementById('login');
const dataEntryDiv = document.getElementById('dataEntry');
const loadingDiv = document.getElementById('loading');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshData');
const dataTable = document.getElementById('dataTable');

// State Management
let sessionToken = null;

// Utility Functions
const showLoading = () => loadingDiv.style.display = 'block';
const hideLoading = () => loadingDiv.style.display = 'none';

const showAlert = (message, type = 'error') => {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
};

const validateForm = (formData) => {
    const errors = [];
    if (!formData.get('email')?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors.push('Please enter a valid email address');
    }
    if (formData.get('phone') && !formData.get('phone').match(/^\d{10}$/)) {
        errors.push('Please enter a valid 10-digit phone number');
    }
    return errors;
};

// API Calls
async function makeAPICall(endpoint, data) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` })
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        return await response.json();
    } catch (error) {
        throw new Error(error.message || 'Network error occurred');
    } finally {
        hideLoading();
    }
}

// Event Handlers
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    try {
        const formData = new FormData(loginForm);
        const response = await makeAPICall('/login', Object.fromEntries(formData));
        
        sessionToken = response.token;
        localStorage.setItem(STORAGE_KEY, sessionToken);
        
        loginDiv.style.display = 'none';
        dataEntryDiv.style.display = 'block';
        
        showAlert('Login successful', 'success');
        await loadRecentData();
    } catch (error) {
        showAlert(error.message);
    }
});

dataForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const formData = new FormData(dataForm);
    const errors = validateForm(formData);
    
    if (errors.length > 0) {
        errors.forEach(error => showAlert(error));
        return;
    }
    
    try {
        await makeAPICall('/submit', Object.fromEntries(formData));
        showAlert('Data submitted successfully', 'success');
        dataForm.reset();
        await loadRecentData();
    } catch (error) {
        showAlert(error.message);
    }
});

logoutBtn.addEventListener('click', () => {
    sessionToken = null;
    localStorage.removeItem(STORAGE_KEY);
    loginDiv.style.display = 'block';
    dataEntryDiv.style.display = 'none';
    showAlert('Logged out successfully', 'success');
});

refreshBtn.addEventListener('click', loadRecentData);

// Data Loading Function
async function loadRecentData() {
    try {
        const data = await makeAPICall('/recent-entries', {});
        renderDataTable(data);
    } catch (error) {
        showAlert('Error loading recent entries');
    }
}

function renderDataTable(data) {
    if (!data.length) {
        dataTable.innerHTML = '<p>No recent entries found.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'data-table';
    
    // Create header
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1);
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    
    // Create data rows
    data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header];
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
    
    dataTable.innerHTML = '';
    dataTable.appendChild(table);
}

// Check for existing session on load
window.addEventListener('load', () => {
    const savedToken = localStorage.getItem(STORAGE_KEY);
    if (savedToken) {
        sessionToken = savedToken;
        loginDiv.style.display = 'none';
        dataEntryDiv.style.display = 'block';
        loadRecentData();
    }
});