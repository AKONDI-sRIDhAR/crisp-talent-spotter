import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInterviewStore } from '@/store/interviewStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Bot } from 'lucide-react'; // Merged Bot import
import { toast } from "sonner"; // Used for toast notifications

type MissingField = 'name' | 'email' | 'phone' | null;

const PreInterviewCheck: React.FC = () => {
  const { currentCandidate, updateCandidate, setInterviewStep } = useInterviewStore();
  const [missingField, setMissingField] = useState<MissingField>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); // Kept error state for input validation

  // Function to check candidate data and set the next missing field state
  const validateAndSetNextField = (candidate: typeof currentCandidate) => {
    if (!candidate) return;

    setError(''); // Clear error on new check

    // 1. Check Name
    if (!candidate.name || candidate.name.trim() === '') {
      setMissingField('name');
      return;
    }
    
    // 2. Check Email (basic format)
    if (!candidate.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) {
      setMissingField('email');
      return;
    } 
    
    // 3. Check Phone (must be a valid string, we rely on submit for formatting)
    if (!candidate.phone || candidate.phone.trim() === '' || candidate.phone.replace(/[^0-9]/g, '').length < 10) {
      setMissingField('phone');
      return;
    }

    // All fields present, proceed
    setMissingField(null);
    setInterviewStep('interview');
  };

  // Effect to trigger re-check whenever currentCandidate changes (i.e., after an update)
  useEffect(() => {
    validateAndSetNextField(currentCandidate);
    // Pre-fill input with any existing value to help the user correct it
    if (currentCandidate && missingField) {
      const initialValue = currentCandidate[missingField as keyof typeof currentCandidate] || '';
      setInputValue(initialValue);
    }
  }, [currentCandidate, missingField]); 

  const getPrompt = () => {
    switch (missingField) {
      case 'name':
        return { title: "It looks like we're missing your name. What's your full name?", placeholder: "e.g., Jane Doe", type: "text" };
      case 'email':
        return { title: "We need your email address to link your session. What's your email?", placeholder: "e.g., jane.doe@example.com", type: "email" };
      case 'phone':
        // Clarified prompt to explain required format
        return { title: "And finally, we need your phone number for contact. What is it? (Include country code if necessary, e.g., +91)", placeholder: "e.g., +919876543210", type: "tel" };
      default:
        return { title: "", placeholder: "", type: "text" };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !missingField || !currentCandidate) return;

    setError('');
    let valueToSubmit = inputValue;

    // --- Validation Logic ---

    if (missingField === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    if (missingField === 'phone') {
        const cleanedPhone = inputValue.replace(/[^0-9]/g, '');
        if (cleanedPhone.length < 10) {
            setError('Please enter a valid phone number (at least 10 digits).');
            return;
        }
        // Force Indian format (+91XXXXXXXXXX) if only digits are provided
        if (!inputValue.startsWith('+')) {
            valueToSubmit = `+91${cleanedPhone.slice(-10)}`;
        } else {
            // Clean non-digit characters (except the initial +) for storage
            valueToSubmit = inputValue.replace(/\s/g, ''); 
        }
    }

    // --- Submission Logic ---

    setIsLoading(true);
    // Update the candidate in the store with the validated information
    updateCandidate(currentCandidate.id, { [missingField]: valueToSubmit });

    // The useEffect hook will now re-run, find the next missing field or proceed to 'interview'
    setInputValue('');
    setIsLoading(false);
  };
  
  const { title, placeholder, type } = getPrompt();

  if (!currentCandidate) {
    // Fallback if component is somehow rendered without a current candidate
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-destructive">Error: No candidate data found. Please start over.</p>
      </div>
    );
  }

  if (!missingField) {
    // Loader state - shows briefly while validation is finalizing the transition to 'interview'
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Finalizing details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <motion.div
        key={missingField} // Key ensures remount/animation on state change
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="glass-card shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                {/* Conversational Prompt */}
                <p className="font-medium mb-4">{title}</p> 
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Input Field */}
                  <Input
                    id={missingField}
                    type={type}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={placeholder}
                    required
                    className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                  />
                  {/* Validation Error */}
                  {error && <p className="text-sm text-destructive">{error}</p>} 
                  
                  {/* Submit Button */}
                  <Button type="submit" className="w-full" disabled={isLoading || !inputValue.trim()}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Continue'}
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PreInterviewCheck;