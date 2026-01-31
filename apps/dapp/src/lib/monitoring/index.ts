/**
 * Monitoring Library - Main exports
 * 
 * Usage:
 * 
 * // In API routes
 * import { withMonitoring } from '@/lib/monitoring';
 * import { alertHealthCheckFailed } from '@/lib/monitoring/alerts';
 * 
 * // Wrap your handler
 * export const GET = withMonitoring(async (request) => {
 *   // your code
 * });
 * 
 * // Send alerts
 * await alertHealthCheckFailed('database', error.message);
 */

export { withMonitoring, getPerformanceStats, getRawMetrics, clearOldMetrics } from './middleware';
export {
    sendAlert,
    alertHealthCheckFailed,
    alertHighLatency,
    alertRpcFailure,
    alertDeploymentSuccess,
    type AlertPayload,
    type AlertSeverity,
} from './alerts';
