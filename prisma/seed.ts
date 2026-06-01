import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const email = 'demo@collabboard.dev';

  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'Demo User' },
  });

  await db.board.createMany({
    data: [
      { title: 'Product Roadmap', userId: user.id, isPublic: true },
      { title: 'Sprint Retro', userId: user.id },
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
