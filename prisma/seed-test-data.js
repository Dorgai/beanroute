const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting test data seed...');

  // Get the admin user (created by the main seed)
  const admin = await prisma.user.findUnique({
    where: { username: 'admin' }
  });

  if (!admin) {
    throw new Error('Admin user not found. Run the main seed first with npx prisma db seed');
  }
  
  // Create a retailer user
  const retailerPassword = await bcrypt.hash('retailer123', 10);
  const retailer = await prisma.user.upsert({
    where: { username: 'retailer' },
    update: {},
    create: {
      username: 'retailer',
      email: 'retailer@beanroute.com',
      password: retailerPassword,
      firstName: 'Retail',
      lastName: 'Manager',
      role: 'RETAILER',
      status: 'ACTIVE'
    }
  });
  console.log(`Created retailer user: ${retailer.username}`);

  // Create test shops
  const shops = [
    {
      name: 'Downtown Coffee Shop',
      address: '123 Main Street',
      city: 'New York',
      minCoffeeQuantitySmall: 25,
      minCoffeeQuantityLarge: 10
    },
    {
      name: 'Uptown Cafe',
      address: '456 Broadway',
      city: 'Los Angeles',
      minCoffeeQuantitySmall: 20,
      minCoffeeQuantityLarge: 8
    },
    {
      name: 'Bean Heaven',
      address: '789 Market St',
      city: 'San Francisco',
      minCoffeeQuantitySmall: 30,
      minCoffeeQuantityLarge: 15
    }
  ];

  for (const shopData of shops) {
    const shop = await prisma.shop.upsert({
      where: { name: shopData.name },
      update: shopData,
      create: {
        ...shopData,
        createdById: admin.id
      }
    });
    console.log(`Created/updated shop: ${shop.name}`);
    
    // Associate the retailer with this shop
    await prisma.userShop.upsert({
      where: {
        userId_shopId: {
          userId: retailer.id,
          shopId: shop.id
        }
      },
      update: { role: 'RETAILER' },
      create: {
        userId: retailer.id,
        shopId: shop.id,
        role: 'RETAILER'
      }
    });
  }

  // Create various coffee entries
  const coffees = [
    {
      name: 'Colombian Supremo',
      quantity: 200,
      grade: 'SPECIALTY',
      country: 'Colombia',
      producer: 'Supremo Cooperative',
      notes: 'Caramel and chocolate notes, full-bodied'
    },
    {
      name: 'Brazilian Santos',
      quantity: 150,
      grade: 'PREMIUM',
      country: 'Brazil',
      producer: 'Santos Farms',
      notes: 'Nutty with mild acidity'
    },
    {
      name: 'Kenyan AA',
      quantity: 100,
      grade: 'RARITY',
      country: 'Kenya',
      producer: 'Nyeri Cooperative',
      notes: 'Vibrant acidity, blackcurrant and citrus notes'
    },
    {
      name: 'Sumatra Mandheling',
      quantity: 180,
      grade: 'PREMIUM',
      country: 'Indonesia',
      producer: 'Mandheling Estate',
      notes: 'Earthy, low acidity, full body'
    }
  ];

  for (const coffeeData of coffees) {
    const coffee = await prisma.greenCoffee.upsert({
      where: {
        name_country_producer: {
          name: coffeeData.name,
          country: coffeeData.country || '',
          producer: coffeeData.producer || ''
        }
      },
      update: coffeeData,
      create: {
        ...coffeeData,
        createdById: admin.id
      }
    });
    console.log(`Created/updated coffee: ${coffee.name}`);
  }

  // Add some inventory to shops (including low levels for alerts)
  const shops_list = await prisma.shop.findMany();
  const coffees_list = await prisma.greenCoffee.findMany();

  // Create retail inventory with low levels for testing alerts
  for (const shop of shops_list) {
    for (const coffee of coffees_list) {
      // Set some shops to have low inventory for certain coffees
      let smallBags = Math.floor(Math.random() * 30) + 1;
      let largeBags = Math.floor(Math.random() * 15) + 1;
      
      // Make some items low in inventory for testing
      if (shop.name === 'Downtown Coffee Shop' && coffee.name === 'Colombian Supremo') {
        smallBags = 3; // Critical level
        largeBags = 2; // Critical level
      } else if (shop.name === 'Uptown Cafe' && coffee.name === 'Brazilian Santos') {
        smallBags = 10; // Warning level
        largeBags = 4; // Warning level
      }
      
      // Calculate total quantity (1 small bag = 0.25kg, 1 large bag = 1kg)
      const totalQuantity = (smallBags * 0.25) + (largeBags * 1);
      
      await prisma.retailInventory.upsert({
        where: {
          shopId_coffeeId: {
            shopId: shop.id,
            coffeeId: coffee.id
          }
        },
        update: {
          smallBags,
          largeBags,
          totalQuantity
        },
        create: {
          shopId: shop.id,
          coffeeId: coffee.id,
          smallBags,
          largeBags,
          totalQuantity,
          lastOrderDate: new Date()
        }
      });
    }
  }
  
  // Create a test inventory alert log
  const testShop = shops_list.find(shop => shop.name === 'Downtown Coffee Shop');
  if (testShop) {
    const alertLog = await prisma.inventoryAlertLog.create({
      data: {
        shopId: testShop.id,
        alertType: 'WARNING',
        totalSmallBags: 5,
        totalLargeBags: 2,
        minSmallBags: 25,
        minLargeBags: 10,
        smallBagsPercentage: 20.0,
        largeBagsPercentage: 20.0,
        loggedById: admin.id,
        notifiedUsers: {
          connect: [{ id: admin.id }, { id: retailer.id }]
        },
        emailsSent: true
      }
    });
    console.log(`Created test alert log for shop: ${testShop.name}`);
  }

  console.log('Test data seed completed!');
}

main()
  .catch((e) => {
    console.error('Error in test data seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 