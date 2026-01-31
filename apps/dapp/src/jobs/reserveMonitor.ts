/**
 * Reserve Health Monitor
 * 
 * Runs every 5 minutes to:
 * - Check insurance buffer levels
 * - Update trench status (ACTIVE/PAUSED/EMERGENCY)
 * - Log insurance events
 */

import { checkReserveHealth } from '@/services/insuranceService';

/**
 * Run reserve health check
 */
export async function runReserveMonitor(): Promise<void> {
  console.log('[ReserveMonitor] Starting health check...');
  const startTime = Date.now();
  
  try {
    await checkReserveHealth();
    console.log(`[ReserveMonitor] Health check completed in ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error('[ReserveMonitor] Health check failed:', error);
    throw error;
  }
}

/**
 * Start scheduled monitoring (for use with cron/job scheduler)
 */
export function startReserveMonitoring(intervalMinutes: number = 5): void {
  console.log(`[ReserveMonitor] Starting scheduled monitoring (every ${intervalMinutes} minutes)`);
  
  // Run immediately
  runReserveMonitor();
  
  // Schedule recurring runs
  setInterval(runReserveMonitor, intervalMinutes * 60 * 1000);
}

// For manual execution
if (require.main === module) {
  runReserveMonitor()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
