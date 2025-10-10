// Script to seed local database with sample data
const { PrismaClient } = require('@prisma/client');

async function seedData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Seeding local database...');
    
    // Create additional coffee types
    const coffeeData = [
      { name: 'Ethiopian Yirgacheffe', grade: 'SPECIALTY', brewingMethod: 'FILTER', producer: 'Ethiopia', process: 'WASHED', countryOfOrigin: 'Ethiopia', stock: 25.5, price: 45.00 },
      { name: 'Colombian Supremo', grade: 'PREMIUM', brewingMethod: 'ESPRESSO', producer: 'Colombia', process: 'WASHED', countryOfOrigin: 'Colombia', stock: 30.0, price: 38.00 },
      { name: 'Kenyan AA', grade: 'SPECIALTY', brewingMethod: 'FILTER', producer: 'Kenya', process: 'WASHED', countryOfOrigin: 'Kenya', stock: 20.0, price: 42.00 },
      { name: 'Guatemalan Antigua', grade: 'PREMIUM', brewingMethod: 'ESPRESSO', producer: 'Guatemala', process: 'WASHED', countryOfOrigin: 'Guatemala', stock: 15.5, price: 40.00 },
      { name: 'Brazilian Santos', grade: 'COMMERCIAL', brewingMethod: 'ESPRESSO', producer: 'Brazil', process: 'NATURAL', countryOfOrigin: 'Brazil', stock: 50.0, price: 25.00 },
      { name: 'Costa Rican Tarrazu', grade: 'SPECIALTY', brewingMethod: 'FILTER', producer: 'Costa Rica', process: 'WASHED', countryOfOrigin: 'Costa Rica', stock: 18.0, price: 48.00 },
      { name: 'Jamaican Blue Mountain', grade: 'RARITY', brewingMethod: 'FILTER', producer: 'Jamaica', process: 'WASHED', countryOfOrigin: 'Jamaica', stock: 5.0, price: 120.00 },
      { name: 'Hawaiian Kona', grade: 'RARITY', brewingMethod: 'FILTER', producer: 'Hawaii', process: 'WASHED', countryOfOrigin: 'Hawaii', stock: 8.0, price: 95.00 },
      { name: 'Peruvian Organic', grade: 'PREMIUM', brewingMethod: 'ESPRESSO', producer: 'Peru', process: 'ORGANIC', countryOfOrigin: 'Peru', stock: 22.0, price: 35.00 },
      { name: 'Tanzanian Peaberry', grade: 'SPECIALTY', brewingMethod: 'FILTER', producer: 'Tanzania', process: 'WASHED', countryOfOrigin: 'Tanzania', stock: 12.0, price: 55.00 }
    ];
    
    for (const coffee of coffeeData) {
      await prisma.coffee.upsert({
        where: { name: coffee.name },
        update: coffee,
        create: coffee
      });
    }
    
    // Create additional shops
    const shopData = [
      { name: 'Downtown Coffee Shop', address: '123 Main St, Downtown, DT 12345', minCoffeeQuantityLarge: 5, minCoffeeQuantitySmall: 10 },
      { name: 'Mall Location', address: '456 Mall Ave, Shopping Center, SC 67890', minCoffeeQuantityLarge: 3, minCoffeeQuantitySmall: 8 },
      { name: 'Airport Terminal', address: '789 Airport Blvd, Terminal 2, AP 54321', minCoffeeQuantityLarge: 8, minCoffeeQuantitySmall: 15 }
    ];
    
    for (const shop of shopData) {
      await prisma.shop.upsert({
        where: { name: shop.name },
        update: shop,
        create: shop
      });
    }
    
    // Get the first shop to create inventory
    const firstShop = await prisma.shop.findFirst();
    if (firstShop) {
      // Create some inventory records
      const coffees = await prisma.coffee.findMany({ take: 5 });
      for (const coffee of coffees) {
        await prisma.retailInventory.upsert({
          where: { 
            shopId_coffeeId: {
              shopId: firstShop.id,
              coffeeId: coffee.id
            }
          },
          update: {
            quantity: Math.floor(Math.random() * 20) + 5
          },
          create: {
            shopId: firstShop.id,
            coffeeId: coffee.id,
            quantity: Math.floor(Math.random() * 20) + 5
          }
        });
      }
    }
    
    console.log('✅ Local database seeded successfully!');
    console.log(`Created ${coffeeData.length} coffee types`);
    console.log(`Created ${shopData.length} additional shops`);
    console.log('Created inventory records');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();


