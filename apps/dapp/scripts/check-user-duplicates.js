const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            handle: true
        }
    });

    console.log(`Check for tobiobembeofficial@gmail.com:`);
    const matches = users.filter(u => u.email === 'tobiobembeofficial@gmail.com');
    console.log(JSON.stringify(matches, null, 2));

    console.log(`\nTotal Users: ${users.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
