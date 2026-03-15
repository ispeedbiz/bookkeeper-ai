"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Plus,
  Play,
  Loader2,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Trash2,
  Edit3,
  FileText,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────

interface Entity {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  entity_id: string;
  name: string;
  email: string | null;
  position: string | null;
  sin_last4: string | null;
  pay_rate: number;
  pay_type: "hourly" | "salary";
  pay_frequency: "weekly" | "biweekly" | "semi-monthly" | "monthly";
  status: "active" | "inactive" | "terminated";
  created_at: string;
}

interface PayRun {
  id: string;
  date: string;
  pay_period: string;
  gross: number;
  deductions: number;
  net: number;
  status: "completed" | "pending" | "failed";
  employee_count: number;
}

interface EmployeeFormData {
  name: string;
  email: string;
  position: string;
  sin_last4: string;
  pay_rate: string;
  pay_type: "hourly" | "salary";
  pay_frequency: "weekly" | "biweekly" | "semi-monthly" | "monthly";
}

const EMPTY_FORM: EmployeeFormData = {
  name: "",
  email: "",
  position: "",
  sin_last4: "",
  pay_rate: "",
  pay_type: "salary",
  pay_frequency: "biweekly",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

function formatPayFrequency(freq: string): string {
  const labels: Record<string, string> = {
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    "semi-monthly": "Semi-monthly",
    monthly: "Monthly",
  };
  return labels[freq] || freq;
}

function getPayPeriodsPerYear(freq: string): number {
  const periods: Record<string, number> = {
    weekly: 52,
    biweekly: 26,
    "semi-monthly": 24,
    monthly: 12,
  };
  return periods[freq] || 26;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "text-teal-400 bg-teal-400/10";
    case "inactive":
      return "text-gold-400 bg-gold-400/10";
    case "terminated":
      return "text-coral-400 bg-coral-400/10";
    case "completed":
      return "text-teal-400 bg-teal-400/10";
    case "pending":
      return "text-gold-400 bg-gold-400/10";
    case "failed":
      return "text-coral-400 bg-coral-400/10";
    default:
      return "text-slate-400 bg-slate-400/10";
  }
}

// ── localStorage keys ────────────────────────────────────────────────────────

const LS_EMPLOYEES_KEY = "bookkeeper_payroll_employees";
const LS_PAY_RUNS_KEY = "bookkeeper_payroll_runs";

function getStoredEmployees(entityId: string): Employee[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(`${LS_EMPLOYEES_KEY}_${entityId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setStoredEmployees(entityId: string, employees: Employee[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${LS_EMPLOYEES_KEY}_${entityId}`,
    JSON.stringify(employees)
  );
}

