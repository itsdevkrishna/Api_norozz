import { City } from '../models/city.model.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

// Pre-seeded default Indian cities list to auto-populate if DB is fresh
const DEFAULT_INITIAL_CITIES = [
  { name: 'Delhi NCR', state: 'Delhi NCR', coordinates: { lat: 28.6139, lng: 77.2090, zoom: 11 } },
  { name: 'Bengaluru', state: 'Karnataka', coordinates: { lat: 12.9716, lng: 77.5946, zoom: 11 } },
  { name: 'Mumbai', state: 'Maharashtra', coordinates: { lat: 19.0760, lng: 72.8777, zoom: 11 } },
  { name: 'Hyderabad', state: 'Telangana', coordinates: { lat: 17.3850, lng: 78.4867, zoom: 11 } },
  { name: 'Pune', state: 'Maharashtra', coordinates: { lat: 18.5204, lng: 73.8567, zoom: 11 } },
  { name: 'Jaipur', state: 'Rajasthan', coordinates: { lat: 26.9124, lng: 75.7873, zoom: 11 } },
];

export class CityService {
  /**
   * Fetch all active cities (public/onboarding endpoint)
   * Automatically seeds initial cities if none exist
   */
  async getActiveCities() {
    let cities = await City.find({ status: 'active' }).sort({ name: 1 });
    
    if (!cities || cities.length === 0) {
      console.log('🌱 Auto-seeding initial active cities list into database...');
      await City.insertMany(DEFAULT_INITIAL_CITIES);
      cities = await City.find({ status: 'active' }).sort({ name: 1 });
    }
    
    return cities;
  }

  /**
   * Fetch all cities for Super Admin (with pagination & search)
   */
  async getAllCities(search = '', status = '') {
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      filter.status = status;
    }

    let cities = await City.find(filter).sort({ name: 1 });
    if ((!cities || cities.length === 0) && !search && !status) {
      await City.insertMany(DEFAULT_INITIAL_CITIES);
      cities = await City.find({}).sort({ name: 1 });
    }
    return cities;
  }

  /**
   * Create new City by Super Admin
   */
  async createCity(cityData, superAdminId) {
    const existing = await City.findOne({
      name: { $regex: new RegExp(`^${cityData.name.trim()}$`, 'i') },
    });
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, `City with name '${cityData.name}' already exists`);
    }

    const city = await City.create({
      name: cityData.name.trim(),
      state: cityData.state || '',
      country: cityData.country || 'India',
      status: cityData.status || 'active',
      coordinates: cityData.coordinates || { lat: 28.6139, lng: 77.2090, zoom: 11 },
      createdBy: superAdminId,
    });

    return city;
  }

  /**
   * Update existing City
   */
  async updateCity(id, updateData, superAdminId) {
    const city = await City.findById(id);
    if (!city) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'City not found');
    }

    if (updateData.name && updateData.name.trim().toLowerCase() !== city.name.toLowerCase()) {
      const existing = await City.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${updateData.name.trim()}$`, 'i') },
      });
      if (existing) {
        throw new ApiError(HTTP_STATUS.CONFLICT, `City with name '${updateData.name}' already exists`);
      }
    }

    if (updateData.name) city.name = updateData.name.trim();
    if (updateData.state !== undefined) city.state = updateData.state;
    if (updateData.status) city.status = updateData.status;
    if (updateData.coordinates) city.coordinates = updateData.coordinates;
    city.updatedBy = superAdminId;

    await city.save();
    return city;
  }

  /**
   * Toggle City active/inactive status
   */
  async toggleCityStatus(id, superAdminId) {
    const city = await City.findById(id);
    if (!city) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'City not found');
    }

    city.status = city.status === 'active' ? 'inactive' : 'active';
    city.updatedBy = superAdminId;
    await city.save();
    return city;
  }

  /**
   * Delete City
   */
  async deleteCity(id) {
    const city = await City.findByIdAndDelete(id);
    if (!city) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'City not found');
    }
    return { message: 'City deleted successfully' };
  }
}

export const cityService = new CityService();
