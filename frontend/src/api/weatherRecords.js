import { apiClient } from "./client";

export async function createWeatherRecord(data) {
  const response = await apiClient.post("/api/weather-records", data);
  return response.data;
}

export async function getWeatherRecords(skip = 0, limit = 20) {
  const response = await apiClient.get("/api/weather-records", {
    params: { skip, limit },
  });
  return response.data;
}

export async function getWeatherRecord(recordId) {
  const response = await apiClient.get(`/api/weather-records/${recordId}`);
  return response.data;
}

export async function updateWeatherRecord(recordId, data) {
  const response = await apiClient.patch(
    `/api/weather-records/${recordId}`,
    data,
  );
  return response.data;
}

export async function deleteWeatherRecord(recordId) {
  await apiClient.delete(`/api/weather-records/${recordId}`);
}
