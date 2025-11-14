/**
 * Performance profiling utilities
 * Use these to track render performance and identify bottlenecks
 */

type PerformanceMark = {
  name: string
  startTime: number
  endTime?: number
  duration?: number
}

const marks: Map<string, PerformanceMark> = new Map()

/**
 * Start a performance measurement
 */
export function startMeasure(name: string): void {
  if (typeof window === 'undefined' || !window.performance) return

  marks.set(name, {
    name,
    startTime: window.performance.now(),
  })
}

/**
 * End a performance measurement and log the result
 */
export function endMeasure(name: string, log: boolean = false): number | undefined {
  if (typeof window === 'undefined' || !window.performance) return undefined

  const mark = marks.get(name)
  if (!mark) {
    console.warn(`Performance mark "${name}" not found`)
    return undefined
  }

  const endTime = window.performance.now()
  const duration = endTime - mark.startTime

  marks.set(name, {
    ...mark,
    endTime,
    duration,
  })

  if (log && import.meta.env.DEV) {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
  }

  return duration
}

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  log: boolean = false
): Promise<T> {
  startMeasure(name)
  try {
    const result = await fn()
    endMeasure(name, log)
    return result
  } catch (error) {
    endMeasure(name, log)
    throw error
  }
}

/**
 * Measure sync function execution time
 */
export function measureSync<T>(name: string, fn: () => T, log: boolean = false): T {
  startMeasure(name)
  try {
    const result = fn()
    endMeasure(name, log)
    return result
  } catch (error) {
    endMeasure(name, log)
    throw error
  }
}

/**
 * Get all performance measurements
 */
export function getPerformanceMarks(): Array<PerformanceMark & { name: string }> {
  return Array.from(marks.entries()).map(([name, mark]) => ({
    ...mark,
    name,
  }))
}

/**
 * Clear all performance marks
 */
export function clearPerformanceMarks(): void {
  marks.clear()
}


