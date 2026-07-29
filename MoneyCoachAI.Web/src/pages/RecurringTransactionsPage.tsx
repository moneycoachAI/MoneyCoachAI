import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import recurringTransactionService from "../services/recurringTransactionService";

import type {
  CreateRecurringTransactionRequest,
  RecurringTransaction,
} from "../types/recurringTransactionTypes";

type Notice = {
  type: "success" | "error";
  message: string;
};

type StatusFilter =
  | "All"
  | "Scheduled"
  | "Upcoming"
  | "Due Today"
  | "Overdue"
  | "Paused";

const CATEGORY_OPTIONS = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Rent",
  "Bills",
  "Utilities",
  "Food",
  "Travel",
  "Shopping",
  "Insurance",
  "Subscription",
  "Education",
  "Healthcare",
  "Loan EMI",
  "Maintenance",
  "Other",
];

const FREQUENCY_OPTIONS = [
  "Daily",
  "Weekly",
  "Biweekly",
  "Monthly",
  "Quarterly",
  "HalfYearly",
  "Yearly",
];

const EMPTY_EDIT_FORM: CreateRecurringTransactionRequest = {
  title: "",
  amount: 0,
  category: "",
  otherDescription: "",
  description: "",
  type: "Income",
  frequency: "Monthly",
  startDate: "",
  endDate: "",
};

