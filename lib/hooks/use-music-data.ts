import { useState, useEffect } from 'react'

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

        // Update data only if it's newer than the current data
        setData(prevData => {
          if (!prevData || newData.lastUpdated > prevData.lastUpdated) {
            return newData;
          }
          return prevData;
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

    // Set up an interval to fetch data every 5 minutes
    const intervalId = setInterval(fetchData, 5 * 60 * 1000)

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId)
  }, [period])

  return { data, loading, error }
}