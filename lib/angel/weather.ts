const OPEN_WEATHER_CURRENT_URL =
  'https://api.openweathermap.org/data/2.5/weather'

export interface EnvironmentalWeatherContext {
  locationLabel: string
  condition: string
  temperatureC: number | null
  feelsLikeC: number | null
  isDaytime: boolean | null
}

export async function loadEnvironmentalWeatherContext(input: {
  city: string | null
  countryCode: string | null
}): Promise<EnvironmentalWeatherContext | null> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY?.trim()
  const city = input.city?.trim()

  if (!apiKey || !city) {
    return null
  }

  const countryCode = input.countryCode?.trim()
  const query = countryCode ? `${city},${countryCode}` : city
  const params = new URLSearchParams({
    q: query,
    appid: apiKey,
    units: 'metric',
  })

  try {
    const response = await fetch(`${OPEN_WEATHER_CURRENT_URL}?${params}`, {
      next: { revalidate: 60 * 30 },
    })

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as {
      name?: unknown
      weather?: Array<{ description?: unknown }>
      main?: { temp?: unknown; feels_like?: unknown }
      sys?: { sunrise?: unknown; sunset?: unknown }
      dt?: unknown
    }

    const condition =
      typeof payload.weather?.[0]?.description === 'string'
        ? payload.weather[0].description.trim()
        : null

    if (!condition) {
      return null
    }

    const currentTimestamp =
      typeof payload.dt === 'number' ? payload.dt * 1000 : null
    const sunriseTimestamp =
      typeof payload.sys?.sunrise === 'number'
        ? payload.sys.sunrise * 1000
        : null
    const sunsetTimestamp =
      typeof payload.sys?.sunset === 'number' ? payload.sys.sunset * 1000 : null

    return {
      locationLabel:
        typeof payload.name === 'string' && payload.name.trim()
          ? payload.name.trim()
          : city,
      condition,
      temperatureC:
        typeof payload.main?.temp === 'number' ? payload.main.temp : null,
      feelsLikeC:
        typeof payload.main?.feels_like === 'number'
          ? payload.main.feels_like
          : null,
      isDaytime:
        currentTimestamp !== null &&
        sunriseTimestamp !== null &&
        sunsetTimestamp !== null
          ? currentTimestamp >= sunriseTimestamp &&
            currentTimestamp < sunsetTimestamp
          : null,
    }
  } catch {
    return null
  }
}

export function formatEnvironmentalWeatherLine(
  weather: EnvironmentalWeatherContext
) {
  const temperatureLine =
    weather.temperatureC === null
      ? null
      : `${Math.round(weather.temperatureC)}°C`
  const feelsLikeLine =
    weather.feelsLikeC === null
      ? null
      : `feels like ${Math.round(weather.feelsLikeC)}°C`
  const daylightLine =
    weather.isDaytime === null
      ? null
      : weather.isDaytime
        ? 'daytime there now'
        : 'night there now'

  return [
    `- Current weather in ${weather.locationLabel}: ${weather.condition}`,
    [temperatureLine, feelsLikeLine, daylightLine].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(' — ')
}
