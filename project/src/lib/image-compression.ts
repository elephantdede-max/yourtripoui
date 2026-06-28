/**
 * Compression d'images avant upload
 *
 * Compresse une image client-side avant d'uploader vers Supabase Storage.
 * Réduit la taille du fichier de 80-95% sans perte visible de qualité.
 *
 * Usage :
 *   const compressed = await compressImage(file, { maxWidth: 400, quality: 0.85 });
 *   await supabase.storage.from('avatars').upload(path, compressed);
 */

export interface CompressOptions {
  /** Largeur max en pixels (défaut 400 pour avatar) */
  maxWidth?: number;
  /** Hauteur max (défaut = maxWidth) */
  maxHeight?: number;
  /** Qualité 0-1 pour JPEG/WebP (défaut 0.85) */
  quality?: number;
  /** Format de sortie */
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

/**
 * Compresse une image File → Blob.
 * Retourne un Blob compressé prêt à uploader.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<Blob> {
  const {
    maxWidth = 400,
    maxHeight = maxWidth,
    quality = 0.85,
    format = 'image/jpeg',
  } = options;

  // Si le fichier est déjà petit (< 100 KB) et c'est un format raisonnable, skip
  // (File hérite de Blob, donc OK)
  if (file.size < 100 * 1024 && file.type !== 'image/heic' && file.type !== 'image/heif') {
    return file as Blob;
  }

  return new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = (): void => reject(new Error('Lecture du fichier impossible'));

    reader.onload = (event: ProgressEvent<FileReader>): void => {
      const result = event.target?.result;
      if (typeof result !== 'string') {
        reject(new Error('Format de lecture invalide'));
        return;
      }

      const img = new Image();

      img.onerror = (): void => reject(new Error("Image illisible (format peut-être non supporté : HEIC ?)"));

      img.onload = (): void => {
        // Calcul des nouvelles dimensions en gardant le ratio
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Canvas pour redimensionner
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas non supporté'));
          return;
        }

        // Lissage haute qualité
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export en Blob
        canvas.toBlob(
          (blob: Blob | null): void => {
            if (!blob) {
              reject(new Error('Compression impossible'));
              return;
            }
            resolve(blob);
          },
          format,
          quality,
        );
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Helper : compresse + retourne en File (pour APIs qui veulent un File)
 */
export async function compressImageAsFile(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const blob = await compressImage(file, options);
  const ext = options.format === 'image/webp'
    ? 'webp'
    : options.format === 'image/png'
      ? 'png'
      : 'jpg';
  const filename = file.name.replace(/\.[^.]+$/, `.${ext}`);
  return new File([blob], filename, { type: blob.type });
}

/**
 * Estime le ratio de compression obtenu (pour log/debug)
 */
export function formatCompressionRatio(originalSize: number, compressedSize: number): string {
  const ratio = (1 - compressedSize / originalSize) * 100;
  const factor = (originalSize / compressedSize).toFixed(1);
  return `${ratio.toFixed(0)}% économisés (×${factor})`;
}