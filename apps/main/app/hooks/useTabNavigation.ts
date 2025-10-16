// hooks/useTabNavigation.ts
'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTabs, setActiveTab } from '../context/Tabs'
import type { TabKey } from '../types/tabs'

export function useTabNavigation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, dispatch } = useTabs()
  const { activeTab } = state

  const navigateToTab = useCallback((tab: TabKey) => {
    if (tab !== activeTab) {
      dispatch(setActiveTab(tab)) // triggers scroll hook (except on first render)
    }
    const params = new URLSearchParams(searchParams.toString())
    if (params.get('tab') !== tab) {
      params.set('tab', tab)
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }, [activeTab, dispatch, router, searchParams])

  return { navigateToTab }
}