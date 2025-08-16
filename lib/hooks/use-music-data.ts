import { useState, useEffect, useRef } from 'react'

type Period = '7day' | '1month' | '3month' | '6month' | '12month' | 'overall'

interface Album {
  name: string
  artist: {
    name: string
    url: string
  }
  playcount: string
  image: { '#text': string, size: string }[]
  url: string
}

interface Track {
  name: string
  artist: {
    '#text': string
    mbid: string
  }
  album: {
    '#text': string
  }
  image: { '#text': string, size: string }[]
  url: string
  date?: {
    '#text': string
    uts: string
  }
  '@attr'?: {
    nowplaying: string
  }
}

interface LastFmData {
  topAlbums: Album[]
  recentTracks: Track[]
  lastUpdated: number
}

export function useLastFmData(period: Period) {
  const [data, setData] = useState<LastFmData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const currentPeriodRef = useRef<Period>(period)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/lastfm?period=${period}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const newData: LastFmData = await response.json()
        
        if (!newData.topAlbums || !newData.recentTracks) {
          throw new Error('Invalid data structure received from API')
        }

        // Always update data when period changes, or when data is newer
        setData(prevData => {
          // If period changed, always update (different datasets)
          if (currentPeriodRef.current !== period) {
            currentPeriodRef.current = period
            return newData
          }
          
          // If same period, only update if data is newer
          if (!prevData || newData.lastUpdated > prevData.lastUpdated) {
            return newData
          }
          
          return prevData
        })
        
        setError(null)
      } catch (err) {
        console.error('Error fetching Last.fm data:', err)
        setError(err instanceof Error ? err : new Error('An error occurred'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up an interval to fetch data every 30 seconds for near real-time updates
    const intervalId = setInterval(fetchData, 30 * 1000)

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId)
  }, [period])

  return { data, loading, error }
}