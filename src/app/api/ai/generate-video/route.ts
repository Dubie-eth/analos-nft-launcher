/**
 * AI VIDEO GENERATION API
 * Generates short videos for evolving NFTs (6.9 seconds)
 */

import { NextRequest, NextResponse } from 'next/server';

function badRequest(detail: string, fieldErrors?: Record<string, string>) {
  return NextResponse.json(
    {
      error: 'ERROR_BAD_REQUEST',
      details: {
        title: 'Bad request.',
        detail,
        isRetryable: false,
        additionalInfo: fieldErrors && Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {},
        buttons: [],
        planChoices: []
      }
    },
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return badRequest('Content-Type must be application/json');
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return badRequest('Invalid JSON payload');
  }

  const { prompt, duration = 6.9, baseImage, style = 'smooth transition' } = body || {};
  const normalizedStyle = typeof style === 'string' ? style.trim() : '';

  const fieldErrors: Record<string, string> = {};
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    fieldErrors.prompt = 'Prompt is required and must be a non-empty string';
  }
  if (typeof baseImage !== 'string' || !/^https?:\/\//.test(baseImage)) {
    fieldErrors.baseImage = 'baseImage must be a valid http(s) URL to an image';
  }
  if (typeof duration !== 'number' || duration <= 0 || duration > 60) {
    fieldErrors.duration = 'Duration must be a number between 0 and 60 seconds';
  }
  if (typeof style !== 'string' || normalizedStyle.length === 0) {
    fieldErrors.style = 'Style must be a non-empty string';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return badRequest('Invalid request parameters', fieldErrors);
  }

  // Check for API key
  const apiKey = process.env.RUNWAY_API_KEY || process.env.STABLE_VIDEO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Video generation API key not configured' },
      { status: 500 }
    );
  }

  try {
    // For now, return a placeholder video URL
    // In production, this would call Runway ML, Stable Video Diffusion, or similar
    const videoUrl = `https://cyan-bewildered-ape-960.mypinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm`;

    return NextResponse.json({
      videoUrl,
      prompt,
      duration,
      baseImage,
      style: normalizedStyle || 'smooth transition',
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}
