/**
 * Next.js Instrumentation
 * 
 * Runs on server startup. Used to initialize background services.
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { initializeBlockchainServices } = await import('@/lib/blockchain-init');

        try {
            // Start blockchain monitoring services
            await initializeBlockchainServices();
            console.log('✅ Blockchain services registered via instrumentation');
        } catch (error) {
            console.error('❌ Failed to initialize blockchain services in instrumentation:', error);
        }
    }
}
