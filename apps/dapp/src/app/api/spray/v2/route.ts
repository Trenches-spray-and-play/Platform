/**
 * POST /api/spray/v2
 * 
 * Process a spray request with:
 * - 0.5% fee calculation
 * - Proportional allocation to featured projects
 * - Insurance tracking
 * - Risk assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { processSpray, previewSpray } from '@/services/sprayServiceV2';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const SprayRequestSchema = z.object({
  trenchId: z.string(),
  amount: z.number().positive(),
});

const SprayPreviewSchema = z.object({
  trenchId: z.string(),
  amount: z.number().positive(),
  action: z.literal('preview'),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Check if this is a preview request
    const previewResult = SprayPreviewSchema.safeParse(body);
    if (previewResult.success) {
      const { trenchId, amount } = previewResult.data;
      const preview = await previewSpray(trenchId, amount);
      
      return NextResponse.json({
        success: true,
        data: preview,
      });
    }
    
    // Validate request
    const validationResult = SprayRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    const { trenchId, amount } = validationResult.data;
    
    // Process spray
    const result = await processSpray(session.id, trenchId, amount);
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error processing spray:', error);
    
    if (error instanceof Error) {
      // Check for specific error messages
      if (error.message.includes('Trench is')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'TRENCH_INACTIVE' },
          { status: 400 }
        );
      }
      if (error.message.includes('Minimum')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'MIN_AMOUNT_NOT_MET' },
          { status: 400 }
        );
      }
      if (error.message.includes('Maximum')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'MAX_AMOUNT_EXCEEDED' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to process spray' },
      { status: 500 }
    );
  }
}
