import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";

import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  generateRecurringTransactions,
  getRecurringTransactions,
  updateRecurringTransaction,
} from "../services/recurringTransactionService";

import type {
  CreateRecurringTransactionRequest,
  RecurringTransaction,
} from "../types/recurringTransactionTypes";

import {
  getTodayDateInputValue,
  isFutureDate,
  isFutureMonth,
} from "../utils/dateUtils";

type Notice = {
  type: "success" | "error";
  message: string;
};

const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const CATEGORY_OPTIONS = [
  "Salary",
  "Freelance",
  "Investment",
  "Rent",
  "Bills",
  "Food",
  "Travel",
  "Shopping",
  "Insurance",
  "Subscription",
  "Other",
];

const EMPTY_EDIT_FORM: CreateRecurringTransactionRequest = {
  title: "",
  amount: 0,
  category: "",
  type: "Income",
  frequency: "Monthly",
  startDate: "",
};

function RecurringTransactionsPage() {
  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1);
  const currentYear = String(currentDate.getFullYear());

  const today = getTodayDateInputValue();

  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("Income");
  const [frequency, setFrequency] = useState("Monthly");
  const [startDate, setStartDate] = useState("");

  const [generateMonth, setGenerateMonth] = useState(currentMonth);
  const [generateYear, setGenerateYear] = useState(currentYear);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<CreateRecurringTransactionRequest>(EMPTY_EDIT_FORM);
  const [savingEdit, setSavingEdit] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [formNotice, setFormNotice] = useState<Notice | null>(null);
  const [generateNotice, setGenerateNotice] = useState<Notice | null>(null);
  const [listNotice, setListNotice] = useState<Notice | null>(null);

  const yearOptions = useMemo(() => {
    const currentYearNumber =
      currentDate.getFullYear();

    const startYear = currentYearNumber - 5;

    return Array.from(
      { length: 6 },
      (_, index) =>
        String(startYear + index)
    );
  }, []);

  const incomeTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) => transaction.type.toLowerCase() === "income"
      ),
    [transactions]
  );

  const expenseTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) => transaction.type.toLowerCase() === "expense"
      ),
    [transactions]
  );

  const totalRecurringIncome = useMemo(
    () =>
      incomeTransactions.reduce(
        (total, transaction) => total + transaction.amount,
        0
      ),
    [incomeTransactions]
  );

  const totalRecurringExpenses = useMemo(
    () =>
      expenseTransactions.reduce(
        (total, transaction) => total + transaction.amount,
        0
      ),
    [expenseTransactions]
  );

  const loadTransactions = async () => {
    try {
      const data = await getRecurringTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load recurring transactions:", error);

      setListNotice({
        type: "error",
        message: "Failed to load recurring transactions.",
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

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!title.trim() || !category.trim() || !startDate) {
      setFormNotice({
        type: "error",
        message: "Please complete all recurring transaction fields.",
      });
      return;
    }

    if (isFutureDate(startDate)) {
      setFormNotice({
        type: "error",
        message:
          "Recurring transaction start date cannot be in the future.",
      });
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormNotice({
        type: "error",
        message: "Please enter a valid amount greater than zero.",
      });
      return;
    }

    try {
      setCreating(true);
      setFormNotice(null);

      await createRecurringTransaction({
        title: title.trim(),
        amount: numericAmount,
        category: category.trim(),
        type,
        frequency,
        startDate,
      });

      setTitle("");
      setAmount("");
      setCategory("");
      setType("Income");
      setFrequency("Monthly");
      setStartDate("");

      await loadTransactions();

      setFormNotice({
        type: "success",
        message: "Recurring transaction added successfully.",
      });
    } catch (error) {
      console.error("Failed to create recurring transaction:", error);

      setFormNotice({
        type: "error",
        message: "Failed to add recurring transaction.",
      });
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (transaction: RecurringTransaction) => {
    setEditingId(transaction.id);

    setEditingTransaction({
      title: transaction.title,
      amount: transaction.amount,
      category: transaction.category,
      type: transaction.type,
      frequency: transaction.frequency,
      startDate: toDateInputValue(transaction.startDate),
    });

    setOpenMenuId(null);
    setListNotice(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTransaction(EMPTY_EDIT_FORM);
  };

  const handleUpdate = async () => {
    if (!editingId) {
      return;
    }

    if (
      !editingTransaction.title.trim() ||
      !editingTransaction.category.trim() ||
      !editingTransaction.startDate
    ) {
      setListNotice({
        type: "error",
        message: "Please complete all edit fields.",
      });
      return;
    }

    if (isFutureDate(editingTransaction.startDate)) {
      setListNotice({
        type: "error",
        message:
          "Recurring transaction start date cannot be in the future.",
      });
      return;
    }

    if (
      !Number.isFinite(editingTransaction.amount) ||
      editingTransaction.amount <= 0
    ) {
      setListNotice({
        type: "error",
        message: "Please enter a valid amount greater than zero.",
      });
      return;
    }

    try {
      setSavingEdit(true);
      setListNotice(null);

      await updateRecurringTransaction(editingId, {
        ...editingTransaction,
        title: editingTransaction.title.trim(),
        category: editingTransaction.category.trim(),
      });

      await loadTransactions();

      setEditingId(null);
      setEditingTransaction(EMPTY_EDIT_FORM);

      setListNotice({
        type: "success",
        message: "Recurring transaction updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update recurring transaction:", error);

      setListNotice({
        type: "error",
        message: "Failed to update recurring transaction.",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (transaction: RecurringTransaction) => {
    const confirmed = window.confirm(
      `Delete "${transaction.title}" from recurring transactions?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(transaction.id);
      setOpenMenuId(null);
      setListNotice(null);

      await deleteRecurringTransaction(transaction.id);
      await loadTransactions();

      if (editingId === transaction.id) {
        cancelEditing();
      }

      setListNotice({
        type: "success",
        message: "Recurring transaction deleted.",
      });
    } catch (error) {
      console.error("Failed to delete recurring transaction:", error);

      setListNotice({
        type: "error",
        message: "Failed to delete recurring transaction.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerate = async () => {
    const selectedMonth = Number(generateMonth);
    const selectedYear = Number(generateYear);

    if (
      !Number.isInteger(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      setGenerateNotice({
        type: "error",
        message: "Please select a valid month.",
      });
      return;
    }

    if (!Number.isInteger(selectedYear)) {
      setGenerateNotice({
        type: "error",
        message: "Please select a valid year.",
      });
      return;
    }

    if (
      isFutureMonth(
        selectedMonth,
        selectedYear
      )
    ) {
      setGenerateNotice({
        type: "error",
        message:
          "Recurring entries cannot be generated for a future month.",
      });

      return;
    }

    try {
      setGenerating(true);
      setGenerateNotice(null);

      const message = await generateRecurringTransactions(
        selectedMonth,
        selectedYear
      );

      setGenerateNotice({
        type: "success",
        message,
      });
    } catch (error) {
      console.error("Failed to generate recurring transactions:", error);

      setGenerateNotice({
        type: "error",
        message: "Failed to generate monthly entries.",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppLayout>
      <main className="recurring-page">
        <header className="recurring-header">
          <div>
            <span className="recurring-eyebrow">Automated finances</span>
            <h1>Recurring Transactions</h1>
            <p>
              Manage repeating income and expenses, then generate entries for a
              selected month.
            </p>
          </div>

          <div className="recurring-header-count">
            <small>Active schedules</small>
            <strong>{transactions.length}</strong>
          </div>
        </header>

        <section className="recurring-summary">
          <div>
            <span>Recurring income</span>
            <strong>{formatCurrency(totalRecurringIncome)}</strong>
            <small>{incomeTransactions.length} active schedules</small>
          </div>

          <div>
            <span>Recurring expenses</span>
            <strong>{formatCurrency(totalRecurringExpenses)}</strong>
            <small>{expenseTransactions.length} active schedules</small>
          </div>

          <div>
            <span>Monthly difference</span>
            <strong
              className={
                totalRecurringIncome - totalRecurringExpenses < 0
                  ? "recurring-negative"
                  : ""
              }
            >
              {formatCurrency(
                totalRecurringIncome - totalRecurringExpenses
              )}
            </strong>
            <small>Income minus recurring expenses</small>
          </div>
        </section>

        <section className="recurring-section">
          <div className="recurring-section-heading">
            <div>
              <span className="recurring-section-kicker">New schedule</span>
              <h2>Add recurring transaction</h2>
              <p>
                Create a repeating income or expense schedule for future entry
                generation.
              </p>
            </div>
          </div>

          <div className="recurring-divider" />

          
          <form className="recurring-form" onSubmit={handleCreate}>
            <div className="recurring-field recurring-field-wide">
              <label htmlFor="recurring-title">Title</label>
              <input
                id="recurring-title"
                type="text"
                placeholder="Example: Monthly salary"
                value={title}
                disabled={creating}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>

            <div className="recurring-field">
              <label htmlFor="recurring-amount">Amount</label>
              <input
                id="recurring-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={amount}
                disabled={creating}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>

            <div className="recurring-field">
              <label htmlFor="recurring-category">Category / source</label>

              <input
                id="recurring-category"
                list="recurring-category-options"
                type="text"
                placeholder="Select or type a category"
                value={category}
                disabled={creating}
                onChange={(event) => setCategory(event.target.value)}
                required
              />

              <datalist id="recurring-category-options">
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>

            <div className="recurring-field">
              <label htmlFor="recurring-type">Transaction type</label>
              <select
                id="recurring-type"
                value={type}
                disabled={creating}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>

            <div className="recurring-field">
              <label htmlFor="recurring-frequency">Frequency</label>
              <select
                id="recurring-frequency"
                value={frequency}
                disabled={creating}
                onChange={(event) => setFrequency(event.target.value)}
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>

            <div className="recurring-field">
              <label htmlFor="recurring-start-date">Start date</label>
              <input
                id="recurring-start-date"
                type="date"
                value={startDate}
                max={today}
                disabled={creating}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </div>

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
                "Add Recurring"
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

        <section className="recurring-section recurring-generate-section">
          <div className="recurring-section-heading recurring-generate-heading">
            <div>
              <span className="recurring-section-kicker">Monthly action</span>
              <h2>Generate monthly entries</h2>
              <p>
                Create income and expense entries from active recurring
                schedules.
              </p>
            </div>

            <div className="recurring-generate-controls">
              <div className="recurring-field">
                <label htmlFor="generate-month">Month</label>
                <select
                  id="generate-month"
                  value={generateMonth}
                  disabled={generating}
                  onChange={(event) => setGenerateMonth(event.target.value)}
                >
                  {MONTH_OPTIONS.map((option) => {
                    const optionMonth =
                      Number(option.value);

                    const optionYear =
                      Number(generateYear);

                    const isFutureOption =
                      isFutureMonth(
                        optionMonth,
                        optionYear
                      );

                    return (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={isFutureOption}
                      >
                        {option.label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="recurring-field">
                <label htmlFor="generate-year">Year</label>
                <select
                  id="generate-year"
                  value={generateYear}
                  disabled={generating}
                  onChange={(event) => {
                    const nextYear =
                      event.target.value;

                    setGenerateYear(nextYear);

                    const selectedMonthNumber =
                      Number(generateMonth);

                    const selectedYearNumber =
                      Number(nextYear);

                    if (
                      isFutureMonth(
                        selectedMonthNumber,
                        selectedYearNumber
                      )
                    ) {
                      setGenerateMonth(
                        String(
                          currentDate.getMonth() + 1
                        )
                      );
                    }

                    setGenerateNotice(null);
                  }}
                >
                  {yearOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="recurring-generate-button"
                disabled={generating}
                onClick={() => void handleGenerate()}
              >
                {generating ? (
                  <>
                    <span className="recurring-button-spinner" />
                    Generating...
                  </>
                ) : (
                  "Generate Entries"
                )}
              </button>
            </div>
          </div>

          {generateNotice && (
            <InlineNotice
              notice={generateNotice}
              onClose={() => setGenerateNotice(null)}
            />
          )}
        </section>

        <section className="recurring-section">
          <div className="recurring-section-heading">
            <div>
              <span className="recurring-section-kicker">Schedules</span>
              <h2>Recurring transaction list</h2>
              <p>
                Review and update active recurring income and expense
                schedules.
              </p>
            </div>

            <span className="recurring-section-count">
              {transactions.length} total
            </span>
          </div>

          <div className="recurring-divider" />

          {listNotice && (
            <InlineNotice
              notice={listNotice}
              onClose={() => setListNotice(null)}
            />
          )}

          {loading ? (
            <div className="recurring-state">
              <span className="recurring-loader" />
              <h3>Loading schedules</h3>
              <p>Please wait while recurring transactions are loaded.</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="recurring-state">
              <div className="recurring-state-icon">↻</div>
              <h3>No recurring transactions yet</h3>
              <p>
                Add your first recurring income or expense using the form
                above.
              </p>
            </div>
          ) : (
            <div className="recurring-columns">
              <RecurringGroup
                title="Recurring Income"
                description="Scheduled income sources"
                tone="income"
                today={today}
                transactions={incomeTransactions}
                deletingId={deletingId}
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
              />

              <RecurringGroup
                title="Recurring Expenses"
                description="Scheduled expense payments"
                tone="expense"
                today={today}
                transactions={expenseTransactions}
                deletingId={deletingId}
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
              />
            </div>
          )}
        </section>

        <style>{recurringStyles}</style>
      </main>
    </AppLayout>
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

      <button
        type="button"
        aria-label="Close message"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}

type RecurringGroupProps = {
  title: string;
  description: string;
  tone: "income" | "expense";
  today: string;
  transactions: RecurringTransaction[];
  deletingId: string | null;
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
};

function RecurringGroup({
  title,
  description,
  tone,
  today,
  transactions,
  deletingId,
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
}: RecurringGroupProps) {
  return (
    <div className="recurring-group">
      <div className="recurring-group-header">
        <div>
          <span className={`recurring-group-dot recurring-group-dot-${tone}`} />

          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </div>

        <strong>{transactions.length}</strong>
      </div>

      {transactions.length === 0 ? (
        <div className="recurring-group-empty">
          No {tone === "income" ? "income" : "expense"} schedules added.
        </div>
      ) : (
        <div className="recurring-list">
          {transactions.map((transaction) => {
            const isEditing = editingId === transaction.id;

            return (
              <article
                key={transaction.id}
                className={`recurring-item recurring-item-${tone} ${
                  isEditing ? "recurring-item-editing" : ""
                }`}
              >
                {isEditing ? (
                  <div className="recurring-edit-form">
                    <div className="recurring-edit-heading">
                      <div>
                        <span>Edit schedule</span>
                        <h4>{transaction.title}</h4>
                      </div>

                      <button
                        type="button"
                        aria-label="Cancel editing"
                        className="recurring-edit-close"
                        disabled={savingEdit}
                        onClick={onCancelEdit}
                      >
                        ×
                      </button>
                    </div>

                    <div className="recurring-edit-grid">
                      <div className="recurring-field recurring-edit-wide">
                        <label htmlFor={`edit-title-${transaction.id}`}>
                          Title
                        </label>
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
                      </div>

                      <div className="recurring-field">
                        <label htmlFor={`edit-amount-${transaction.id}`}>
                          Amount
                        </label>
                        <input
                          id={`edit-amount-${transaction.id}`}
                          type="number"
                          min="0"
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
                      </div>

                      <div className="recurring-field">
                        <label htmlFor={`edit-category-${transaction.id}`}>
                          Category / source
                        </label>
                        <input
                          id={`edit-category-${transaction.id}`}
                          list="recurring-category-options"
                          type="text"
                          value={editingTransaction.category}
                          disabled={savingEdit}
                          onChange={(event) =>
                            setEditingTransaction((current) => ({
                              ...current,
                              category: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="recurring-field">
                        <label htmlFor={`edit-type-${transaction.id}`}>
                          Type
                        </label>
                        <select
                          id={`edit-type-${transaction.id}`}
                          value={editingTransaction.type}
                          disabled={savingEdit}
                          onChange={(event) =>
                            setEditingTransaction((current) => ({
                              ...current,
                              type: event.target.value,
                            }))
                          }
                        >
                          <option value="Income">Income</option>
                          <option value="Expense">Expense</option>
                        </select>
                      </div>

                      <div className="recurring-field">
                        <label htmlFor={`edit-frequency-${transaction.id}`}>
                          Frequency
                        </label>
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
                          <option value="Monthly">Monthly</option>
                          <option value="Weekly">Weekly</option>
                        </select>
                      </div>

                      <div className="recurring-field">
                        <label htmlFor={`edit-date-${transaction.id}`}>
                          Start date
                        </label>
                        <input
                          id={`edit-date-${transaction.id}`}
                          type="date"
                          value={editingTransaction.startDate}
                          max={today}
                          disabled={savingEdit}
                          onChange={(event) =>
                            setEditingTransaction((current) => ({
                              ...current,
                              startDate: event.target.value,
                            }))
                          }
                        />
                      </div>
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
                  </div>
                ) : (
                  <div className="recurring-item-main">
                    <div className="recurring-item-title-row">
                      <div>
                        <span className="recurring-item-category">
                          {transaction.category}
                        </span>
                        <h4>{transaction.title}</h4>
                      </div>

                      <div className="recurring-item-actions">
                        <button
                          type="button"
                          className="recurring-edit-button"
                          disabled={Boolean(editingId)}
                          onClick={() => onStartEdit(transaction)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="recurring-delete-button"
                          disabled={
                            deletingId === transaction.id || Boolean(editingId)
                          }
                          onClick={() => void onDelete(transaction)}
                        >
                          {deletingId === transaction.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>

                        <div className="recurring-mobile-menu">
                          <button
                            type="button"
                            className="recurring-menu-trigger"
                            aria-label="Open transaction menu"
                            onClick={() =>
                              setOpenMenuId((currentId) =>
                                currentId === transaction.id
                                  ? null
                                  : transaction.id
                              )
                            }
                          >
                            ⋮
                          </button>

                          {openMenuId === transaction.id && (
                            <div className="recurring-menu-popover">
                              <button
                                type="button"
                                onClick={() => onStartEdit(transaction)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="recurring-menu-delete"
                                disabled={deletingId === transaction.id}
                                onClick={() => void onDelete(transaction)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <strong
                      className={`recurring-item-amount amount-${tone}`}
                    >
                      {formatCurrency(transaction.amount)}
                    </strong>

                    <div className="recurring-item-meta">
                      <span>{transaction.frequency}</span>
                      <span>Starts {formatDate(transaction.startDate)}</span>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
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

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDateInputValue(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const recurringStyles = `
  .recurring-page,
  .recurring-page * {
    box-sizing: border-box;
  }

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
    max-width: 720px;
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
  .recurring-header-count strong {
    display: block;
  }

  .recurring-header-count small {
    color: #94a3b8;
    font-size: 0.68rem;
  }

  .recurring-header-count strong {
    margin-top: 3px;
    color: #334155;
    font-size: 1.1rem;
  }

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
    font-weight: 900;
  }

  .recurring-inline-notice p {
    flex: 1;
    margin: 0;
  }

  .recurring-inline-notice button {
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 1.15rem;
    line-height: 1;
  }

  .recurring-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding: 22px 0 2px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  }

  .recurring-summary > div {
    padding: 4px 22px;
    border-right: 1px solid rgba(148, 163, 184, 0.18);
  }

  .recurring-summary > div:first-child {
    padding-left: 0;
  }

  .recurring-summary > div:last-child {
    border-right: 0;
  }

  .recurring-summary span,
  .recurring-summary strong,
  .recurring-summary small {
    display: block;
  }

  .recurring-summary span {
    color: #7c5cfc;
    font-size: 0.68rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .recurring-summary strong {
    margin-top: 7px;
    color: #172033;
    font-size: 1.25rem;
  }

  .recurring-summary small {
    margin-top: 5px;
    color: #94a3b8;
    font-size: 0.69rem;
  }

  .recurring-negative {
    color: #dc2626 !important;
  }

  .recurring-section {
    padding-top: 30px;
  }

  .recurring-section-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .recurring-section-heading h2 {
    margin: 5px 0 0;
    color: #172033;
    font-size: 1.18rem;
  }

  .recurring-section-heading p {
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
    grid-template-columns: 1.3fr repeat(5, minmax(135px, 1fr)) auto;
    align-items: end;
    gap: 12px;
    padding-top: 20px;
  }

  .recurring-field {
    min-width: 0;
  }

  .recurring-field label {
    display: block;
    margin: 0 0 7px 2px;
    color: #475569;
    font-size: 0.73rem;
    font-weight: 900;
  }

  .recurring-field input,
  .recurring-field select {
    width: 100%;
    min-height: 45px;
    padding: 0 12px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 12px;
    outline: none;
    background: rgba(255, 255, 255, 0.76);
    color: #1e293b;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 700;
  }

  .recurring-field input:focus,
  .recurring-field select:focus {
    border-color: #6d5dfc;
    box-shadow: 0 0 0 4px rgba(109, 93, 252, 0.1);
  }

  .recurring-primary-button,
  .recurring-generate-button,
  .recurring-save-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 45px;
    padding: 0 17px;
    border: 0;
    border-radius: 12px;
    background: linear-gradient(135deg, #5b8cff, #7b61ff);
    box-shadow: 0 10px 23px rgba(91, 140, 255, 0.22);
    color: white;
    cursor: pointer;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 900;
    white-space: nowrap;
  }

  .recurring-primary-button:disabled,
  .recurring-generate-button:disabled,
  .recurring-save-button:disabled {
    cursor: not-allowed;
    opacity: 0.62;
    box-shadow: none;
  }

  .recurring-generate-section {
    padding: 22px 20px;
    margin-top: 30px;
    border: 1px solid rgba(255, 255, 255, 0.72);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.58);
    box-shadow:
      0 8px 26px rgba(15, 23, 42, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(14px);
  }

  .recurring-generate-heading {
    align-items: end;
  }

  .recurring-generate-controls {
    display: grid;
    grid-template-columns: 170px 130px auto;
    align-items: end;
    gap: 10px;
  }

  .recurring-columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    padding-top: 20px;
  }

  .recurring-group {
    min-width: 0;
  }

  .recurring-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 13px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  }

  .recurring-group-header > div {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .recurring-group-header h3 {
    margin: 0;
    color: #172033;
    font-size: 0.96rem;
  }

  .recurring-group-header p {
    margin: 3px 0 0;
    color: #94a3b8;
    font-size: 0.69rem;
  }

  .recurring-group-header > strong {
    color: #64748b;
    font-size: 0.82rem;
  }

  .recurring-group-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .recurring-group-dot-income {
    background: #21c77a;
    box-shadow: 0 0 0 5px rgba(33, 199, 122, 0.1);
  }

  .recurring-group-dot-expense {
    background: #ff6467;
    box-shadow: 0 0 0 5px rgba(255, 100, 103, 0.1);
  }

  .recurring-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 500px;
    padding: 13px 3px 3px 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #6c4dff rgba(148, 163, 184, 0.1);
  }

  .recurring-list::-webkit-scrollbar {
    width: 7px;
  }

  .recurring-list::-webkit-scrollbar-track {
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.1);
  }

  .recurring-list::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: linear-gradient(180deg, #5b8cff, #7b61ff);
  }

  .recurring-item {
    position: relative;
    padding: 16px;
    overflow: visible;
    border: 1px solid rgba(255, 255, 255, 0.72);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.62);
    box-shadow:
      0 7px 22px rgba(15, 23, 42, 0.045),
      inset 0 1px 0 rgba(255, 255, 255, 0.85);
  }

  .recurring-item::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    border-radius: 16px 0 0 16px;
  }

  .recurring-item-income::before {
    background: #21c77a;
  }

  .recurring-item-expense::before {
    background: #ff6467;
  }

  .recurring-item-editing {
    border-color: rgba(109, 93, 252, 0.25);
    background: rgba(255, 255, 255, 0.78);
    box-shadow:
      0 14px 34px rgba(91, 92, 180, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  .recurring-item-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .recurring-item-category {
    display: block;
    margin-bottom: 4px;
    color: #7c5cfc;
    font-size: 0.65rem;
    font-weight: 900;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .recurring-item h4 {
    margin: 0;
    color: #172033;
    font-size: 0.94rem;
  }

  .recurring-item-amount {
    display: block;
    margin-top: 12px;
    font-size: 1.05rem;
  }

  .amount-income {
    color: #087f5b;
  }

  .amount-expense {
    color: #dc2626;
  }

  .recurring-item-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 11px;
  }

  .recurring-item-meta span {
    display: inline-flex;
    align-items: center;
    min-height: 25px;
    padding: 0 8px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.1);
    color: #64748b;
    font-size: 0.65rem;
    font-weight: 750;
  }

  .recurring-item-actions {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .recurring-edit-button,
  .recurring-delete-button {
    min-height: 31px;
    padding: 0 10px;
    border-radius: 9px;
    cursor: pointer;
    font-size: 0.68rem;
    font-weight: 900;
  }

  .recurring-edit-button {
    border: 1px solid rgba(79, 124, 255, 0.18);
    background: rgba(79, 124, 255, 0.07);
    color: #315fda;
  }

  .recurring-delete-button {
    border: 1px solid rgba(239, 68, 68, 0.18);
    background: rgba(239, 68, 68, 0.07);
    color: #dc2626;
  }

  .recurring-edit-button:disabled,
  .recurring-delete-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .recurring-edit-form {
    position: relative;
  }

  .recurring-edit-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  }

  .recurring-edit-heading span {
    color: #7c5cfc;
    font-size: 0.64rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .recurring-edit-heading h4 {
    margin-top: 4px;
  }

  .recurring-edit-close {
    display: grid;
    place-items: center;
    width: 31px;
    height: 31px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.7);
    color: #64748b;
    cursor: pointer;
    font-size: 1.05rem;
  }

  .recurring-edit-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 11px;
    padding-top: 15px;
  }

  .recurring-edit-wide {
    grid-column: 1 / -1;
  }

  .recurring-edit-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 9px;
    margin-top: 15px;
  }

  .recurring-save-button {
    min-height: 39px;
  }

  .recurring-cancel-button {
    min-height: 39px;
    padding: 0 14px;
    border: 1px solid rgba(148, 163, 184, 0.24);
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.62);
    color: #64748b;
    cursor: pointer;
    font: inherit;
    font-size: 0.75rem;
    font-weight: 850;
  }

  .recurring-cancel-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .recurring-mobile-menu {
    display: none;
    position: relative;
  }

  .recurring-menu-trigger {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.7);
    color: #475569;
    cursor: pointer;
    font-size: 1.05rem;
  }

  .recurring-menu-popover {
    position: absolute;
    top: 36px;
    right: 0;
    z-index: 20;
    min-width: 112px;
    padding: 5px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.14);
  }

  .recurring-menu-popover button {
    width: 100%;
    min-height: 31px;
    padding: 0 8px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: #315fda;
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 850;
    text-align: left;
  }

  .recurring-menu-popover button:hover {
    background: rgba(79, 124, 255, 0.07);
  }

  .recurring-menu-popover .recurring-menu-delete {
    color: #dc2626;
  }

  .recurring-menu-popover .recurring-menu-delete:hover {
    background: rgba(239, 68, 68, 0.07);
  }

  .recurring-group-empty {
    padding: 30px 10px;
    color: #94a3b8;
    font-size: 0.78rem;
    text-align: center;
  }

  .recurring-state {
    display: grid;
    place-items: center;
    min-height: 270px;
    padding: 30px;
    text-align: center;
  }

  .recurring-state h3 {
    margin: 14px 0 0;
    color: #172033;
    font-size: 1.02rem;
  }

  .recurring-state p {
    max-width: 420px;
    margin: 7px 0 0;
    color: #64748b;
    font-size: 0.8rem;
    line-height: 1.6;
  }

  .recurring-state-icon {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: rgba(109, 93, 252, 0.1);
    color: #6d5dfc;
    font-size: 1.3rem;
    font-weight: 900;
  }

  .recurring-loader,
  .recurring-button-spinner {
    display: inline-block;
    border-radius: 50%;
    border-style: solid;
    animation: recurring-spin 0.75s linear infinite;
  }

  .recurring-loader {
    width: 36px;
    height: 36px;
    border-width: 3px;
    border-color: rgba(109, 93, 252, 0.18);
    border-top-color: #6d5dfc;
  }

  .recurring-button-spinner {
    width: 14px;
    height: 14px;
    border-width: 2px;
    border-color: rgba(255, 255, 255, 0.38);
    border-top-color: white;
  }

  @keyframes recurring-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1180px) {
    .recurring-form {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .recurring-primary-button {
      width: 100%;
    }
  }

  @media (max-width: 850px) {
    .recurring-summary {
      grid-template-columns: 1fr;
      gap: 14px;
      padding-bottom: 18px;
    }

    .recurring-summary > div {
      padding: 0 0 14px;
      border-right: 0;
      border-bottom: 1px solid rgba(148, 163, 184, 0.15);
    }

    .recurring-summary > div:last-child {
      padding-bottom: 0;
      border-bottom: 0;
    }

    .recurring-generate-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .recurring-generate-controls {
      width: 100%;
      grid-template-columns: 1fr 1fr auto;
    }

    .recurring-columns {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .recurring-page {
      padding: 18px 6px 28px;
    }

    .recurring-header {
      flex-direction: column;
      gap: 14px;
    }

    .recurring-header-count {
      padding-left: 14px;
    }

    .recurring-form {
      grid-template-columns: 1fr 1fr;
    }

    .recurring-field-wide {
      grid-column: 1 / -1;
    }

    .recurring-primary-button {
      grid-column: 1 / -1;
    }

    .recurring-generate-section {
      padding: 18px 14px;
    }

    .recurring-generate-controls {
      grid-template-columns: 1fr 1fr;
    }

    .recurring-generate-button {
      grid-column: 1 / -1;
      width: 100%;
    }

    .recurring-edit-button,
    .recurring-delete-button {
      display: none;
    }

    .recurring-mobile-menu {
      display: block;
    }

    .recurring-list {
      max-height: 470px;
    }
  }

  @media (max-width: 480px) {
    .recurring-header h1 {
      font-size: 2rem;
    }

    .recurring-form {
      grid-template-columns: 1fr;
    }

    .recurring-field-wide,
    .recurring-primary-button {
      grid-column: auto;
    }

    .recurring-generate-controls {
      grid-template-columns: 1fr;
    }

    .recurring-generate-button {
      grid-column: auto;
    }

    .recurring-item {
      padding: 14px 12px;
    }

    .recurring-edit-grid {
      grid-template-columns: 1fr;
    }

    .recurring-edit-wide {
      grid-column: auto;
    }

    .recurring-edit-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .recurring-save-button,
    .recurring-cancel-button {
      width: 100%;
    }
  }
`;

export default RecurringTransactionsPage;