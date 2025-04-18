const { execSync } = require('child_process');

function runCommand(command) {
  console.log(`\n> Running: ${command}`);
  try {
    return execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    throw error;
  }
}

async function deployToRailway() {
  try {
    // 1. Generate Prisma client
    runCommand('npx prisma generate');
    
    // 2. Build the Next.js app
    runCommand('npm run build');
    
    // 3. Deploy to Railway with --detach flag to avoid waiting
    console.log('\n--- Deploying to Railway ---');
    runCommand('railway up --detach');
    
    console.log('\n--- Deployment initiated successfully ---');
    console.log('The app is being deployed to Railway. This process runs in the background.');
    console.log('You can check the deployment status using the Railway dashboard or CLI commands.');
    
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

deployToRailway(); 