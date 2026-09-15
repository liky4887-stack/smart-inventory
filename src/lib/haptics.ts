type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

export function haptic(style: HapticStyle = 'light') {
  try {
    if (!navigator.vibrate) return;
    const patterns: Record<HapticStyle, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 40,
      success: [10, 30, 10],
      error: [40, 20, 40],
      selection: 5,
    };
    navigator.vibrate(patterns[style]);
  } catch {
    // no-op
  }
}

export const hapticLight = () => haptic('light');
export const hapticMedium = () => haptic('medium');
export const hapticHeavy = () => haptic('heavy');
export const hapticSuccess = () => haptic('success');
export const hapticError = () => haptic('error');
export const hapticSelection = () => haptic('selection');
