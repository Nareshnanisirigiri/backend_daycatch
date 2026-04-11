import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const tables = await prisma.$queryRaw`SHOW TABLES;`;
    console.log(JSON.stringify(tables, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
