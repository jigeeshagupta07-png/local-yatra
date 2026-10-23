/**
 * YatraLocal API Helper Module
 * Open-Meteo Weather Forecast Client
 * 
 * Features:
 * - Zero API key, public Open-Meteo forecast endpoint
 * - 5-second AbortController timeout
 * - 1 automatic retry on network failure
 * - 15-minute sessionStorage cache (keyed by lat,lng)
 * - WMO weather code conversion & travel advisories
 * - Safe offline / error fallback so app never breaks
 */

const CACHE_PREFIX = 'yl_weather_';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const TIMEOUT_MS = 5000; // 5 seconds

/**
 * Interpret WMO weather codes into human-readable text and emoji
 */
export function interpretWeatherCode(code) {
  if (code === 0) return { label: 'Clear Sky', icon: '☀️', condition: 'clear' };
  if (code >= 1 && code <= 3) return { label: 'Partly Cloudy', icon: '⛅', condition: 'cloudy' };
  if (code === 45 || code === 48) return { label: 'Foggy / Mist', icon: '🌫️', condition: 'fog' };
  if (code >= 51 && code <= 57) return { label: 'Light Drizzle', icon: '🌦️', condition: 'drizzle' };
  if (code >= 61 && code <= 67) return { label: code >= 65 ? 'Heavy Rain' : 'Rain', icon: '🌧️', condition: 'rain' };
  if (code >= 71 && code <= 77) return { label: 'Snowfall', icon: '❄️', condition: 'snow' };
  if (code >= 80 && code <= 82) return { label: 'Rain Showers', icon: '🌧️', condition: 'rain' };
  if (code >= 85 && code <= 86) return { label: 'Snow Showers', icon: '🌨️', condition: 'snow' };
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', icon: '⛈️', condition: 'storm' };
  return { label: 'Fair Weather', icon: '🌤️', condition: 'clear' };
}

/**
 * Generate practical travel advisory based on forecasted weather
 */
function generateAdvisory(todayCode, maxPrecip, maxTemp, maxWind) {
  const warnings = [];

  if (todayCode >= 95 || (todayCode >= 65 && todayCode <= 67) || maxPrecip >= 70) {
    warnings.push({
      level: 'warning',
      text: 'Heavy rain or thunderstorms expected: check road conditions before travelling.',
      icon: '⚠️'
    });
  } else if ((todayCode >= 71 && todayCode <= 77) || todayCode === 85 || todayCode === 86) {
    warnings.push({
      level: 'warning',
      text: 'Snowfall forecasted: wear thermal layers and carry sturdy non-slip footwear.',
      icon: '❄️'
    });
  } else if (maxTemp >= 38) {
    warnings.push({
      level: 'advisory',
      text: 'Intense afternoon heat expected: stay hydrated and plan outdoor visits before 10 AM or after 5 PM.',
      icon: '☀️'
    });
  } else if (maxWind >= 35) {
    warnings.push({
      level: 'advisory',
      text: 'High winds forecasted: mountain cable cars and river boating may experience delays.',
      icon: '💨'
    });
  }

  if (warnings.length === 0) {
    warnings.push({
      level: 'info',
      text: 'Favourable travel weather forecasted for the week ahead.',
      icon: '✨'
    });
  }

  return warnings;
}

/**
 * Low-level fetcher with AbortController timeout
 */
async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) {
      throw new Error(`Weather API HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Fetch 7-day weather forecast with retry and sessionStorage caching
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @param {string} destinationKey Optional cache key (e.g. 'manali')
 * @returns {Promise<Object>} Weather payload or safe fallback
 */
export async function getLiveWeather(lat, lng, destinationKey = '') {
  const cacheKey = `${CACHE_PREFIX}${destinationKey || `${lat.toFixed(3)}_${lng.toFixed(3)}`}`;

  // 1. Check sessionStorage cache
  try {
    const cachedStr = sessionStorage.getItem(cacheKey);
    if (cachedStr) {
      const cached = JSON.parse(cachedStr);
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return { ...cached.data, fromCache: true };
      }
    }
  } catch (e) {
    // sessionStorage not available or parsing failed
  }

  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=7`;

  // 2. Fetch with 1 retry
  let rawData = null;
  let lastErr = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      rawData = await fetchWithTimeout(endpoint, TIMEOUT_MS);
      if (rawData && rawData.daily) break;
    } catch (err) {
      lastErr = err;
      if (attempt === 1) {
        // Brief pause before retry
        await new Promise(r => setTimeout(r, 400));
      }
    }
  }

  // 3. Fallback on network/fetch failure
  if (!rawData || !rawData.daily) {
    console.warn('[Weather API] Failed or offline, using fallback:', lastErr?.message || 'unknown');
    return {
      available: false,
      error: 'Live weather not available right now',
      attribution: 'Weather data: Open-Meteo',
      tip: 'Tip: Check local hill station/monument advisory boards on arrival.'
    };
  }

  // 4. Process API response
  try {
    const daily = rawData.daily;
    const todayCode = daily.weather_code[0] ?? 0;
    const todayInterpretation = interpretWeatherCode(todayCode);
    const maxTemp = Math.round(daily.temperature_2m_max[0] ?? 25);
    const minTemp = Math.round(daily.temperature_2m_min[0] ?? 15);
    const maxPrecip = daily.precipitation_probability_max[0] ?? 0;
    const maxWind = Math.round(daily.wind_speed_10m_max[0] ?? 10);

    const warnings = generateAdvisory(todayCode, maxPrecip, maxTemp, maxWind);

    // 7-day mini forecast
    const dailyForecast = (daily.time || []).map((dateStr, idx) => {
      const code = daily.weather_code[idx] ?? 0;
      const interp = interpretWeatherCode(code);
      const dayDate = new Date(dateStr);
      const dayName = isNaN(dayDate.getTime())
        ? `Day ${idx + 1}`
        : dayDate.toLocaleDateString('en-US', { weekday: 'short' });

      return {
        date: dateStr,
        dayName,
        weatherCode: code,
        label: interp.label,
        icon: interp.icon,
        tempMax: Math.round(daily.temperature_2m_max[idx] ?? 0),
        tempMin: Math.round(daily.temperature_2m_min[idx] ?? 0),
        precipProb: daily.precipitation_probability_max[idx] ?? 0,
        windMax: Math.round(daily.wind_speed_10m_max[idx] ?? 0)
      };
    });

    const result = {
      available: true,
      today: {
        condition: todayInterpretation.label,
        icon: todayInterpretation.icon,
        tempMax: maxTemp,
        tempMin: minTemp,
        precipProb: maxPrecip,
        windMax: maxWind
      },
      warnings,
      dailyForecast,
      attribution: 'Weather data: Open-Meteo',
      timestamp: Date.now()
    };

    // Save to sessionStorage
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));
    } catch (e) {
      // ignore storage quota errors
    }

    return result;
  } catch (processErr) {
    console.warn('[Weather API] Process error:', processErr);
    return {
      available: false,
      error: 'Live weather not available right now',
      attribution: 'Weather data: Open-Meteo',
      tip: 'Tip: Check local hill station/monument advisory boards on arrival.'
    };
  }
}
