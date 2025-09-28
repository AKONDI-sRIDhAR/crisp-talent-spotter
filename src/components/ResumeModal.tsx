import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  resumeText?: string;
}

const ResumeModal: React.FC<ResumeModalProps> = ({ 
  isOpen, 
  onClose, 
  candidateName, 
  resumeText 
}) => {
  const handleDownload = () => {
    if (!resumeText) return;
    
    const blob = new Blob([resumeText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${candidateName.replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Resume - {candidateName}</span>
            <div className="flex gap-2">
              <Button onClick={handleDownload} size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={onClose} size="sm" variant="ghost">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh] p-4 bg-muted/20 rounded-lg">
          {resumeText ? (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">
              {resumeText}
            </pre>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No resume content available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeModal;