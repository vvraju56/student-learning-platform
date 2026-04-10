"use client"

import { useEyeMonitoring } from "./use-eye-monitoring"

// Re-export the new eye monitoring hook as useFaceMonitoring for compatibility
export const useFaceMonitoring = useEyeMonitoring
