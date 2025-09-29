import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, FileUp, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

interface CandidateFormProps {
  onComplete: (data: { name: string; email: string; phone: string; resumeText: string; resumeDataUrl: string; }) => void;
}

const CandidateForm: React.FC<CandidateFormProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsParsing(true);
    setFileName(file.name);

    try {
      let text = '';
      const reader = new FileReader();

      // For data URL to store and view
      reader.onloadend = () => {
        setResumeDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // For parsing
      const arrayBuffer = await file.arrayBuffer();

      if (file.type === 'application/pdf') {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
        }
        text = fullText;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        setError('Unsupported file type. Please upload a PDF or DOCX.');
        setIsParsing(false);
        return;
      }

      setResumeText(text);
      extractInfoFromText(text);

    } catch (err) {
      console.error('Error parsing file:', err);
      setError('Failed to parse the resume. Please try another file.');
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
      setError('Please fill in all required fields. If the resume parser missed them, please enter them manually.');
      return;
    }

    onComplete({
      ...formData,
      resumeText,
      resumeDataUrl,
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