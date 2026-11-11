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
import { traineeApi, adminApi } from "../api/endpoints";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ui/useToast";
import {
  Search,
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
import { Card } from "../components/ui/Card";
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
  employmentStatus: z.enum(["EMPLOYED", "UNEMPLOYED", "SEEKING"]),
  companyName: z.string().optional(),
  currentRole: z.string().optional(),
});

export default function Trainees() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchFilter = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "ALL";
  const consentFilter = searchParams.get("consent") || "ALL";
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const [sorting, setSorting] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addStatus, setAddStatus] = useState("SEEKING");

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
    queryKey: ["trainees"],
    queryFn: ({ signal }) => traineeApi.getAll(signal),
    staleTime: 60000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.removeTrainee(id),
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
    mutationFn: ({ id, stop }) => adminApi.stopEmails(id, stop),
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
      employmentStatus: "SEEKING",
      companyName: "",
      currentRole: "",
    },
  });

  const onAddTrainee = async (formData) => {
    try {
      const fn = role === "ADMIN" ? adminApi.addTrainee : traineeApi.create;
      await fn({
        ...formData,
        consentGiven: true,
        allowEmails: true,
      });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      addToast({ title: "Trainee Added", description: `${formData.fullName} registered.` });
      reset();
      setAddStatus("SEEKING");
      setAddModalOpen(false);
    } catch (err) {
      addToast({ title: "Creation Failed", description: err.message, variant: "danger" });
    }
  };

  const filteredData = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return trainees.filter((item) => {
      const matchSearch =
        !q ||
        item.fullName?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.currentRole?.toLowerCase().includes(q) ||
        item.companyName?.toLowerCase().includes(q) ||
        String(item.id) === q;

      const matchStatus = statusFilter === "ALL" || item.employmentStatus === statusFilter;

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
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "employmentStatus",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue();
          const configs = {
            EMPLOYED: { label: "Employed", variant: "emerald" },
            UNEMPLOYED: { label: "Unemployed", variant: "rose" },
            SEEKING: { label: "Seeking", variant: "amber" },
          };
          const conf = configs[status] || { label: status || "Unknown", variant: "neutral" };
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
      ...(role === "ADMIN"
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
              onClick={() => navigate(`/trainees/${row.original.id}`)}
            >
              <Eye size={13} /> Profile
            </Button>
            {role === "ADMIN" && (
              <Button
                variant="ghost"
                size="icon"
                className="text-red-700 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-950/60 dark:hover:text-red-300"
                onClick={() => setDeleteTarget(row.original)}
                aria-label={`Remove ${row.original.fullName}`}
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [role, navigate, emailStopMutation]
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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Trainees Directory</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Search, filter, sort, and inspect trainee outcomes across {trainees.length} records.
          </p>
        </div>

        {role === "ADMIN" && (
          <Button variant="primary" size="md" onClick={() => setAddModalOpen(true)}>
            <Plus size={15} /> Add Trainee
          </Button>
        )}
      </div>

      {/* Filters Toolbar */}
      <Card>
        <div className="p-3.5 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Input
              value={searchFilter}
              onChange={(e) => updateParams({ search: e.target.value })}
              placeholder="Search by name, email, company, role, or ID..."
              className="pl-9"
            />
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" />
          </div>

          <div className="w-full md:w-44">
            <Select
              value={statusFilter}
              onValueChange={(val) => updateParams({ status: val })}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "EMPLOYED", label: "Employed" },
                { value: "SEEKING", label: "Seeking" },
                { value: "UNEMPLOYED", label: "Unemployed" },
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
              size="md"
              onClick={() => updateParams({ search: "", status: "ALL", consent: "ALL" })}
            >
              <X size={14} /> Clear
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
          icon={Users}
          title="No matching trainees"
          description="Try clearing or adjusting your search query, status filter, or consent filter."
          action={
            hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams({ search: "", status: "ALL", consent: "ALL" })}
              >
                Reset Filters
              </Button>
            )
          }
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
              Page {safePageIndex + 1} of {pageCount} ({filteredData.length} trainees)
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
                options={[
                  { value: "SEEKING", label: "Seeking Employment" },
                  { value: "EMPLOYED", label: "Employed" },
                  { value: "UNEMPLOYED", label: "Unemployed" },
                ]}
              />
            </Field>

            {addStatus === "EMPLOYED" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Company Name" id="add-company">
                  <Input id="add-company" {...register("companyName")} placeholder="e.g. TCS" />
                </Field>
                <Field label="Current Role" id="add-role">
                  <Input id="add-role" {...register("currentRole")} placeholder="e.g. Developer" />
                </Field>
              </div>
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
