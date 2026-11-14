import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Callout,
  Card,
  H2,
  H4,
  HTMLTable,
  InputGroup,
  Intent,
  NonIdealState,
  Spinner,
  Switch,
  Tag,
} from "@blueprintjs/core";
import { Cell, Column, Table2 } from "@blueprintjs/table";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { showError } from "../lib/toaster";

interface EmploymentRecord {
  traineeId: number;
  fullName: string;
  roleCategory: string;
  location: string | null;
  status: string;
  role: string | null;
  company: string | null;
  salary: number | null;
  reason: string | null;
  updatedAt: string;
}

interface EmploymentOverviewDTO {
  totalWithEmployment: number;
  statusCounts: Record<string, number>;
  unemployedReasons: Record<string, number>;
  records: EmploymentRecord[];
  employedSortedByRole: EmploymentRecord[];
  unemployedList: EmploymentRecord[];
}

const STATUS_BOXES = [
  { key: "full_time", label: "Full-Time", intent: Intent.SUCCESS },
  { key: "part_time", label: "Part-Time", intent: Intent.PRIMARY },
  { key: "internship", label: "Internship", intent: Intent.WARNING },
  { key: "self_employed", label: "Self-Employed", intent: Intent.NONE },
  { key: "unemployed", label: "Unemployed", intent: Intent.DANGER },
] as const;

