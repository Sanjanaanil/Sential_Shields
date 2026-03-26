import axios from 'axios';

interface LocationData {
  country: string;
  city: string;
  coordinates: [number, number];
}

class GeoLocationService {
  private readonly ipApiUrl = 'http://ip-api.com/json/';

  async getLocationFromIp(ipAddress: string): Promise<LocationData> {
    // Default location for localhost or invalid IPs
    const defaultLocation: LocationData = {
      country: 'Unknown',
      city: 'Unknown',
      coordinates: [0, 0],
    };

    try {
      // Skip lookup for localhost
      if (ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress === 'localhost') {
        return defaultLocation;
      }

      const response = await axios.get(`${this.ipApiUrl}${ipAddress}`);
      
      if (response.data.status === 'success') {
        return {
          country: response.data.country,
          city: response.data.city,
          coordinates: [response.data.lat, response.data.lon],
        };
      }

      return defaultLocation;
    } catch (error) {
      console.error('Error fetching location from IP:', error);
      return defaultLocation;
    }
  }

  calculateDistance(loc1: [number, number], loc2: [number, number]): number {
    const [lat1, lon1] = loc1;
    const [lat2, lon2] = loc2;
    
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default new GeoLocationService();