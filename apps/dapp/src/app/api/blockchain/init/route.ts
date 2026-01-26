import { NextResponse } from 'next/server';
import { initializeBlockchainServices } from '@/lib/blockchain-init';

/**
 * Initialize blockchain monitoring
 * Call this endpoint once on server startup or via cron
 */
export async function POST() {
  try {
    await initializeBlockchainServices();
    return NextResponse.json({
      success: true,
      message: 'Blockchain services initialized',
    });
  } catch (error) {
    console.error('Error initializing blockchain services:', error);
    return NextResponse.json(
      { error: 'Failed to initialize blockchain services' },
      { status: 500 }
    );
  }
}
