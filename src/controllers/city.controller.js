import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { cityService } from '../services/city.service.js';

class CityController {
  sendSuccess(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
  }

  getActiveCities = asyncHandler(async (req, res) => {
    const cities = await cityService.getActiveCities();
    return this.sendSuccess(res, cities, 'Active cities retrieved successfully');
  });

  getAllCities = asyncHandler(async (req, res) => {
    const { search, status } = req.query;
    const cities = await cityService.getAllCities(search, status);
    return this.sendSuccess(res, cities, 'All cities retrieved successfully');
  });

  createCity = asyncHandler(async (req, res) => {
    const city = await cityService.createCity(req.body, req.user._id);
    return this.sendSuccess(res, city, 'City created successfully', 201);
  });

  updateCity = asyncHandler(async (req, res) => {
    const city = await cityService.updateCity(req.params.id, req.body, req.user._id);
    return this.sendSuccess(res, city, 'City updated successfully');
  });

  toggleCityStatus = asyncHandler(async (req, res) => {
    const city = await cityService.toggleCityStatus(req.params.id, req.user._id);
    return this.sendSuccess(res, city, `City status toggled to ${city.status}`);
  });

  deleteCity = asyncHandler(async (req, res) => {
    const result = await cityService.deleteCity(req.params.id);
    return this.sendSuccess(res, result, result.message);
  });
}

export const cityController = new CityController();