export default function EmploymentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [data, setData] = useState<EmploymentOverviewDTO | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [gridMode, setGridMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (st: string, q: string) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (st !== "ALL") qs.set("status", st);
      if (q.trim()) qs.set("search", q.trim());
      const res = await apiRequest<EmploymentOverviewDTO>(`/api/employment?${qs.toString()}`);
      setData(res);
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to load employment stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void load(statusFilter, search);
    }, 150);
    return () => clearTimeout(t);
  }, [statusFilter, search, load]);

  return (
    <div className="st-stack">
      <Card>
        <div className="st-between">
          <div>
            <H2 style={{ margin: 0 }}>Employment Outcomes</H2>
            <p className="bp5-text-muted" style={{ margin: "4px 0 0 0", fontSize: 13 }}>
              Click any status box to filter trainees, inspect unemployed reasons, or search by trainee name / ID.
            </p>
          </div>
          {statusFilter !== "ALL" && (
            <Button minimal icon="cross" text="Clear Status Filter" onClick={() => setStatusFilter("ALL")} />
          )}
        </div>
      </Card>

      {!isAdmin && (
        <Callout intent={Intent.PRIMARY} icon="lock">
          Course Provider view: Non-consented trainees and individual salary figures are omitted on the server.
        </Callout>
      )}

      {/* 5 Clickable Status Boxes */}
      <div className="st-grid-cards">
        {STATUS_BOXES.map((box) => {
          const active = statusFilter === box.key;
          const count = data?.statusCounts?.[box.key] ?? 0;
          return (
            <Card
              key={box.key}
              interactive
              onClick={() => setStatusFilter((prev) => (prev === box.key ? "ALL" : box.key))}
              style={{
                border: active ? "2px solid #2d72d2" : undefined,
              }}
            >
              <div className="st-between">
                <strong>{box.label}</strong>
                <Tag minimal intent={box.intent}>
                  {active ? "Filtered" : "Click to filter"}
                </Tag>
              </div>
              <H2 style={{ margin: "10px 0 0 0" }}>{count}</H2>
            </Card>
          );
        })}
      </div>

      {/* Unemployed Reasons & Employed Sorted by Role Blocks */}
      {data && (
        <div className="st-grid-2">
          <Card>
            <H4>Unemployed Breakdown ({data.unemployedList.length})</H4>
            <div className="st-row" style={{ marginBottom: 10 }}>
              <Tag intent={Intent.WARNING} minimal>
                Actively Looking: {data.unemployedReasons.actively_looking || 0}
              </Tag>
              <Tag intent={Intent.NONE} minimal>
                Break / Study: {data.unemployedReasons.break || 0}
              </Tag>
            </div>
            {data.unemployedList.length === 0 ? (
              <p className="bp5-text-muted">No trainees currently marked unemployed.</p>
            ) : (
              <HTMLTable compact striped style={{ width: "100%" }}>
                <tbody>
                  {data.unemployedList.map((u) => (
                    <tr key={u.traineeId}>
                      <td>
                        <strong>{u.fullName}</strong> (#{u.traineeId})
                      </td>
                      <td>
                        <Tag minimal intent={Intent.WARNING}>
                          {u.reason === "break" ? "Break" : "Actively Looking"}
                        </Tag>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Button
                          small
                          minimal
                          text="View profile"
                          onClick={() => navigate(`/trainees/${u.traineeId}`)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </HTMLTable>
            )}
          </Card>

          <Card>
            <H4>Employed Trainees — Sorted by Role ({data.employedSortedByRole.length})</H4>
            {data.employedSortedByRole.length === 0 ? (
              <p className="bp5-text-muted">No employed records found.</p>
            ) : (
              <HTMLTable compact striped style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Trainee</th>
                    <th>Company</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.employedSortedByRole.map((e) => (
                    <tr key={e.traineeId}>
                      <td><strong>{e.role || "N/A"}</strong></td>
                      <td>{e.fullName} (#{e.traineeId})</td>
                      <td>{e.company || "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <Button
                          small
                          minimal
                          text="View profile"
                          onClick={() => navigate(`/trainees/${e.traineeId}`)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </HTMLTable>
            )}
          </Card>
        </div>
      )}

      {/* Searchable Records Table (with optional BlueprintJS Table2 spreadsheet view) */}
      <Card>
        <div className="st-between" style={{ marginBottom: 12 }}>
          <div style={{ minWidth: 280, flex: 1, maxWidth: 420 }}>
            <InputGroup
              leftIcon="search"
              placeholder="Search by trainee name or ID (e.g. Aarav or #1)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Switch
            style={{ marginBottom: 0 }}
            checked={gridMode}
            onChange={(e) => setGridMode(e.currentTarget.checked)}
            label="Spreadsheet Grid (@blueprintjs/table)"
          />
        </div>

        {loading || !data ? (
          <div className="st-row" style={{ justifyContent: "center", padding: 32 }}>
            <Spinner size={28} />
          </div>
        ) : data.records.length === 0 ? (
          <NonIdealState
            icon="briefcase"
            title="No employment records match"
            description="Adjust the status box filter or trainee search query."
          />
        ) : gridMode ? (
          <div style={{ height: Math.min(340, 60 + data.records.length * 30) }}>
            <Table2 numRows={data.records.length}>
              <Column
                name="Trainee"
                cellRenderer={(i) => (
                  <Cell>{`${data.records[i].fullName} (#${data.records[i].traineeId})`}</Cell>
                )}
              />
              <Column
                name="Status"
                cellRenderer={(i) => <Cell>{data.records[i].status}</Cell>}
              />
              <Column
                name="Role"
                cellRenderer={(i) => <Cell>{data.records[i].role || "—"}</Cell>}
              />
              <Column
                name="Company"
                cellRenderer={(i) => <Cell>{data.records[i].company || "—"}</Cell>}
              />
              <Column
                name={isAdmin ? "Salary" : "Reason"}
                cellRenderer={(i) => (
                  <Cell>
                    {isAdmin
                      ? data.records[i].salary != null
                        ? `₹${data.records[i].salary!.toLocaleString("en-IN")}`
                        : "—"
                      : data.records[i].reason || "—"}
                  </Cell>
                )}
              />
            </Table2>
          </div>
        ) : (
          <HTMLTable striped interactive style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Trainee</th>
                <th>Status</th>
                <th>Role & Company</th>
                {isAdmin && <th>Salary</th>}
                <th style={{ textAlign: "right" }}>Profile</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((rec) => (
                <tr key={rec.traineeId}>
                  <td>#{rec.traineeId}</td>
                  <td>{rec.fullName}</td>
                  <td>
                    <Tag minimal>{rec.status.replace("_", " ")}</Tag>
                  </td>
                  <td>
                    {rec.status === "unemployed"
                      ? `Unemployed (${rec.reason || "unspecified"})`
                      : `${rec.role || "N/A"} @ ${rec.company || "N/A"}`}
                  </td>
                  {isAdmin && (
                    <td>
                      {rec.salary != null ? `₹${rec.salary.toLocaleString("en-IN")}` : "—"}
                    </td>
                  )}
                  <td style={{ textAlign: "right" }}>
                    <Button
                      small
                      icon="eye-open"
                      text="View profile"
                      onClick={() => navigate(`/trainees/${rec.traineeId}`)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        )}
      </Card>
    </div>
  );
}
