export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        console.log('[Instrumentation] Running on Node.js runtime');
        
        // Re-enable blockchain services now that connection is fixed
        const { initializeBlockchainServices } = await import('@/lib/blockchain-init');
        try {
            await initializeBlockchainServices();
            console.log('✅ Blockchain services registered via instrumentation');
        } catch (error) {
            console.error('❌ Failed to initialize blockchain services in instrumentation:', error);
        }
    }
}
