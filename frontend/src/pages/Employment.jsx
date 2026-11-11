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
import { traineeApi, providerApi } from "../api/endpoints";
import { useAuth } from "../context/useAuth";
import {
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
import { ButtonGroup, H2 } from "@blueprintjs/core";
import { Card, Section, SectionCard, CardList } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { Select } from "../components/ui/Select";
import { Avatar } from "../components/ui/Avatar";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/QueryState";
import {
  EMPLOYMENT_STATUS_OPTIONS,
  categorizeUnemployedReason,
  getEmploymentMeta,
  getUnemployedReasonText,
  isEmployedStatus,
  normalizeEmploymentStatus,
} from "../utils/domain";

export default function Employment() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isProvider = role === "COURSE_PROVIDER";
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
    queryKey: ["trainees", role],
    queryFn: ({ signal }) =>
      isProvider ? providerApi.getAllTraineesReadOnly(signal) : traineeApi.getAll(signal),
    staleTime: 60000,
  });

  const counts = useMemo(() => {
    const bucketCounts = {
      FULL_TIME: 0,
      PART_TIME: 0,
      INTERNSHIP: 0,
      SELF_EMPLOYED: 0,
      UNEMPLOYED: 0,
    };
    trainees.forEach((t) => {
      const normalized = normalizeEmploymentStatus(t.employmentStatus);
      bucketCounts[normalized] = (bucketCounts[normalized] || 0) + 1;
    });
    return { ...bucketCounts, total: trainees.length };
  }, [trainees]);

  const unemployedTrainees = useMemo(() => {
    return trainees
      .filter((t) => !isEmployedStatus(t.employmentStatus))
      .map((t) => {
        const reasonText = getUnemployedReasonText(t) || "No reason specified";
        return {
          ...t,
          reasonText,
          reasonCategory: categorizeUnemployedReason(reasonText),
        };
      });
  }, [trainees]);

  const unemployedCategoryCounts = useMemo(() => {
    const map = {};
    unemployedTrainees.forEach((t) => {
      map[t.reasonCategory] = (map[t.reasonCategory] || 0) + 1;
    });
    return map;
  }, [unemployedTrainees]);

  const employedSortedByRole = useMemo(() => {
    return trainees
      .filter((t) => isEmployedStatus(t.employmentStatus))
      .sort((a, b) => {
        const roleCmp = (a.currentRole || "zzzz").localeCompare(b.currentRole || "zzzz");
        if (roleCmp !== 0) return roleCmp;
        return (a.fullName || "").localeCompare(b.fullName || "");
      });
  }, [trainees]);

  const filteredTrainees = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cleanIdQuery = q.replace(/^#/, "");
    const result = trainees.filter((t) => {
      const matchSearch =
        !q ||
        t.fullName?.toLowerCase().includes(q) ||
        String(t.id) === cleanIdQuery ||
        t.currentRole?.toLowerCase().includes(q) ||
        t.companyName?.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "ALL" || normalizeEmploymentStatus(t.employmentStatus) === statusFilter;
      return matchSearch && matchStatus;
    });

    if (sortBy === "salary" && !isProvider) {
      return [...result].sort((a, b) => (b.currentSalary || 0) - (a.currentSalary || 0));
    }
    if (sortBy === "role") {
      return [...result].sort((a, b) => (a.currentRole || "").localeCompare(b.currentRole || ""));
    }
    return [...result].sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
  }, [trainees, search, statusFilter, sortBy, isProvider]);

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
          const conf = getEmploymentMeta(getValue());
          return <Badge variant={conf.variant}>{conf.label}</Badge>;
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
      ...(!isProvider
        ? [
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
          ]
        : []),
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
              icon={<Eye size={13} />}
              onClick={() => navigate(`/trainees/${row.original.id}`)}
            >
              View Profile
            </Button>
          </div>
        ),
      },
    ],
    [navigate, isProvider]
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

  const statusBoxes = EMPLOYMENT_STATUS_OPTIONS.map((opt) => ({
    key: opt.value,
    label: opt.label,
    count: counts[opt.value] || 0,
    note: opt.note,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <H2 className="!mb-0">Employment Outcomes</H2>
          <p className="bp6-text-muted text-xs mt-1">
            Click a status box to inspect trainees, search by trainee name or ID, or browse role and
            unemployed reason breakdowns ({counts.total} trainees).
          </p>
        </div>

        {statusFilter !== "ALL" && (
          <Button
            variant="outline"
            size="sm"
            icon={<X size={13} />}
            onClick={() => updateParams({ status: "ALL" })}
          >
            Show All Statuses
          </Button>
        )}
      </div>

      {/* 5 Clickable Status Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {statusBoxes.map((box) => {
          const active = statusFilter === box.key;
          const toggleStatus = () => updateParams({ status: active ? "ALL" : box.key });
          return (
            <Card
              key={box.key}
              compact
              interactive
              selected={active}
              elevation={active ? 2 : 1}
              role="button"
              tabIndex={0}
              onClick={toggleStatus}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleStatus();
                }
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium bp6-text-muted">{box.label}</span>
                {active && <Badge variant="primary">Active</Badge>}
              </div>
              <H2 className="!mb-0 !mt-1.5 tabular-nums">{box.count}</H2>
              <p className="text-xs bp6-text-muted mt-1">{box.note}</p>
            </Card>
          );
        })}
      </div>

      {/* Unemployed Block & Employed Block (Sorted by Role) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section
          title={`Unemployed Block (${unemployedTrainees.length})`}
          icon={<AlertCircle size={15} />}
          rightElement={
            <Button
              variant="minimal"
              size="sm"
              onClick={() => updateParams({ status: "UNEMPLOYED" })}
            >
              Filter Unemployed
            </Button>
          }
        >
          <SectionCard compact className="flex flex-wrap gap-1.5">
            {Object.entries(unemployedCategoryCounts).map(([category, cnt]) => (
              <Badge key={category} variant={category === "Actively Looking" ? "amber" : "rose"}>
                {category}: {cnt}
              </Badge>
            ))}
          </SectionCard>
          {unemployedTrainees.length > 0 ? (
            <SectionCard padded={false}>
              <CardList bordered={false}>
                {unemployedTrainees.map((t) => (
                  <Card key={t.id} compact className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold truncate">{t.fullName}</span>
                        <span className="text-[11px] bp6-text-muted tabular-nums">#{t.id}</span>
                        <Badge variant={t.reasonCategory === "Actively Looking" ? "amber" : "outline"}>
                          {t.reasonCategory}
                        </Badge>
                      </div>
                      <p className="text-xs bp6-text-muted mt-0.5 truncate">{t.reasonText}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => navigate(`/trainees/${t.id}`)}
                    >
                      View Profile
                    </Button>
                  </Card>
                ))}
              </CardList>
            </SectionCard>
          ) : (
            <SectionCard>
              <p className="text-xs bp6-text-muted">No unemployed trainees reported.</p>
            </SectionCard>
          )}
        </Section>

        <Section
          title={`Employed Block — Sorted by Role (${employedSortedByRole.length})`}
          icon={<BriefcaseBusiness size={15} />}
          rightElement={
            <Button
              variant="minimal"
              size="sm"
              onClick={() => updateParams({ sort: "role", status: "ALL" })}
            >
              Sort Table by Role
            </Button>
          }
        >
          {employedSortedByRole.length > 0 ? (
            <SectionCard padded={false}>
              <CardList bordered={false} className="max-h-72 overflow-y-auto">
                {employedSortedByRole.map((t) => {
                  const statusMeta = getEmploymentMeta(t.employmentStatus);
                  return (
                    <Card key={t.id} compact className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold truncate">
                            {t.currentRole || "Placed Role"}
                          </span>
                          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                        </div>
                        <p className="text-xs bp6-text-muted mt-0.5 truncate">
                          {t.fullName} (#{t.id}) {t.companyName ? `at ${t.companyName}` : ""}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => navigate(`/trainees/${t.id}`)}
                      >
                        View Profile
                      </Button>
                    </Card>
                  );
                })}
              </CardList>
            </SectionCard>
          ) : (
            <SectionCard>
              <p className="text-xs bp6-text-muted">No placed trainees recorded yet.</p>
            </SectionCard>
          )}
        </Section>
      </div>

      {/* Search & Sort Toolbar */}
      <Card compact>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <Input
              leftIcon="search"
              value={search}
              onChange={(e) => updateParams({ search: e.target.value })}
              placeholder="Search by trainee name, ID, role, or company..."
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={isProvider && sortBy === "salary" ? "name" : sortBy}
              onValueChange={(val) => updateParams({ sort: val })}
              options={[
                { value: "name", label: "Sort: Trainee Name" },
                { value: "role", label: "Sort: Job Role" },
                ...(!isProvider ? [{ value: "salary", label: "Sort: Highest Salary" }] : []),
              ]}
            />
          </div>

          {(search || statusFilter !== "ALL") && (
            <Button
              variant="outline"
              icon={<X size={14} />}
              onClick={() => updateParams({ search: "", status: "ALL" })}
            >
              Clear
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
          icon={<BriefcaseBusiness size={28} />}
          title="No matching employment records"
          description="Try clearing filters or selecting All Trainees."
        />
      ) : (
        <Section
          title={`Employment Records (${filteredTrainees.length})`}
          icon={<BriefcaseBusiness size={15} />}
        >
          <SectionCard padded={false}>
            <Table striped interactive className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sorted = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          className={header.id === "actions" ? "!text-right" : ""}
                        >
                          {canSort ? (
                            <Button
                              variant="minimal"
                              size="sm"
                              onClick={header.column.getToggleSortingHandler()}
                              endIcon={
                                sorted === "asc" ? (
                                  <ArrowUp size={12} />
                                ) : sorted === "desc" ? (
                                  <ArrowDown size={12} />
                                ) : (
                                  <ArrowUpDown size={12} className="opacity-60" />
                                )
                              }
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </Button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </SectionCard>

          <SectionCard compact className="flex items-center justify-between text-xs bp6-text-muted">
            <span>
              Page {safePageIndex + 1} of {pageCount} ({filteredTrainees.length} records)
            </span>
            <ButtonGroup>
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={14} />}
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                endIcon={<ChevronRight size={14} />}
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                Next
              </Button>
            </ButtonGroup>
          </SectionCard>
        </Section>
      )}
    </div>
  );
}
