"use client"

import { useEyeMonitoring } from "./use-eye-monitoring"

// Re-export the new eye monitoring hook as useFaceMonitoring for compatibility
// but using the new eye tracking logic under the hood.
export const useFaceMonitoring = useEyeMonitoring
