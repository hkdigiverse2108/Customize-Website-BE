export interface IPaginationState {
  page: number;
  limit: number;
  page_limit: number;
}

type ApiResponse<T = unknown> = {
  status: number;
  message: string;
  data?: T;
  error?: unknown;
};

export const apiResponse = <T>(status: number, message: string, data: T, error: unknown): ApiResponse<T> => ({
  status,
  message,
  data,
  error,
});
