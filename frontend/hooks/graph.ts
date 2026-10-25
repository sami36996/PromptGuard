import { apiClient } from "@/lib/api/client";


export async function getGraph(){

 return apiClient.get("/api/graph/stats");

}