export function useHaptics() {
    const vibrate = (pattern: number[] | 'light' | 'heavy' | 'success') => {
        if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
            let p: number[] = []
            if (pattern === 'light') p = [50]
            else if (pattern === 'heavy') p = [200, 100, 200, 100, 400]
            else if (pattern === 'success') p = [100, 50, 100]
            else if (Array.isArray(pattern)) p = pattern

            navigator.vibrate(p)
        }
    }
    return { vibrate }
}
