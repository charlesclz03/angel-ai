import { Body, Equator, Ecliptic, Observer, AstroTime } from 'astronomy-engine'
import cityTimezones from 'city-timezones'

export interface AstrologicalSigns {
  sunSign: string
  moonSign: string
  ascendantSign?: string
  isValid: boolean
}

const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
]

function getZodiacSign(longitude: number): string {
  const normalizedLong = ((longitude % 360) + 360) % 360
  const index = Math.floor(normalizedLong / 30)
  return ZODIAC_SIGNS[index]
}

export function calculateNatalChart(
  birthDate: string, // YYYY-MM-DD
  birthTime: string, // HH:MM
  birthTimeUnknown: boolean,
  birthPlace: string
): AstrologicalSigns {
  if (!birthDate) {
    return { sunSign: 'Unknown', moonSign: 'Unknown', isValid: false }
  }

  let lat = 0.0
  let lon = 0.0

  if (birthPlace) {
    // Basic geocoding via city string
    const lookupString = birthPlace.split(',')[0].trim()
    const cityData = cityTimezones.lookupViaCity(lookupString)
    if (cityData && cityData.length > 0) {
      lat = cityData[0].lat
      lon = cityData[0].lng
    }
  }

  // Fallback to noon UTC if time is unknown. True precise astrology requires timezone conversion,
  // but for V1 broad empathy scoping, UTC noon approximations suffice when time/location fail.
  const timeString = !birthTime || birthTimeUnknown ? '12:00' : birthTime
  // Ensure formatted exactly.
  const safeTime = timeString.includes(':') ? timeString : '12:00'
  const dateString = `${birthDate}T${safeTime}:00Z`

  const birthDatetime = new Date(dateString)
  if (isNaN(birthDatetime.getTime())) {
    return { sunSign: 'Unknown', moonSign: 'Unknown', isValid: false }
  }

  const astroTime = new AstroTime(birthDatetime)
  const observer = new Observer(lat, lon, 0)

  // Calculate Sun
  const sunGeo = Equator(Body.Sun, astroTime, observer, false, true)
  const sunEcl = Ecliptic(sunGeo.vec)
  const sunSign = getZodiacSign(sunEcl.elon)

  // Calculate Moon
  const moonGeo = Equator(Body.Moon, astroTime, observer, false, true)
  const moonEcl = Ecliptic(moonGeo.vec)
  const moonSign = getZodiacSign(moonEcl.elon)

  return {
    sunSign,
    moonSign,
    isValid: true,
  }
}
