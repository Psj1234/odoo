import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('🔧 Setting up database...\n');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check if tables exist by trying to query them
    const tables = [
      { name: 'User', model: prisma.user },
      { name: 'Delivery', model: prisma.delivery },
      { name: 'Ledger', model: prisma.ledger },
      { name: 'Location', model: prisma.location },
      { name: 'Warehouse', model: prisma.warehouse },
      { name: 'Product', model: prisma.product },
      { name: 'Receipt', model: prisma.receipt },
      { name: 'Transfer', model: prisma.transfer },
      { name: 'Adjustment', model: prisma.adjustment },
      { name: 'Stock', model: prisma.stock },
    ];

    console.log('📊 Checking tables...\n');
    for (const table of tables) {
      try {
        await table.model.findFirst();
        console.log(`✅ ${table.name} table exists`);
      } catch (error) {
        if (error.code === 'P2021' || error.message.includes('does not exist')) {
          console.log(`❌ ${table.name} table does NOT exist - Run migrations!`);
        } else {
          console.log(`✅ ${table.name} table exists (or connection issue)`);
        }
      }
    }

    console.log('\n📝 Next steps:');
    console.log('1. Run: npx prisma migrate dev');
    console.log('2. Run: npx prisma generate');
    console.log('3. (Optional) Run: npm run seed\n');

  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    if (error.code === 'P1001') {
      console.error('\n💡 Database connection failed. Check your DATABASE_URL in .env file');
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();

