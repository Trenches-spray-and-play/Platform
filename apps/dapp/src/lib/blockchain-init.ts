/**
 * Initialize blockchain monitoring on server startup
 * This should be called from a server-side entry point
 */

import { startMonitoring, initializeBlockchain } from '@/services/blockchain.monitor';
import { expirePendingTransactions } from '@/services/transaction.service';

let monitoringStarted = false;

/**
 * Start blockchain monitoring (call this from API route or server startup)
 */
export async function initializeBlockchainServices() {
  if (monitoringStarted) {
    return;
  }

  // Initialize blockchain connection
  const initialized = initializeBlockchain();
  
  if (!initialized) {
    console.warn('Blockchain monitoring not started - HYPEREVM_RPC_URL not configured');
    return;
  }

  // Start monitoring
  await startMonitoring();
  monitoringStarted = true;

  // Expire old pending transactions on startup
  const expiredCount = await expirePendingTransactions();
  if (expiredCount > 0) {
    console.log(`Expired ${expiredCount} pending transactions on startup`);
  }

  // Schedule periodic expiration check (every 5 minutes)
  setInterval(async () => {
    await expirePendingTransactions();
  }, 5 * 60 * 1000);

  console.log('Blockchain services initialized');
}
