export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface Pagination {
  page: number
  size: number
  total: number
}