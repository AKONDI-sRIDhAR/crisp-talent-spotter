import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInterviewStore } from '@/store/interviewStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

type MissingField = 'name' | 'email' | 'phone' | null;

const PreInterviewCheck: React.FC = () => {
  const { currentCandidate, updateCandidate, setInterviewStep } = useInterviewStore();
  const [missingField, setMissingField] = useState<MissingField>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentCandidate) return;

    // Determine the first missing field
    if (!currentCandidate.name) {
      setMissingField('name');
    } else if (!currentCandidate.email) {
      setMissingField('email');
    } else if (!currentCandidate.phone) {
      setMissingField('phone');
    } else {
      // No fields are missing, proceed to interview
      setInterviewStep('interview');
    }
  }, [currentCandidate, setInterviewStep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !missingField || !currentCandidate) return;

    setIsLoading(true);
    // Update the candidate in the store with the new information
    updateCandidate(currentCandidate.id, { [missingField]: inputValue });

    // Reset for the next potential field
    setInputValue('');
    setIsLoading(false);
    // The useEffect hook will handle finding the next missing field or proceeding
  };

  const getPrompt = () => {
    switch (missingField) {
      case 'name':
        return { title: "What's your full name?", placeholder: "e.g., Jane Doe", type: "text" };
      case 'email':
        return { title: "What's your email address?", placeholder: "e.g., jane.doe@example.com", type: "email" };
      case 'phone':
        return { title: "What's your phone number?", placeholder: "e.g., +911234567890", type: "tel" };
      default:
        return { title: "", placeholder: "", type: "text" };
    }
  };

  const { title, placeholder, type } = getPrompt();

  if (!missingField) {
    // This will briefly show a loader while useEffect determines the next step
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <motion.div
        key={missingField}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl">
          <CardHeader>
            <CardTitle>One last thing...</CardTitle>
            <CardDescription>We noticed some information is missing. Please provide it below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor={missingField}>{title}</Label>
                <Input
                  id={missingField}
                  type={type}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={placeholder}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PreInterviewCheck;