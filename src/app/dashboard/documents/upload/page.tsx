'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DocumentUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const router = useRouter();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('UPLOAD: File selected:', file.name, file.size);

      // Validate file
      const maxSize = 50 * 1024 * 1024; // 50MB
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

      if (file.size > maxSize) {
        alert('File size must be less than 50MB');
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF, DOC, DOCX, and TXT files are allowed');
        return;
      }

      setSelectedFile(file);
      setUploadProgress('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress('Starting upload...');

    try {
      console.log('UPLOAD STEP 1: Getting user session');

      // Wait a moment for auth to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      console.log('UPLOAD STEP 2: Session check result:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        error: sessionError
      });

      if (sessionError) {
        console.error('UPLOAD STEP 3: Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!session || !session.user) {
        console.error('UPLOAD STEP 4: No valid session found');
        throw new Error('Please log in again to upload files');
      }

      const user = session.user;
      console.log('UPLOAD STEP 5: Authenticated user:', user.id);

      setUploadProgress('Uploading to storage...');

      // Upload to storage
      const timestamp = Date.now();
      const filePath = `${user.id}/documents/${timestamp}_${selectedFile.name}`;

      console.log('UPLOAD STEP 6: Uploading to path:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('legal-documents')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('UPLOAD STEP 7: Storage upload failed:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      console.log('UPLOAD STEP 8: Storage upload successful:', uploadData);
      setUploadProgress('Saving to database...');

      // Save to database
      const { error: dbError } = await supabase
        .from('user_documents')
        .insert({
          user_id: user.id,
          title: selectedFile.name.replace(/\.[^/.]+$/, ""), // Remove extension
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          practice_area: 'General'
        });

      if (dbError) {
        console.error('UPLOAD STEP 9: Database save failed:', dbError);
        throw new Error(`Database save failed: ${dbError.message}`);
      }

      console.log('UPLOAD STEP 10: Upload completed successfully');
      setUploadProgress('Upload completed!');
      alert('File uploaded successfully!');

      // Reset form
      setSelectedFile(null);

      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard/documents');
      }, 1500);

    } catch (error: any) {
      console.error('UPLOAD ERROR:', error);
      setUploadProgress('Upload failed');
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout
      title="Upload Document"
      subtitle="Upload and analyze your legal documents"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
            <CardDescription>
              Upload PDF, DOC, or DOCX files up to 50MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drop files here or click to upload
              </h3>
              <p className="text-gray-500 mb-4">
                Supports PDF, DOC, DOCX files up to 50MB
              </p>

              {/* Hidden file input */}
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                id="file-input"
                disabled={uploading}
              />

              {/* File selection button */}
              <label
                htmlFor="file-input"
                className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Choose Files
              </label>

              {/* Selected file info */}
              {selectedFile && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Size: {Math.round(selectedFile.size / 1024)} KB
                  </p>
                </div>
              )}

              {/* Upload progress */}
              {uploadProgress && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    {uploadProgress.includes('completed') ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    )}
                    <span className="text-sm font-medium">{uploadProgress}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Upload button */}
            {selectedFile && !uploading && (
              <div className="mt-4 text-center">
                <Button
                  onClick={handleUpload}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Upload Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Maximum file size: 50MB</li>
              <li>• Supported formats: PDF, DOC, DOCX</li>
              <li>• Files are automatically scanned for legal content</li>
              <li>• Personal information is kept secure and private</li>
              <li>• Documents can be categorized by practice area</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
