"use client";

import styles from "./DataTable.module.css";

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (item: T) => React.ReactNode;
}

function getActionBtnClass(variant?: string): string {
  const classes = [styles.actionBtn];
  if (variant === "primary") {
    classes.push(styles.actionBtnPrimary);
  } else if (variant === "danger") {
    classes.push(styles.actionBtnDanger);
  }
  if (variant === "sm") {
    classes.push(styles.actionBtnSm);
  }
  return classes.join(" ");
}

interface Action<T> {
  label: string | ((item: T) => string);
  variant?: "primary" | "danger" | "sm";
  onClick: (item: T) => void;
  condition?: (item: T) => boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  actions?: Action<T>[];
  emptyMessage?: string;
  emptySubtitle?: string;
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
  };
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  actions,
  emptyMessage = "No data available",
  emptySubtitle,
  loading = false,
  pagination,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>◈</div>
          <div className={styles.emptyTitle}>{emptyMessage}</div>
          {emptySubtitle && <div className={styles.emptySubtitle}>{emptySubtitle}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.header}
                </th>
              ))}
              {actions && actions.length > 0 && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={keyExtractor(item)}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td>
                    <div className={styles.actions}>
                      {actions
                        .filter((action) => !action.condition || action.condition(item))
                        .map((action, idx) => (
                          <button
                            key={idx}
                            className={getActionBtnClass(action.variant)}
                            onClick={() => action.onClick(item)}
                          >
                            {typeof action.label === "function" ? action.label(item) : action.label}
                          </button>
                        ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} -{" "}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{" "}
            {pagination.totalItems}
          </div>
          <div className={styles.paginationControls}>
            <button
              className={styles.pageBtn}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              ←
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  className={`${styles.pageBtn} ${page === pagination.currentPage ? styles.pageBtnActive : ""}`.trim()}
                  onClick={() => pagination.onPageChange(page)}
                >
                  {page}
                </button>
              );
            })}
            <button
              className={styles.pageBtn}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
