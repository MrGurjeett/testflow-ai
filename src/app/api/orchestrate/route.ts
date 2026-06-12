import { NextRequest, NextResponse } from 'next/server';
import { runWorkflow } from '@/services/orchestrator';

/**
 * POST /api/orchestrate
 * Next.js App Router API route to run the multi-agent QA orchestration with progressive updates.
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

    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    // Execute the sequential multi-agent workflow
    runWorkflow(userStory, (event) => {
      // Write progress events directly to the stream
      writer.write(encoder.encode(JSON.stringify({ type: 'progress', ...event }) + '\n'));
    })
      .then((finalResult) => {
        if (!finalResult.success) {
          writer.write(encoder.encode(JSON.stringify({
            type: 'error',
            error: finalResult.error,
            failedAgent: finalResult.failedAgent
          }) + '\n'));
        } else {
          writer.write(encoder.encode(JSON.stringify({
            type: 'final',
            workflowResults: {
              requirements: finalResult.requirementsOutput,
              testDesign: finalResult.testDesignOutput,
              automation: finalResult.automationOutput,
              testExecution: finalResult.testExecutionOutput,
              resultAggregator: finalResult.resultAggregatorOutput,
              qualityAssessment: finalResult.qualityOutput,
              status: 'SUCCESS',
              timings: finalResult.timings,
            }
          }) + '\n'));
        }
        writer.close();
      })
      .catch((error: any) => {
        const errorMsg = error.message || String(error);
        writer.write(encoder.encode(JSON.stringify({
          type: 'error',
          error: errorMsg,
          failedAgent: error.failedAgent || 'Unknown'
        }) + '\n'));
        writer.close();
      });

    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

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
