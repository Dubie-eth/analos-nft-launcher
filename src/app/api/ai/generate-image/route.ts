/**
 * AI IMAGE GENERATION API
 * Generates images using AI services (OpenAI DALL-E, Stability AI, etc.)
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

  const { prompt, size = '1024x1024', quality = 'hd', style = 'artistic' } = body || {};
  // Normalize style to allowed set; default to 'artistic' when unsupported
  const allowedStyles = ['artistic', 'abstract', 'realistic', 'anime'];
  const normalizedStyle = typeof style === 'string' ? style.toLowerCase() : 'artistic';
  const effectiveStyle = allowedStyles.includes(normalizedStyle) ? normalizedStyle : 'artistic';

  const fieldErrors: Record<string, string> = {};
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    fieldErrors.prompt = 'Prompt is required and must be a non-empty string';
  }
  if (typeof size === 'string') {
    const sizePattern = /^\d{2,4}x\d{2,4}$/;
    if (!sizePattern.test(size)) {
      fieldErrors.size = 'Size must be in the format WIDTHxHEIGHT (e.g., 1024x1024)';
    }
  } else {
    fieldErrors.size = 'Size must be a string in the format WIDTHxHEIGHT';
  }

  const allowedQuality = ['hd', 'standard', 'auto'];
  if (typeof quality !== 'string' || !allowedQuality.includes(quality)) {
    fieldErrors.quality = `Quality must be one of: ${allowedQuality.join(', ')}`;
  }
  // Only enforce type for style; unknown values are normalized to 'artistic'
  if (typeof style !== 'string') {
    fieldErrors.style = 'Style must be a string';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return badRequest('Invalid request parameters', fieldErrors);
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.STABILITY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI API key not configured' },
      { status: 500 }
    );
  }

  try {
    // For now, return a placeholder image URL
    // In production, this would call OpenAI DALL-E, Stability AI, or similar
    const imageUrl = `https://cyan-bewildered-ape-960.mypinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm`;

    return NextResponse.json({
      imageUrl,
      prompt,
      size,
      quality,
      style: effectiveStyle,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
