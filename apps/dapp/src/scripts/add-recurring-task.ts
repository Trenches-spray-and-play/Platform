
import { PrismaClient, TaskType } from '@prisma/client';

const prisma = new PrismaClient();

async function addRecurringTask() {
    console.log('🔄 Adding Recurring Deployment Task...');

    // Add a recurring task that MUST be done every time
    const task = await prisma.task.upsert({
        where: { id: 'task-intel-briefing' },
        update: {
            taskType: TaskType.RECURRING,
            isActive: true,
            title: 'Verify Intel Briefing',
            description: 'Acknowledge the latest mission parameters before deployment.',
            reward: 25,
            order: 0
        },
        create: {
            id: 'task-intel-briefing',
            title: 'Verify Intel Briefing',
            description: 'Acknowledge the latest mission parameters before deployment.',
            reward: 25,
            taskType: TaskType.RECURRING,
            isActive: true,
            order: 0
        }
    });

    console.log(`✅ ${task.title} (ID: ${task.id}) is now ACTIVE as a RECURRING task.`);
    await prisma.$disconnect();
}

addRecurringTask().catch(console.error);
