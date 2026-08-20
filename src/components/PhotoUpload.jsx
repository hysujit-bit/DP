import { useRef, useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';

/**
 * PhotoUpload — Reusable component for uploading profile photos
 * 
 * Props:
 *   value     — current photo data URL (or null)
 *   onChange  — callback with new data URL (or null to remove)
 *   name      — display name for the avatar fallback
 *   size      — avatar size: 'sm' | 'md' | 'lg' (default: 'md')
 */
export default function PhotoUpload({ value, onChange, name = '', size = 'md' }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-20 h-20 text-xl',
    lg: 'w-28 h-28 text-3xl',
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 400;
          let { width, height } = img;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          // Check size (500KB max)
          const sizeInBytes = Math.ceil((dataUrl.length * 3) / 4);
          if (sizeInBytes > 500 * 1024) {
            reject(new Error('Image too large after compression. Please use a smaller image.'));
          } else {
            resolve(dataUrl);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dataUrl = await compressImage(file);
      onChange(dataUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative inline-block">
      {/* Avatar display */}
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-sky-100 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-sky-300 transition-all relative group`}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <img src={value} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sky-700 font-bold">{initials}</span>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {loading ? (
            <Loader2 size={20} className="text-white animate-spin" />
          ) : (
            <Camera size={20} className="text-white" />
          )}
        </div>
      </div>

      {/* Remove button */}
      {value && (
        <button
          onClick={handleRemove}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-sm"
          title="Remove photo"
        >
          <X size={12} />
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1 text-center z-10">
          {error}
        </div>
      )}
    </div>
  );
}
