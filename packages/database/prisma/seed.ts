import { auth } from "@repo/auth/server";
import { prisma } from "../src";

const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1"]);

function isLocalDatabase(databaseUrl: string | undefined) {
  if (!databaseUrl) return false;
  try {
    return LOCAL_DB_HOSTS.has(new URL(databaseUrl).hostname);
  } catch {
    return false;
  }
}

function resolveSeedPassword() {
  if (process.env.SEED_PASSWORD) {
    return process.env.SEED_PASSWORD;
  }

  if (isLocalDatabase(process.env.DATABASE_URL)) {
    // Known, fixed credential relied on by e2e/helpers/auth.ts (SEEDED_USER)
    // for local dev and CI runs against a local Postgres.
    return "asdfasdf";
  }

  throw new Error(
    "Refusing to seed a non-local DATABASE_URL without an explicit SEED_PASSWORD. " +
      "Set SEED_PASSWORD to a strong value before seeding a shared/staging/deployed database.",
  );
}

const DEFAULT_PASSWORD = resolveSeedPassword();

const users = [
  { email: "admin@example.com", name: "Seth Davis", role: "admin" },
  {
    email: "diana.martinez@example.com",
    name: "Diana Martinez",
    role: "admin",
  },
  { email: "ethan.brown@example.com", name: "Ethan Brown", role: "user" },
  { email: "fiona.wilson@example.com", name: "Fiona Wilson", role: "user" },
  { email: "george.taylor@example.com", name: "George Taylor", role: "user" },
];

async function seed() {
  console.log(`Seeding ${users.length} users...`);

  let created = 0;
  let skipped = 0;

  for (const user of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      skipped++;
      continue;
    }

    const result = await auth.api.signUpEmail({
      body: {
        name: user.name,
        email: user.email,
        password: DEFAULT_PASSWORD,
      },
    });

    if (result.user) {
      await prisma.user.update({
        where: { id: result.user.id },
        data: { role: user.role },
      });
      created++;
    }
  }

  console.log(`Done: ${created} created, ${skipped} already existed.`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
