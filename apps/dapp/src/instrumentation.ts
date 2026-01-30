/**
 * Next.js Instrumentation
 * 
 * Runs on server startup. Used to initialize background services.
 */

export async function register() {
    // TEMPORARILY DISABLED: Background monitoring causing DB connection exhaustion
    // To re-enable: Uncomment below after fixing connection pool configuration
    console.log('[Instrumentation] Blockchain monitoring disabled (connection pool issues)');
    
    // if (process.env.NEXT_RUNTIME === 'nodejs') {
    //     const { initializeBlockchainServices } = await import('@/lib/blockchain-init');
    //     try {
    //         await initializeBlockchainServices();
    //         console.log('✅ Blockchain services registered via instrumentation');
    //     } catch (error) {
    //         console.error('❌ Failed to initialize blockchain services:', error);
    //     }
    // }
}
