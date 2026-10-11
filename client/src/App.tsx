
import {
  useState,
  useEffect,
  type FormEvent,
  type ReactNode
} from "react";
import { api } from "./api";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate
} from "react-router-dom";
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  ChartNoAxesCombined,
  LogOut,
  ArrowRight,
  LoaderCircle,
  RefreshCw,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import { AuthProvider, useAuth } from "./AuthContext";
import "./index.css";

interface DashboardData {
  totalSpent: number;
  totalExpenses: number;
  currentMonthSpent: number;
  currentMonthBudget: number;
  currentMonthRemaining: number;
}

function formatCurrency(value: number | undefined): string {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (isRegister) {
        await register(name, email, password);
        navigate("/login", {
          replace: true,
          state: { message: "Account created. Please sign in." }
        });
      } else {
        await login(email, password);
        navigate("/", { replace: true });
      }
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as {
              response?: { data?: { message?: string } };
            }).response?.data?.message
          : undefined;

      setError(message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand">
          <span className="brand-mark">₹</span>
          <span>PocketPilot</span>
        </div>

        <div className="visual-copy">
          <span className="eyebrow">YOUR MONEY, IN FOCUS</span>
          <h1>Make every rupee count.</h1>
          <p>
            Understand your spending, plan your budgets, and build
            better financial habits — one day at a time.
          </p>

          <div className="visual-stats">
            <div>
              <strong>Track</strong>
              <span>Every expense</span>
            </div>
            <div>
              <strong>Plan</strong>
              <span>Every budget</span>
            </div>
            <div>
              <strong>Grow</strong>
              <span>Every month</span>
            </div>
          </div>
        </div>

        <span className="visual-footer">
          Simple finances. Clear decisions.
        </span>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <div className="mobile-brand brand">
            <span className="brand-mark">₹</span>
            <span>PocketPilot</span>
          </div>

          <span className="eyebrow">
            {isRegister ? "GET STARTED" : "WELCOME BACK"}
          </span>
          <h2>
            {isRegister ? "Create your account" : "Sign in to PocketPilot"}
          </h2>
          <p className="muted">
            {isRegister
              ? "Start managing your expenses with confidence."
              : "Your financial overview is just a sign-in away."}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <label>
                Full name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  isRegister ? "At least 8 characters" : "Your password"
                }
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={isRegister ? 8 : undefined}
                maxLength={72}
                required
              />
            </label>

            {error && <div className="error-message">{error}</div>}

            <button className="primary-button" disabled={busy}>
              {busy ? (
                <LoaderCircle size={18} className="spin" />
              ) : (
                <>
                  {isRegister ? "Create account" : "Sign in"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "New to PocketPilot?"}{" "}
            <NavLink to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Sign in" : "Create account"}
            </NavLink>
          </p>
        </div>
      </section>
    </main>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Checking your session…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function Dashboard() {
  const { user, logout } = useAuth();

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/expenses", label: "Expenses", icon: ReceiptText },
    { to: "/budgets", label: "Budgets", icon: Wallet },
    { to: "/reports", label: "Reports", icon: ChartNoAxesCombined }
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">₹</span>
          <span>PocketPilot</span>
        </div>

        <p className="nav-heading">WORKSPACE</p>

        <nav className="side-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="avatar">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="user-info">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>

          <button
            className="icon-button"
            title="Sign out"
            onClick={() => void logout()}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">PERSONAL FINANCE</span>
            <h1>Good to see you, {user?.name?.split(" ")[0]}.</h1>
          </div>

          <span className="today-label">
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            })}
          </span>
        </header>

        <Routes>
          <Route path="/" element={<DashboardHome />} />
         <Route
            path="/expenses"
            element={<ExpensesPage />}
          />
          <Route
            path="/budgets"
            element={< BudgetsPage />}
          />
          <Route
            path="/reports"
            element={
              <PlaceholderPage
                title="Reports"
                description="Review spending summaries and export your expenses."
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function DashboardHome() {
  const [dashboardData] = useState<DashboardData>({
    totalSpent: 0,
    totalExpenses: 0,
    currentMonthSpent: 0,
    currentMonthBudget: 0,
    currentMonthRemaining: 0,
  });

  return (
    <section className="page-content">
      {/* Welcome Section */}
      <div className="welcome-card">
        <div>
          <span className="eyebrow">YOUR FINANCIAL OVERVIEW</span>
          <h1>Welcome to PocketPilot</h1>
          <p>
            Track your expenses, manage your budget, and stay in control
            of your finances.
          </p>
        </div>
      </div>

      {/* Dashboard Heading */}
      <div className="section-heading">
        <div>
          <h2>Dashboard</h2>
          <p>Here is your financial summary.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stat-grid">
        <StatCard
          title="Total spent"
          value={formatCurrency(dashboardData.totalSpent)}
          note="Across all expenses"
        />

        <StatCard
          title="This month"
          value={formatCurrency(dashboardData.currentMonthSpent)}
          note="Spending this month"
        />

        <StatCard
          title="Monthly budget"
          value={formatCurrency(dashboardData.currentMonthBudget)}
          note="Your planned limit"
        />

        <StatCard
          title="Remaining"
          value={formatCurrency(dashboardData.currentMonthRemaining)}
          note="Budget left this month"
        />
      </div>

      {/* Expense Summary */}
      <div className="empty-panel">
        <div className="empty-panel-icon">
          <span>₹</span>
        </div>

        <h3>Your financial summary</h3>

        <p>
          Your dashboard summary is temporarily showing default values.
          Continue using the Expenses section to manage your transactions.
        </p>
      </div>
    </section>
  );
}

interface Expense {
  id: number;
  title: string;
  amount: number | string;
  category: string;
  expense_date: string;
  notes: string | null;
}

interface ExpenseFormData {
  title: string;
  amount: string;
  category: string;
  expense_date: string;
  notes: string;
}

interface ExpensePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const emptyExpenseForm: ExpenseFormData = {
  title: "",
  amount: "",
  category: "",
  expense_date: new Date().toLocaleDateString("en-CA"),
  notes: "",
};

function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<ExpensePagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [form, setForm] = useState<ExpenseFormData>(emptyExpenseForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function fetchExpenses(page = pagination.page) {
    try {
      setLoading(true);
      setError("");

      const params: Record<string, string | number> = {
        page,
        limit: pagination.limit,
      };

      if (categoryFilter.trim()) {
        params.category = categoryFilter.trim();
      }

      if (from) params.from = from;
      if (to) params.to = to;

      const response = await api.get("/expenses", { params });

      setExpenses(response.data.expenses ?? []);
      setPagination(
        response.data.pagination ?? {
          page,
          limit: 10,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err: any) {
      console.error("Fetch expenses failed:", err);
      setError(
        err?.response?.data?.message ?? "Unable to load expenses."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchExpenses(1);
  }, [categoryFilter, from, to]);

  function openCreateForm() {
    setEditingId(null);
    setForm({
      ...emptyExpenseForm,
      expense_date: new Date().toLocaleDateString("en-CA"),
    });
    setMessage("");
    setError("");
    setFormOpen(true);
  }

  function openEditForm(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      expense_date: String(expense.expense_date).slice(0, 10),
      notes: expense.notes ?? "",
    });
    setMessage("");
    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyExpenseForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category.trim(),
        expense_date: form.expense_date,
        notes: form.notes.trim() || null,
      };

      if (
        !payload.title ||
        !payload.category ||
        !payload.expense_date ||
        !Number.isFinite(payload.amount) ||
        payload.amount <= 0
      ) {
        setError("Please enter a valid title, amount, category, and date.");
        return;
      }

      if (editingId !== null) {
        await api.put(`/expenses/${editingId}`, payload);
        setMessage("Expense updated successfully.");
      } else {
        await api.post("/expenses", payload);
        setMessage("Expense added successfully.");
      }

      closeForm();
      await fetchExpenses(1);
    } catch (err: any) {
      console.error("Save expense failed:", err);
      setError(
        err?.response?.data?.message ?? "Unable to save the expense."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense: Expense) {
    const confirmed = window.confirm(
      `Delete "${expense.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/expenses/${expense.id}`);

      setMessage("Expense deleted successfully.");

      const nextPage =
        expenses.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await fetchExpenses(nextPage);
    } catch (err: any) {
      console.error("Delete expense failed:", err);
      setError(
        err?.response?.data?.message ?? "Unable to delete the expense."
      );
    }
  }

  const filteredExpenses = expenses.filter((expense) => {
    const query = search.trim().toLowerCase();

    return (
      !query ||
      expense.title.toLowerCase().includes(query) ||
      expense.category.toLowerCase().includes(query) ||
      (expense.notes ?? "").toLowerCase().includes(query)
    );
  });

  function formatExpenseDate(value: string) {
    const date = String(value).slice(0, 10);
    const [year, month, day] = date.split("-").map(Number);

    if (!year || !month || !day) return date;

    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <section className="page-content">
      <div className="section-heading">
        <div>
          <span className="eyebrow">TRACK YOUR SPENDING</span>
          <h2>Expenses</h2>
          <p className="muted">
            Add, review, and manage your daily expenses.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          <Plus size={18} />
          Add expense
        </button>
      </div>

      <div className="stat-grid">
        <StatCard
          title="Recorded expenses"
          value={String(pagination.total)}
          note="Matching your selected filters"
        />
        <StatCard
          title="Current page"
          value={`${pagination.page} / ${Math.max(
            pagination.totalPages,
            1
          )}`}
          note={`${pagination.limit} expenses per page`}
        />
      </div>

      {message && (
        <div className="success-message" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void fetchExpenses()}
            disabled={loading}
          >
            Try again
          </button>
        </div>
      )}

      <div className="expense-toolbar">
        <div className="expense-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search title, category, or notes..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search expenses"
          />
        </div>

        <input
          type="text"
          placeholder="Filter by category"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="Filter by category"
        />

        <label className="expense-date-filter">
          <span>From</span>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>

        <label className="expense-date-filter">
          <span>To</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setSearch("");
            setCategoryFilter("");
            setFrom("");
            setTo("");
          }}
        >
          <X size={16} />
          Clear
        </button>
      </div>

      {formOpen && (
        <div className="expense-form-panel">
          <div className="section-heading">
            <div>
              <h3>{editingId !== null ? "Edit expense" : "Add expense"}</h3>
              <p className="muted">
                Enter the details below.
              </p>
            </div>

            <button
              type="button"
              className="icon-button"
              onClick={closeForm}
              aria-label="Close expense form"
            >
              <X size={18} />
            </button>
          </div>

          <form className="expense-form" onSubmit={handleSubmit}>
            <label>
              Title
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                maxLength={150}
                required
                placeholder="e.g. Grocery shopping"
              />
            </label>

            <label>
              Amount (₹)
              <input
                type="number"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
                min="0.01"
                max="9999999999.99"
                step="0.01"
                required
                placeholder="0.00"
              />
            </label>

            <label>
              Category
              <input
                type="text"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
                maxLength={80}
                required
                placeholder="e.g. Food, Transport, Bills"
              />
            </label>

            <label>
              Date
              <input
                type="date"
                value={form.expense_date}
                onChange={(event) =>
                  setForm({ ...form, expense_date: event.target.value })
                }
                required
              />
            </label>

            <label className="expense-notes-field">
              Notes (optional)
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                maxLength={500}
                rows={3}
                placeholder="Add a note..."
              />
            </label>

            <div className="expense-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save changes"
                    : "Add expense"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="expense-table-panel">
        <div className="section-heading">
          <div>
            <h3>All expenses</h3>
            <p className="muted">
              {pagination.total} recorded expense(s)
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-panel">
            <p>Loading expenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="empty-panel">
            <div className="empty-icon">
              <ReceiptText size={25} />
            </div>
            <h3>
              {search || categoryFilter || from || to
                ? "No matching expenses"
                : "No expenses yet"}
            </h3>
            <p>
              {search || categoryFilter || from || to
                ? "Try changing your search or filters."
                : "Add your first expense to start tracking your spending."}
            </p>
          </div>
        ) : (
          <>
            <div className="expense-table-scroll">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>Expense</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        <strong>{expense.title}</strong>
                        {expense.notes && (
                          <p className="muted expense-note">
                            {expense.notes}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className="expense-category">
                          {expense.category}
                        </span>
                      </td>
                      <td>{formatExpenseDate(expense.expense_date)}</td>
                      <td className="expense-amount">
                        {formatCurrency(Number(expense.amount))}
                      </td>
                      <td>
                        <div className="expense-row-actions">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => openEditForm(expense)}
                            aria-label={`Edit ${expense.title}`}
                            title="Edit expense"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            className="icon-button danger-button"
                            onClick={() => void handleDelete(expense)}
                            aria-label={`Delete ${expense.title}`}
                            title="Delete expense"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="expense-pagination">
              <span className="muted">
                Page {pagination.page} of{" "}
                {Math.max(pagination.totalPages, 1)}
              </span>

              <div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void fetchExpenses(pagination.page - 1)}
                  disabled={loading || pagination.page <= 1}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void fetchExpenses(pagination.page + 1)}
                  disabled={
                    loading ||
                    pagination.page >= pagination.totalPages
                  }
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}


