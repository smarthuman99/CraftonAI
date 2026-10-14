import React, { useEffect, useState } from "react";
import "./listPagination.css";

export function usePaginatedRows(rows, { pageSize = 24, resetKey = "" } = {}) {
  const [requestedPage, setPage] = useState(0);
  useEffect(() => setPage(0), [resetKey]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(requestedPage, pages - 1);
  return {
    rows: rows.slice(page * pageSize, (page + 1) * pageSize),
    page,
    pages,
    pageSize,
    total: rows.length,
    setPage
  };
}

export function PaginationControls({ pagination, lang }) {
  const { page, pages, pageSize, total, setPage } = pagination;
  if (pages <= 1) return null;
  return (
    <nav className="list-pagination" aria-label={lang === "Cn" ? "列表分页" : "List pages"}>
      <span aria-live="polite">
        {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} / {total}
      </span>
      <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>
        {lang === "Cn" ? "上一页" : "Previous"}
      </button>
      <button type="button" disabled={page + 1 === pages} onClick={() => setPage(page + 1)}>
        {lang === "Cn" ? "下一页" : "Next"}
      </button>
    </nav>
  );
}
