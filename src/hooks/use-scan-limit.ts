import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"

interface ScanLimit {
  remaining: number
  total: number
  planType: string
  canScan: boolean
}

export function useScanLimit() {
  const [scanLimit, setScanLimit] = useState<ScanLimit | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchScanLimit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Guest users have unlimited scans
        setScanLimit({
          remaining: Infinity,
          total: Infinity,
          planType: 'guest',
          canScan: true
        })
        setLoading(false)
        return
      }

      // Check for active subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_name, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      const planType = subscription ? subscription.plan_name.toLowerCase() : 'free'
      
      // Get current month-year
      const now = new Date()
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      // Get or create usage record
      const { data: usage, error } = await supabase
        .from('user_scan_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching scan usage:', error)
      }

      const scanCount = usage?.scan_count || 0
      // Free users get 10 scans/month, Premium and Business get unlimited
      const maxScans = planType === 'free' ? 10 : Infinity

      setScanLimit({
        remaining: Math.max(0, maxScans - scanCount),
        total: maxScans,
        planType,
        canScan: planType !== 'free' || scanCount < maxScans
      })
    } catch (error) {
      console.error('Error in fetchScanLimit:', error)
    } finally {
      setLoading(false)
    }
  }

  const incrementScanCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return // Guest users don't track scans

      const now = new Date()
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      // Check for active subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_name')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      const planType = subscription ? subscription.plan_name.toLowerCase() : 'free'

      // Get existing usage record
      const { data: existingUsage } = await supabase
        .from('user_scan_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .maybeSingle()

      if (existingUsage) {
        // Update existing record
        await supabase
          .from('user_scan_usage')
          .update({ 
            scan_count: existingUsage.scan_count + 1,
            plan_type: planType 
          })
          .eq('user_id', user.id)
          .eq('month_year', monthYear)
      } else {
        // Insert new record
        await supabase
          .from('user_scan_usage')
          .insert({
            user_id: user.id,
            month_year: monthYear,
            plan_type: planType,
            scan_count: 1
          })
      }

      await fetchScanLimit()
    } catch (error) {
      console.error('Error incrementing scan count:', error)
    }
  }

  useEffect(() => {
    fetchScanLimit()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchScanLimit()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    scanLimit,
    loading,
    refreshLimit: fetchScanLimit,
    incrementScanCount
  }
}
