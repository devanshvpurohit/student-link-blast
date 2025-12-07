import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ImageMessageProps {
  imageUrl: string;
  alt?: string;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({ imageUrl, alt = 'Shared image' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        className="cursor-pointer rounded-lg overflow-hidden max-w-[200px] sm:max-w-[280px]"
        onClick={() => setIsOpen(true)}
      >
        <img 
          src={imageUrl} 
          alt={alt}
          className="w-full h-auto object-cover rounded-lg hover:opacity-90 transition-opacity"
          loading="lazy"
        />
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 sm:p-4">
          <img 
            src={imageUrl} 
            alt={alt}
            className="w-full h-full object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};