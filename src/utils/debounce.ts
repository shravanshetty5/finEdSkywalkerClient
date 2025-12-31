/**
 * Creates a debounced version of the provided function that delays its execution
 * until after the specified delay has elapsed since the last time it was invoked.
 * 
 * @param func - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @returns A debounced version of the function
 * 
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 * 
 * debouncedSearch('apple'); // Will execute after 300ms if no other calls
 * debouncedSearch('banana'); // Previous call is cancelled, this will execute
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function debounced(...args: Parameters<T>) {
    // Clear the previous timeout if it exists
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    // Set a new timeout
    timeoutId = setTimeout(() => {
      func(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Creates a debounced version with a cancel method to clear pending executions.
 * 
 * @param func - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @returns Object with debounced function and cancel method
 */
export function debounceWithCancel<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): {
  debounced: (...args: Parameters<T>) => void
  cancel: () => void
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const debounced = (...args: Parameters<T>) => {
    cancel()
    timeoutId = setTimeout(() => {
      func(...args)
      timeoutId = null
    }, delay)
  }

  return { debounced, cancel }
}

