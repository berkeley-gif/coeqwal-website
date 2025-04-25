"use client"

import { createContext, Dispatch, SetStateAction } from "react"

export interface Storyline {
  opener: {
    title: string
    subtitle: string
    p1: string
    p2: string
    throughline: string
  }
  precipitation: {
    title: string
    p1: string
    p2: string
    p3: string
    p4: string
  }
  variability?: {
    p1: string
    p2: string
    p3: string
    p4: string
  }
  snowpack: {
    title: string
    p1: string
    p2: string
    p3: string
  }
  flow: {
    title: string
    p1: string
    p2: string
    p3: string
    p4: string
    valley: {
      p1: string
      p2: string
      p3: string
      p4: string
    }
    transition: {
      p1: string
      p2: string
    }
  }
  delta: {
    p11: string
    p12: string
    p13: string
    p2: string
    p3: string
    p4: string
    p5: string
    transition: string
  }
  economy: {
    title: string
    p1: string
    p2: string
    irrigation: {
      p1: string
      p2: string
    }
    drinking: {
      p1: string
      p2: string
      p3: string
    }
  }
  transformation: {
    subtitle1: string
    subtitle2: string
    p11: string
    p12: string
    p21: string
    p22: string
    p23: string
    p31: string
    p32: string
    p33: string
    p41: string
    p42: string
    p43: string
    transition: string
  }
  impact: {
    benefits: {
      p1: string
      p2: string
      p3: string
      p4: string
      transition: string
    }
    salmon: {
      p1: string
      p2: string
      p31: string
      p32: string
      p33: string
    }
    delta: {
      p11: string
      p12: string
      p2: string
      p3: string
      p4: string
      p5: string
    }
    groundwater: {
      p1: string
      p21: string
      p22: string
      p23: string
      p3: string
    }
    drinking: {
      p1: string
      p21: string
      p22: string
      p23: string
    }
    climate: {
      p11: string
      p12: string
      p2: string
      p3: string
    }
  }
  conclusion: {
    subtitle: string
    caption: string
    p11: string
    p12: string
    p13: string
    p14: string
    p15: string
    p16: string
    p2: string
    p3: string
    p41: string
    p42: string
    transition: {
      subtitle: string
      p11: string
      p12: string
      p2: string
    }
    ending: {
      p11: string
      p12: string
    }
  }
}

const StoryContext = createContext<{
  activeSection: string
  setActiveSection: Dispatch<SetStateAction<string>>
  storyline: Storyline | null
}>({
  activeSection: "opener",
  setActiveSection: () => {},
  storyline: null,
})

export default StoryContext
