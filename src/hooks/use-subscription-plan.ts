import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export type PlanType = 'free' | 'premium' | 'business' | 'guest'

interface SubscriptionPlan {
  planType: PlanType
  isLoading: boolean
  isPremiumOrBusiness: boolean
  hasBackgroundAccess: boolean
}

export function useSubscriptionPlan(): SubscriptionPlan {
  const [planType, setPlanType] = useState<PlanType>('guest')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setPlanType('guest')
          setIsLoading(false)
          return
        }

        // Check for active subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan_name, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        if (subscription) {
          const plan = subscription.plan_name.toLowerCase() as PlanType
          setPlanType(plan)
        } else {
          setPlanType('free')
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        setPlanType('free')
      } finally {
        setIsLoading(false)
      }
    }

    checkSubscription()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const isPremiumOrBusiness = planType === 'premium' || planType === 'business'
  const hasBackgroundAccess = isPremiumOrBusiness

  return {
    planType,
    isLoading,
    isPremiumOrBusiness,
    hasBackgroundAccess
  }
}
