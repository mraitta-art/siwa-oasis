/**
 * Utility to compress images natively in the browser using HTML5 Canvas.
 * Essential for reducing large mobile camera uploads before sending to the server.
 */
export async function compressImage(file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.8): Promise<File> {
  // Only compress images
  if (!file.type.startsWith('image/')) return file;
  
  // Don't compress SVGs or GIFs as canvas breaks them or loses animation
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions keeping aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback if canvas is not supported
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // fallback
              return;
            }
            
            // Create a new File from the compressed blob
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve(newFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file); // fallback on error
    };
    reader.onerror = () => resolve(file); // fallback on error
  });
}
