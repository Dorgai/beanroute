#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_URL = process.env.API_URL || 'http://localhost:3000';
const ADMIN_MANAGEMENT_TOKEN = process.env.ADMIN_MANAGEMENT_TOKEN;

if (!ADMIN_MANAGEMENT_TOKEN) {
  console.error('Error: ADMIN_MANAGEMENT_TOKEN environment variable is required');
  process.exit(1);
}

async function updatePassword() {
  rl.question('Enter new password: ', async (newPassword) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/manage?token=${ADMIN_MANAGEMENT_TOKEN}`,
        {
          operation: 'updatePassword',
          data: { newPassword }
        }
      );
      console.log('Password updated successfully!');
      console.log('New credentials:');
      console.log('Username: admin');
      console.log(`Password: ${newPassword}`);
    } catch (error) {
      console.error('Error updating password:', error.response?.data || error.message);
    }
    rl.close();
  });
}

async function updateEmail() {
  rl.question('Enter new email: ', async (newEmail) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/manage?token=${ADMIN_MANAGEMENT_TOKEN}`,
        {
          operation: 'updateEmail',
          data: { newEmail }
        }
      );
      console.log('Email updated successfully!');
      console.log('New email:', newEmail);
    } catch (error) {
      console.error('Error updating email:', error.response?.data || error.message);
    }
    rl.close();
  });
}

async function updateStatus() {
  rl.question('Enter new status (ACTIVE/INACTIVE): ', async (newStatus) => {
    if (!['ACTIVE', 'INACTIVE'].includes(newStatus.toUpperCase())) {
      console.error('Invalid status. Must be ACTIVE or INACTIVE');
      rl.close();
      return;
    }
    
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/manage?token=${ADMIN_MANAGEMENT_TOKEN}`,
        {
          operation: 'updateStatus',
          data: { newStatus: newStatus.toUpperCase() }
        }
      );
      console.log('Status updated successfully!');
      console.log('New status:', newStatus.toUpperCase());
    } catch (error) {
      console.error('Error updating status:', error.response?.data || error.message);
    }
    rl.close();
  });
}

// Main menu
console.log('Admin Management Tool');
console.log('1. Update Password');
console.log('2. Update Email');
console.log('3. Update Status');
console.log('4. Exit');

rl.question('Select an option (1-4): ', (option) => {
  switch (option) {
    case '1':
      updatePassword();
      break;
    case '2':
      updateEmail();
      break;
    case '3':
      updateStatus();
      break;
    case '4':
      console.log('Exiting...');
      rl.close();
      break;
    default:
      console.log('Invalid option');
      rl.close();
  }
}); 