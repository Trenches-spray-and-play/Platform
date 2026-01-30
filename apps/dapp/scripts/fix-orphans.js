const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find all deposits that have a userId but might have an orphaned depositAddressId
    const deposits = await prisma.deposit.findMany({
        include: {
            depositAddress: true
        }
    });

    console.log(`Checking ${deposits.length} deposits...`);

    for (const deposit of deposits) {
        if (!deposit.depositAddress) {
            console.log(`Found orphaned deposit: ${deposit.id} (${deposit.txHash}) on ${deposit.chain}`);

            // Try to find a valid deposit address for this user and chain
            const correctAddress = await prisma.depositAddress.findFirst({
                where: {
                    userId: deposit.userId,
                    chain: deposit.chain
                }
            });

            if (correctAddress) {
                console.log(`Linking to correct deposit address: ${correctAddress.id} (${correctAddress.address})`);
                await prisma.deposit.update({
                    where: { id: deposit.id },
                    data: { depositAddressId: correctAddress.id }
                });
            } else {
                console.log(`❌ Could not find a valid deposit address for user ${deposit.userId} on ${deposit.chain}`);
            }
        }
    }

    console.log('Finished fixing orphans.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
