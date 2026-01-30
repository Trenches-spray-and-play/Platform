const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const deposits = await prisma.deposit.findMany();
    console.log(JSON.stringify(deposits, (key, value) => {
        if (typeof value === 'bigint') return value.toString();
        return value;
    }, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
