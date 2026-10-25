import { apiClient } from "./client"

export const getAnalytics = () =>
  apiClient.get("/api/analytics/")