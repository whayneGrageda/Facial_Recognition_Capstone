import { useState } from 'react';

interface UsePaginationProps {
  initialPage?: number;
  initialLimit?: number;
}

export const usePagination = ({
  initialPage = 1,
  initialLimit = 10,
}: UsePaginationProps = {}) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const offset = (page - 1) * limit;

  const goToPage = (newPage: number) => {
    setPage(newPage);
  };

  const nextPage = () => {
    setPage((prev) => prev + 1);
  };

  const prevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const reset = () => {
    setPage(initialPage);
  };

  return {
    page,
    limit,
    offset,
    setPage: goToPage,
    setLimit,
    nextPage,
    prevPage,
    reset,
  };
};
