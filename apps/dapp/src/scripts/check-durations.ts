
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTrenches() {
    const trenches = await prisma.trench.findMany({
        orderBy: { level: 'asc' }
    });
    console.log('--- TRENCH DURATIONS ---');
    trenches.forEach(t => {
        console.log(`[${t.level}] ${t.name}: ${t.durationHours}h (${(t.durationHours / 24).toFixed(1)} days)`);
    });

    const tasks = await prisma.task.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
    });
    console.log('\n--- ACTIVE TASKS ---');
    tasks.forEach(task => {
        console.log(`[${task.taskType}] ${task.title} (Reward: ${task.reward} BP)`);
    });

    await prisma.$disconnect();
}

checkTrenches();
