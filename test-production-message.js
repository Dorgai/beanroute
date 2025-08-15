async function testProductionMessageAPI() {
  try {
    console.log('🧪 Testing production message board API...\n');

    // Test 1: Check if the messages API endpoint exists
    console.log('1️⃣ Testing GET /api/messages...');
    const messagesResponse = await fetch('https://beanroute-production.up.railway.app/api/messages', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjdkMTgxYWYyLTk3ODYtNDFmMC04YWExLTNhNGY5ZWM2NWMwOSIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6Imxhc3psby5kb3JnYWlAZ21haWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU0MDM4NTQ0LCJleHAiOjE3NTQ2NDMzNDR9.hhKjDtZF8pGwz6PlfTGntNBzNvwS5l7fZ6MuFlH3-wE'
      }
    });

    console.log(`   Status: ${messagesResponse.status}`);
    if (messagesResponse.ok) {
      const messagesData = await messagesResponse.json();
      console.log(`   ✅ Success: Found ${messagesData.messages?.length || 0} messages`);
    } else {
      const errorText = await messagesResponse.text();
      console.log(`   ❌ Error: ${errorText}`);
    }

    // Test 2: Test sending a message
    console.log('\n2️⃣ Testing POST /api/messages...');
    const sendMessageResponse = await fetch('https://beanroute-production.up.railway.app/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjdkMTgxYWYyLTk3ODYtNDFmMC04YWExLTNhNGY5ZWM2NWMwOSIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6Imxhc3psby5kb3JnYWlAZ21haWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU0MDM4NTQ0LCJleHAiOjE3NTQ2NDMzNDR9.hhKjDtZF8pGwz6PlfTGntNBzNvwS5l7fZ6MuFlH3-wE'
      },
      body: JSON.stringify({
        content: 'Test message from production API test'
      })
    });

    console.log(`   Status: ${sendMessageResponse.status}`);
    if (sendMessageResponse.ok) {
      const sendData = await sendMessageResponse.json();
      console.log(`   ✅ Success: Message sent with ID ${sendData.message?.id}`);
    } else {
      const errorText = await sendMessageResponse.text();
      console.log(`   ❌ Error: ${errorText}`);
    }

    // Test 3: Test unread count
    console.log('\n3️⃣ Testing GET /api/messages/unread-count...');
    const unreadResponse = await fetch('https://beanroute-production.up.railway.app/api/messages/unread-count', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjdkMTgxYWYyLTk3ODYtNDFmMC04YWExLTNhNGY5ZWM2NWMwOSIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6Imxhc3psby5kb3JnYWlAZ21haWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU0MDM4NTQ0LCJleHAiOjE3NTQ2NDMzNDR9.hhKjDtZF8pGwz6PlfTGntNBzNvwS5l7fZ6MuFlH3-wE'
      }
    });

    console.log(`   Status: ${unreadResponse.status}`);
    if (unreadResponse.ok) {
      const unreadData = await unreadResponse.json();
      console.log(`   ✅ Success: Unread count is ${unreadData.count}`);
    } else {
      const errorText = await unreadResponse.text();
      console.log(`   ❌ Error: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Error testing production API:', error.message);
  }
}

testProductionMessageAPI(); 