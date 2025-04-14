const { PrismaClient, Role, TeamRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding the database with updated roles...');

  // --- Create Users with Correct Roles --- 
  const usersToCreate = [
    { username: 'admin', password: 'admin123', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: 'ADMIN' },
    { username: 'owner', password: 'owner123', firstName: 'Owner', lastName: 'User', email: 'owner@example.com', role: 'OWNER' },
    { username: 'retailer', password: 'retailer123', firstName: 'Retail', lastName: 'User', email: 'retailer@example.com', role: 'RETAILER' },
    { username: 'roaster', password: 'roaster123', firstName: 'Roast', lastName: 'User', email: 'roaster@example.com', role: 'ROASTER' },
    { username: 'barista', password: 'barista123', firstName: 'Barista', lastName: 'User', email: 'barista@example.com', role: 'BARISTA' },
  ];

  const createdUsers = {};

  for (const userData of usersToCreate) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    try {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: { 
          role: userData.role, // Use string role instead of enum
          password: hashedPassword, // Update password on seed run
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username
        },
        create: {
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role, // Use string role from loop
        },
      });
      createdUsers[userData.role] = user; // Store created user by role for later use
      console.log(`Created/Updated ${userData.role} user: ${user.username}`);
    } catch (error) {
        console.error(`Failed to create/update user ${userData.username}:`, error);
        // Decide if you want to continue or exit on error
    }
  }

  // --- Create Team and Assign Users (Example) ---
  let team;
  try {
      team = await prisma.team.upsert({
          where: { name: 'Main Operations' },
          update: {},
          create: {
              name: 'Main Operations',
              description: 'Primary operational team',
          },
      });
      console.log(`Created/Found team: ${team.name}`);
  } catch (error) {
      console.error("Failed to create/find team:", error);
      // Handle error appropriately, maybe exit
  }

  if (team && Object.keys(createdUsers).length > 0) {
      // Example assignments - adjust as needed
      const assignments = [
          { role: 'ADMIN', teamRole: 'OWNER' }, 
          { role: 'OWNER', teamRole: 'ADMIN' },
          { role: 'RETAILER', teamRole: 'MEMBER' },
          { role: 'ROASTER', teamRole: 'MEMBER' },
          { role: 'BARISTA', teamRole: 'MEMBER' },
      ];

      for (const assignment of assignments) {
          const user = createdUsers[assignment.role];
          if (user) {
              try {
                  await prisma.userTeam.upsert({
                      where: { userId_teamId: { userId: user.id, teamId: team.id } },
                      update: { role: assignment.teamRole }, // Update role if assignment exists
                      create: {
                          userId: user.id,
                          teamId: team.id,
                          role: assignment.teamRole, // Use string role instead of enum
                      },
                  });
                  console.log(`Assigned ${assignment.role} user (${user.username}) to team ${team.name} as ${assignment.teamRole}`);
              } catch (error) {
                  console.error(`Failed to assign user ${user.username} to team:`, error);
              }
          }
      }
  } else {
      console.log('Skipping team assignments (team or users missing).');
  }

  // --- Create Permissions (Example for ADMIN) ---
  // Permissions might need adjustment based on new roles
  const adminPermissions = [
    { resource: 'user', action: 'create' },
    { resource: 'user', action: 'read' },
    { resource: 'user', action: 'update' },
    { resource: 'user', action: 'delete' },
    { resource: 'shop', action: 'create' },
    { resource: 'shop', action: 'read' },
    { resource: 'shop', action: 'update' },
    { resource: 'shop', action: 'delete' },
    { resource: 'team', action: 'create' },
    { resource: 'team', action: 'read' },
    { resource: 'team', action: 'update' },
    { resource: 'team', action: 'delete' },
  ];

  const adminUser = createdUsers['ADMIN'];
  if (adminUser) {
      console.log(`Setting up permissions for ADMIN user: ${adminUser.username}`);
      for (const perm of adminPermissions) {
          try {
              await prisma.permission.upsert({
                  where: {
                      userId_resource_action: {
                          userId: adminUser.id,
                          resource: perm.resource,
                          action: perm.action,
                      },
                  },
                  update: {},
                  create: {
                      name: `${perm.action}_${perm.resource}`,
                      resource: perm.resource,
                      action: perm.action,
                      userId: adminUser.id,
                      createdById: adminUser.id, // Admin creates their own permissions here
                  },
              });
          } catch (error) {
              console.error(`Failed to create permission ${perm.action}_${perm.resource} for admin:`, error);
          }
      }
      console.log('Finished setting up admin permissions.');
  } else {
      console.log('ADMIN user not found, skipping admin permission setup.');
  }

  // TODO: Define and create permissions for OWNER, RETAILER, ROASTER, BARISTA as needed

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