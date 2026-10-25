import { apiClient } from "./client"

export const getEvents = () =>
  apiClient.get("/api/events/")