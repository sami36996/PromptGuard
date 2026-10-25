import { apiClient } from "./client"

export const getGraph = () =>
  apiClient.get("/api/graph/stats")