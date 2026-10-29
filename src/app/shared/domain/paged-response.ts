/** Formato das listas paginadas da API (`page` começa em 1; `pageSize` vai de 1 a 100). */
export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages?: number;
}
