// Script to test the inventory check API
require('dotenv').config();
const axios = require('axios');

// Set the API key - this should match what we used in the Railway variables
const API_KEY = 'random_inventory_key';

// URL for local testing - update if needed
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testInventoryCheck() {
  console.log('Testing inventory check API...');
  
  try {
    process.env.INVENTORY_CHECK_API_KEY = API_KEY;
    console.log('Set environment variable INVENTORY_CHECK_API_KEY to:', API_KEY);
    
    // Test local API call with fetch
    console.log('\nTesting with local fetch call:');
    const response = await fetch(`${BASE_URL}/api/retail/check-inventory-alerts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testInventoryCheck().catch(console.error); 