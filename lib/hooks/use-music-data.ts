import { useState, useEffect } from 'react'
import type { Period, MusicSnapshot } from '@/lib/music-types'

export function useLastFmData(period: Period) {
  const [data, setData] = useState<MusicSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/lastfm?period=${period}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const newData: MusicSnapshot = await response.json()

        if (cancelled) return

        if (
          !Array.isArray(newData.topAlbums) ||
          !Array.isArray(newData.recentTracks) ||
          !Array.isArray(newData.topArtists)
        ) {
          throw new Error('Invalid data structure received from API')
        }

        setData(newData)
        setError(null)
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching Last.fm data:', err)
          setError(
            err instanceof Error ? err : new Error('An error occurred')
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [period])

  return { data, loading, error }
}
