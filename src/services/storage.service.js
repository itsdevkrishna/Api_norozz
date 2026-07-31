import cloudinary from '../config/cloudinary.js';

export class StorageService {
  async uploadToCloudinary(fileBuffer, folder = 'norozz_uploads') {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });
  }
}

export const storageService = new StorageService();
