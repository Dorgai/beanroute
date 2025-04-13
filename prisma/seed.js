const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding the database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  console.log(`Created admin user: ${admin.username}`);

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      username: 'manager',
      email: 'manager@example.com',
      password: managerPassword,
      firstName: 'Manager',
      lastName: 'User',
      role: 'MANAGER',
    },
  });

  console.log(`Created manager user: ${manager.username}`);

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      username: 'user',
      email: 'user@example.com',
      password: userPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: 'USER',
    },
  });

  console.log(`Created regular user: ${user.username}`);

  // Create a team
  const team = await prisma.team.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: {
      name: 'Engineering',
      description: 'Engineering department responsible for development',
    },
  });

  console.log(`Created team: ${team.name}`);

  // Assign users to the team
  await prisma.userTeam.upsert({
    where: { userId_teamId: { userId: admin.id, teamId: team.id } },
    update: {},
    create: {
      userId: admin.id,
      teamId: team.id,
      role: 'OWNER',
    },
  });

  await prisma.userTeam.upsert({
    where: { userId_teamId: { userId: manager.id, teamId: team.id } },
    update: {},
    create: {
      userId: manager.id,
      teamId: team.id,
      role: 'ADMIN',
    },
  });

  await prisma.userTeam.upsert({
    where: { userId_teamId: { userId: user.id, teamId: team.id } },
    update: {},
    create: {
      userId: user.id,
      teamId: team.id,
      role: 'MEMBER',
    },
  });

  console.log('Assigned users to the Engineering team');

  // Create permissions for admin
  const adminPermissions = [
    { resource: 'user', action: 'create' },
    { resource: 'user', action: 'read' },
    { resource: 'user', action: 'update' },
    { resource: 'user', action: 'delete' },
    { resource: 'team', action: 'create' },
    { resource: 'team', action: 'read' },
    { resource: 'team', action: 'update' },
    { resource: 'team', action: 'delete' },
  ];

  for (const perm of adminPermissions) {
    await prisma.permission.upsert({
      where: {
        userId_resource_action: {
          userId: admin.id,
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {},
      create: {
        name: `${perm.action}_${perm.resource}`,
        resource: perm.resource,
        action: perm.action,
        userId: admin.id,
        createdById: admin.id,
      },
    });
  }

  console.log('Created admin permissions');

  // Create permissions for manager
  const managerPermissions = [
    { resource: 'user', action: 'read' },
    { resource: 'user', action: 'update' },
    { resource: 'team', action: 'read' },
    { resource: 'team', action: 'update' },
  ];

  for (const perm of managerPermissions) {
    await prisma.permission.upsert({
      where: {
        userId_resource_action: {
          userId: manager.id,
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {},
      create: {
        name: `${perm.action}_${perm.resource}`,
        resource: perm.resource,
        action: perm.action,
        userId: manager.id,
        createdById: admin.id,
      },
    });
  }

  console.log('Created manager permissions');

  // Create permissions for regular user
  const userPermissions = [
    { resource: 'user', action: 'read' },
    { resource: 'team', action: 'read' },
  ];

  for (const perm of userPermissions) {
    await prisma.permission.upsert({
      where: {
        userId_resource_action: {
          userId: user.id,
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {},
      create: {
        name: `${perm.action}_${perm.resource}`,
        resource: perm.resource,
        action: perm.action,
        userId: user.id,
        createdById: admin.id,
      },
    });
  }

  console.log('Created user permissions');

  console.log('✅ Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 