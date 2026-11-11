import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { traineeApi, adminApi, providerApi } from "../api/endpoints";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ui/useToast";
import {
  EMPLOYMENT_STATUS_OPTIONS,
  getEmploymentMeta,
  isEmployedStatus,
  normalizeEmploymentStatus,
  toApiEmploymentStatus,
} from "../utils/domain";
import {
  Plus,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Switch } from "../components/ui/Switch";
import { Select } from "../components/ui/Select";
import { ButtonGroup, H2, Intent } from "@blueprintjs/core";
import { Card, Section, SectionCard } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Field, Input } from "../components/ui/Field";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/QueryState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../components/ui/Dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "../components/ui/AlertDialog";

const addTraineeSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email required"),
  phoneNumber: z.string().optional(),
  employmentStatus: z.enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "SELF_EMPLOYED", "UNEMPLOYED"]),
  companyName: z.string().optional(),
  currentRole: z.string().optional(),
  unemployedReason: z.string().optional(),
});

export default function Trainees() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { addToast } = useToast();
  const isAdmin = role === "ADMIN";
  const isProvider = role === "COURSE_PROVIDER";
  const [searchParams, setSearchParams] = useSearchParams();

  const searchFilter = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "ALL";
  const consentFilter = searchParams.get("consent") || "ALL";
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const [sorting, setSorting] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addStatus, setAddStatus] = useState("UNEMPLOYED");

  const updateParams = (updates, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (!v || v === "ALL" || (k === "page" && Number(v) <= 1)) {
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

  const deleteMutation = useMutation({
    mutationFn: (id) => (role === "ADMIN" ? adminApi.removeTrainee(id) : traineeApi.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      addToast({ title: "Trainee Removed", description: "The trainee record has been deleted." });
      setDeleteTarget(null);
    },
    onError: (err) => {
      addToast({ title: "Deletion Failed", description: err.message, variant: "danger" });
    },
  });

  const emailStopMutation = useMutation({
    mutationFn: /** @param {{ id: any, stop: boolean }} payload */ ({ id, stop }) =>
      adminApi.stopEmails(id, stop),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      addToast({ title: "Email Setting Updated", description: "Quarterly email setting updated." });
    },
    onError: (err) => {
      addToast({ title: "Update Failed", description: err.message, variant: "danger" });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors, isSubmitting },
    setValue: setAddValue,
  } = useForm({
    resolver: zodResolver(addTraineeSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      employmentStatus: "UNEMPLOYED",
      companyName: "",
      currentRole: "",
      unemployedReason: "",
    },
  });

  const onAddTrainee = async (formData) => {
    try {
      const fn = role === "ADMIN" ? adminApi.addTrainee : traineeApi.create;
      await fn({
        ...formData,
        employmentStatus: toApiEmploymentStatus(formData.employmentStatus),
        consentGiven: true,
        allowEmails: true,
      });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["skillsSummary"] });
      addToast({ title: "Trainee Added", description: `${formData.fullName} registered.` });
      reset();
      setAddStatus("UNEMPLOYED");
      setAddModalOpen(false);
    } catch (err) {
      addToast({ title: "Creation Failed", description: err.message, variant: "danger" });
    }
  };

  const filteredData = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    const cleanIdQuery = q.replace(/^#/, "");
    return trainees.filter((item) => {
      const matchSearch =
        !q ||
        item.fullName?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.currentRole?.toLowerCase().includes(q) ||
        item.companyName?.toLowerCase().includes(q) ||
        String(item.id) === cleanIdQuery;

      const matchStatus =
        statusFilter === "ALL" || normalizeEmploymentStatus(item.employmentStatus) === statusFilter;

      const matchConsent =
        consentFilter === "ALL" ||
        (consentFilter === "true" && Boolean(item.consentGiven)) ||
        (consentFilter === "false" && !item.consentGiven);

      return matchSearch && matchStatus && matchConsent;
    });
  }, [trainees, searchFilter, statusFilter, consentFilter]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "fullName",
        header: "Trainee",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 min-w-[200px]">
            <Avatar fallback={row.original.fullName} size="sm" />
            <div className="min-w-0">
              <p className="font-medium text-sm text-gray-900 dark:text-gray-50 truncate">{row.original.fullName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {isProvider || !row.original.email ? `ID #${row.original.id}` : row.original.email}
              </p>
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
      {
        accessorKey: "skills",
        header: "Skills",
        enableSorting: false,
        cell: ({ row }) => {
          const skills = row.original.skills || [];
          return (
            <div className="flex flex-wrap gap-1 max-w-[220px]">
              {skills.slice(0, 3).map((s) => (
                <Badge key={s} variant="neutral">
                  {s}
                </Badge>
              ))}
              {skills.length > 3 && (
                <Badge variant="outline">+{skills.length - 3}</Badge>
              )}
              {skills.length === 0 && <span className="text-xs text-gray-400 dark:text-gray-500">None</span>}
            </div>
          );
        },
      },
      {
        accessorKey: "consentGiven",
        header: "Consent",
        cell: ({ getValue }) =>
          getValue() ? (
            <Badge variant="emerald">Granted</Badge>
          ) : (
            <Badge variant="outline">Pending</Badge>
          ),
      },
      ...(isAdmin
        ? [
            {
              id: "allowEmails",
              header: "Emails",
              enableSorting: false,
              cell: ({ row }) => (
                <Switch
                  aria-label={`Toggle emails for ${row.original.fullName}`}
                  checked={!row.original.adminStoppedEmail}
                  onCheckedChange={(checked) =>
                    emailStopMutation.mutate({ id: row.original.id, stop: !checked })
                  }
                />
              ),
            },
          ]
        : []),
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              icon={<Eye size={13} />}
              onClick={() => navigate(`/trainees/${row.original.id}`)}
            >
              View Profile
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                intent={Intent.DANGER}
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={() => setDeleteTarget(row.original)}
                aria-label={`Remove ${row.original.fullName}`}
              />
            )}
          </div>
        ),
      },
    ],
    [isAdmin, isProvider, navigate, emailStopMutation]
  );

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePageIndex = Math.min(currentPage - 1, pageCount - 1);

  const table = useReactTable({
    data: filteredData,
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

  const hasFilters = searchFilter !== "" || statusFilter !== "ALL" || consentFilter !== "ALL";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <H2 className="!mb-0">Trainees Directory</H2>
          <p className="bp6-text-muted text-xs mt-1">
            Search, filter, sort, and inspect trainee outcomes across {trainees.length} records.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => setAddModalOpen(true)}
          >
            Add Trainee
          </Button>
        )}
      </div>

      {/* Filters Toolbar */}
      <Card compact>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1">
            <Input
              leftIcon="search"
              value={searchFilter}
              onChange={(e) => updateParams({ search: e.target.value })}
              placeholder="Search by name, email, company, role, or ID..."
            />
          </div>

          <div className="w-full md:w-44">
            <Select
              value={statusFilter}
              onValueChange={(val) => updateParams({ status: val })}
              options={[
                { value: "ALL", label: "All Statuses" },
                ...EMPLOYMENT_STATUS_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                })),
              ]}
            />
          </div>

          <div className="w-full md:w-44">
            <Select
              value={consentFilter}
              onValueChange={(val) => updateParams({ consent: val })}
              options={[
                { value: "ALL", label: "All Consent" },
                { value: "true", label: "Consent Granted" },
                { value: "false", label: "Consent Pending" },
              ]}
            />
          </div>

          {hasFilters && (
            <Button
              variant="outline"
              icon={<X size={14} />}
              onClick={() => updateParams({ search: "", status: "ALL", consent: "ALL" })}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* States / Table */}
      {isLoading ? (
        <LoadingState label="Loading trainee directory..." rows={5} />
      ) : isError ? (
        <ErrorState title="Failed to load trainees" error={error} onRetry={refetch} />
      ) : filteredData.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No matching trainees"
          description="Try clearing or adjusting your search query, status filter, or consent filter."
          action={
            hasFilters && (
              <Button
                variant="outline"
                onClick={() => updateParams({ search: "", status: "ALL", consent: "ALL" })}
              >
                Reset Filters
              </Button>
            )
          }
        />
      ) : (
        <Section title={`Registered Trainees (${filteredData.length})`} icon={<Users size={15} />}>
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
              Page {safePageIndex + 1} of {pageCount} ({filteredData.length} trainees)
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

      {/* Add Trainee Dialog */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Trainee</DialogTitle>
            <DialogDescription>
              Create a new trainee record in the SkillTrack directory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onAddTrainee)} className="space-y-3.5">
            <Field label="Full Name" required error={formErrors.fullName?.message} id="add-name">
              <Input
                id="add-name"
                {...register("fullName")}
                placeholder="e.g. Aarav Sharma"
                hasError={Boolean(formErrors.fullName)}
              />
            </Field>

            <Field label="Email Address" required error={formErrors.email?.message} id="add-email">
              <Input
                id="add-email"
                type="email"
                {...register("email")}
                placeholder="e.g. aarav@example.com"
                hasError={Boolean(formErrors.email)}
              />
            </Field>

            <Field label="Phone Number" id="add-phone">
              <Input id="add-phone" {...register("phoneNumber")} placeholder="+91 98765 43210" />
            </Field>

            <Field label="Employment Status" required>
              <Select
                value={addStatus}
                onValueChange={(val) => {
                  setAddStatus(val);
                  setAddValue("employmentStatus", val);
                }}
                options={EMPLOYMENT_STATUS_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </Field>

            {isEmployedStatus(addStatus) ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Company Name" id="add-company">
                  <Input id="add-company" {...register("companyName")} placeholder="e.g. TCS" />
                </Field>
                <Field label="Current Role" id="add-role">
                  <Input id="add-role" {...register("currentRole")} placeholder="e.g. Developer" />
                </Field>
              </div>
            ) : (
              <Field label="Unemployed Reason" id="add-reason">
                <Input
                  id="add-reason"
                  {...register("unemployedReason")}
                  placeholder="e.g. Actively looking, Career break..."
                />
              </Field>
            )}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
              <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
                Create Trainee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent variant="danger">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Trainee Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.fullName}</strong> from the
              registry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
            <Button
              variant="danger"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Remove Trainee
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
