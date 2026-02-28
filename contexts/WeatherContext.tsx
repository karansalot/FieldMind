'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface WeatherData {
    temp: number       // °F
    tempC: number      // °C
    condition: string  // clear/rain/snow/fog/cloudy
    windSpeed: number  // mph
    humidity: number
    feelsLike: number  // °F
    city: string
    icon: string
    isFreezingCold: boolean  // < 32°F
    isVeryHot: boolean       // > 95°F
    isRainy: boolean
    isSnowy: boolean
    isWindy: boolean         // > 25mph
    isFoggy: boolean
    loaded: boolean
    error: string | null
}

const defaultWeather: WeatherData = {
    temp: 72, tempC: 22, condition: 'clear', windSpeed: 5,
    humidity: 50, feelsLike: 72, city: 'Your Location',
    icon: '☀️', isFreezingCold: false, isVeryHot: false,
    isRainy: false, isSnowy: false, isWindy: false, isFoggy: false,
    loaded: false, error: null
}

const WeatherContext = createContext<WeatherData>(defaultWeather)

function conditionToIcon(condition: string): string {
    const c = condition.toLowerCase()
    if (c.includes('snow') || c.includes('blizzard')) return '❄️'
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return '🌧️'
    if (c.includes('fog') || c.includes('mist')) return '🌫️'
    if (c.includes('thunder') || c.includes('storm')) return '⛈️'
    if (c.includes('cloud') || c.includes('overcast')) return '☁️'
    if (c.includes('clear') || c.includes('sunny')) return '☀️'
    return '🌤️'
}

export function WeatherProvider({ children }: { children: ReactNode }) {
    const [weather, setWeather] = useState<WeatherData>(defaultWeather)

    useEffect(() => {
        if (!navigator.geolocation) {
            fetchWeatherByIp()
            return
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
            () => fetchWeatherByIp(),
            { timeout: 5000 }
        )
    }, [])

    async function fetchWeatherByCoords(lat: number, lon: number) {
        try {
            const res = await fetch(`https://wttr.in/${lat},${lon}?format=j1`)
            if (!res.ok) throw new Error('Weather fetch failed')
            const data = await res.json()
            parseWttrData(data)
        } catch (e) {
            setWeather(w => ({ ...w, loaded: true, error: 'Weather unavailable' }))
        }
    }

    async function fetchWeatherByIp() {
        try {
            const res = await fetch('https://wttr.in/?format=j1')
            if (!res.ok) throw new Error('Weather fetch failed')
            const data = await res.json()
            parseWttrData(data)
        } catch {
            setWeather(w => ({ ...w, loaded: true, error: 'Weather unavailable' }))
        }
    }

    function parseWttrData(data: any) {
        try {
            const current = data.current_condition?.[0]
            const area = data.nearest_area?.[0]
            const tempF = parseInt(current.temp_F)
            const tempC = parseInt(current.temp_C)
            const feelsF = parseInt(current.FeelsLikeF)
            const windMph = parseInt(current.windspeedMiles)
            const humidity = parseInt(current.humidity)
            const description = current.weatherDesc?.[0]?.value || 'Clear'
            const city = area?.areaName?.[0]?.value || 'Your Location'

            const condition = description.toLowerCase()

            setWeather({
                temp: tempF,
                tempC,
                condition: description,
                windSpeed: windMph,
                humidity,
                feelsLike: feelsF,
                city,
                icon: conditionToIcon(description),
                isFreezingCold: tempF < 32,
                isVeryHot: tempF > 95,
                isRainy: condition.includes('rain') || condition.includes('drizzle'),
                isSnowy: condition.includes('snow') || condition.includes('blizzard'),
                isWindy: windMph > 25,
                isFoggy: condition.includes('fog') || condition.includes('mist'),
                loaded: true,
                error: null
            })
        } catch {
            setWeather(w => ({ ...w, loaded: true, error: 'Parse error' }))
        }
    }

    return <WeatherContext.Provider value={weather}>{children}</WeatherContext.Provider>
}

export function useWeather() {
    return useContext(WeatherContext)
}