function RecurringTransactionsPage() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [otherDescription, setOtherDescription] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"Income" | "Expense">("Income");
  const [frequency, setFrequency] = useState("Monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<CreateRecurringTransactionRequest>(EMPTY_EDIT_FORM);
  const [savingEdit, setSavingEdit] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [formNotice, setFormNotice] = useState<Notice | null>(null);
  const [listNotice, setListNotice] = useState<Notice | null>(null);

  const loadTransactions = async () => {
    try {
      setLoading(true);

      const data =
        await recurringTransactionService.getRecurringTransactions();

      setTransactions(data);
    } catch (error) {
      console.error(
        "Failed to load recurring transactions:",
        error
      );

      setListNotice({
        type: "error",
        message: "Failed to load recurring reminders.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTransactions();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const activeCount = useMemo(
    () => transactions.filter((item) => item.isActive).length,
    [transactions]
  );

  const dueTodayCount = useMemo(
    () =>
      transactions.filter(
        (item) => item.isActive && item.reminderStatus === "Due Today"
      ).length,
    [transactions]
  );

  const upcomingCount = useMemo(
    () =>
      transactions.filter(
        (item) => item.isActive && item.reminderStatus === "Upcoming"
      ).length,
    [transactions]
  );

  const overdueCount = useMemo(
    () =>
      transactions.filter(
        (item) => item.isActive && item.reminderStatus === "Overdue"
      ).length,
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...transactions]
      .filter((item) => {
        const matchesSearch =
          !normalizedSearch ||
          item.title.toLowerCase().includes(normalizedSearch) ||
          item.category.toLowerCase().includes(normalizedSearch) ||
          (item.otherDescription ?? "")
            .toLowerCase()
            .includes(normalizedSearch) ||
          (item.description ?? "").toLowerCase().includes(normalizedSearch) ||
          item.reminderMessage.toLowerCase().includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "All" ||
          (statusFilter === "Paused"
            ? !item.isActive
            : item.isActive && item.reminderStatus === statusFilter);

        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(a.nextOccurrenceDate).getTime() -
          new Date(b.nextOccurrenceDate).getTime()
      );
  }, [transactions, search, statusFilter]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    const numericAmount = Number(amount);
    const validationMessage = validateRequest({
      title,
      amount: numericAmount,
      category,
      otherDescription,
      description,
      type,
      frequency,
      startDate,
      endDate,
    });

    if (validationMessage) {
      setFormNotice({ type: "error", message: validationMessage });
      return;
    }

    try {
      setCreating(true);
      setFormNotice(null);

      await recurringTransactionService.createRecurringTransaction({
        title: title.trim(),
        amount: numericAmount,
        category: category.trim(),
        otherDescription:
          category === "Other" ? otherDescription.trim() : undefined,
        description: description.trim() || undefined,
        type,
        frequency,
        startDate,
        endDate: endDate || undefined,
      });

      resetCreateForm();
      await loadTransactions();

      setFormNotice({
        type: "success",
        message: "Recurring reminder added successfully.",
      });
    } catch (error) {
      console.error("Failed to create recurring reminder:", error);
      setFormNotice({
        type: "error",
        message: "Failed to add recurring reminder.",
      });
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setTitle("");
    setAmount("");
    setCategory("");
    setOtherDescription("");
    setDescription("");
    setType("Income");
    setFrequency("Monthly");
    setStartDate("");
    setEndDate("");
  };

  const startEditing = (transaction: RecurringTransaction) => {
    setEditingId(transaction.id);
    setEditingTransaction({
      title: transaction.title,
      amount: transaction.amount,
      category: transaction.category,
      otherDescription: transaction.otherDescription ?? "",
      description: transaction.description ?? "",
      type: transaction.type,
      frequency: transaction.frequency,
      startDate: toDateInputValue(transaction.startDate),
      endDate: transaction.endDate
        ? toDateInputValue(transaction.endDate)
        : "",
    });
    setOpenMenuId(null);
    setListNotice(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTransaction(EMPTY_EDIT_FORM);
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    const validationMessage = validateRequest(editingTransaction);
    if (validationMessage) {
      setListNotice({ type: "error", message: validationMessage });
      return;
    }

    try {
      setSavingEdit(true);
      setListNotice(null);

      await recurringTransactionService.updateRecurringTransaction(editingId, {
        ...editingTransaction,
        title: editingTransaction.title.trim(),
        category: editingTransaction.category.trim(),
        otherDescription:
          editingTransaction.category === "Other"
            ? editingTransaction.otherDescription?.trim()
            : undefined,
        description: editingTransaction.description?.trim() || undefined,
        endDate: editingTransaction.endDate || undefined,
      });

      await loadTransactions();
      cancelEditing();

      setListNotice({
        type: "success",
        message: "Recurring reminder updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update recurring reminder:", error);
      setListNotice({
        type: "error",
        message: "Failed to update recurring reminder.",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (transaction: RecurringTransaction) => {
    const confirmed = window.confirm(
      `Delete "${transaction.title}" from recurring reminders?`
    );
    if (!confirmed) return;

    try {
      setDeletingId(transaction.id);
      setOpenMenuId(null);
      setListNotice(null);

      await recurringTransactionService.deleteRecurringTransaction(
        transaction.id
      );
      await loadTransactions();

      if (editingId === transaction.id) cancelEditing();

      setListNotice({
        type: "success",
        message: "Recurring reminder deleted.",
      });
    } catch (error) {
      console.error("Failed to delete recurring reminder:", error);
      setListNotice({
        type: "error",
        message: "Failed to delete recurring reminder.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handlePauseResume = async (transaction: RecurringTransaction) => {
    try {
      setActionId(transaction.id);
      setOpenMenuId(null);
      setListNotice(null);

      if (transaction.isActive) {
        await recurringTransactionService.pauseRecurringReminder(transaction.id);
      } else {
        await recurringTransactionService.resumeRecurringReminder(transaction.id);
      }

      await loadTransactions();
      setListNotice({
        type: "success",
        message: transaction.isActive
          ? "Recurring reminder paused."
          : "Recurring reminder resumed.",
      });
    } catch (error) {
      console.error("Failed to change reminder status:", error);
      setListNotice({
        type: "error",
        message: "Failed to change recurring reminder status.",
      });
    } finally {
      setActionId(null);
    }
  };

  const handleAddTransaction = (transaction: RecurringTransaction) => {
    setOpenMenuId(null);

    const targetPath =
      transaction.type.toLowerCase() === "expense" ? "/expenses" : "/incomes";

    navigate(targetPath, {
      state: {
        recurringTransactionId: transaction.id,
        recurringTransaction: {
          id: transaction.id,
          title: transaction.title,
          amount: transaction.amount,
          category: transaction.category,
          otherDescription: transaction.otherDescription,
          description: transaction.description,
          type: transaction.type,
          nextOccurrenceDate: transaction.nextOccurrenceDate,
        },
      },
    });
  };

  return (
    <AppLayout>
      <main className="recurring-page">
        <header className="recurring-header">
          <div>
            <span className="recurring-eyebrow">Automated finances</span>
            <h1>Recurring Reminders</h1>
            <p>
              Track repeating income and expenses, receive due-date reminders,
              and record each occurrence without changing its calendar schedule.
            </p>
          </div>

          <div className="recurring-header-count">
            <small>Active reminders</small>
            <strong>{activeCount}</strong>
          </div>
        </header>

        <section className="recurring-summary-grid">
          <SummaryCard label="Active" value={activeCount} tone="active" />
          <SummaryCard
            label="Due today"
            value={dueTodayCount}
            tone="today"
          />
          <SummaryCard
            label="Upcoming"
            value={upcomingCount}
            tone="upcoming"
          />
          <SummaryCard label="Overdue" value={overdueCount} tone="overdue" />
        </section>

        <section className="recurring-section recurring-form-section">
          <div className="recurring-section-heading">
            <div>
              <span className="recurring-section-kicker">New reminder</span>
              <h2>Add recurring reminder</h2>
              <p>
                Create a calendar-based reminder for recurring income or an
                expense payment.
              </p>
            </div>
          </div>

          <div className="recurring-divider" />

          <form className="recurring-form" onSubmit={handleCreate}>
            <FormField label="Title" htmlFor="recurring-title" wide>
              <input
                id="recurring-title"
                type="text"
                placeholder="Example: Netflix or Monthly salary"
                value={title}
                disabled={creating}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </FormField>

            <FormField label="Amount" htmlFor="recurring-amount">
              <input
                id="recurring-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0"
                value={amount}
                disabled={creating}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </FormField>

            <FormField label="Type" htmlFor="recurring-type">
              <select
                id="recurring-type"
                value={type}
                disabled={creating}
                onChange={(event) =>
                  setType(event.target.value as "Income" | "Expense")
                }
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </FormField>

            <FormField label="Category" htmlFor="recurring-category">
              <select
                id="recurring-category"
                value={category}
                disabled={creating}
                onChange={(event) => {
                  setCategory(event.target.value);
                  if (event.target.value !== "Other") {
                    setOtherDescription("");
                  }
                }}
                required
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            {category === "Other" && (
              <FormField
                label="Other description"
                htmlFor="recurring-other-description"
              >
                <input
                  id="recurring-other-description"
                  type="text"
                  placeholder="Example: Society Maintenance"
                  value={otherDescription}
                  disabled={creating}
                  onChange={(event) => setOtherDescription(event.target.value)}
                  required
                />
              </FormField>
            )}

            <FormField label="Description" htmlFor="recurring-description">
              <input
                id="recurring-description"
                type="text"
                placeholder="Example: Netflix"
                value={description}
                disabled={creating}
                onChange={(event) => setDescription(event.target.value)}
              />
            </FormField>

            <FormField label="Frequency" htmlFor="recurring-frequency">
              <select
                id="recurring-frequency"
                value={frequency}
                disabled={creating}
                onChange={(event) => setFrequency(event.target.value)}
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {formatFrequency(option)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Start date" htmlFor="recurring-start-date">
              <input
                id="recurring-start-date"
                type="date"
                value={startDate}
                disabled={creating}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </FormField>

            <FormField label="End date (optional)" htmlFor="recurring-end-date">
              <input
                id="recurring-end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                disabled={creating}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </FormField>

            <button
              type="submit"
              className="recurring-primary-button"
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="recurring-button-spinner" />
                  Adding...
                </>
              ) : (
                "Add Reminder"
              )}
            </button>
          </form>

          {formNotice && (
            <InlineNotice
              notice={formNotice}
              onClose={() => setFormNotice(null)}
            />
          )}
        </section>

        <section className="recurring-section">
          <div className="recurring-list-heading">
            <div>
              <span className="recurring-section-kicker">Reminder list</span>
              <h2>Recurring income and expenses</h2>
              <p>
                Search, filter, edit, pause, resume, or record a recurring
                transaction.
              </p>
            </div>

            <span className="recurring-section-count">
              {filteredTransactions.length} shown
            </span>
          </div>

          <div className="recurring-toolbar">
            <div className="recurring-search-wrap">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search title, category, description..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              aria-label="Filter recurring reminders by status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="All">All statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Due Today">Due Today</option>
              <option value="Overdue">Overdue</option>
              <option value="Paused">Paused</option>
            </select>
          </div>

          {listNotice && (
            <InlineNotice
              notice={listNotice}
              onClose={() => setListNotice(null)}
            />
          )}

          {loading ? (
            <div className="recurring-state">
              <span className="recurring-loader" />
              <h3>Loading recurring reminders</h3>
              <p>Please wait while your reminders are loaded.</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="recurring-state">
              <div className="recurring-state-icon">↻</div>
              <h3>No recurring reminders found</h3>
              <p>
                Add your first reminder above or change the current search and
                status filter.
              </p>
            </div>
          ) : (
            <div className="recurring-reminder-list">
              {filteredTransactions.map((transaction) => (
                <RecurringReminderCard
                  key={transaction.id}
                  transaction={transaction}
                  deletingId={deletingId}
                  actionId={actionId}
                  editingId={editingId}
                  editingTransaction={editingTransaction}
                  savingEdit={savingEdit}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  setEditingTransaction={setEditingTransaction}
                  onStartEdit={startEditing}
                  onCancelEdit={cancelEditing}
                  onSaveEdit={handleUpdate}
                  onDelete={handleDelete}
                  onPauseResume={handlePauseResume}
                  onAddTransaction={handleAddTransaction}
                />
              ))}
            </div>
          )}
        </section>

        <style>{recurringStyles}</style>
      </main>
    </AppLayout>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  tone: "active" | "today" | "upcoming" | "overdue";
};

function SummaryCard({ label, value, tone }: SummaryCardProps) {
  return (
    <div className={`recurring-summary-card summary-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>Recurring reminders</small>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  htmlFor: string;
  wide?: boolean;
  children: React.ReactNode;
};

function FormField({ label, htmlFor, wide, children }: FormFieldProps) {
  return (
    <div className={`recurring-field ${wide ? "recurring-field-wide" : ""}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

type InlineNoticeProps = {
  notice: Notice;
  onClose: () => void;
};

function InlineNotice({ notice, onClose }: InlineNoticeProps) {
  return (
    <div
      className={`recurring-inline-notice recurring-inline-notice-${notice.type}`}
      role="status"
    >
      <span>{notice.type === "success" ? "✓" : "!"}</span>
      <p>{notice.message}</p>
      <button type="button" aria-label="Close message" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

type RecurringReminderCardProps = {
  transaction: RecurringTransaction;
  deletingId: string | null;
  actionId: string | null;
  editingId: string | null;
  editingTransaction: CreateRecurringTransactionRequest;
  savingEdit: boolean;
  openMenuId: string | null;
  setOpenMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingTransaction: React.Dispatch<
    React.SetStateAction<CreateRecurringTransactionRequest>
  >;
  onStartEdit: (transaction: RecurringTransaction) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => Promise<void>;
  onDelete: (transaction: RecurringTransaction) => Promise<void>;
  onPauseResume: (transaction: RecurringTransaction) => Promise<void>;
  onAddTransaction: (transaction: RecurringTransaction) => void;
};

function RecurringReminderCard({
  transaction,
  deletingId,
  actionId,
  editingId,
  editingTransaction,
  savingEdit,
  openMenuId,
  setOpenMenuId,
  setEditingTransaction,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onPauseResume,
  onAddTransaction,
}: RecurringReminderCardProps) {
  const isEditing = editingId === transaction.id;
  const isExpense = transaction.type.toLowerCase() === "expense";
  const isBusy =
    deletingId === transaction.id || actionId === transaction.id || savingEdit;

  const isFirstOccurrence =
    !transaction.lastCompletedOccurrenceDate;

  const isActionableReminder =
    transaction.isActive &&
    ["Upcoming", "Due Today", "Overdue"].includes(
      transaction.reminderStatus
    );

  const canRecordTransaction =
    transaction.isActive &&
    (isFirstOccurrence || isActionableReminder);

  if (isEditing) {
    return (
      <article className="recurring-reminder-card recurring-item-editing">
        <div className="recurring-edit-heading">
          <div>
            <span>Edit recurring reminder</span>
            <h3>{transaction.title}</h3>
          </div>
          <button
            type="button"
            className="recurring-edit-close"
            aria-label="Cancel editing"
            disabled={savingEdit}
            onClick={onCancelEdit}
          >
            ×
          </button>
        </div>

        <div className="recurring-edit-grid">
          <FormField label="Title" htmlFor={`edit-title-${transaction.id}`} wide>
            <input
              id={`edit-title-${transaction.id}`}
              type="text"
              value={editingTransaction.title}
              disabled={savingEdit}
              onChange={(event) =>
                setEditingTransaction((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField label="Amount" htmlFor={`edit-amount-${transaction.id}`}>
            <input
              id={`edit-amount-${transaction.id}`}
              type="number"
              min="0.01"
              step="0.01"
              value={editingTransaction.amount}
              disabled={savingEdit}
              onChange={(event) =>
                setEditingTransaction((current) => ({
                  ...current,
                  amount: Number(event.target.value),
                }))
              }
            />
          </FormField>

          <FormField label="Type" htmlFor={`edit-type-${transaction.id}`}>
            <select
              id={`edit-type-${transaction.id}`}
              value={editingTransaction.type}
              disabled={savingEdit}
              onChange={(event) =>
                setEditingTransaction((current) => ({
                  ...current,
                  type: event.target.value as "Income" | "Expense",
                }))
              }
            >
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </FormField>

          <FormField
            label="Category"
            htmlFor={`edit-category-${transaction.id}`}
          >
            <select
              id={`edit-category-${transaction.id}`}
              value={editingTransaction.category}
              disabled={savingEdit}
              onChange={(event) =>
                setEditingTransaction((current) => ({
                  ...current,
                  category: event.target.value,
                  otherDescription:
                    event.target.value === "Other"
                      ? current.otherDescription
                      : "",
                }))
              }
            >
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          {editingTransaction.category === "Other" && (
            <FormField
              label="Other description"
              htmlFor={`edit-other-description-${transaction.id}`}
            >
              <input
                id={`edit-other-description-${transaction.id}`}
                type="text"
                value={editingTransaction.otherDescription ?? ""}
                disabled={savingEdit}
                onChange={(event) =>
                  setEditingTransaction((current) => ({
                    ...current,
                    otherDescription: event.target.value,
                  }))
                }
              />
            </FormField>
          )}

          <FormField
            label="Description"
            htmlFor={`edit-description-${transaction.id}`}
          >
            <input
              id={`edit-description-${transaction.id}`}
              type="text"
              value={editingTransaction.description ?? ""}
              disabled={savingEdit}
              onChange={(event) =>
                setEditingTransaction((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField
            label="Frequency"
            htmlFor={`edit-frequency-${transaction.id}`}
          >
            <select
              id={`edit-frequency-${transaction.id}`}
              value={editingTransaction.frequency}
              disabled={savingEdit}
              onChange={(event) =>
                setEditingTransaction((current) => ({
                  ...current,
                  frequency: event.target.value,
                }))
              }
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatFrequency(option)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Start date"
            htmlFor={`edit-start-date-${transaction.id}`}
          >
            <input
              id={`edit-start-date-${transaction.id}`}
              type="date"
              value={editingTransaction.startDate}
              disabled={savingEdit}
              onChange={(event) =>
                setEditingTransaction((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField
            label="End date (optional)"
            htmlFor={`edit-end-date-${transaction.id}`}
          >
            <input
              id={`edit-end-date-${transaction.id}`}
              type="date"
              min={editingTransaction.startDate || undefined}
              value={editingTransaction.endDate ?? ""}
              disabled={savingEdit}
              onChange={(event) =>
                setEditingTransaction((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
            />
          </FormField>
        </div>

        <div className="recurring-edit-actions">
          <button
            type="button"
            className="recurring-save-button"
            disabled={savingEdit}
            onClick={() => void onSaveEdit()}
          >
            {savingEdit ? (
              <>
                <span className="recurring-button-spinner" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
          <button
            type="button"
            className="recurring-cancel-button"
            disabled={savingEdit}
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`recurring-reminder-card ${
        isExpense ? "reminder-expense" : "reminder-income"
      } ${!transaction.isActive ? "reminder-paused" : ""}`}
    >
      <div className="recurring-card-top">
        <div className="recurring-card-title-wrap">
          <span className="recurring-card-category">
            {transaction.category === "Other"
              ? transaction.otherDescription || "Other"
              : transaction.category}
          </span>
          <h3>{transaction.title}</h3>
          <p>{transaction.reminderMessage}</p>
        </div>

        <div className="recurring-card-menu-wrap">
          <StatusBadge
            status={transaction.isActive ? transaction.reminderStatus : "Paused"}
          />
          <button
            type="button"
            className="recurring-menu-trigger"
            aria-label="Open reminder actions"
            onClick={() =>
              setOpenMenuId((current) =>
                current === transaction.id ? null : transaction.id
              )
            }
          >
            ⋮
          </button>

          {openMenuId === transaction.id && (
            <div className="recurring-menu-popover">
              <button type="button" onClick={() => onStartEdit(transaction)}>
                Edit
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void onPauseResume(transaction)}
              >
                {transaction.isActive ? "Pause" : "Resume"}
              </button>
              <button
                type="button"
                className="recurring-menu-delete"
                disabled={isBusy}
                onClick={() => void onDelete(transaction)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="recurring-card-details">
        <DetailItem label="Amount" value={formatCurrency(transaction.amount)} />
        <DetailItem label="Type" value={transaction.type} />
        <DetailItem
          label="Frequency"
          value={formatFrequency(transaction.frequency)}
        />
        <DetailItem
          label="Next reminder"
          value={formatDate(transaction.nextOccurrenceDate)}
        />
        <DetailItem
          label="Start date"
          value={formatDate(transaction.startDate)}
        />
        <DetailItem
          label="Reminder time"
          value={`${formatHour(transaction.reminderHour)}, ${transaction.reminderDaysBefore} days before`}
        />
      </div>

      {transaction.isActive && isFirstOccurrence && (
        <div
          className={`recurring-action-hint ${
            isExpense
              ? "recurring-action-hint-expense"
              : "recurring-action-hint-income"
          }`}
        >
          <span aria-hidden="true">{isExpense ? "!" : "✓"}</span>
          <p>
            {isExpense
              ? "New reminder — click Add Expense after this payment is made."
              : "New reminder — click Add Income after this money is received."}
          </p>
        </div>
      )}

      {transaction.isActive &&
        !isFirstOccurrence &&
        isActionableReminder && (
          <div
            className={`recurring-action-hint ${
              isExpense
                ? "recurring-action-hint-expense"
                : "recurring-action-hint-income"
            }`}
          >
            <span aria-hidden="true">
              {transaction.reminderStatus === "Overdue" ? "!" : "→"}
            </span>
            <p>
              {isExpense
                ? "Reminder is active — record this expense after the payment is made."
                : "Reminder is active — record this income after the money is received."}
            </p>
          </div>
        )}

      {transaction.isActive &&
        !isFirstOccurrence &&
        transaction.reminderStatus === "Scheduled" && (
          <div className="recurring-scheduled-hint">
            This reminder will become actionable{" "}
            {transaction.reminderDaysBefore} days before the due date.
          </div>
        )}

      {!transaction.isActive && (
        <div className="recurring-scheduled-hint">
          This reminder is paused. Resume it to receive reminders and record the
          next occurrence.
        </div>
      )}

      <div className="recurring-card-actions">
        <button
          type="button"
          className={`recurring-record-button ${
            isExpense ? "record-expense" : "record-income"
          }`}
          disabled={!canRecordTransaction || isBusy}
          onClick={() => onAddTransaction(transaction)}
        >
          {isExpense ? "Add Expense" : "Add Income"}
        </button>

        <button
          type="button"
          className="recurring-secondary-button"
          disabled={isBusy}
          onClick={() => void onPauseResume(transaction)}
        >
          {actionId === transaction.id
            ? "Please wait..."
            : transaction.isActive
              ? "Pause"
              : "Resume"}
        </button>

        <button
          type="button"
          className="recurring-edit-button"
          disabled={Boolean(editingId) || isBusy}
          onClick={() => onStartEdit(transaction)}
        >
          Edit
        </button>

        <button
          type="button"
          className="recurring-delete-button"
          disabled={Boolean(editingId) || isBusy}
          onClick={() => void onDelete(transaction)}
        >
          {deletingId === transaction.id ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="recurring-detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className = status.toLowerCase().replaceAll(" ", "-");
  return (
    <span className={`recurring-status-badge status-${className}`}>
      <i />
      {status}
    </span>
  );
}

function validateRequest(request: CreateRecurringTransactionRequest) {
  if (!request.title.trim() || !request.category.trim() || !request.startDate) {
    return "Please complete the title, category, and start date.";
  }

  if (!Number.isFinite(request.amount) || request.amount <= 0) {
    return "Please enter a valid amount greater than zero.";
  }

  if (
    request.category === "Other" &&
    !request.otherDescription?.trim()
  ) {
    return "Please describe the Other category.";
  }

  if (
    request.endDate &&
    new Date(request.endDate).getTime() < new Date(request.startDate).getTime()
  ) {
    return "End date cannot be earlier than the start date.";
  }

  return null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFrequency(value: string) {
  return value === "HalfYearly" ? "Half Yearly" : value;
}

function formatHour(hour: number) {
  const normalizedHour = hour % 24;
  const suffix = normalizedHour >= 12 ? "PM" : "AM";
  const displayHour = normalizedHour % 12 || 12;
  return `${displayHour}:00 ${suffix}`;
}

function toDateInputValue(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const recurringStyles = `
  .recurring-page,
  .recurring-page * { box-sizing: border-box; }

  .recurring-page {
    width: 100%;
    min-height: 100%;
    padding: 26px 1% 34px;
    color: #111827;
  }

  .recurring-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  }

  .recurring-eyebrow,
  .recurring-section-kicker {
    display: block;
    color: #6d5dfc;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .recurring-header h1 {
    margin: 7px 0 0;
    font-size: clamp(2rem, 3.2vw, 2.75rem);
    line-height: 1.05;
    letter-spacing: -0.045em;
  }

  .recurring-header p {
    max-width: 760px;
    margin: 10px 0 0;
    color: #64748b;
    font-size: 0.96rem;
    line-height: 1.65;
  }

  .recurring-header-count {
    flex: 0 0 auto;
    padding: 7px 0 7px 18px;
    border-left: 2px solid rgba(109, 93, 252, 0.22);
  }

  .recurring-header-count small,
  .recurring-header-count strong { display: block; }

  .recurring-header-count small {
    color: #94a3b8;
    font-size: 0.68rem;
  }

  .recurring-header-count strong {
    margin-top: 3px;
    color: #334155;
    font-size: 1.35rem;
  }

  .recurring-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    padding-top: 22px;
  }

  .recurring-summary-card {
    position: relative;
    min-height: 112px;
    padding: 17px 18px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.74);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.66);
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(15px);
  }

  .recurring-summary-card::after {
    content: "";
    position: absolute;
    right: -30px;
    bottom: -38px;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: var(--summary-glow);
    filter: blur(2px);
  }

  .summary-active { --summary-glow: rgba(109, 93, 252, 0.16); }
  .summary-today { --summary-glow: rgba(33, 199, 122, 0.17); }
  .summary-upcoming { --summary-glow: rgba(245, 158, 11, 0.17); }
  .summary-overdue { --summary-glow: rgba(239, 68, 68, 0.16); }

  .recurring-summary-card span,
  .recurring-summary-card strong,
  .recurring-summary-card small { display: block; position: relative; z-index: 1; }

  .recurring-summary-card span {
    color: #64748b;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .recurring-summary-card strong {
    margin-top: 6px;
    color: #172033;
    font-size: 1.65rem;
  }

  .recurring-summary-card small {
    margin-top: 4px;
    color: #94a3b8;
    font-size: 0.68rem;
  }

  .recurring-section { padding-top: 30px; }

  .recurring-form-section {
    margin-top: 26px;
    padding: 22px;
    border: 1px solid rgba(255, 255, 255, 0.72);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.54);
    box-shadow: 0 10px 35px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8);
    backdrop-filter: blur(14px);
  }

  .recurring-section-heading,
  .recurring-list-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .recurring-section-heading h2,
  .recurring-list-heading h2 {
    margin: 5px 0 0;
    color: #172033;
    font-size: 1.18rem;
  }

  .recurring-section-heading p,
  .recurring-list-heading p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 0.82rem;
    line-height: 1.55;
  }

  .recurring-section-count {
    color: #7c5cfc;
    font-size: 0.72rem;
    font-weight: 900;
  }

  .recurring-divider {
    height: 1px;
    margin-top: 18px;
    background: rgba(148, 163, 184, 0.2);
  }

  .recurring-form {
    display: grid;
    grid-template-columns: repeat(4, minmax(145px, 1fr));
    align-items: end;
    gap: 13px;
    padding-top: 20px;
  }

  .recurring-field { min-width: 0; }
  .recurring-field-wide { grid-column: span 2; }

  .recurring-field label {
    display: block;
    margin: 0 0 7px 2px;
    color: #475569;
    font-size: 0.73rem;
    font-weight: 900;
  }

  .recurring-field input,
  .recurring-field select,
  .recurring-toolbar input,
  .recurring-toolbar select {
    width: 100%;
    min-height: 45px;
    padding: 0 12px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 12px;
    outline: none;
    background: rgba(255, 255, 255, 0.78);
    color: #1e293b;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 700;
  }

  .recurring-field input:focus,
  .recurring-field select:focus,
  .recurring-toolbar input:focus,
  .recurring-toolbar select:focus {
    border-color: #6d5dfc;
    box-shadow: 0 0 0 4px rgba(109, 93, 252, 0.1);
  }

  .recurring-primary-button,
  .recurring-save-button,
  .recurring-record-button,
  .recurring-secondary-button,
  .recurring-edit-button,
  .recurring-delete-button,
  .recurring-cancel-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 42px;
    padding: 0 15px;
    border-radius: 11px;
    cursor: pointer;
    font: inherit;
    font-size: 0.74rem;
    font-weight: 900;
    white-space: nowrap;
  }

  .recurring-primary-button,
  .recurring-save-button {
    min-height: 45px;
    border: 0;
    background: linear-gradient(135deg, #5b8cff, #7b61ff);
    box-shadow: 0 10px 23px rgba(91, 140, 255, 0.22);
    color: white;
  }

  button:disabled { cursor: not-allowed !important; opacity: 0.55; }

  .recurring-inline-notice {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    margin-top: 16px;
    padding: 12px 14px;
    border: 1px solid;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 800;
  }

  .recurring-inline-notice-success {
    border-color: rgba(33, 199, 122, 0.24);
    background: rgba(33, 199, 122, 0.09);
    color: #087f5b;
  }

  .recurring-inline-notice-error {
    border-color: rgba(239, 68, 68, 0.24);
    background: rgba(239, 68, 68, 0.09);
    color: #b91c1c;
  }

  .recurring-inline-notice > span {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background: currentColor;
    color: white;
  }

  .recurring-inline-notice p { flex: 1; margin: 0; }
  .recurring-inline-notice button { border: 0; background: transparent; color: inherit; font-size: 1.1rem; cursor: pointer; }

  .recurring-toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 210px;
    gap: 12px;
    margin-top: 18px;
  }

  .recurring-search-wrap { position: relative; }
  .recurring-search-wrap > span {
    position: absolute;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 1.1rem;
  }
  .recurring-search-wrap input { padding-left: 38px; }

  .recurring-reminder-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    padding-top: 18px;
  }

  .recurring-reminder-card {
    position: relative;
    min-width: 0;
    padding: 18px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.75);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.66);
    box-shadow:
      0 9px 28px rgba(15, 23, 42, 0.055),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(14px);
  }

  .reminder-income {
    border-left: 5px solid #21c77a;
  }

  .reminder-expense {
    border-left: 5px solid #ff6467;
  }

  
  .reminder-paused { opacity: 0.78; filter: saturate(0.75); }

  .recurring-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
  }

  .recurring-card-title-wrap { min-width: 0; }
  .recurring-card-category {
    display: block;
    margin-bottom: 4px;
    color: #7c5cfc;
    font-size: 0.65rem;
    font-weight: 900;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .recurring-card-title-wrap h3 {
    margin: 0;
    color: #172033;
    font-size: 1rem;
  }

  .recurring-card-title-wrap p {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 0.76rem;
    line-height: 1.5;
  }

  .recurring-card-menu-wrap {
    position: relative;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .recurring-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    padding: 0 9px;
    border-radius: 999px;
    font-size: 0.65rem;
    font-weight: 900;
    white-space: nowrap;
  }

  .recurring-status-badge i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .status-due-today { background: rgba(33, 199, 122, 0.11); color: #087f5b; }
  .status-upcoming { background: rgba(245, 158, 11, 0.13); color: #b45309; }
  .status-overdue { background: rgba(239, 68, 68, 0.11); color: #b91c1c; }
  .status-scheduled { background: rgba(100, 116, 139, 0.11); color: #475569; }
  .status-inactive,
  .status-paused { background: rgba(100, 116, 139, 0.12); color: #64748b; }

  .recurring-menu-trigger {
    display: none;
    place-items: center;
    width: 31px;
    height: 31px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.72);
    color: #475569;
    cursor: pointer;
    font-size: 1.05rem;
  }

  .recurring-menu-popover {
    position: absolute;
    top: 37px;
    right: 0;
    z-index: 30;
    min-width: 122px;
    padding: 5px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.14);
  }

  .recurring-menu-popover button {
    width: 100%;
    min-height: 32px;
    padding: 0 9px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: #315fda;
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 850;
    text-align: left;
  }

  .recurring-menu-popover button:hover { background: rgba(79, 124, 255, 0.07); }
  .recurring-menu-popover .recurring-menu-delete { color: #dc2626; }

  .recurring-card-details {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 17px;
    padding: 14px 0;
    border-top: 1px solid rgba(148, 163, 184, 0.15);
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  }

  .recurring-detail-item span,
  .recurring-detail-item strong { display: block; }
  .recurring-detail-item span { color: #94a3b8; font-size: 0.62rem; font-weight: 800; }
  .recurring-detail-item strong { margin-top: 4px; color: #334155; font-size: 0.72rem; line-height: 1.35; }

  .recurring-card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 15px;
  }

  .recurring-action-hint {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 14px;
  padding: 10px 12px;
  border: 1px solid;
  border-radius: 12px;
}

.recurring-action-hint span {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 900;
}

.recurring-action-hint p {
  margin: 1px 0 0;
  font-size: 0.7rem;
  font-weight: 750;
  line-height: 1.45;
}

.recurring-action-hint-expense {
  border-color: rgba(239, 68, 68, 0.18);
  background: rgba(239, 68, 68, 0.06);
  color: #b91c1c;
}

.recurring-action-hint-expense span {
  background: #ef4444;
}

.recurring-action-hint-income {
  border-color: rgba(33, 199, 122, 0.2);
  background: rgba(33, 199, 122, 0.07);
  color: #087f5b;
}

.recurring-action-hint-income span {
  background: #21c77a;
}

.recurring-scheduled-hint {
  margin-top: 14px;
  padding: 10px 12px;
  border: 1px solid rgba(100, 116, 139, 0.16);
  border-radius: 12px;
  background: rgba(100, 116, 139, 0.07);
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 750;
  line-height: 1.45;
}

  .recurring-record-button { border: 0; color: white; }
  .record-income { background: linear-gradient(135deg, #20b875, #36cf91); }
  .record-expense { background: linear-gradient(135deg, #ef5b61, #ff777b); }
  .recurring-secondary-button { border: 1px solid rgba(124, 92, 252, 0.2); background: rgba(124, 92, 252, 0.08); color: #6547d8; }
  .recurring-edit-button { border: 1px solid rgba(79, 124, 255, 0.18); background: rgba(79, 124, 255, 0.07); color: #315fda; }
  .recurring-delete-button { border: 1px solid rgba(239, 68, 68, 0.18); background: rgba(239, 68, 68, 0.07); color: #dc2626; }

  .recurring-item-editing { grid-column: 1 / -1; border-color: rgba(109, 93, 252, 0.25); }
  .recurring-edit-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid rgba(148, 163, 184, 0.16); }
  .recurring-edit-heading span { color: #7c5cfc; font-size: 0.64rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
  .recurring-edit-heading h3 { margin: 4px 0 0; color: #172033; font-size: 1rem; }
  .recurring-edit-close { display: grid; place-items: center; width: 31px; height: 31px; border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 9px; background: rgba(255, 255, 255, 0.7); color: #64748b; cursor: pointer; font-size: 1.05rem; }

  .recurring-edit-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; padding-top: 16px; }
  .recurring-edit-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 15px; }
  .recurring-cancel-button { border: 1px solid rgba(148, 163, 184, 0.24); background: rgba(255, 255, 255, 0.62); color: #64748b; }

  .recurring-state { display: grid; place-items: center; min-height: 270px; padding: 30px; text-align: center; }
  .recurring-state h3 { margin: 14px 0 0; color: #172033; font-size: 1.02rem; }
  .recurring-state p { max-width: 420px; margin: 7px 0 0; color: #64748b; font-size: 0.8rem; line-height: 1.6; }
  .recurring-state-icon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; background: rgba(109, 93, 252, 0.1); color: #6d5dfc; font-size: 1.3rem; font-weight: 900; }

  .recurring-loader,
  .recurring-button-spinner { display: inline-block; border-radius: 50%; border-style: solid; animation: recurring-spin 0.75s linear infinite; }
  .recurring-loader { width: 36px; height: 36px; border-width: 3px; border-color: rgba(109, 93, 252, 0.18); border-top-color: #6d5dfc; }
  .recurring-button-spinner { width: 14px; height: 14px; border-width: 2px; border-color: rgba(255, 255, 255, 0.38); border-top-color: white; }

  @keyframes recurring-spin { to { transform: rotate(360deg); } }

  @media (max-width: 1180px) {
    .recurring-form,
    .recurring-edit-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .recurring-reminder-list { grid-template-columns: 1fr; }
  }

  @media (max-width: 850px) {
    .recurring-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .recurring-form,
    .recurring-edit-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .recurring-field-wide { grid-column: 1 / -1; }
    .recurring-card-details { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 760px) {
    .recurring-page { padding: 18px 6px 28px; }
    .recurring-header { flex-direction: column; gap: 14px; }
    .recurring-header-count { padding-left: 14px; }
    .recurring-form-section { padding: 18px 12px; }
    .recurring-toolbar { grid-template-columns: 1fr; }

    .recurring-menu-trigger {
      display: grid;
    }

    .recurring-card-actions .recurring-secondary-button,
    .recurring-card-actions .recurring-edit-button,
    .recurring-card-actions .recurring-delete-button {
      display: none;
    }
  }

  @media (max-width: 520px) {
    .recurring-header h1 { font-size: 2rem; }
    .recurring-summary-grid { gap: 9px; }
    .recurring-summary-card { min-height: 98px; padding: 14px; }
    .recurring-form,
    .recurring-edit-grid { grid-template-columns: 1fr; }
    .recurring-field-wide { grid-column: auto; }
    .recurring-primary-button { width: 100%; }
    .recurring-card-top { gap: 8px; }
    .recurring-status-badge { padding: 0 7px; }
    .recurring-card-details { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .recurring-card-actions { display: grid; grid-template-columns: 1fr 1fr; }
    .recurring-record-button,
    .recurring-secondary-button { width: 100%; }
    .recurring-edit-actions { display: grid; grid-template-columns: 1fr 1fr; }
    .recurring-save-button,
    .recurring-cancel-button { width: 100%; }
  }
`;

export default RecurringTransactionsPage;