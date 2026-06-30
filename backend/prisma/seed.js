import { prisma } from '../src/config/prisma.js';

async function ensureOrganization() {
  const existing = await prisma.organization.findFirst({
    where: { name: 'VMS Demo Organization' }
  });

  if (existing) {
    return existing;
  }

  return prisma.organization.create({
    data: {
      name: 'VMS Demo Organization',
      email: 'demo-organization@example.com',
      phone: '0900000000',
      address: 'Demo address',
      description: 'Non-production organization seed for local UC12 testing.'
    }
  });
}

async function ensureCategory() {
  return prisma.eventCategory.upsert({
    where: {
      name_categoryType: {
        name: 'Community',
        categoryType: 'TYPE'
      }
    },
    update: {},
    create: {
      name: 'Community',
      categoryType: 'TYPE',
      description: 'General community volunteer events.'
    }
  });
}

async function ensureEvent(title, data) {
  const existing = await prisma.event.findFirst({ where: { title } });

  if (existing) {
    return existing;
  }

  return prisma.event.create({
    data: {
      title,
      description: data.description,
      location: data.location,
      startDate: data.startDate,
      endDate: data.endDate,
      applicationDeadline: data.applicationDeadline,
      maxCapacity: data.maxCapacity,
      approvedParticipants: data.approvedParticipants,
      status: data.status,
      organizationId: data.organizationId,
      categoryId: data.categoryId
    }
  });
}

async function main() {
  await prisma.role.createMany({
    data: [
      { name: 'VOLUNTEER', description: 'Volunteer participant' },
      { name: 'STAFF', description: 'Event staff' },
      { name: 'MANAGER', description: 'Management user' },
      { name: 'ADMIN', description: 'System administrator' }
    ],
    skipDuplicates: true
  });

  const organization = await ensureOrganization();
  const category = await ensureCategory();
  const now = new Date();
  const futureStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const futureEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000);
  const futureDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  await ensureEvent('UC12 Seed - Eligible Event', {
    description: 'Eligible non-production event for local Apply Event testing.',
    location: 'Ho Chi Minh City',
    startDate: futureStart,
    endDate: futureEnd,
    applicationDeadline: futureDeadline,
    maxCapacity: 30,
    approvedParticipants: 5,
    status: 'PUBLISHED',
    organizationId: organization.id,
    categoryId: category.id
  });

  await ensureEvent('UC12 Seed - Full Event', {
    description: 'Full non-production event for local Apply Event testing.',
    location: 'Ho Chi Minh City',
    startDate: futureStart,
    endDate: futureEnd,
    applicationDeadline: futureDeadline,
    maxCapacity: 10,
    approvedParticipants: 10,
    status: 'PUBLISHED',
    organizationId: organization.id,
    categoryId: category.id
  });

  await ensureEvent('UC12 Seed - Draft Event', {
    description: 'Draft non-production event for local Apply Event testing.',
    location: 'Ho Chi Minh City',
    startDate: futureStart,
    endDate: futureEnd,
    applicationDeadline: futureDeadline,
    maxCapacity: 20,
    approvedParticipants: 0,
    status: 'DRAFT',
    organizationId: organization.id,
    categoryId: category.id
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
