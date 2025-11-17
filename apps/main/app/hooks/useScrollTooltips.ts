import { RefObject } from 'react';

/**
 * Tooltip step configuration
 * Currenty based on Yun-Hsin's storyline-flow pattern for scroll-driven animations
 */
export interface TooltipStep {
  id: string;
  targetRef: RefObject<HTMLElement | null>;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  // Scroll progress range [0-1] where this tooltip is visible
  scrollRange: [number, number]; // e.g., [0, 0.5] means visible from 0% to 50% scroll progress
}
