// Generate VAPID keys for push notifications
// Run this script once to generate keys, then add them to your environment variables

const webpush = require('web-push');

console.log('🔑 Generating VAPID keys for BeanRoute push notifications...\n');

try {
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('✅ VAPID keys generated successfully!\n');
  console.log('📋 Add these environment variables to your .env file:\n');
  console.log('# Push Notification Configuration');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log(`VAPID_SUBJECT=mailto:admin@beanroute.com`);
  console.log('');
  console.log('🚀 For Railway deployment, add these variables in the Railway dashboard:');
  console.log('   Variables → Add Variable → (paste each line above)');
  console.log('');
  console.log('🔒 Keep the private key secure - never commit it to version control!');
  console.log('');
  console.log('📱 The public key will be used by browsers to subscribe to notifications.');
  console.log('🔐 The private key will be used by the server to send notifications.');
  
} catch (error) {
  console.error('❌ Error generating VAPID keys:', error);
  process.exit(1);
}

