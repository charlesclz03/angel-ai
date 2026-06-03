import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  formatEnvironmentalWeatherLine,
  loadEnvironmentalWeatherContext,
} from '@/lib/angel/weather'

describe('angel weather', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('loads current weather context when OpenWeather is configured', async () => {
    vi.stubEnv('OPENWEATHERMAP_API_KEY', 'weather-key')
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          name: 'Lisbon',
          weather: [{ description: 'clear sky' }],
          main: {
            temp: 18.4,
            feels_like: 17.8,
          },
          sys: {
            sunrise: 1711350000,
            sunset: 1711395000,
          },
          dt: 1711370000,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    )
    vi.stubGlobal('fetch', fetchMock)

    const weather = await loadEnvironmentalWeatherContext({
      city: 'Lisbon',
      countryCode: 'PT',
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(weather).toEqual({
      locationLabel: 'Lisbon',
      condition: 'clear sky',
      temperatureC: 18.4,
      feelsLikeC: 17.8,
      isDaytime: true,
    })
  })

  it('formats weather context into a session-brief line', () => {
    expect(
      formatEnvironmentalWeatherLine({
        locationLabel: 'Lisbon',
        condition: 'clear sky',
        temperatureC: 18.4,
        feelsLikeC: 17.8,
        isDaytime: true,
      })
    ).toContain('Current weather in Lisbon: clear sky')
  })
})
