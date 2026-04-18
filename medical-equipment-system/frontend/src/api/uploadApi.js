const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Uploads an image file to Supabase Storage via the backend.
 * @param {File} file - The image File object
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
export async function uploadServiceImage(file) {
    const token = localStorage.getItem('jwt_token');
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE}/upload/service-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Image upload failed');
    }

    const data = await response.json();
    return data.url;
}
