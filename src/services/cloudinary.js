// Cloudinary CDN Integration for LIFE OF BLOCKS
// Cloudinary API Key: 436742212766973
// Cloudinary API Secret: KfC7dUV8AGhA2SRYFyzLahdCOf4

export const CLOUDINARY_API_KEY = "436742212766973";
export const CLOUDINARY_API_SECRET = "KfC7dUV8AGhA2SRYFyzLahdCOf4";

export function getCloudinaryCloudName() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('lob_cloudinary_cloud');
    if (saved) return saved.trim();
  }
  return import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
}

export function setCloudinaryCloudName(name) {
  if (typeof window !== 'undefined' && name) {
    localStorage.setItem('lob_cloudinary_cloud', name.trim());
  }
}

/**
 * Generate SHA-1 hash using browser crypto Subtle API
 */
async function generateSha1(message) {
  const enc = new TextEncoder();
  const data = enc.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload a file directly to Cloudinary CDN
 */
export async function uploadToCloudinary(file, folder = 'life-of-blocks', onProgress) {
  const cloudName = getCloudinaryCloudName();
  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not set');
  }

  const timestamp = Math.round(Date.now() / 1000);
  
  // Signature computation: keys sorted alphabetically + api_secret
  const stringToSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = await generateSha1(stringToSign);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('signature', signature);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.secure_url || response.url,
            publicId: response.public_id,
            format: response.format,
            bytes: response.bytes,
            resourceType: response.resource_type
          });
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error(`Cloudinary upload failed: status ${xhr.status} ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error uploading to Cloudinary'));
    xhr.send(formData);
  });
}
