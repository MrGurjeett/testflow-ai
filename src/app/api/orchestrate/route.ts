import { NextRequest, NextResponse } from 'next/server';
import { runFullWorkflow } from '@/services/foundry';

/**
 * POST /api/orchestrate
 * Next.js App Router API route to run the multi-agent QA orchestration.
 * 
 * Request Body:
 * {
 *   "userStory": "As a user..."
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.userStory !== 'string' || !body.userStory.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid parameter "userStory" in request body.',
        },
        { status: 400 }
      );
    }

    const { userStory } = body;

    // Execute the sequential multi-agent workflow
    const results = await runFullWorkflow(userStory);

    if (results.status === 'FAILED') {
      // Return 500 Internal Server Error with specific failed agent and error message
      return NextResponse.json(
        {
          success: false,
          failedAgent: results.failedAgent || 'Unknown',
          error: results.error || 'An error occurred during workflow execution.',
        },
        { status: 500 }
      );
    }

    // Return the successful orchestration response bundle
    return NextResponse.json(
      {
        success: true,
        workflowResults: {
          requirements: results.requirements,
          testDesign: results.testDesign,
          automation: results.automation,
          qualityAssessment: results.qualityAssessment,
          status: results.status,
          timestamps: results.timestamps,
          duration: results.duration,
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[POST /api/orchestrate Exception]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected exception occurred on the orchestrator server.',
      },
      { status: 500 }
    );
  }
}
