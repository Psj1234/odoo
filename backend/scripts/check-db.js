import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database setup...\n');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection: OK\n');

    // Check each required table
    const checks = [
      { name: 'User', query: () => prisma.user.count() },
      { name: 'Delivery', query: () => prisma.delivery.count() },
      { name: 'Ledger', query: () => prisma.ledger.count() },
      { name: 'Location', query: () => prisma.location.count() },
      { name: 'Warehouse', query: () => prisma.warehouse.count() },
      { name: 'Product', query: () => prisma.product.count() },
      { name: 'Receipt', query: () => prisma.receipt.count() },
      { name: 'Transfer', query: () => prisma.transfer.count() },
      { name: 'Adjustment', query: () => prisma.adjustment.count() },
      { name: 'Stock', query: () => prisma.stock.count() },
    ];

    console.log('📊 Table Status:\n');
    for (const check of checks) {
      try {
        const count = await check.query();
        console.log(`✅ ${check.name.padEnd(15)} - ${count} records`);
      } catch (error) {
        if (error.code === 'P2021' || error.message.includes('does not exist')) {
          console.log(`❌ ${check.name.padEnd(15)} - TABLE DOES NOT EXIST`);
          console.log(`   Run: npx prisma migrate dev`);
        } else {
          console.log(`⚠️  ${check.name.padEnd(15)} - Error: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Database check complete!');
    console.log('\n💡 If tables are missing, run:');
    console.log('   npx prisma migrate dev');
    console.log('   npx prisma generate');

  } catch (error) {
    console.error('\n❌ Database connection failed!');
    console.error('Error:', error.message);
    if (error.code === 'P1001') {
      console.error('\n💡 Check your DATABASE_URL in .env file');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

