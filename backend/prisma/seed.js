import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Categories
  const category1 = await prisma.category.create({
    data: {
      name: 'Electronics',
      description: 'Electronic products and components'
    }
  });

  const category2 = await prisma.category.create({
    data: {
      name: 'Clothing',
      description: 'Apparel and accessories'
    }
  });

  console.log('✅ Created categories');

  // Create Warehouses
  const warehouse1 = await prisma.warehouse.create({
    data: {
      name: 'Main Warehouse',
      code: 'WH-001',
      address: '123 Main Street, City, State 12345',
      phone: '+1234567890'
    }
  });

  const warehouse2 = await prisma.warehouse.create({
    data: {
      name: 'Secondary Warehouse',
      code: 'WH-002',
      address: '456 Oak Avenue, City, State 12345',
      phone: '+1234567891'
    }
  });

  console.log('✅ Created warehouses');

  // Create Locations
  const location1 = await prisma.location.create({
    data: {
      warehouseId: warehouse1.id,
      name: 'Zone A',
      code: 'Z-A',
      type: 'STORAGE'
    }
  });

  const location2 = await prisma.location.create({
    data: {
      warehouseId: warehouse1.id,
      name: 'Zone B',
      code: 'Z-B',
      type: 'STORAGE'
    }
  });

  const location3 = await prisma.location.create({
    data: {
      warehouseId: warehouse2.id,
      name: 'Zone A',
      code: 'Z-A',
      type: 'STORAGE'
    }
  });

  console.log('✅ Created locations');

  // Create Products
  const product1 = await prisma.product.create({
    data: {
      sku: 'SKU-001',
      name: 'Laptop Computer',
      description: 'High-performance laptop',
      categoryId: category1.id,
      unit: 'pcs',
      reorderPoint: 10
    }
  });

  const product2 = await prisma.product.create({
    data: {
      sku: 'SKU-002',
      name: 'T-Shirt',
      description: 'Cotton t-shirt',
      categoryId: category2.id,
      unit: 'pcs',
      reorderPoint: 20
    }
  });

  const product3 = await prisma.product.create({
    data: {
      sku: 'SKU-003',
      name: 'Smartphone',
      description: 'Latest smartphone model',
      categoryId: category1.id,
      unit: 'pcs',
      reorderPoint: 15
    }
  });

  console.log('✅ Created products');

  // Create initial stock
  await prisma.stock.create({
    data: {
      productId: product1.id,
      locationId: location1.id,
      quantity: 50
    }
  });

  await prisma.stock.create({
    data: {
      productId: product2.id,
      locationId: location1.id,
      quantity: 100
    }
  });

  await prisma.stock.create({
    data: {
      productId: product3.id,
      locationId: location2.id,
      quantity: 5  // Low stock for testing
    }
  });

  console.log('✅ Created initial stock');

  console.log('🎉 Seeding completed!');
  console.log('\n📝 Sample data created:');
  console.log('  - 2 Categories');
  console.log('  - 2 Warehouses');
  console.log('  - 3 Locations');
  console.log('  - 3 Products');
  console.log('  - 3 Stock entries');
  console.log('\n💡 You can now login and start using the system!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

