import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInterviewStore } from '@/store/interviewStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Bot } from 'lucide-react';

type MissingField = 'name' | 'email' | 'phone' | null;

const PreInterviewCheck: React.FC = () => {
  const { currentCandidate, updateCandidate, setInterviewStep } = useInterviewStore();
  const [missingField, setMissingField] = useState<MissingField>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateAndSetNextField = (candidate: typeof currentCandidate) => {
    if (!candidate) return;

    if (!candidate.name) {
      setMissingField('name');
    } else if (!candidate.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) {
      setMissingField('email');
    } else if (!candidate.phone) {
      setMissingField('phone');
    } else {
      setMissingField(null);
      setInterviewStep('interview');
    }
  };

  useEffect(() => {
    validateAndSetNextField(currentCandidate);
  }, [currentCandidate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !missingField || !currentCandidate) return;

    setError('');

    if (missingField === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (missingField === 'phone' && !/^\+?[1-9]\d{1,14}$/.test(inputValue.replace(/\s/g, ''))) {
        setError('Please enter a valid phone number.');
        return;
    }

    setIsLoading(true);
    updateCandidate(currentCandidate.id, { [missingField]: inputValue });

    setInputValue('');
    setIsLoading(false);
  };

  const getPrompt = () => {
    switch (missingField) {
      case 'name':
        return { title: "It looks like we're missing your name. What's your full name?", placeholder: "e.g., Jane Doe", type: "text" };
      case 'email':
        return { title: "We're missing your email. What's your email address?", placeholder: "e.g., jane.doe@example.com", type: "email" };
      case 'phone':
        return { title: "And finally, what's your phone number?", placeholder: "e.g., +14155552671", type: "tel" };
      default:
        return { title: "", placeholder: "", type: "text" };
    }
  };

  if (!currentCandidate) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Error: No candidate data found. Please start over.</p>
      </div>
    );
  }

  if (!missingField) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-4">Finalizing details...</p>
      </div>
    );
  }

  const { title, placeholder, type } = getPrompt();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <motion.div
        key={missingField}
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
                        <p className="font-medium mb-4">{title}</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                id={missingField}
                                type={type}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={placeholder}
                                required
                                className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                            />
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <Button type="submit" className="w-full" disabled={isLoading}>
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