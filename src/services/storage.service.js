import { r2StorageService } from './r2Storage.service.js';

export class StorageService {
  async uploadToCloudinary(fileBuffer, folder = 'norozz_uploads') {
    const result = await r2StorageService.uploadFile(fileBuffer, 'file', 'application/octet-stream', folder);
    return {
      url: result.url,
      secure_url: result.url,
    };
  }

  async uploadBase64Image(base64String, folder = 'norozz_profiles') {
    return await r2StorageService.uploadBase64Image(base64String, folder);
  }
}

export const storageService = new StorageService();
