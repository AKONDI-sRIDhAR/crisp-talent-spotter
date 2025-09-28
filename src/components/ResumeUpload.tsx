import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ResumeUploadProps {
  onComplete: (data: { name: string; email: string; phone: string; resumeText: string; resumeDataUrl: string; }) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onComplete }) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'error' | 'success'>('idle');
  const [error, setError] = useState<string>('');
  const [resumeText, setResumeText] = useState<string>('');
  const [resumeDataUrl, setResumeDataUrl] = useState<string>('');
  const [manualData, setManualData] = useState<{ name: string; email: string; phone: string }>({ name: '', email: '', phone: '' });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: handleFileDrop
  });

  // Helper function to read file as Data URL (required for PDF viewing)
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  async function handleFileDrop(acceptedFiles: File[]) {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadStatus('uploading');
    setError('');

    try {
      setUploadStatus('processing');

      // Store the file as a Data URL for potential PDF viewing later
      const dataUrl = await readFileAsDataURL(file);
      setResumeDataUrl(dataUrl);
      
      // Set a placeholder for resumeText since AI parsing is disabled
      setResumeText("Resume uploaded successfully. Text extraction is disabled.");

      setUploadStatus('success');

    } catch (err) {
      console.error('Error processing resume file:', err);
      setError('Failed to read the file. Please ensure it is a valid PDF.');
      setUploadStatus('error');
    }
  }

  const handleManualDataChange = (field: keyof typeof manualData, value: string) => {
    setManualData(prev => ({ ...prev, [field]: value }));
  };

  const handleProceed = () => {
    // Validate required fields
    if (!manualData.name || !manualData.email || !manualData.phone) {
      setError('Please fill in all required fields.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(manualData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Passing all required fields, including resumeDataUrl
    onComplete({ ...manualData, resumeText, resumeDataUrl });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h2 className="text-3xl font-bold">Upload Your Resume</h2>
        <p className="text-muted-foreground">
          Please upload your resume and fill in your details below to begin.
        </p>
      </motion.div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${uploadStatus === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-500/10' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <motion.div
              animate={{ scale: isDragActive ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {uploadStatus === 'idle' && (
                <>
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-medium">
                      {isDragActive ? 'Drop your resume here' : 'Drop your resume here, or click to browse'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Supports PDF files (Max 10MB)
                    </p>
                  </div>
                </>
              )}
              
              {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                <>
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                  <p className="text-lg font-medium">
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Processing file...'}
                  </p>
                </>
              )}
              
              {uploadStatus === 'success' && (
                <>
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="text-lg font-medium text-green-600">Resume uploaded successfully!</p>
                </>
              )}
              
              {uploadStatus === 'error' && (
                <>
                  <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                  <p className="text-lg font-medium text-destructive">Upload failed</p>
                </>
              )}
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Data Entry */}
      {(uploadStatus === 'success' || uploadStatus === 'error') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Enter Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={manualData.name}
                    onChange={(e) => handleManualDataChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={manualData.email}
                    onChange={(e) => handleManualDataChange('email', e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={manualData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9+\-\s\(\)]/g, '');
                      handleManualDataChange('phone', value);
                    }}
                    placeholder="Enter your phone number"
                  />
                </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Proceed Button */}
      {uploadStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <Button onClick={handleProceed} size="lg" className="px-8">
            Start Interview
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default ResumeUpload;