const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: 'tobiobembeofficial@gmail.com' },
      select: { id: true, handle: true, balance: true }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User:', user.handle);
    console.log('Balance: $' + user.balance);
    
    // Get deposit address
    const depositAddress = await prisma.depositAddress.findFirst({
      where: { userId: user.id, chain: 'hyperevm' }
    });
    
    console.log('\nDeposit Address:', depositAddress?.address || 'Not found');
    
    // Get recent deposits
    const deposits = await prisma.deposit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('\nRecent Deposits:', deposits.length);
    deposits.forEach(d => {
      console.log(' -', d.amount, d.asset, '| $' + d.amountUsd, '|', d.status, '|', d.createdAt.toISOString().slice(0,10));
    });
    
    // Get recent scan logs
    const scanLogs = await prisma.depositScanLog.findMany({
      where: { userId: user.id },
      orderBy: { scannedAt: 'desc' },
      take: 3
    });
    
    console.log('\nRecent Scan Logs:', scanLogs.length);
    scanLogs.forEach(log => {
      console.log(' -', log.scannedAt.toISOString(), '| found:', log.foundCount, '| duration:', log.durationMs + 'ms', log.error ? '| ERROR: ' + log.error : '');
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