function getStoredPayRuns(entityId: string): PayRun[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(`${LS_PAY_RUNS_KEY}_${entityId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setStoredPayRuns(entityId: string, runs: PayRun[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${LS_PAY_RUNS_KEY}_${entityId}`,
    JSON.stringify(runs)
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payRuns, setPayRuns] = useState<PayRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRunPayrollModal, setShowRunPayrollModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  // Load entities and employees
  const fetchData = useCallback(async () => {
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: entityData } = await supabase
        .from("entities")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");

      if (entityData && entityData.length > 0) {
        setEntities(entityData);
        const entityId = entityData[0].id;
        setSelectedEntity(entityId);
        loadEmployeesForEntity(entityId);
      }
    } catch (error) {
      console.error("Error fetching payroll data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  function loadEmployeesForEntity(entityId: string) {
    const stored = getStoredEmployees(entityId);
    setEmployees(stored);
    const runs = getStoredPayRuns(entityId);
    setPayRuns(runs);
  }

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedEntity) {
      loadEmployeesForEntity(selectedEntity);
    }
  }, [selectedEntity]);

  // ── Employee CRUD ──────────────────────────────────────────────────────────

  function openAddModal() {
    setFormData(EMPTY_FORM);
    setEditingEmployee(null);
    setFormError("");
    setShowAddModal(true);
  }

  function openEditModal(emp: Employee) {
    setFormData({
      name: emp.name,
      email: emp.email || "",
      position: emp.position || "",
      sin_last4: emp.sin_last4 || "",
      pay_rate: emp.pay_rate.toString(),
      pay_type: emp.pay_type,
      pay_frequency: emp.pay_frequency,
    });
    setEditingEmployee(emp);
    setFormError("");
    setShowAddModal(true);
  }

  async function handleSaveEmployee() {
    if (!formData.name.trim()) {
      setFormError("Employee name is required");
      return;
    }
    if (!formData.pay_rate || parseFloat(formData.pay_rate) <= 0) {
      setFormError("Valid pay rate is required");
      return;
    }
    if (formData.sin_last4 && !/^\d{4}$/.test(formData.sin_last4)) {
      setFormError("SIN last 4 must be exactly 4 digits");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingEmployee) {
        // Update existing
        const updated = employees.map((emp) =>
          emp.id === editingEmployee.id
            ? {
                ...emp,
                name: formData.name.trim(),
                email: formData.email.trim() || null,
                position: formData.position.trim() || null,
                sin_last4: formData.sin_last4 || null,
                pay_rate: parseFloat(formData.pay_rate),
                pay_type: formData.pay_type,
                pay_frequency: formData.pay_frequency,
              }
            : emp
        );
        setEmployees(updated);
        setStoredEmployees(selectedEntity, updated);
      } else {
        // Create new
        const newEmployee: Employee = {
          id: crypto.randomUUID(),
          entity_id: selectedEntity,
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          position: formData.position.trim() || null,
          sin_last4: formData.sin_last4 || null,
          pay_rate: parseFloat(formData.pay_rate),
          pay_type: formData.pay_type,
          pay_frequency: formData.pay_frequency,
          status: "active",
          created_at: new Date().toISOString(),
        };
        const updated = [newEmployee, ...employees];
        setEmployees(updated);
        setStoredEmployees(selectedEntity, updated);
      }

      setShowAddModal(false);
      setFormData(EMPTY_FORM);
      setEditingEmployee(null);
    } catch (error) {
      console.error("Error saving employee:", error);
      setFormError("Failed to save employee");
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteEmployee(empId: string) {
    const updated = employees.filter((e) => e.id !== empId);
    setEmployees(updated);
    setStoredEmployees(selectedEntity, updated);
  }

  function toggleEmployeeStatus(emp: Employee) {
    const newStatus = emp.status === "active" ? "inactive" : "active";
    const updated = employees.map((e) =>
      e.id === emp.id ? { ...e, status: newStatus as Employee["status"] } : e
    );
    setEmployees(updated);
    setStoredEmployees(selectedEntity, updated);
  }

  // ── Run Payroll ────────────────────────────────────────────────────────────

  const activeEmployees = employees.filter((e) => e.status === "active");

  function calculatePayPeriodAmount(emp: Employee): number {
    if (emp.pay_type === "salary") {
      return emp.pay_rate / getPayPeriodsPerYear(emp.pay_frequency);
    }
    // Hourly: assume 40hrs/week for estimates
    const weeklyPay = emp.pay_rate * 40;
    switch (emp.pay_frequency) {
      case "weekly":
        return weeklyPay;
      case "biweekly":
        return weeklyPay * 2;
      case "semi-monthly":
        return (weeklyPay * 52) / 24;
      case "monthly":
        return (weeklyPay * 52) / 12;
      default:
        return weeklyPay * 2;
    }
  }

  const totalPayrollAmount = activeEmployees.reduce(
    (sum, emp) => sum + calculatePayPeriodAmount(emp),
    0
  );

  function getNextPayPeriodLabel(): string {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 14);
    return `${now.toLocaleDateString("en-CA")} to ${endDate.toLocaleDateString("en-CA")}`;
  }

  function handleRunPayroll() {
    if (activeEmployees.length === 0) return;

    const estimatedDeductions = totalPayrollAmount * 0.28; // ~28% estimate
    const netAmount = totalPayrollAmount - estimatedDeductions;

    const newRun: PayRun = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      pay_period: getNextPayPeriodLabel(),
      gross: Math.round(totalPayrollAmount * 100) / 100,
      deductions: Math.round(estimatedDeductions * 100) / 100,
      net: Math.round(netAmount * 100) / 100,
      status: "completed",
      employee_count: activeEmployees.length,
    };

    const updatedRuns = [newRun, ...payRuns];
    setPayRuns(updatedRuns);
    setStoredPayRuns(selectedEntity, updatedRuns);
    setShowRunPayrollModal(false);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  const statsCards = [
    {
      label: "Total Employees",
      value: employees.length,
      icon: Users,
      color: "text-teal-400",
      bg: "bg-teal-400/10",
    },
    {
      label: "Active",
      value: activeEmployees.length,
      icon: CheckCircle,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
    },
    {
      label: "Est. Payroll / Period",
      value: formatCurrency(totalPayrollAmount),
      icon: DollarSign,
      color: "text-gold-400",
      bg: "bg-gold-400/10",
    },
    {
      label: "Pay Runs",
      value: payRuns.length,
      icon: Clock,
      color: "text-teal-400",
      bg: "bg-teal-400/10",
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen bg-navy-950">
        <Sidebar active="Payroll" />
        <main className="ml-64 flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <p className="text-slate-400">Loading payroll...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar active="Payroll" />

      <main className="ml-0 flex-1 p-4 pt-16 lg:ml-64 lg:p-8 lg:pt-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Payroll</h1>
            <p className="mt-1 text-slate-400">
              Manage employees and run payroll for your entities.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 rounded-xl bg-teal-500/10 px-4 py-2.5 text-sm font-medium text-teal-400 transition-all hover:bg-teal-500/20"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
            <button
              onClick={() => setShowRunPayrollModal(true)}
              disabled={activeEmployees.length === 0}
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-medium text-navy-950 transition-all hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Run Payroll
            </button>
          </div>
        </div>

        {/* Entity Selector (if multiple) */}
        {entities.length > 1 && (
          <div className="mb-6">
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-teal-400/50"
            >
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card) => (
            <div key={card.label} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{card.label}</span>
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-white">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Employee List */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Employees</h2>
          {employees.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">
                No employees yet. Add your first employee to get started.
              </p>
              <button
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-500/10 px-4 py-2.5 text-sm font-medium text-teal-400 transition-all hover:bg-teal-500/20"
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="glass-card rounded-xl p-5 transition-all hover:border-navy-600/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-white">
                        {emp.name}
                      </h3>
                      {emp.position && (
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {emp.position}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(emp.status)}`}
                    >
                      {emp.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Pay Rate</span>
                      <span className="font-medium text-white">
                        {formatCurrency(emp.pay_rate)}
                        {emp.pay_type === "hourly" ? "/hr" : "/yr"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Frequency</span>
                      <span className="text-slate-300">
                        {formatPayFrequency(emp.pay_frequency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Per Period</span>
                      <span className="font-medium text-teal-400">
                        {formatCurrency(calculatePayPeriodAmount(emp))}
                      </span>
                    </div>
                    {emp.email && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Email</span>
                        <span className="truncate pl-2 text-slate-300">
                          {emp.email}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-navy-700/30 pt-3">
                    <button
                      onClick={() => openEditModal(emp)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition-all hover:bg-navy-800 hover:text-white"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleEmployeeStatus(emp)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition-all hover:bg-navy-800 hover:text-white"
                    >
                      {emp.status === "active" ? (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id)}
                      className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition-all hover:bg-coral-400/10 hover:text-coral-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pay History */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Pay History
          </h2>
          {payRuns.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">
                No payroll runs yet. Run your first payroll to see history here.
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-navy-700/30">
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                        Date
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                        Pay Period
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                        Employees
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                        Gross
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                        Deductions
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                        Net
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-700/20">
                    {payRuns.map((run) => (
                      <tr
                        key={run.id}
                        className="transition-colors hover:bg-navy-800/30"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-white">
                          {new Date(run.date).toLocaleDateString("en-CA")}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                          {run.pay_period}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                          {run.employee_count}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-white">
                          {formatCurrency(run.gross)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-coral-400">
                          -{formatCurrency(run.deductions)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-teal-400">
                          {formatCurrency(run.net)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(run.status)}`}
                          >
                            {run.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Add/Edit Employee Modal ─────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-navy-700/50 bg-navy-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editingEmployee ? "Edit Employee" : "Add Employee"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEmployee(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-navy-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-lg bg-coral-400/10 px-4 py-2.5 text-sm text-coral-400">
                {formError}
              </div>
            )}

            <div className="mt-5 space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Smith"
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400/50"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400/50"
                />
              </div>

              {/* Position */}
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  placeholder="Software Developer"
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400/50"
                />
              </div>

              {/* SIN last 4 */}
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">
                  SIN (Last 4 digits)
                </label>
                <input
                  type="text"
                  value={formData.sin_last4}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setFormData({ ...formData, sin_last4: val });
                  }}
                  placeholder="1234"
                  maxLength={4}
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400/50"
                />
              </div>

              {/* Pay Rate & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">
                    Pay Rate *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pay_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, pay_rate: e.target.value })
                    }
                    placeholder="65000"
                    className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">
                    Pay Type
                  </label>
                  <select
                    value={formData.pay_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pay_type: e.target.value as "hourly" | "salary",
                      })
                    }
                    className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-white outline-none focus:border-teal-400/50"
                  >
                    <option value="salary">Salary (Annual)</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
              </div>

              {/* Pay Frequency */}
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">
                  Pay Frequency
                </label>
                <select
                  value={formData.pay_frequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pay_frequency: e.target.value as EmployeeFormData["pay_frequency"],
                    })
                  }
                  className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-sm text-white outline-none focus:border-teal-400/50"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="semi-monthly">Semi-monthly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEmployee(null);
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition-all hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmployee}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-medium text-navy-950 transition-all hover:bg-teal-400 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingEmployee ? "Save Changes" : "Add Employee"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Run Payroll Confirmation Modal ──────────────────────────────────── */}
      {showRunPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-navy-700/50 bg-navy-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Run Payroll
              </h3>
              <button
                onClick={() => setShowRunPayrollModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-navy-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-navy-700/30 bg-navy-800/50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Pay Period</span>
                  <span className="font-medium text-white">
                    {getNextPayPeriodLabel()}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Active Employees</span>
                  <span className="font-medium text-white">
                    {activeEmployees.length}
                  </span>
                </div>
                <div className="mt-3 border-t border-navy-700/30 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      Est. Gross Total
                    </span>
                    <span className="text-lg font-bold text-teal-400">
                      {formatCurrency(totalPayrollAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-gold-400/10 px-4 py-2.5 text-sm text-gold-400">
                This will create a payroll record. Actual disbursements require
                bank integration.
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRunPayrollModal(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition-all hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRunPayroll}
                className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-medium text-navy-950 transition-all hover:bg-teal-400"
              >
                <Play className="h-4 w-4" />
                Confirm & Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
