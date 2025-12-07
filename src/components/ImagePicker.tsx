import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image, X } from 'lucide-react';

interface ImagePickerProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  onClear: () => void;
  disabled?: boolean;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  onImageSelect,
  selectedImage,
  onClear,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  if (selectedImage) {
    return (
      <div className="relative">
        <div className="w-16 h-16 rounded-lg overflow-hidden border border-border">
          <img 
            src={URL.createObjectURL(selectedImage)} 
            alt="Selected" 
            className="w-full h-full object-cover"
          />
        </div>
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
          onClick={onClear}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        className="h-8 w-8 p-0"
      >
        <Image className="h-4 w-4" />
      </Button>
    </>
  );
};