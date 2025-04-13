import prisma from './prisma';

export async function getTeamById(id) {
  return prisma.team.findUnique({
    where: { id },
  });
}

export async function getTeams(search = '', page = 1, limit = 10) {
  const where = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  const skip = (page - 1) * limit;
  
  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.team.count({ where }),
  ]);
  
  return {
    teams,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createTeam(data) {
  return prisma.team.create({
    data,
  });
}

export async function updateTeam(id, data) {
  return prisma.team.update({
    where: { id },
    data,
  });
}

export async function deleteTeam(id) {
  return prisma.team.delete({
    where: { id },
  });
}

export async function getTeamMembers(teamId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const [teamMembers, total] = await Promise.all([
    prisma.userTeam.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
          },
        },
      },
      skip,
      take: limit,
    }),
    prisma.userTeam.count({ where: { teamId } }),
  ]);
  
  // Format the response
  const members = teamMembers.map(member => ({
    ...member.user,
    teamRole: member.role,
    assignedAt: member.createdAt,
  }));
  
  return {
    members,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateTeamMemberRole(teamId, userId, role) {
  return prisma.userTeam.update({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
    data: { role },
  });
}

export async function getUsersNotInTeam(teamId, search = '', page = 1, limit = 10) {
  // Get all user IDs that are already in the team
  const teamMemberIds = await prisma.userTeam.findMany({
    where: { teamId },
    select: { userId: true },
  });
  
  const memberIds = teamMemberIds.map(member => member.userId);
  
  // Find users not in the team
  const where = {
    id: { notIn: memberIds },
    status: 'ACTIVE',
  };
  
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      skip,
      take: limit,
      orderBy: { username: 'asc' },
    }),
    prisma.user.count({ where }),
  ]);
  
  return {
    users,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
} 