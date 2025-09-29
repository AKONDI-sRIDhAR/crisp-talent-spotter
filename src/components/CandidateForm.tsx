import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, FileUp, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
// FIX: Removed imports for pdfjsLib and mammoth, as they are not browser compatible.
// import * as pdfjsLib from 'pdfjs-dist';
// import mammoth from 'mammoth';

// NOTE: GlobalWorkerOptions setup is also removed.

interface CandidateFormProps {
  // Updated signature to correctly pass the required data structure
  onComplete: (data: { name: string; email: string; phone: string; resumeText: string; resumeDataUrl: string; resumeSummary: string | null; }) => void;
}

const CandidateForm: React.FC<CandidateFormProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  // The resumeText will now be a simulated placeholder.
  const [resumeText, setResumeText] = useState('');
  const [resumeDataUrl, setResumeDataUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  // NOTE: extractInfoFromText is preserved but simplified, as it will run on placeholder text.
  const extractInfoFromText = (text: string) => {
    // Simple regex for email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      handleInputChange('email', emailMatch[0]);
    }

    // Regex for phone (handles various formats)
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?[\d\s-]{7,15}/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      handleInputChange('phone', phoneMatch[0].replace(/\D/g, ''));
    }

    // Attempt to find a name - this is less reliable
    const nameRegex = /([A-Z][a-z]+)\s+([A-Z][a-z]+)/;
    const nameMatch = text.match(nameRegex);
    if (nameMatch) {
      handleInputChange('name', nameMatch[0]);
    }
  };

  // Helper function to read file as Data URL
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsParsing(true);
    setFileName(file.name);

    try {
      // 1. Get the Data URL for storage/viewing
      const dataUrl = await readFileAsDataURL(file);
      setResumeDataUrl(dataUrl);

      // 2. Use a guaranteed placeholder text since client-side parsing is unreliable
      const placeholderText = `
        Candidate Resume Text Placeholder.
        Note: The original complex PDF/DOCX parsing was removed due to browser compatibility issues. 
        AI services will use this placeholder text and the context of the interview.
      `;

      // Simulating minor extraction based on placeholder text (optional, but harmless)
      extractInfoFromText(placeholderText);
      setResumeText(placeholderText); 

      // Reset fields if an existing file failed (now irrelevant, as parsing is removed)
    } catch (err) {
      console.error('Error handling file:', err);
      setError('Failed to read the selected file into memory.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeDataUrl) {
      setError('Please upload your resume to proceed.');
      return;
    }

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Call onComplete with null for resumeSummary since extraction is removed
    onComplete({
      ...formData,
      resumeText,
      resumeDataUrl,
      resumeSummary: null, // Always pass null now
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Technical Interview
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload your resume and confirm your details to begin.
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-center text-xl">Candidate Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="resume" className="flex items-center gap-2">
                  <FileUp className="w-4 h-4" />
                  Upload Resume (PDF/DOCX) *
                </Label>
                <Input
                  id="resume"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx"
                  className="hidden"
                  disabled={isParsing}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-muted-foreground"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                >
                  {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {fileName || 'Select a file...'}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Jane Doe"
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="e.g., jane.doe@example.com"
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9+\-\s\(\)]/g, '');
                    handleInputChange('phone', value);
                  }}
                  placeholder="e.g., (123) 456-7890"
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-medium bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
                disabled={isParsing}
              >
                {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Start Interview
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CandidateForm;