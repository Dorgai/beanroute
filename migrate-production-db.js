const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateProductionDB() {
  try {
    console.log('🔧 Running database migration in production...\n');

    // Check current tables
    console.log('📋 Current tables in production:');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    // Check if Message table exists
    const messageTableExists = tables.some(table => table.table_name === 'Message');
    
    if (messageTableExists) {
      console.log('\n✅ Message table already exists in production');
      return;
    }

    console.log('\n❌ Message table does not exist. Creating it...');

    // Create Message table
    await prisma.$executeRaw`
      CREATE TABLE "Message" (
        "id" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "senderId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
      )
    `;

    // Create MessageRead table
    await prisma.$executeRaw`
      CREATE TABLE "MessageRead" (
        "id" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("id")
      )
    `;

    // Add foreign key constraints
    await prisma.$executeRaw`
      ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" 
      FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `;

    await prisma.$executeRaw`
      ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_messageId_fkey" 
      FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `;

    await prisma.$executeRaw`
      ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `;

    // Add unique constraint for MessageRead
    await prisma.$executeRaw`
      ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_messageId_userId_key" 
      UNIQUE ("messageId", "userId")
    `;

    console.log('✅ Message and MessageRead tables created successfully!');

    // Verify the tables were created
    const newTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    console.log('\n📋 Updated tables in production:');
    newTables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error migrating production database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateProductionDB(); 