type Budget = {
  id: number;
  category: string;
  budget_amount: number;
  month: number;
  year: number;
  spent: number;
  remaining: number;
  budget_status: "within_budget" | "reached" | "exceeded";
};

function BudgetsPage() {
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [yearText, monthText] = selectedMonth.split("-");
  const selectedYear = Number(yearText);
  const selectedMonthNumber = Number(monthText);

  async function loadBudgets() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/budgets", {
        params: {
          month: selectedMonthNumber,
          year: selectedYear,
        },
      });

      setBudgets(response.data.budgets ?? []);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Unable to load budgets."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBudgets();
  }, [selectedMonth]);

  function resetForm() {
    setCategory("");
    setAmount("");
    setEditingId(null);
  }

  function editBudget(budget: Budget) {
    setCategory(budget.category);
    setAmount(String(budget.budget_amount));
    setEditingId(budget.id);
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedCategory = category.trim();
    const numericAmount = Number(amount);

    if (!trimmedCategory || trimmedCategory.length > 80) {
      setError("Category must contain between 1 and 80 characters.");
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      numericAmount > 9999999999.99 ||
      Math.round(numericAmount * 100) / 100 !== numericAmount
    ) {
      setError("Enter a valid positive amount with up to 2 decimal places.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/budgets", {
        category: trimmedCategory,
        amount: numericAmount,
        month: selectedMonthNumber,
        year: selectedYear,
      });

      setSuccess(
        editingId !== null
          ? "Budget updated successfully."
          : "Budget saved successfully."
      );

      resetForm();
      await loadBudgets();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Unable to save the budget."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(budget: Budget) {
    const confirmed = window.confirm(
      `Delete the ${budget.category} budget for ${selectedMonth}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/budgets/${budget.id}`);

      if (editingId === budget.id) {
        resetForm();
      }

      setSuccess(`${budget.category} budget deleted successfully.`);
      await loadBudgets();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Unable to delete the budget."
      );
    }
  }

  const totalBudget = budgets.reduce(
    (total, budget) => total + budget.budget_amount,
    0
  );

  const totalSpent = budgets.reduce(
    (total, budget) => total + budget.spent,
    0
  );

  const totalRemaining = totalBudget - totalSpent;

  const exceededCount = budgets.filter(
    (budget) => budget.budget_status === "exceeded"
  ).length;

  const reachedCount = budgets.filter(
    (budget) => budget.budget_status === "reached"
  ).length;

  const monthLabel = new Date(
    selectedYear,
    selectedMonthNumber - 1,
    1
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  function getProgress(budget: Budget) {
    if (budget.budget_amount <= 0) return 0;

    return Math.min(
      (budget.spent / budget.budget_amount) * 100,
      100
    );
  }

  function getStatus(budget: Budget) {
    if (budget.budget_status === "exceeded") {
      return { label: "Exceeded", className: "budget-status-exceeded" };
    }

    if (budget.budget_status === "reached") {
      return { label: "Limit reached", className: "budget-status-reached" };
    }

    return { label: "Within budget", className: "budget-status-safe" };
  }

  return (
    <div className="budgets-page">
      <div className="page-heading budget-heading">
        <div>
          <h1>Budgets</h1>
          <p>Set spending limits and keep your finances on track.</p>
        </div>

        <div className="budget-month-picker">
          <CalendarDays size={18} />
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => {
              setSelectedMonth(event.target.value);
              setSuccess("");
              setError("");
              resetForm();
            }}
            aria-label="Select budget month"
          />
        </div>
      </div>

      {error && (
        <div className="budget-message budget-message-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="budget-message budget-message-success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess("")} aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="budget-summary-grid">
        <div className="budget-summary-card">
          <div className="budget-summary-icon budget-icon-purple">
            <Target size={21} />
          </div>
          <p>Total budget</p>
          <h2>{formatCurrency(totalBudget)}</h2>
          <span>{budgets.length} categories</span>
        </div>

        <div className="budget-summary-card">
          <div className="budget-summary-icon budget-icon-orange">
            <TrendingUp size={21} />
          </div>
          <p>Total spent</p>
          <h2>{formatCurrency(totalSpent)}</h2>
          <span>For {monthLabel}</span>
        </div>

        <div className="budget-summary-card">
          <div className="budget-summary-icon budget-icon-green">
            <Wallet size={21} />
          </div>
          <p>Remaining budget</p>
          <h2 className={totalRemaining < 0 ? "budget-negative" : ""}>
            {formatCurrency(totalRemaining)}
          </h2>
          <span>
            {totalRemaining < 0 ? "Over your combined limits" : "Available to spend"}
          </span>
        </div>
      </div>

      <div className="budget-content-grid">
        <section className="budget-panel budget-form-panel">
          <div className="budget-panel-heading">
            <div>
              <h2>{editingId !== null ? "Edit budget" : "Set a budget"}</h2>
              <p>Choose a category and monthly spending limit.</p>
            </div>
            <div className="budget-heading-icon">
              <Plus size={20} />
            </div>
          </div>

          <form onSubmit={handleSave} className="budget-form">
            <label htmlFor="budget-category">Category</label>
            <input
              id="budget-category"
              type="text"
              placeholder="e.g. Food, Travel, Shopping"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              maxLength={80}
              required
            />

            <label htmlFor="budget-amount">Monthly limit (₹)</label>
            <input
              id="budget-amount"
              type="number"
              min="0.01"
              max="9999999999.99"
              step="0.01"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />

            <div className="budget-selected-month">
              <CalendarDays size={16} />
              Budget period: <strong>{monthLabel}</strong>
            </div>

            <button
              type="submit"
              className="budget-primary-button"
              disabled={saving}
            >
              {saving ? "Saving..." : editingId !== null ? "Update budget" : "Save budget"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="budget-cancel-button"
                onClick={resetForm}
              >
                Cancel editing
              </button>
            )}
          </form>

          <p className="budget-form-tip">
            Tip: Use the same category name as your expenses to track spending accurately.
          </p>
        </section>

        <section className="budget-panel budget-list-panel">
          <div className="budget-panel-heading">
            <div>
              <h2>Category budgets</h2>
              <p>Your spending breakdown for {monthLabel}.</p>
            </div>
            <span className="budget-count">{budgets.length}</span>
          </div>

          {loading ? (
            <div className="budget-empty-state">
              <div className="budget-loading-spinner" />
              <p>Loading budgets...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="budget-empty-state">
              <div className="budget-empty-icon">
                <Wallet size={30} />
              </div>
              <h3>No budgets yet</h3>
              <p>
                Set your first category budget to start tracking your monthly spending.
              </p>
            </div>
          ) : (
            <div className="budget-category-list">
              {budgets.map((budget) => {
                const status = getStatus(budget);
                const progress = getProgress(budget);

                return (
                  <article className="budget-category-item" key={budget.id}>
                    <div className="budget-category-top">
                      <div className="budget-category-name">
                        <div className="budget-category-avatar">
                          {budget.category.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3>{budget.category}</h3>
                          <span className={`budget-status ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>

                      <div className="budget-category-actions">
                        <button
                          type="button"
                          title="Edit budget"
                          aria-label={`Edit ${budget.category} budget`}
                          onClick={() => editBudget(budget)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title="Delete budget"
                          aria-label={`Delete ${budget.category} budget`}
                          onClick={() => handleDelete(budget)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="budget-amount-row">
                      <div>
                        <span>Spent</span>
                        <strong>{formatCurrency(budget.spent)}</strong>
                      </div>
                      <div className="budget-amount-right">
                        <span>Budget</span>
                        <strong>{formatCurrency(budget.budget_amount)}</strong>
                      </div>
                    </div>

                    <div className="budget-progress-track">
                      <div
                        className={`budget-progress-fill ${
                          budget.budget_status === "exceeded"
                            ? "budget-progress-danger"
                            : budget.budget_status === "reached"
                            ? "budget-progress-warning"
                            : "budget-progress-normal"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="budget-bottom-row">
                      <span>{Math.round((budget.spent / budget.budget_amount) * 100)}% used</span>
                      <span
                        className={
                          budget.remaining < 0
                            ? "budget-negative"
                            : "budget-positive"
                        }
                      >
                        {budget.remaining < 0
                          ? `${formatCurrency(Math.abs(budget.remaining))} over budget`
                          : `${formatCurrency(budget.remaining)} left`}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && budgets.length > 0 && (
            <div className="budget-insight">
              {exceededCount > 0 ? (
                <>
                  <AlertTriangle size={19} />
                  <p>
                    <strong>{exceededCount} {exceededCount === 1 ? "category has" : "categories have"} exceeded</strong>{" "}
                    the budget. Consider reducing spending in those categories.
                  </p>
                </>
              ) : reachedCount > 0 ? (
                <>
                  <AlertTriangle size={19} />
                  <p>
                    <strong>{reachedCount} {reachedCount === 1 ? "category has" : "categories have"} reached</strong>{" "}
                    its spending limit.
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 size={19} />
                  <p>
                    <strong>Looking good!</strong> Your spending is within all category budgets.
                  </p>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  note
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <article className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function PlaceholderPage({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="page-content">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
        </div>
      </div>

      <div className="empty-panel">
        <h3>{title} workspace</h3>
        <p>We'll connect this page to your backend APIs next.</p>
      </div>
    </section>
  );
}

function AppRoutes() {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading PocketPilot…</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? <Navigate to="/" replace /> : <AuthPage mode="login" />
        }
      />

      <Route
        path="/register"
        element={
          user ? <Navigate to="/" replace /> : <AuthPage mode="register" />
        }
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
