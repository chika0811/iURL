import { useState, useEffect } from "react"

interface DailyStats {
  linksChecked: number
  threatsBlocked: number
}

export function useDailyStats() {
  const [stats, setStats] = useState<DailyStats>({ linksChecked: 0, threatsBlocked: 0 })

  useEffect(() => {
    const updateStats = () => {
      const today = new Date().toDateString()
      const allStats = JSON.parse(localStorage.getItem('iurl-daily-stats') || '{}')
      const todayStats = allStats[today] || { linksChecked: 0, threatsBlocked: 0 }
      setStats(todayStats)
    }

    updateStats()
    
    // Update every second to reflect real-time changes
    const interval = setInterval(updateStats, 1000)
    
    return () => clearInterval(interval)
  }, [])

  return stats
}