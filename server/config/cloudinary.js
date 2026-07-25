import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Check if Cloudinary is configured
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const isCloudinaryConfigured = cloudName && apiKey && apiSecret;

if (!isCloudinaryConfigured) {
  console.warn('⚠️ WARNING: Cloudinary is NOT configured! Image uploads will fail.');
  console.warn('   Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file');
} else {
  console.log('✅ Cloudinary configured for:', cloudName);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

export const uploadImage = async (file, mimetype = 'image/jpeg') => {
  try {
    if (!file) {
      throw new Error('No image content provided');
    }

    if (typeof file === 'string') {
      const result = await cloudinary.uploader.upload(file, {
        folder: 'k-forum',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 1000, height: 500, crop: 'fit' }],
        quality: 'auto',
        fetch_format: 'auto',
        resource_type: 'image'
      });
      return result.secure_url;
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'k-forum',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          transformation: [{ width: 1000, height: 500, crop: 'fit' }],
          quality: 'auto',
          fetch_format: 'auto',
          resource_type: 'image'
        },
        (error, uploadResult) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(uploadResult);
        }
      );

      uploadStream.end(file);
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

export const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image');
  }
};