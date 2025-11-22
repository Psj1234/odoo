import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function viewData() {
  console.log('📊 Viewing Database Data\n');
  console.log('='.repeat(50));

  try {
    // Users
    console.log('\n👤 USERS:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    if (users.length === 0) {
      console.log('  No users found');
    } else {
      users.forEach(u => {
        console.log(`  ID: ${u.id} | Phone: ${u.phone} | Name: ${u.name || 'N/A'} | Role: ${u.role}`);
      });
    }

    // Warehouses
    console.log('\n🏭 WAREHOUSES:');
    const warehouses = await prisma.warehouse.findMany();
    if (warehouses.length === 0) {
      console.log('  No warehouses found');
    } else {
      warehouses.forEach(w => {
        console.log(`  ID: ${w.id} | Code: ${w.code} | Name: ${w.name}`);
      });
    }

    // Locations (Zones/Storage)
    console.log('\n📍 LOCATIONS (Zones/Storage):');
    const locations = await prisma.location.findMany({
      include: {
        warehouse: {
          select: { name: true, code: true }
        }
      }
    });
    if (locations.length === 0) {
      console.log('  No locations found');
    } else {
      locations.forEach(l => {
        console.log(`  ID: ${l.id} | Code: ${l.code} | Name: ${l.name} | Type: ${l.type} | Warehouse: ${l.warehouse.name} (${l.warehouse.code})`);
      });
    }

    // Products
    console.log('\n📦 PRODUCTS:');
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: { name: true }
        }
      },
      take: 10
    });
    if (products.length === 0) {
      console.log('  No products found');
    } else {
      products.forEach(p => {
        console.log(`  ID: ${p.id} | SKU: ${p.sku} | Name: ${p.name} | Category: ${p.category?.name || 'N/A'}`);
      });
      const totalProducts = await prisma.product.count();
      if (totalProducts > 10) {
        console.log(`  ... and ${totalProducts - 10} more products`);
      }
    }

    // Deliveries
    console.log('\n🚚 DELIVERIES:');
    const deliveries = await prisma.delivery.findMany({
      include: {
        warehouse: {
          select: { code: true, name: true }
        },
        items: true
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    if (deliveries.length === 0) {
      console.log('  No deliveries found');
    } else {
      deliveries.forEach(d => {
        console.log(`  ID: ${d.id} | Doc: ${d.documentNumber} | Date: ${d.date.toISOString().split('T')[0]} | Warehouse: ${d.warehouse.code} | Status: ${d.status} | Items: ${d.items.length}`);
      });
      const totalDeliveries = await prisma.delivery.count();
      if (totalDeliveries > 10) {
        console.log(`  ... and ${totalDeliveries - 10} more deliveries`);
      }
    }

    // Ledger (Logs)
    console.log('\n📋 LEDGER (Logs/Movements):');
    const ledger = await prisma.ledger.findMany({
      include: {
        product: {
          select: { sku: true, name: true }
        },
        location: {
          select: { name: true },
          include: {
            warehouse: {
              select: { code: true }
            }
          }
        },
        user: {
          select: { name: true, phone: true }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    if (ledger.length === 0) {
      console.log('  No ledger entries found');
    } else {
      ledger.forEach(l => {
        const qty = l.quantity > 0 ? `+${l.quantity}` : `${l.quantity}`;
        console.log(`  Date: ${l.date.toISOString().split('T')[0]} | ${l.product.sku} | ${l.type} | Qty: ${qty} | Location: ${l.location.name} (${l.location.warehouse.code}) | User: ${l.user.name || l.user.phone}`);
      });
      const totalLedger = await prisma.ledger.count();
      if (totalLedger > 10) {
        console.log(`  ... and ${totalLedger - 10} more entries`);
      }
    }

    // Stock
    console.log('\n📊 STOCK:');
    const stock = await prisma.stock.findMany({
      include: {
        product: {
          select: { sku: true, name: true }
        },
        location: {
          select: { name: true },
          include: {
            warehouse: {
              select: { code: true, name: true }
            }
          }
        }
      },
      where: {
        quantity: { gt: 0 }
      },
      take: 10
    });
    if (stock.length === 0) {
      console.log('  No stock found');
    } else {
      stock.forEach(s => {
        console.log(`  ${s.product.sku} (${s.product.name}) | Location: ${s.location.name} (${s.location.warehouse.code}) | Qty: ${s.quantity}`);
      });
      const totalStock = await prisma.stock.count({ where: { quantity: { gt: 0 } } });
      if (totalStock > 10) {
        console.log(`  ... and ${totalStock - 10} more stock entries`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n📈 SUMMARY:');
    const counts = {
      Users: await prisma.user.count(),
      Warehouses: await prisma.warehouse.count(),
      Locations: await prisma.location.count(),
      Products: await prisma.product.count(),
      Deliveries: await prisma.delivery.count(),
      Receipts: await prisma.receipt.count(),
      Transfers: await prisma.transfer.count(),
      Adjustments: await prisma.adjustment.count(),
      LedgerEntries: await prisma.ledger.count(),
      StockEntries: await prisma.stock.count()
    };

    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  ${table.padEnd(20)}: ${count}`);
    });

  } catch (error) {
    console.error('\n❌ Error viewing data:', error.message);
    if (error.code === 'P1001') {
      console.error('💡 Database connection failed. Check your DATABASE_URL in .env');
    } else if (error.code === 'P2021') {
      console.error('💡 Tables do not exist. Run: npx prisma migrate dev');
    }
  } finally {
    await prisma.$disconnect();
  }
}

viewData();

