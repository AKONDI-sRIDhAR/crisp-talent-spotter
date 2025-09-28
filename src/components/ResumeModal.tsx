import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  resumeDataUrl?: string;
  resumeText?: string; // Keep for fallback download
}

const ResumeModal: React.FC<ResumeModalProps> = ({ 
  isOpen, 
  onClose, 
  candidateName, 
  resumeDataUrl,
  resumeText
}) => {
  const handleDownload = () => {
    // Prioritize downloading the actual PDF file via data URL
    if (resumeDataUrl) {
      const a = document.createElement('a');
      a.href = resumeDataUrl;
      a.download = `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (resumeText) {
      // Fallback to downloading the extracted text
      const blob = new Blob([resumeText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${candidateName.replace(/\s+/g, '_')}_Resume.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>Resume - {candidateName}</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownload}
                size="sm"
                variant="outline"
                disabled={!resumeDataUrl && !resumeText}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={onClose} size="icon" variant="ghost">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow border-t">
          {resumeDataUrl ? (
            <iframe
              src={resumeDataUrl}
              className="w-full h-full"
              title={`Resume of ${candidateName}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-center py-8 text-muted-foreground">
              <p>No PDF preview is available.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeModal;