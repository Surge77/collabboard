import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const email = 'demo@collabboard.dev';

  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'Demo User' },
  });

  const org = await db.organization.upsert({
    where: { personalForUserId: user.id },
    update: {},
    create: {
      name: 'Personal',
      personalForUserId: user.id,
      members: { create: { userId: user.id, role: 'ADMIN' } },
    },
  });

  await db.board.createMany({
    data: [
      {
        title: 'Product Roadmap',
        userId: user.id,
        createdById: user.id,
        orgId: org.id,
        isPublic: true,
      },
      { title: 'Sprint Retro', userId: user.id, createdById: user.id, orgId: org.id },
    ],
  });

  console.warn(`Seeded user ${user.email} with sample boards.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void db.$disconnect();
  });
