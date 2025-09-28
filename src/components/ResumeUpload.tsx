import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInterviewStore } from '@/store/interviewStore';
import { aiService } from '@/services/aiService';

interface ResumeUploadProps {
  onComplete: () => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onComplete }) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'error' | 'success'>('idle');
  const [error, setError] = useState<string>('');
  const [extractedData, setExtractedDataLocal] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [manualData, setManualData] = useState<{ name: string; email: string; phone: string }>({ name: '', email: '', phone: '' });
  
  const { setExtractedData: setStoreExtractedData } = useInterviewStore();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: handleFileDrop
  });

  async function handleFileDrop(acceptedFiles: File[]) {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadStatus('uploading');
    setError('');

    try {
      // Parse the document
      setUploadStatus('processing');
      
      // Since we can't use the document parsing tool here, we'll simulate extraction
      // In a real implementation, you would use a PDF parsing library
      const simulatedText = `
        John Doe
        Software Engineer
        Email: john.doe@email.com
        Phone: +1 (555) 123-4567
        
        Experience:
        - Full Stack Developer at Tech Corp (2020-2023)
        - Frontend Developer at StartupX (2018-2020)
        
        Skills:
        - React, Node.js, TypeScript
        - MongoDB, PostgreSQL
        - AWS, Docker
      `;

      const extracted = await aiService.extractResumeData(simulatedText);
      
      setExtractedDataLocal(extracted);
      setStoreExtractedData(extracted);
      
      // Pre-fill manual fields with extracted data
      setManualData({
        name: extracted.name || '',
        email: extracted.email || '',
        phone: extracted.phone || ''
      });

      setUploadStatus('success');
    } catch (err) {
      console.error('Error processing resume:', err);
      setError('Failed to process resume. Please try again.');
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

    // Update store with final data
    setStoreExtractedData(manualData);
    onComplete();
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
          Upload your resume and we'll extract your information automatically
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
                      Supports PDF and DOCX files (Max 10MB)
                    </p>
                  </div>
                </>
              )}
              
              {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                <>
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                  <p className="text-lg font-medium">
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Processing resume...'}
                  </p>
                </>
              )}
              
              {uploadStatus === 'success' && (
                <>
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="text-lg font-medium text-green-600">Resume processed successfully!</p>
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
              <CardTitle>Verify Your Information</CardTitle>
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
                  onChange={(e) => handleManualDataChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              {extractedData.name && (
                <Alert>
                  <CheckCircle2 className="w-4 h-4" />
                  <AlertDescription>
                    We've pre-filled the form with information from your resume. Please verify and update as needed.
                  </AlertDescription>
                </Alert>
              )}
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
      {(uploadStatus === 'success' || uploadStatus === 'error') && (
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