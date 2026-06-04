import { Dimensions, PixelRatio } from 'react-native'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

// Design baseline: iPhone 13 (390 x 844 dp)
const BASE_W = 390
const BASE_H = 844

/** Scales a horizontal measurement proportionally to screen width */
export const rw = (size: number): number => Math.round((SCREEN_W / BASE_W) * size)

/** Scales a vertical measurement proportionally to screen height */
export const rh = (size: number): number => Math.round((SCREEN_H / BASE_H) * size)

/** Scales font sizes using PixelRatio for crisp text on all densities */
export const rf = (size: number): number => {
  const newSize = (SCREEN_W / BASE_W) * size
  return Math.round(PixelRatio.roundToNearestPixel(newSize))
}

/** True when the device is a tablet (width ≥ 768 dp) */
export const isTablet = SCREEN_W >= 768

/** Content max-width so lines never stretch across huge tablets */
export const maxContentWidth = isTablet ? 600 : SCREEN_W
