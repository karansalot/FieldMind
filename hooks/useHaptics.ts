export function useHaptics() {
    const vibrate = (pattern: number[]) => {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(pattern)
        }
    }
    return { vibrate }
}
