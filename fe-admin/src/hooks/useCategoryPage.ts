import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useCategoryExportExcel, useCategoryList } from "@/hooks/useCategory";
import type { CategoryParams, CategoryStatus } from "@/api/categoryApi";

export type ModalMode = "create" | "edit" | null;

function getStr(searchParams: URLSearchParams, key: string, fallback = "") {
  return searchParams.get(key) ?? fallback;
}

function getNum(searchParams: URLSearchParams, key: string, fallback: number) {
  const v = searchParams.get(key);
  return v != null ? Number(v) : fallback;
}

export default function useCategoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlKeyword = getStr(searchParams, "keyword");
  const urlStatus = searchParams.get("status") as CategoryStatus | null;
  const urlDirection = getStr(searchParams, "direction", "desc") as "asc" | "desc";
  const urlPage = getNum(searchParams, "page", 0);
  const urlSize = getNum(searchParams, "size", 10);

  const [search, setSearch] = useState(urlKeyword);
  const debouncedSearch = useDebounce(search, 500);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (debouncedSearch !== urlKeyword) {
      updateParams({ keyword: debouncedSearch || null, page: null });
    }

  }, [debouncedSearch]);

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next, { replace: true });
  }

  const queryParams: CategoryParams = {
    page: urlPage,
    size: urlSize,
    sort: "categoryId",
    direction: urlDirection,
    status: urlStatus,
    keyword: debouncedSearch || undefined,
  };

  const { data, isLoading } = useCategoryList(queryParams);
  const { mutate: exportExcel, isPending: isExporting } = useCategoryExportExcel();

  const handleExportExcel = (type: "selected" | "filtered" | "all") => {
    const ids = type === "selected" ? Array.from(selectedIds) : undefined;
    const params =
      type === "all"
        ? {}
        : {
            status: urlStatus,
            keyword: debouncedSearch || undefined,
          };
    exportExcel({ params, ids });
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids: number[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  return {
    params: {
      page: urlPage,
      size: urlSize,
      sort: "categoryId",
      direction: urlDirection,
      status: urlStatus,
    },
    search,
    data,
    isLoading,
    selectedIds,
    isExporting,
    setSearch,
    updateParams,
    handleExportExcel,
    toggleSelectOne,
    toggleSelectAll,
    setSelectedIds,
  };
}
