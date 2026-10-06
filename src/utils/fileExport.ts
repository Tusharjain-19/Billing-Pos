import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface SaveAndShareOptions {
  blob: Blob;
  filename: string;
  mimeType?: string;
  title?: string;
  dialogTitle?: string;
}

/**
 * Converts a Blob to a base64 string (without data: URL prefix)
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // remove "data:*/*;base64," prefix
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Universal cross-platform file exporter.
 * Works seamlessly on Desktop Web, Mobile Browser, and Capacitor Android/iOS Native Apps.
 */
export async function saveAndShareFile(options: SaveAndShareOptions): Promise<{ success: boolean; error?: string }> {
  const { blob, filename, mimeType, title = filename, dialogTitle = `Save or Share ${filename}` } = options;

  try {
    // 1. Capacitor Native Platform (Android / iOS app)
    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = await blobToBase64(blob);
        
        // Write to Cache / Documents directory
        const writeResult = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
        });

        // Open native Android Share sheet / Save to Files / Drive / WhatsApp
        await Share.share({
          title,
          text: `Exported file: ${filename}`,
          url: writeResult.uri,
          dialogTitle,
        });

        return { success: true };
      } catch (nativeErr: any) {
        console.warn('Native Capacitor share failed, attempting fallback download:', nativeErr);
      }
    }

    // 2. Mobile Browser Web Share API (Chrome Android / iOS Safari)
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: mimeType || blob.type || 'application/octet-stream' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title,
            text: `Exported: ${filename}`,
          });
          return { success: true };
        }
      } catch (shareErr: any) {
        // User cancelled share or browser restriction - fallback to standard download
        if (shareErr.name === 'AbortError') {
          return { success: true };
        }
        console.warn('Web share failed, falling back to download:', shareErr);
      }
    }

    // 3. Standard Browser Blob Download
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 400);

    return { success: true };
  } catch (err: any) {
    console.error('saveAndShareFile error:', err);
    return {
      success: false,
      error: err?.message || 'Failed to export file',
    };
  }
}
