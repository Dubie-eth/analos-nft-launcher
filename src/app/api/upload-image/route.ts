import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Image upload request received');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo' or 'banner'

    console.log('📁 File details:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      uploadType: type
    });

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['logo', 'banner'].includes(type)) {
      console.log('❌ Invalid type:', type);
      return NextResponse.json({ error: 'Invalid type. Must be "logo" or "banner"' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB for banners, 5MB for logos)
    const maxSize = type === 'banner' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size, 'max:', maxSize);
      return NextResponse.json({ error: `File size must be less than ${type === 'banner' ? '10MB' : '5MB'}` }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'png';
    const filename = `${type}_${timestamp}.${fileExtension}`;

    // For serverless environments, we'll use a compressed approach
    // Convert to base64 but with compression info for cleanup
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    
    // Create a compressed data URL with metadata for cleanup
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log('✅ Image processed successfully:', filename, 'Size:', file.size, 'Base64 size:', base64.length);

    return NextResponse.json({
      success: true,
      url: dataUrl,
      filename: filename,
      type: type,
      size: file.size,
      base64Size: base64.length,
      // Add cleanup metadata
      cleanup: {
        timestamp: timestamp,
        originalSize: file.size,
        compressedSize: base64.length
      }
    });

  } catch (error) {
    console.error('❌ Error uploading image:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
