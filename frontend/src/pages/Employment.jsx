import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { traineeApi } from "../api/endpoints";
import {
  Search,
  AlertCircle,
  Eye,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { Select } from "../components/ui/Select";
import { Avatar } from "../components/ui/Avatar";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/QueryState";

export default function Employment() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get("status") || "ALL";
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort") || "name";
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const [sorting, setSorting] = useState([]);

  const updateParams = (updates, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (!v || v === "ALL" || (k === "sort" && v === "name") || (k === "page" && Number(v) <= 1)) {
        next.delete(k);
      } else {
        next.set(k, String(v));
      }
    });
    if (resetPage && !("page" in updates)) {
      next.delete("page");
    }
    setSearchParams(next, { replace: true });
  };

  const {
    data: trainees = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["trainees"],
    queryFn: ({ signal }) => traineeApi.getAll(signal),
    staleTime: 60000,
  });

  const counts = useMemo(() => {
    const employed = trainees.filter((t) => t.employmentStatus === "EMPLOYED").length;
    const unemployed = trainees.filter((t) => t.employmentStatus === "UNEMPLOYED").length;
    const seeking = trainees.filter((t) => t.employmentStatus === "SEEKING").length;
    return { employed, unemployed, seeking, total: trainees.length };
  }, [trainees]);

  const unemployedReasons = useMemo(() => {
    const map = {};
    trainees.forEach((t) => {
      if (t.employmentStatus === "UNEMPLOYED" && t.unemployedReason) {
        map[t.unemployedReason] = (map[t.unemployedReason] || 0) + 1;
      }
    });
    return map;
  }, [trainees]);

  const filteredTrainees = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = trainees.filter((t) => {
      const matchSearch =
        !q ||
        t.fullName?.toLowerCase().includes(q) ||
        String(t.id) === q ||
        t.currentRole?.toLowerCase().includes(q) ||
        t.companyName?.toLowerCase().includes(q);

      const matchStatus = statusFilter === "ALL" || t.employmentStatus === statusFilter;
      return matchSearch && matchStatus;
    });

    if (sortBy === "salary") {
      return [...result].sort((a, b) => (b.currentSalary || 0) - (a.currentSalary || 0));
    }
    if (sortBy === "role") {
      return [...result].sort((a, b) => (a.currentRole || "").localeCompare(b.currentRole || ""));
    }
    return [...result].sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
  }, [trainees, search, statusFilter, sortBy]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "fullName",
        header: "Trainee",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar fallback={row.original.fullName} size="sm" />
            <div>
              <p className="font-medium text-sm text-gray-900 dark:text-gray-50">{row.original.fullName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ID #{row.original.id}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "employmentStatus",
        header: "Status",
        cell: ({ getValue }) => {
          const val = getValue();
          if (val === "EMPLOYED") return <Badge variant="emerald">Employed</Badge>;
          if (val === "UNEMPLOYED") return <Badge variant="rose">Unemployed</Badge>;
          return <Badge variant="amber">Seeking</Badge>;
        },
      },
      {
        accessorKey: "currentRole",
        header: "Role & Company",
        cell: ({ row }) => (
          <div className="text-xs">
            <p className="font-medium text-gray-900 dark:text-gray-100">{row.original.currentRole || "—"}</p>
            <p className="text-gray-500 dark:text-gray-400">{row.original.companyName || "No employer"}</p>
          </div>
        ),
      },
      {
        accessorKey: "currentSalary",
        header: "Compensation",
        cell: ({ row }) => (
          <div className="text-xs">
            <p className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">
              {row.original.currentSalary
                ? `₹${row.original.currentSalary.toLocaleString("en-IN")}`
                : "N/A"}
            </p>
            {row.original.salaryProgression && (
              <p className="text-gray-500 dark:text-gray-400">{row.original.salaryProgression}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "unemployedReason",
        header: "Notes / Context",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 max-w-[220px] block">
            {row.original.unemployedReason || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Profile",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/trainees/${row.original.id}`)}
            >
              <Eye size={13} /> Inspect
            </Button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filteredTrainees.length / pageSize));
  const safePageIndex = Math.min(currentPage - 1, pageCount - 1);

  const table = useReactTable({
    data: filteredTrainees,
    columns,
    state: {
      sorting,
      pagination: { pageIndex: safePageIndex, pageSize },
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater({ pageIndex: safePageIndex, pageSize }) : updater;
      updateParams({ page: next.pageIndex + 1 }, false);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const statusBoxes = [
    { key: "ALL", label: "All Trainees", count: counts.total, note: "Entire directory" },
    { key: "EMPLOYED", label: "Employed", count: counts.employed, note: "Active placements" },
    { key: "SEEKING", label: "Seeking", count: counts.seeking, note: "Actively interviewing" },
    { key: "UNEMPLOYED", label: "Unemployed", count: counts.unemployed, note: "Reason captured" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Employment Outcomes</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Filter placements by status, inspect compensation growth, and review non-placement reasons.
        </p>
      </div>

      {/* Status Filter Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {statusBoxes.map((box) => {
          const active = statusFilter === box.key;
          return (
            <button
              key={box.key}
              type="button"
              onClick={() => updateParams({ status: box.key })}
              className={`text-left p-4 rounded-lg border cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-gray-900 dark:focus-visible:outline-gray-100 ${
                active
                  ? "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-950 dark:border-gray-100"
                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/70"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`text-xs font-medium ${
                    active ? "text-gray-300 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {box.label}
                </p>
                {active && <Badge variant="outline">Active Filter</Badge>}
              </div>
              <p className="text-2xl font-semibold mt-1 tabular-nums">{box.count}</p>
              <p
                className={`text-xs mt-1 ${
                  active ? "text-gray-300 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {box.note}
              </p>
            </button>
          );
        })}
      </div>

      {/* Unemployed Reasons Breakdown */}
      {Object.keys(unemployedReasons).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle size={15} /> Reported Unemployed Reasons
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(unemployedReasons).map(([reason, count]) => (
              <div
                key={reason}
                className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs dark:bg-gray-950/70 dark:border-gray-800"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">{reason}</span>
                <Badge variant="outline" className="shrink-0">
                  {count} {count === 1 ? "trainee" : "trainees"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search & Sort Toolbar */}
      <Card>
        <div className="p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Input
              value={search}
              onChange={(e) => updateParams({ search: e.target.value })}
              placeholder="Search by trainee name, ID, role, or company..."
              className="pl-9"
            />
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={sortBy}
              onValueChange={(val) => updateParams({ sort: val })}
              options={[
                { value: "name", label: "Sort: Trainee Name" },
                { value: "role", label: "Sort: Job Role" },
                { value: "salary", label: "Sort: Highest Salary" },
              ]}
            />
          </div>

          {(search || statusFilter !== "ALL") && (
            <Button
              variant="outline"
              size="md"
              onClick={() => updateParams({ search: "", status: "ALL" })}
            >
              <X size={14} /> Clear
            </Button>
          )}
        </div>
      </Card>

      {/* States / Table */}
      {isLoading ? (
        <LoadingState label="Loading employment records..." rows={5} />
      ) : isError ? (
        <ErrorState title="Failed to load employment records" error={error} onRetry={refetch} />
      ) : filteredTrainees.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title="No matching employment records"
          description="Try clearing filters or selecting All Trainees."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-gray-50 border-b border-gray-200 dark:bg-gray-950/70 dark:border-gray-800">
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sorted = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          className={`px-4 py-3 text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap ${
                            header.id === "actions" ? "text-right" : ""
                          }`}
                        >
                          {canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {sorted === "asc" ? (
                                <ArrowUp size={12} />
                              ) : sorted === "desc" ? (
                                <ArrowDown size={12} />
                              ) : (
                                <ArrowUpDown size={12} className="text-gray-400 dark:text-gray-500" />
                              )}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 dark:bg-gray-950/70 dark:border-gray-800 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>
              Page {safePageIndex + 1} of {pageCount} ({filteredTrainees.length} records)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <ChevronLeft size={14} /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
