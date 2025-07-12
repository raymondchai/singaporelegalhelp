import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  console.log('📤 Upload API called');
  
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    
    console.log('📋 Upload details:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId: userId
    });
    
    if (!file) {
      console.error('❌ No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!userId) {
      console.error('❌ No user ID provided');
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });
    }
    
    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, TXT, JPG, or PNG files.' 
      }, { status: 400 });
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size);
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }
    
    // Create unique file name
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}_${file.name}`;
    
    console.log('📁 Uploading to Supabase Storage:', fileName);
    
    // Convert File to ArrayBuffer for Supabase
    const arrayBuffer = await file.arrayBuffer();
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('legal-documents')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      return NextResponse.json({ 
        error: `Upload failed: ${uploadError.message}` 
      }, { status: 500 });
    }
    
    console.log('✅ File uploaded to storage:', uploadData.path);
    
    // Save document record to database
    const { data: docData, error: docError } = await supabase
      .from('user_documents')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        file_type: file.type,
        upload_date: new Date().toISOString(),
        status: 'uploaded'
      })
      .select()
      .single();
    
    if (docError) {
      console.error('❌ Document record error:', docError);
      
      // Try to clean up uploaded file
      try {
        await supabase.storage.from('legal-documents').remove([uploadData.path]);
        console.log('🧹 Cleaned up uploaded file after database error');
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }
      
      return NextResponse.json({ 
        error: `Database error: ${docError.message}` 
      }, { status: 500 });
    }
    
    console.log('✅ Document record created:', docData.id);
    
    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('legal-documents')
      .getPublicUrl(uploadData.path);
    
    const response = {
      success: true,
      document: {
        ...docData,
        public_url: urlData.publicUrl
      }
    };
    
    console.log('🎉 Upload completed successfully');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('💥 Upload API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during upload' 
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
