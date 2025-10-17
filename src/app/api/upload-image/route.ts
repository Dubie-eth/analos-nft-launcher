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

    // Convert file to base64 for storage (works in serverless environments)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'png';
    const filename = `${type}_${timestamp}.${fileExtension}`;

    // For now, return a data URL that can be used directly
    // In production, you'd want to upload to a cloud storage service like AWS S3, Cloudinary, etc.
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log('✅ Image processed successfully:', filename);

    return NextResponse.json({
      success: true,
      url: dataUrl, // Using data URL for now
      filename: filename,
      type: type,
      size: file.size
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
