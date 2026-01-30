
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:TboXtraCash1%21%21%3FT@db.nlloqdxjynwvmxwrruhb.supabase.co:5432/postgres"
        }
    }
});

async function main() {
    console.log('--- USER INFO ---');
    const users = await prisma.user.findMany({
        where: {
            handle: {
                contains: 'izecube',
                mode: 'insensitive'
            }
        }
    });
    console.log(JSON.stringify(users, null, 2));

    if (users.length > 0) {
        const userId = users[0].id;
        console.log('\n--- DEPOSITS FOR USER ---');
        const deposits = await prisma.deposit.findMany({
            where: { userId },
            include: {
                depositAddress: true
            }
        });
        console.log(JSON.stringify(deposits, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
