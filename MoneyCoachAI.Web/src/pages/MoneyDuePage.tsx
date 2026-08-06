import { useEffect, useMemo, useState } from "react";

import AppLayout from "../components/AppLayout";
import moneyDueService from "../services/moneyDueService";

import type {
  InterestPeriod,
  MoneyDue,
  MoneyDueSettlement,
  MoneyDueStatus,
  MoneyDueType,
} from "../types/moneyDueTypes";

type ActiveTab = MoneyDueType | "Interest";
type StatusFilter = "All" | MoneyDueStatus | "Overdue";

type MoneyDueFormState = {
  dueType: MoneyDueType;
  title: string;
  category: string;
  otherDescription: string;
  hasInterest: boolean;
  principalAmount: string;
  interestRate: string;
  interestPeriod: InterestPeriod;
  interestPeriods: string;
  totalAmount: string;
  dueDate: string;
  reminderDaysBefore: string;
  description: string;
};

type SettlementFormState = {
  amount: string;
  settlementDate: string;
  description: string;
};

type NoticeState = {
  type: "success" | "error";
  message: string;
} | null;

const MONEY_DUE_CATEGORIES = [
  "Friend or Family",
  "Client Payment",
  "Salary",
  "Freelance",
  "Business",
  "Loan",
  "Rent",
  "Bill",
  "Shop Credit",
  "Vendor Payment",
  "Refund",
  "Reimbursement",
  "Education",
  "Healthcare",
  "Other",
];

const getTodayInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const toDateInputValue = (
  value: string | Date | null | undefined
): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const createEmptyMoneyDueForm = (
  dueType: MoneyDueType = "Receivable"
): MoneyDueFormState => ({
  dueType,
  title: "",
  category: "",
  otherDescription: "",
  hasInterest: false,
  principalAmount: "",
  interestRate: "",
  interestPeriod: "Month",
  interestPeriods: "",
  totalAmount: "",
  dueDate: "",
  reminderDaysBefore: "3",
  description: "",
});

const createEmptySettlementForm = (): SettlementFormState => ({
  amount: "",
  settlementDate: getTodayInputValue(),
  description: "",
});

function MoneyDuePage() {
  const [items, setItems] = useState<MoneyDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("Receivable");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [notice, setNotice] = useState<NoticeState>(null);

  const [showMoneyDueForm, setShowMoneyDueForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MoneyDue | null>(null);
  const [moneyDueForm, setMoneyDueForm] = useState<MoneyDueFormState>(
    createEmptyMoneyDueForm()
  );
  const [savingMoneyDue, setSavingMoneyDue] = useState(false);
  const [moneyDueFormError, setMoneyDueFormError] = useState("");

  const [selectedSettlementItem, setSelectedSettlementItem] =
    useState<MoneyDue | null>(null);
  const [settlementForm, setSettlementForm] =
    useState<SettlementFormState>(createEmptySettlementForm());
  const [savingSettlement, setSavingSettlement] = useState(false);
  const [settlementError, setSettlementError] = useState("");

  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<MoneyDue | null>(null);
  const [editingSettlement, setEditingSettlement] =
    useState<MoneyDueSettlement | null>(null);
  const [deletingSettlementId, setDeletingSettlementId] =
    useState<string | null>(null);
  const [historyNotice, setHistoryNotice] = useState<NoticeState>(null);

  
  const loadMoneyDueItems = async () => {
    try {
      setLoading(true);
      const data = await moneyDueService.getAll();
      setItems(data);
    } catch (error) {
      console.error("Failed to load Money Due records:", error);
      setItems([]);
      setNotice({
        type: "error",
        message: "Failed to load Money Due records.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMoneyDueItems();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const activeItems = useMemo(
    () => items.filter((item) => item.status !== "Completed"),
    [items]
  );

  const totalReceivable = useMemo(
    () =>
      activeItems
        .filter((item) => item.dueType === "Receivable")
        .reduce((total, item) => total + item.remainingAmount, 0),
    [activeItems]
  );

  const totalPayable = useMemo(
    () =>
      activeItems
        .filter((item) => item.dueType === "Payable")
        .reduce((total, item) => total + item.remainingAmount, 0),
    [activeItems]
  );

  const overdueCount = useMemo(
    () => activeItems.filter((item) => item.isOverdue).length,
    [activeItems]
  );

  const dueSoonCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysFromToday = new Date(today);
    sevenDaysFromToday.setDate(sevenDaysFromToday.getDate() + 7);

    return activeItems.filter((item) => {
      const dueDate = new Date(item.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      return dueDate >= today && dueDate <= sevenDaysFromToday;
    }).length;
  }, [activeItems]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...items]
      .filter((item) => {
        if (activeTab === "Interest") {
          return item.hasInterest;
        }

        return item.dueType === activeTab && !item.hasInterest;
      })
      .filter((item) => {
        if (statusFilter === "All") return true;
        if (statusFilter === "Overdue") return item.isOverdue;
        return item.status === statusFilter;
      })
      .filter((item) => {
        if (!normalizedSearch) return true;

        const searchableText = [
          item.title,
          item.category,
          item.otherDescription,
          item.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
      .sort(
        (first, second) =>
          new Date(first.dueDate).getTime() -
          new Date(second.dueDate).getTime()
      );
  }, [items, activeTab, search, statusFilter]);

  const formatMoney = (amount: number) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getProgressPercentage = (item: MoneyDue) => {
    if (item.totalAmount <= 0) return 0;

    return Math.min(
      100,
      Math.max(0, (item.settledAmount / item.totalAmount) * 100)
    );
  };

  const closeMoneyDueForm = () => {
    if (savingMoneyDue) return;

    setShowMoneyDueForm(false);
    setEditingItem(null);
    setMoneyDueForm(
      createEmptyMoneyDueForm(activeTab === "Interest" ? "Receivable" : activeTab)
    );
    setMoneyDueFormError("");
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setMoneyDueForm(
      createEmptyMoneyDueForm(activeTab === "Interest" ? "Receivable" : activeTab)
    );
    setMoneyDueFormError("");
    setShowMoneyDueForm(true);
  };

  const openEditModal = (item: MoneyDue) => {
    setEditingItem(item);
    setMoneyDueForm({
      dueType: item.dueType,
      title: item.title,
      category: item.category,
      otherDescription: item.otherDescription ?? "",
      hasInterest: item.hasInterest,
      principalAmount: item.hasInterest
        ? item.principalAmount.toString()
        : "",
      interestRate: item.hasInterest ? item.interestRate.toString() : "",
      interestPeriod: item.interestPeriod ?? "Month",
      interestPeriods: item.hasInterest
        ? item.interestPeriods.toString()
        : "",
      totalAmount: item.hasInterest ? "" : item.totalAmount.toString(),
      dueDate: toDateInputValue(item.dueDate),
      reminderDaysBefore: item.reminderDaysBefore.toString(),
      description: item.description ?? "",
    });
    setMoneyDueFormError("");
    setShowMoneyDueForm(true);
  };

  const validateMoneyDueForm = () => {
    const reminderDays = Number(moneyDueForm.reminderDaysBefore);

    if (
      !moneyDueForm.title.trim() ||
      !moneyDueForm.category.trim() ||
      !moneyDueForm.dueDate
    ) {
      return "Please complete all required fields.";
    }

    if (
      moneyDueForm.category === "Other" &&
      !moneyDueForm.otherDescription.trim()
    ) {
      return "Please describe the Other category.";
    }

    if (!Number.isInteger(reminderDays) || reminderDays < 0) {
      return "Reminder days must be zero or greater.";
    }

    if (moneyDueForm.hasInterest) {
      const principalAmount = Number(moneyDueForm.principalAmount);
      const interestRate = Number(moneyDueForm.interestRate);
      const interestPeriods = Number(moneyDueForm.interestPeriods);

      if (!Number.isFinite(principalAmount) || principalAmount <= 0) {
        return "Principal amount must be greater than zero.";
      }

      if (
        !Number.isFinite(interestRate) ||
        interestRate <= 0 ||
        interestRate > 100
      ) {
        return "Interest rate must be greater than zero and not exceed 100 percent.";
      }

      if (!Number.isInteger(interestPeriods) || interestPeriods <= 0) {
        return "Number of interest periods must be at least one.";
      }

      const calculatedInterest =
        principalAmount * (interestRate / 100) * interestPeriods;
      const calculatedTotal = principalAmount + calculatedInterest;

      if (editingItem && calculatedTotal < editingItem.settledAmount) {
        return `Calculated total cannot be less than the already settled amount of ${formatMoney(
          editingItem.settledAmount
        )}.`;
      }

      return null;
    }

    const totalAmount = Number(moneyDueForm.totalAmount);

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return "Total amount must be greater than zero.";
    }

    if (editingItem && totalAmount < editingItem.settledAmount) {
      return `Total amount cannot be less than the already settled amount of ${formatMoney(
        editingItem.settledAmount
      )}.`;
    }

    return null;
  };

  const buildMoneyDueRequest = () => {
    const hasInterest = moneyDueForm.hasInterest;

    return {
      dueType: moneyDueForm.dueType,
      title: moneyDueForm.title.trim(),
      partyName:
        editingItem?.partyName?.trim() || moneyDueForm.title.trim(),
      category: moneyDueForm.category,
      otherDescription:
        moneyDueForm.category === "Other"
          ? moneyDueForm.otherDescription.trim()
          : null,
      hasInterest,
      principalAmount: hasInterest
        ? Number(moneyDueForm.principalAmount)
        : 0,
      interestRate: hasInterest ? Number(moneyDueForm.interestRate) : 0,
      interestPeriod: hasInterest ? moneyDueForm.interestPeriod : null,
      interestPeriods: hasInterest
        ? Number(moneyDueForm.interestPeriods)
        : 0,
      interestMethod: "Simple",
      totalAmount: hasInterest ? 0 : Number(moneyDueForm.totalAmount),
      dueDate: `${moneyDueForm.dueDate}T00:00:00Z`,
      reminderDaysBefore: Number(moneyDueForm.reminderDaysBefore),
      description: moneyDueForm.description.trim() || null,
    };
  };

  const handleSaveMoneyDue = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationMessage = validateMoneyDueForm();
    if (validationMessage) {
      setMoneyDueFormError(validationMessage);
      return;
    }

    try {
      setSavingMoneyDue(true);
      setMoneyDueFormError("");

      const request = buildMoneyDueRequest();
      const wasEditing = Boolean(editingItem);

      if (editingItem) {
        await moneyDueService.update(editingItem.id, request);
      } else {
        await moneyDueService.create(request);
      }

      setShowMoneyDueForm(false);
      setEditingItem(null);
      setMoneyDueForm(
      createEmptyMoneyDueForm(activeTab === "Interest" ? "Receivable" : activeTab)
    );
      setMoneyDueFormError("");

      await loadMoneyDueItems();

      setNotice({
        type: "success",
        message: wasEditing
          ? "Money Due record updated successfully."
          : "Money Due record added successfully.",
      });
    } catch (error) {
      console.error("Failed to save Money Due record:", error);
      setMoneyDueFormError("Failed to save the Money Due record.");
    } finally {
      setSavingMoneyDue(false);
    }
  };

  const openSettlementModal = (
    item: MoneyDue,
    settlement?: MoneyDueSettlement
  ) => {
    setSelectedSettlementItem(item);
    setEditingSettlement(settlement ?? null);
    setHistoryNotice(null);

    setSettlementForm(
      settlement
        ? {
            amount: settlement.amount.toString(),
            settlementDate: toDateInputValue(
              settlement.settlementDate
            ),
            description: settlement.description ?? "",
          }
        : createEmptySettlementForm()
    );

    setSettlementError("");
  };

  const closeSettlementModal = () => {
    if (savingSettlement) return;

    setSelectedSettlementItem(null);
    setEditingSettlement(null);
    setSettlementForm(createEmptySettlementForm());
    setSettlementError("");
  };

  const handleRecordSettlement = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedSettlementItem) return;

    const currentItem = selectedSettlementItem;
    const currentEditingSettlement = editingSettlement;
    const numericAmount = Number(settlementForm.amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setSettlementError("Please enter an amount greater than zero.");
      return;
    }

    const otherSettlementsAmount = (currentItem.settlements ?? [])
      .filter((settlement) => settlement.id !== currentEditingSettlement?.id)
      .reduce((total, settlement) => total + settlement.amount, 0);

    if (otherSettlementsAmount + numericAmount > currentItem.totalAmount) {
      setSettlementError(
        "Total settled amount cannot exceed the Money Due total amount."
      );
      return;
    }

    if (!settlementForm.settlementDate) {
      setSettlementError("Please select the settlement date.");
      return;
    }

    try {
      setSavingSettlement(true);
      setSettlementError("");

      const request = {
        amount: numericAmount,
        settlementDate:
          `${settlementForm.settlementDate}T00:00:00.000Z`,
        description: settlementForm.description.trim() || null,
      };

      if (currentEditingSettlement) {
        const updatedItem = await moneyDueService.updateSettlement(
          currentItem.id,
          currentEditingSettlement.id,
          request
        );

        setSelectedSettlementItem(null);
        setEditingSettlement(null);
        setSettlementForm(createEmptySettlementForm());
        setSettlementError("");
        setSelectedHistoryItem(updatedItem);
        setHistoryNotice({
          type: "success",
          message: "Settlement updated successfully.",
        });

        await loadMoneyDueItems();
        return;
      }

      await moneyDueService.recordSettlement(currentItem.id, request);

      setSelectedSettlementItem(null);
      setEditingSettlement(null);
      setSettlementForm(createEmptySettlementForm());
      setSettlementError("");

      await loadMoneyDueItems();

      setNotice({
        type: "success",
        message:
          currentItem.dueType === "Receivable"
            ? "Receipt recorded successfully."
            : "Payment recorded successfully.",
      });
    } catch (error) {
      console.error("Failed to save settlement:", error);
      setSettlementError(
        currentEditingSettlement
          ? "Failed to update the settlement."
          : "Failed to record the settlement."
      );
    } finally {
      setSavingSettlement(false);
    }
  };

  const handleDeleteSettlement = async (
    item: MoneyDue,
    settlement: MoneyDueSettlement
  ) => {
    const confirmed = window.confirm(
      `Delete the settlement of ${formatMoney(
        settlement.amount
      )}? The remaining balance will be recalculated.`
    );

    if (!confirmed) return;

    try {
      setDeletingSettlementId(settlement.id);
      setHistoryNotice(null);

      await moneyDueService.deleteSettlement(item.id, settlement.id);
      const updatedItem = await moneyDueService.getById(item.id);

      setSelectedHistoryItem(updatedItem);
      setHistoryNotice({
        type: "success",
        message: "Settlement deleted successfully.",
      });

      await loadMoneyDueItems();
    } catch (error) {
      console.error("Failed to delete settlement:", error);
      setHistoryNotice({
        type: "error",
        message: "Failed to delete the settlement.",
      });
    } finally {
      setDeletingSettlementId(null);
    }
  };

  const handleDeleteRecord = async (item: MoneyDue) => {
    const settlementCount = item.settlements?.length ?? 0;
    const confirmed = window.confirm(
      settlementCount > 0
        ? `Permanently delete "${item.title}" and its ${settlementCount} settlement record${
            settlementCount === 1 ? "" : "s"
          }? This action cannot be undone.`
        : `Permanently delete "${item.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await moneyDueService.delete(item.id);
      await loadMoneyDueItems();
      setNotice({
        type: "success",
        message: "Money Due record deleted.",
      });
    } catch (error) {
      console.error("Failed to delete Money Due record:", error);
      setNotice({
        type: "error",
        message: "Failed to delete the Money Due record.",
      });
    }
  };

  return (
    <AppLayout>
      <main className="money-due-page">
        <header className="money-due-header">
          <div>
            <span className="money-due-eyebrow">Payment tracking</span>
            <h1>
              Money Due <span>(Receivables &amp; Payables)</span>
            </h1>
            <p>
              Track money you need to receive and money you need to pay.
              Monitor partial settlements, remaining balances and upcoming due
              dates.
            </p>
          </div>

          <button
            type="button"
            className="money-due-primary-button"
            onClick={openCreateModal}
          >
            + Add Money Due
          </button>
        </header>

        {notice && (
          <div
            className={`money-due-notice money-due-notice-${notice.type}`}
            role="status"
          >
            <span>{notice.type === "success" ? "✓" : "!"}</span>
            <p>{notice.message}</p>
            <button
              type="button"
              aria-label="Close message"
              onClick={() => setNotice(null)}
            >
              ×
            </button>
          </div>
        )}

        <section className="money-due-summary-grid">
          <SummaryCard
            icon="↙"
            label="To Receive"
            value={formatMoney(totalReceivable)}
            tone="receivable"
          />
          <SummaryCard
            icon="↗"
            label="To Pay"
            value={formatMoney(totalPayable)}
            tone="payable"
          />
          <SummaryCard
            icon="!"
            label="Overdue"
            value={overdueCount.toString()}
            tone="overdue"
          />
          <SummaryCard
            icon="◷"
            label="Due Soon"
            value={dueSoonCount.toString()}
            tone="soon"
          />
        </section>

        <section className="money-due-content">
          <div className="money-due-tabs">
            <button
              type="button"
              className={activeTab === "Receivable" ? "active receivable" : ""}
              onClick={() => setActiveTab("Receivable")}
            >
              To Receive
            </button>
            <button
              type="button"
              className={activeTab === "Payable" ? "active payable" : ""}
              onClick={() => setActiveTab("Payable")}
            >
              To Pay
            </button>
            <button
              type="button"
              className={activeTab === "Interest" ? "active interest" : ""}
              onClick={() => setActiveTab("Interest")}
            >
              With Interest
            </button>
          </div>

          <div className="money-due-toolbar">
            <input
              type="search"
              value={search}
              placeholder="Search title, category or description..."
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="All">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="PartiallyPaid">Partially settled</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {loading ? (
            <LoadingState />
          ) : filteredItems.length === 0 ? (
            <EmptyState activeTab={activeTab} />
          ) : (
            <div className="money-due-card-grid">
              {filteredItems.map((item) => (
                <MoneyDueCard
                  key={item.id}
                  item={item}
                  formatMoney={formatMoney}
                  formatDate={formatDate}
                  progress={getProgressPercentage(item)}
                  onRecordSettlement={openSettlementModal}
                  onViewHistory={setSelectedHistoryItem}
                  onEdit={openEditModal}
                  onDelete={handleDeleteRecord}
                />
              ))}
            </div>
          )}
        </section>

        {showMoneyDueForm && (
          <MoneyDueFormModal
            form={moneyDueForm}
            editingItem={editingItem}
            saving={savingMoneyDue}
            error={moneyDueFormError}
            onChange={setMoneyDueForm}
            onSubmit={handleSaveMoneyDue}
            onClose={closeMoneyDueForm}
          />
        )}

        {selectedSettlementItem && (
          <SettlementModal
            item={selectedSettlementItem}
            editingSettlement={editingSettlement}
            form={settlementForm}
            saving={savingSettlement}
            error={settlementError}
            formatMoney={formatMoney}
            onChange={setSettlementForm}
            onSubmit={handleRecordSettlement}
            onClose={closeSettlementModal}
          />
        )}

        {selectedHistoryItem && (
          <HistoryModal
            item={selectedHistoryItem}
            formatMoney={formatMoney}
            deletingSettlementId={deletingSettlementId}
            notice={historyNotice}
            onDismissNotice={() => setHistoryNotice(null)}
            onClose={() => {
              setSelectedHistoryItem(null);
              setHistoryNotice(null);
            }}
            onRecordAnother={() => {
              const item = selectedHistoryItem;
              setSelectedHistoryItem(null);
              setHistoryNotice(null);
              openSettlementModal(item);
            }}
            onEditSettlement={(settlement) => {
              const item = selectedHistoryItem;
              setSelectedHistoryItem(null);
              setHistoryNotice(null);
              openSettlementModal(item, settlement);
            }}
            onDeleteSettlement={(settlement) =>
              void handleDeleteSettlement(selectedHistoryItem, settlement)
            }
          />
        )}

        <style>{moneyDueStyles}</style>
      </main>
    </AppLayout>
  );
}

type SummaryCardProps = {
  icon: string;
  label: string;
  value: string;
  tone: "receivable" | "payable" | "overdue" | "soon";
};

function SummaryCard({ icon, label, value, tone }: SummaryCardProps) {
  return (
    <div className={`money-due-summary-card summary-${tone}`}>
      <div className="money-due-summary-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ item }: { item: MoneyDue }) {
  const status = item.isOverdue
    ? "Overdue"
    : item.status === "PartiallyPaid"
      ? "Partially settled"
      : item.status;

  return (
    <span
      className={`money-due-status status-${status
        .toLowerCase()
        .replaceAll(" ", "-")}`}
    >
      {status}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="money-due-state">
      <span className="money-due-loader" />
      <h3>Loading Money Due records</h3>
      <p>Please wait while your receivables and payables are loaded.</p>
    </div>
  );
}

function EmptyState({ activeTab }: { activeTab: ActiveTab }) {
  const isReceivable = activeTab === "Receivable";
  const isInterest = activeTab === "Interest";

  return (
    <div className="money-due-state">
      <div className="money-due-state-icon">
        {isInterest ? "%" : isReceivable ? "↙" : "↗"}
      </div>
      <h3>
        No {isInterest ? "interest records" : isReceivable ? "receivables" : "payables"} found
      </h3>
      <p>
        {isInterest
          ? "Add a receivable or payable with interest to see it here."
          : isReceivable
            ? "Add money expected from a client, salary, business, friend or another source."
            : "Add money you need to pay for a bill, loan, shop, vendor, friend or another source."}
      </p>
    </div>
  );
}

type MoneyDueCardProps = {
  item: MoneyDue;
  progress: number;
  formatMoney: (amount: number) => string;
  formatDate: (value: string) => string;
  onRecordSettlement: (item: MoneyDue) => void;
  onViewHistory: (item: MoneyDue) => void;
  onEdit: (item: MoneyDue) => void;
  onDelete: (item: MoneyDue) => Promise<void>;
};

function MoneyDueCard({
  item,
  progress,
  formatMoney,
  formatDate,
  onRecordSettlement,
  onViewHistory,
  onEdit,
  onDelete,
}: MoneyDueCardProps) {
  const isReceivable = item.dueType === "Receivable";
  const isCompleted = item.status === "Completed";

  return (
    <article
      className={`money-due-card ${
        isReceivable ? "money-due-receivable" : "money-due-payable"
      }`}
    >
      <div className="money-due-card-head">
        <div className="money-due-card-title">
          <span className="money-due-category">
            {item.category === "Other" && item.otherDescription
              ? item.otherDescription
              : item.category}
          </span>
          <h3>{item.title}</h3>
          <p>{item.description?.trim() || "No description added."}</p>
        </div>
        <StatusBadge item={item} />
      </div>

      <div className="money-due-amount-row">
        <div>
          <span>Remaining</span>
          <strong>{formatMoney(item.remainingAmount)}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>{formatMoney(item.totalAmount)}</strong>
        </div>
      </div>

      {item.hasInterest && (
        <div className="money-due-interest-details">
          <div>
            <span>Principal</span>
            <strong>{formatMoney(item.principalAmount)}</strong>
          </div>
          <div>
            <span>Interest</span>
            <strong>{formatMoney(item.interestAmount)}</strong>
          </div>
          <small>
            {item.interestRate}% per {item.interestPeriod?.toLowerCase()} × {" "}
            {item.interestPeriods} period{item.interestPeriods === 1 ? "" : "s"}
          </small>
        </div>
      )}

      <div className="money-due-progress">
        <div className="money-due-progress-head">
          <span>{isReceivable ? "Received" : "Paid"}</span>
          <strong>{progress.toFixed(0)}%</strong>
        </div>
        <div className="money-due-progress-track">
          <div
            className="money-due-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <small>
          {formatMoney(item.settledAmount)} of {formatMoney(item.totalAmount)}
        </small>
      </div>

      <div className="money-due-details">
        <div>
          <span>Due date</span>
          <strong>{formatDate(item.dueDate)}</strong>
        </div>
        <div>
          <span>Settlements</span>
          <strong>{item.settlements?.length ?? 0}</strong>
        </div>
      </div>

      <div className="money-due-card-actions">
        <button
          type="button"
          className="money-due-settlement-button"
          disabled={isCompleted}
          onClick={() => onRecordSettlement(item)}
        >
          {isReceivable ? "Record Receipt" : "Record Payment"}
        </button>
        <button
          type="button"
          className="money-due-history-button"
          onClick={() => onViewHistory(item)}
        >
          View History
        </button>
        <button
          type="button"
          className="money-due-edit-button"
          disabled={isCompleted}
          onClick={() => onEdit(item)}
        >
          Edit
        </button>
        <button
          type="button"
          className="money-due-delete-button"
          onClick={() => void onDelete(item)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

type MoneyDueFormModalProps = {
  form: MoneyDueFormState;
  editingItem: MoneyDue | null;
  saving: boolean;
  error: string;
  onChange: React.Dispatch<React.SetStateAction<MoneyDueFormState>>;
  onSubmit: (event: React.FormEvent) => Promise<void>;
  onClose: () => void;
};

function MoneyDueFormModal({
  form,
  editingItem,
  saving,
  error,
  onChange,
  onSubmit,
  onClose,
}: MoneyDueFormModalProps) {
  const principalAmount = Number(form.principalAmount) || 0;
  const interestRate = Number(form.interestRate) || 0;
  const interestPeriods = Number(form.interestPeriods) || 0;

  const calculatedInterest = form.hasInterest
    ? principalAmount * (interestRate / 100) * interestPeriods
    : 0;

  const calculatedTotal = form.hasInterest
    ? principalAmount + calculatedInterest
    : Number(form.totalAmount) || 0;

  return (
    <ModalBackdrop saving={saving} onClose={onClose}>
      <section
        className="money-due-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="money-due-form-title"
      >
        <ModalHeader
          eyebrow={editingItem ? "Update record" : "New record"}
          title={editingItem ? "Edit Money Due" : "Add Money Due"}
          description={
            editingItem
              ? "Update this record without changing its settlement history."
              : "Track money you expect to receive or money you need to pay."
          }
          disabled={saving}
          onClose={onClose}
        />

        <form className="money-due-create-form" onSubmit={onSubmit}>
          <FormField label="Type" htmlFor="money-due-type">
            <select
              id="money-due-type"
              value={form.dueType}
              disabled={saving}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  dueType: event.target.value as MoneyDueType,
                }))
              }
            >
              <option value="Receivable">To Receive</option>
              <option value="Payable">To Pay</option>
            </select>
          </FormField>

          <FormField label="Title" htmlFor="money-due-title">
            <input
              id="money-due-title"
              type="text"
              value={form.title}
              placeholder="Example: Personal loan"
              disabled={saving}
              required
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField label="Calculation type" htmlFor="money-due-interest-type">
            <div id="money-due-interest-type" className="money-due-interest-toggle">
              <button
                type="button"
                className={!form.hasInterest ? "active" : ""}
                disabled={saving}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    hasInterest: false,
                    principalAmount: "",
                    interestRate: "",
                    interestPeriod: "Month",
                    interestPeriods: "",
                  }))
                }
              >
                Without Interest
              </button>
              <button
                type="button"
                className={form.hasInterest ? "active" : ""}
                disabled={saving}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    hasInterest: true,
                    totalAmount: "",
                  }))
                }
              >
                With Interest
              </button>
            </div>
          </FormField>

          {form.hasInterest ? (
            <>
              <FormField label="Principal amount" htmlFor="money-due-principal">
                <input
                  id="money-due-principal"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.principalAmount}
                  placeholder="0"
                  disabled={saving}
                  required
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      principalAmount: event.target.value,
                    }))
                  }
                />
              </FormField>

              <FormField label="Interest rate (%)" htmlFor="money-due-interest-rate">
                <input
                  id="money-due-interest-rate"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={form.interestRate}
                  placeholder="Example: 10"
                  disabled={saving}
                  required
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      interestRate: event.target.value,
                    }))
                  }
                />
              </FormField>

              <FormField label="Interest period" htmlFor="money-due-interest-period">
                <select
                  id="money-due-interest-period"
                  value={form.interestPeriod}
                  disabled={saving}
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      interestPeriod: event.target.value as InterestPeriod,
                    }))
                  }
                >
                  <option value="Day">Per day</option>
                  <option value="Week">Per week</option>
                  <option value="Month">Per month</option>
                </select>
              </FormField>

              <FormField label="Number of periods" htmlFor="money-due-interest-periods">
                <input
                  id="money-due-interest-periods"
                  type="number"
                  min="1"
                  step="1"
                  value={form.interestPeriods}
                  placeholder="Example: 5"
                  disabled={saving}
                  required
                  onChange={(event) =>
                    onChange((current) => ({
                      ...current,
                      interestPeriods: event.target.value,
                    }))
                  }
                />
              </FormField>

              <div className="money-due-interest-preview">
                <div>
                  <span>Principal</span>
                  <strong>₹{principalAmount.toLocaleString("en-IN")}</strong>
                </div>
                <div>
                  <span>Interest</span>
                  <strong>
                    ₹{calculatedInterest.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>
                <div>
                  <span>Total due</span>
                  <strong>
                    ₹{calculatedTotal.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>
                <small>
                  {interestRate || 0}% per {form.interestPeriod.toLowerCase()} × {" "}
                  {interestPeriods || 0} period{interestPeriods === 1 ? "" : "s"}
                </small>
              </div>
            </>
          ) : (
            <FormField label="Total amount" htmlFor="money-due-amount">
              <input
                id="money-due-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.totalAmount}
                placeholder="0"
                disabled={saving}
                required
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    totalAmount: event.target.value,
                  }))
                }
              />
            </FormField>
          )}

          <FormField label="Category" htmlFor="money-due-category">
            <select
              id="money-due-category"
              value={form.category}
              disabled={saving}
              required
              onChange={(event) =>
                onChange((current) => ({
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
              {MONEY_DUE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </FormField>

          {form.category === "Other" && (
            <FormField label="Other description" htmlFor="money-due-other-description">
              <input
                id="money-due-other-description"
                type="text"
                value={form.otherDescription}
                placeholder="Describe the category"
                disabled={saving}
                required
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    otherDescription: event.target.value,
                  }))
                }
              />
            </FormField>
          )}

          <FormField label="Due date" htmlFor="money-due-date">
            <input
              id="money-due-date"
              type="date"
              value={form.dueDate}
              disabled={saving}
              required
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField label="Remind before" htmlFor="money-due-reminder">
            <select
              id="money-due-reminder"
              value={form.reminderDaysBefore}
              disabled={saving}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  reminderDaysBefore: event.target.value,
                }))
              }
            >
              <option value="0">On due date</option>
              <option value="1">1 day before</option>
              <option value="2">2 days before</option>
              <option value="3">3 days before</option>
              <option value="5">5 days before</option>
              <option value="7">7 days before</option>
              <option value="14">14 days before</option>
              <option value="30">30 days before</option>
            </select>
          </FormField>

          <FormField label="Description (optional)" htmlFor="money-due-description" wide>
            <textarea
              id="money-due-description"
              value={form.description}
              placeholder="Add useful details about this payment"
              disabled={saving}
              rows={3}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </FormField>

          {error && <FormError message={error} />}

          <div className="money-due-modal-actions">
            <button
              type="button"
              className="money-due-cancel-button"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="money-due-submit-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingItem
                  ? "Update Money Due"
                  : form.dueType === "Receivable"
                    ? "Add Receivable"
                    : "Add Payable"}
            </button>
          </div>
        </form>
      </section>
    </ModalBackdrop>
  );
}

type SettlementModalProps = {
  item: MoneyDue;
  editingSettlement: MoneyDueSettlement | null;
  form: SettlementFormState;
  saving: boolean;
  error: string;
  formatMoney: (amount: number) => string;
  onChange: React.Dispatch<React.SetStateAction<SettlementFormState>>;
  onSubmit: (event: React.FormEvent) => Promise<void>;
  onClose: () => void;
};

function SettlementModal({
  item,
  editingSettlement,
  form,
  saving,
  error,
  formatMoney,
  onChange,
  onSubmit,
  onClose,
}: SettlementModalProps) {
  const isReceivable = item.dueType === "Receivable";

  return (
    <ModalBackdrop saving={saving} onClose={onClose}>
      <section
        className="money-due-modal money-due-settlement-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="money-due-settlement-title"
      >
        <ModalHeader
          eyebrow={
            editingSettlement
              ? "Update settlement"
              : isReceivable
                ? "Record receipt"
                : "Record payment"
          }
          title={editingSettlement ? "Edit Settlement" : item.title}
          description={
            editingSettlement
              ? "Correct the amount, date, or description of this settlement."
              : isReceivable
                ? "Record the amount received for this receivable."
                : "Record the amount paid for this payable."
          }
          disabled={saving}
          onClose={onClose}
        />

        <CompactAmountSummary item={item} formatMoney={formatMoney} />

        <form className="money-due-create-form" onSubmit={onSubmit}>
          <FormField
            label={isReceivable ? "Amount received" : "Amount paid"}
            htmlFor="settlement-amount"
          >
            <input
              id="settlement-amount"
              type="number"
              min="0.01"
              max={
                editingSettlement
                  ? item.remainingAmount + editingSettlement.amount
                  : item.remainingAmount
              }
              step="0.01"
              value={form.amount}
              placeholder="0"
              disabled={saving}
              required
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField label="Settlement date" htmlFor="settlement-date">
            <input
              id="settlement-date"
              type="date"
              value={form.settlementDate}
              disabled={saving}
              required
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  settlementDate: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField
            label="Description (optional)"
            htmlFor="settlement-description"
            wide
          >
            <textarea
              id="settlement-description"
              rows={3}
              value={form.description}
              disabled={saving}
              placeholder={
                isReceivable
                  ? "Example: First installment received by bank transfer"
                  : "Example: Partial payment made through UPI"
              }
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </FormField>

          {error && <FormError message={error} />}

          <div className="money-due-modal-actions">
            <button
              type="button"
              className="money-due-cancel-button"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="money-due-submit-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingSettlement
                  ? "Update Settlement"
                  : isReceivable
                    ? "Record Receipt"
                    : "Record Payment"}
            </button>
          </div>
        </form>
      </section>
    </ModalBackdrop>
  );
}

type HistoryModalProps = {
  item: MoneyDue;
  formatMoney: (amount: number) => string;
  deletingSettlementId: string | null;
  notice: NoticeState;
  onDismissNotice: () => void;
  onClose: () => void;
  onRecordAnother: () => void;
  onEditSettlement: (settlement: MoneyDueSettlement) => void;
  onDeleteSettlement: (settlement: MoneyDueSettlement) => void;
};

function HistoryModal({
  item,
  formatMoney,
  deletingSettlementId,
  notice,
  onDismissNotice,
  onClose,
  onRecordAnother,
  onEditSettlement,
  onDeleteSettlement,
}: HistoryModalProps) {
  const isReceivable = item.dueType === "Receivable";
  const settlements = [...(item.settlements ?? [])].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime()
  );

  return (
    <ModalBackdrop saving={Boolean(deletingSettlementId)} onClose={onClose}>
      <section
        className="money-due-modal money-due-history-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="money-due-history-title"
      >
        <ModalHeader
          eyebrow="Settlement history"
          title={item.title}
          description={
            isReceivable
              ? "Review every receipt recorded for this receivable."
              : "Review every payment recorded for this payable."
          }
          disabled={Boolean(deletingSettlementId)}
          onClose={onClose}
        />

        {notice && (
          <div
            className={`money-due-notice money-due-notice-${notice.type} money-due-history-notice`}
            role="status"
          >
            <span>{notice.type === "success" ? "✓" : "!"}</span>
            <p>{notice.message}</p>
            <button
              type="button"
              aria-label="Close message"
              onClick={onDismissNotice}
            >
              ×
            </button>
          </div>
        )}

        <CompactAmountSummary item={item} formatMoney={formatMoney} />

        {settlements.length > 0 ? (
          <div className="money-due-history-list">
            {settlements.map((settlement) => (
              <article className="money-due-history-item" key={settlement.id}>
                <div className="money-due-history-icon">
                  {isReceivable ? "↙" : "↗"}
                </div>

                <div className="money-due-history-copy">
                  <strong className="money-due-history-amount">
                    {formatMoney(settlement.amount)}
                  </strong>

                  <p>
                    {settlement.description?.trim() ||
                      (isReceivable
                        ? "Receipt recorded."
                        : "Payment recorded.")}
                  </p>

                  <div className="money-due-history-dates">
                    <small>
                      {isReceivable ? "Received on " : "Paid on "}
                      {new Date(settlement.settlementDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </small>

                    <small>
                      Added to MoneyCoachAI{" "}
                      {new Date(settlement.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                </div>

                <div className="money-due-history-actions">
                  <div className="money-due-history-desktop-actions">
                    <button
                      type="button"
                      className="history-edit-button"
                      disabled={Boolean(deletingSettlementId)}
                      onClick={() => onEditSettlement(settlement)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="history-delete-button"
                      disabled={deletingSettlementId === settlement.id}
                      onClick={() => onDeleteSettlement(settlement)}
                    >
                      {deletingSettlementId === settlement.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>

                  <details className="money-due-history-mobile-menu">
                    <summary aria-label="Settlement actions">⋮</summary>
                    <div>
                      <button
                        type="button"
                        disabled={Boolean(deletingSettlementId)}
                        onClick={() => onEditSettlement(settlement)}
                      >
                        Edit Settlement
                      </button>
                      <button
                        type="button"
                        className="danger"
                        disabled={deletingSettlementId === settlement.id}
                        onClick={() => onDeleteSettlement(settlement)}
                      >
                        {deletingSettlementId === settlement.id
                          ? "Deleting..."
                          : "Delete Settlement"}
                      </button>
                    </div>
                  </details>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="money-due-history-empty">
            <div>🧾</div>
            <h3>No settlement history yet</h3>
            <p>
              {isReceivable
                ? "Record the first amount received to start the settlement history."
                : "Record the first amount paid to start the settlement history."}
            </p>
          </div>
        )}

        <div className="money-due-history-footer">
          <button
            type="button"
            className="money-due-cancel-button"
            disabled={Boolean(deletingSettlementId)}
            onClick={onClose}
          >
            Close
          </button>
          {item.status !== "Completed" && (
            <button
              type="button"
              className="money-due-submit-button"
              disabled={Boolean(deletingSettlementId)}
              onClick={onRecordAnother}
            >
              {isReceivable
                ? "Record Another Receipt"
                : "Record Another Payment"}
            </button>
          )}
        </div>
      </section>
    </ModalBackdrop>
  );
}

function CompactAmountSummary({
  item,
  formatMoney,
}: {
  item: MoneyDue;
  formatMoney: (amount: number) => string;
}) {
  return (
    <div className="money-due-compact-summary">
      <div>
        <span>Total amount</span>
        <strong>{formatMoney(item.totalAmount)}</strong>
      </div>
      <div>
        <span>{item.dueType === "Receivable" ? "Received" : "Paid"}</span>
        <strong>{formatMoney(item.settledAmount)}</strong>
      </div>
      <div>
        <span>Remaining</span>
        <strong>{formatMoney(item.remainingAmount)}</strong>
      </div>
    </div>
  );
}

function ModalBackdrop({
  saving,
  onClose,
  children,
}: {
  saving: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="money-due-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      {children}
    </div>
  );
}

function ModalHeader({
  eyebrow,
  title,
  description,
  disabled,
  onClose,
}: {
  eyebrow: string;
  title: string;
  description: string;
  disabled: boolean;
  onClose: () => void;
}) {
  return (
    <div className="money-due-modal-header">
      <div>
        <span className="money-due-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <button
        type="button"
        className="money-due-modal-close"
        aria-label="Close"
        disabled={disabled}
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  wide = false,
  children,
}: {
  label: string;
  htmlFor: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`money-due-field ${wide ? "money-due-field-wide" : ""}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <div className="money-due-form-error">
      <span>!</span>
      <p>{message}</p>
    </div>
  );
}

const moneyDueStyles = `
  .money-due-page,
  .money-due-page * { box-sizing: border-box; }

  .money-due-page {
    width: 100%;
    padding: 26px 1% 38px;
    color: #111827;
  }

  .money-due-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  }

  .money-due-eyebrow {
    color: #6d5dfc;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .money-due-header h1 {
    margin: 7px 0 0;
    font-size: clamp(2rem, 3.2vw, 2.75rem);
    letter-spacing: -0.045em;
  }

  .money-due-header h1 span {
    margin-left: 0.18em;
    color: #64748b;
    font-size: 0.55em;
    word-spacing: 0.12em;
  }

  .money-due-header p {
    max-width: 780px;
    margin: 10px 0 0;
    color: #64748b;
    line-height: 1.65;
  }

  .money-due-primary-button,
  .money-due-submit-button {
    border: 0;
    background: linear-gradient(135deg, #5b8cff, #7b61ff);
    color: white;
    box-shadow: 0 12px 28px rgba(91, 140, 255, 0.25);
  }

  .money-due-primary-button {
    min-height: 46px;
    padding: 0 18px;
    border-radius: 14px;
    cursor: pointer;
    font: inherit;
    font-weight: 900;
    white-space: nowrap;
  }

  .money-due-notice {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 18px;
    padding: 12px 14px;
    border: 1px solid;
    border-radius: 13px;
    font-size: 0.8rem;
    font-weight: 800;
  }

  .money-due-notice-success {
    border-color: rgba(33, 199, 122, 0.24);
    background: rgba(33, 199, 122, 0.09);
    color: #087f5b;
  }

  .money-due-notice-error {
    border-color: rgba(239, 68, 68, 0.24);
    background: rgba(239, 68, 68, 0.09);
    color: #b91c1c;
  }

  .money-due-notice > span {
    display: grid;
    place-items: center;
    width: 25px;
    height: 25px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: currentColor;
    color: white;
  }

  .money-due-notice p { flex: 1; margin: 0; }
  .money-due-notice button {
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 1.1rem;
  }

  .money-due-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-top: 22px;
  }

  .money-due-summary-card {
    min-height: 125px;
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, 0.75);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.66);
    box-shadow:
      0 12px 32px rgba(15, 23, 42, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  .money-due-summary-icon {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    margin-bottom: 12px;
    border-radius: 13px;
    background: var(--summary-background);
    color: var(--summary-color);
    font-size: 1.1rem;
    font-weight: 900;
  }

  .summary-receivable {
    --summary-background: rgba(33, 199, 122, 0.13);
    --summary-color: #0f9f63;
  }

  .summary-payable {
    --summary-background: rgba(255, 100, 103, 0.13);
    --summary-color: #e5484d;
  }

  .summary-overdue {
    --summary-background: rgba(239, 68, 68, 0.13);
    --summary-color: #dc2626;
  }

  .summary-soon {
    --summary-background: rgba(245, 158, 11, 0.14);
    --summary-color: #d97706;
  }

  .money-due-summary-card > span {
    color: #64748b;
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .money-due-summary-card > strong {
    display: block;
    margin-top: 5px;
    font-size: 1.55rem;
  }

  .money-due-content { margin-top: 26px; }

  .money-due-tabs {
    display: inline-flex;
    gap: 7px;
    padding: 5px;
    border-radius: 14px;
    background: rgba(148, 163, 184, 0.1);
  }

  .money-due-tabs button {
    min-height: 39px;
    padding: 0 18px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    font: inherit;
    font-weight: 900;
  }

  .money-due-tabs button.active {
    background: white;
    box-shadow: 0 7px 18px rgba(15, 23, 42, 0.08);
  }

  .money-due-tabs button.active.receivable { color: #0f9f63; }
  .money-due-tabs button.active.payable { color: #e5484d; }
  .money-due-tabs button.active.interest { color: #7c5cfc; }

  .money-due-toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 210px;
    gap: 12px;
    margin-top: 17px;
  }

  .money-due-toolbar input,
  .money-due-toolbar select,
  .money-due-field input,
  .money-due-field select,
  .money-due-field textarea {
    width: 100%;
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 12px;
    outline: none;
    background: rgba(255, 255, 255, 0.78);
    color: #1e293b;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 700;
  }

  .money-due-toolbar input,
  .money-due-toolbar select,
  .money-due-field input,
  .money-due-field select {
    min-height: 45px;
    padding: 0 12px;
  }

  .money-due-field textarea {
    min-height: 90px;
    padding: 12px;
    resize: vertical;
  }

  .money-due-toolbar input:focus,
  .money-due-toolbar select:focus,
  .money-due-field input:focus,
  .money-due-field select:focus,
  .money-due-field textarea:focus {
    border-color: #6d5dfc;
    box-shadow: 0 0 0 4px rgba(109, 93, 252, 0.1);
  }

  .money-due-card-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: 16px;
    margin-top: 18px;
  }

  .money-due-card {
    min-width: 0;
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, 0.76);
    border-radius: 19px;
    background: rgba(255, 255, 255, 0.68);
    box-shadow:
      0 10px 28px rgba(15, 23, 42, 0.055),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  .money-due-receivable { border-left: 5px solid #21c77a; }
  .money-due-payable { border-left: 5px solid #ff6467; }

  .money-due-card-head,
  .money-due-amount-row,
  .money-due-progress-head,
  .money-due-details,
  .money-due-card-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .money-due-card-title { min-width: 0; }

  .money-due-category {
    display: block;
    margin-bottom: 5px;
    color: #7c5cfc;
    font-size: 0.65rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .money-due-card h3 { margin: 0; }

  .money-due-card-head p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 0.8rem;
    line-height: 1.45;
  }

  .money-due-status {
    flex: 0 0 auto;
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 900;
  }

  .status-pending {
    background: rgba(100, 116, 139, 0.12);
    color: #475569;
  }

  .status-partially-settled {
    background: rgba(79, 124, 255, 0.12);
    color: #315fda;
  }

  .status-completed {
    background: rgba(33, 199, 122, 0.12);
    color: #087f5b;
  }

  .status-overdue {
    background: rgba(239, 68, 68, 0.12);
    color: #b91c1c;
  }


  .money-due-amount-row {
    margin-top: 18px;
    padding: 14px 0;
    border-top: 1px solid rgba(148, 163, 184, 0.15);
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  }

  .money-due-amount-row span,
  .money-due-details span {
    display: block;
    color: #94a3b8;
    font-size: 0.68rem;
    font-weight: 800;
  }

  .money-due-amount-row strong,
  .money-due-details strong {
    display: block;
    margin-top: 4px;
  }

  .money-due-progress { margin-top: 16px; }

  .money-due-progress-track {
    height: 9px;
    margin-top: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.15);
  }

  .money-due-progress-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #5b8cff, #7b61ff);
  }

  .money-due-progress small {
    display: block;
    margin-top: 7px;
    color: #64748b;
  }

  .money-due-details { margin-top: 17px; }

  .money-due-card-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
    margin-top: 18px;
  }

  .money-due-card-actions button,
  .money-due-modal-actions button,
  .money-due-history-footer button {
    min-height: 40px;
    padding: 0 14px;
    border-radius: 11px;
    cursor: pointer;
    font: inherit;
    font-size: 0.75rem;
    font-weight: 900;
  }

  .money-due-interest-details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 14px;
    padding: 12px;
    border: 1px solid rgba(124, 92, 252, 0.16);
    border-radius: 14px;
    background: rgba(124, 92, 252, 0.06);
  }

  .money-due-interest-details span,
  .money-due-interest-details strong {
    display: block;
  }

  .money-due-interest-details span {
    color: #64748b;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .money-due-interest-details strong {
    margin-top: 4px;
    color: #172033;
    font-size: 0.9rem;
  }

  .money-due-interest-details small {
    grid-column: 1 / -1;
    color: #6d5dfc;
    font-size: 0.68rem;
    font-weight: 800;
  }

  .money-due-settlement-button {
    border: 0;
    background: linear-gradient(135deg, #5b8cff, #7b61ff);
    color: white;
  }

  .money-due-history-button {
    border: 1px solid rgba(124, 92, 252, 0.2);
    background: rgba(124, 92, 252, 0.08);
    color: #6547d8;
  }

  .money-due-edit-button {
    border: 1px solid rgba(79, 124, 255, 0.24);
    background: rgba(79, 124, 255, 0.09);
    color: #315fda;
  }


  .money-due-delete-button {
    border: 1px solid rgba(239, 68, 68, 0.2);
    background: rgba(239, 68, 68, 0.08);
    color: #dc2626;
  }

  .money-due-card-actions button:disabled,
  .money-due-modal-actions button:disabled,
  .money-due-modal-close:disabled {
    cursor: not-allowed;
    opacity: 0.52;
  }

  .money-due-state {
    display: grid;
    place-items: center;
    min-height: 280px;
    padding: 30px;
    text-align: center;
  }

  .money-due-state h3 { margin: 14px 0 0; }

  .money-due-state p {
    max-width: 460px;
    margin: 7px 0 0;
    color: #64748b;
    line-height: 1.6;
  }

  .money-due-state-icon {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    border-radius: 17px;
    background: rgba(109, 93, 252, 0.1);
    color: #6d5dfc;
    font-size: 1.4rem;
    font-weight: 900;
  }

  .money-due-loader {
    width: 38px;
    height: 38px;
    border: 3px solid rgba(109, 93, 252, 0.18);
    border-top-color: #6d5dfc;
    border-radius: 50%;
    animation: money-due-spin 0.75s linear infinite;
  }

  .money-due-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgba(15, 23, 42, 0.42);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .money-due-modal {
    width: min(820px, 100%);
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 0.82);
    border-radius: 24px;
    background: linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.96),
      rgba(244, 242, 255, 0.94)
    );
    box-shadow:
      0 28px 70px rgba(15, 23, 42, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 1);
  }

  .money-due-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  }

  .money-due-modal-header h2 {
    margin: 6px 0 0;
    color: #172033;
    font-size: 1.45rem;
  }

  .money-due-modal-header p {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 0.82rem;
    line-height: 1.5;
  }

  .money-due-modal-close {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.72);
    color: #64748b;
    cursor: pointer;
    font-size: 1.3rem;
  }

  .money-due-create-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    padding-top: 20px;
  }

  .money-due-field { min-width: 0; }
  .money-due-field-wide { grid-column: 1 / -1; }

  .money-due-field label {
    display: block;
    margin: 0 0 7px 2px;
    color: #475569;
    font-size: 0.73rem;
    font-weight: 900;
  }

  .money-due-interest-toggle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 7px;
    padding: 5px;
    border-radius: 12px;
    background: rgba(148, 163, 184, 0.1);
  }

  .money-due-interest-toggle button {
    min-height: 38px;
    padding: 0 10px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    font: inherit;
    font-size: 0.74rem;
    font-weight: 900;
  }

  .money-due-interest-toggle button.active {
    background: white;
    color: #6547d8;
    box-shadow: 0 7px 18px rgba(15, 23, 42, 0.08);
  }

  .money-due-interest-toggle button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .money-due-interest-preview {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 16px;
    border: 1px solid rgba(124, 92, 252, 0.18);
    border-radius: 16px;
    background: rgba(124, 92, 252, 0.07);
  }

  .money-due-interest-preview > div {
    min-width: 0;
    text-align: center;
  }

  .money-due-interest-preview span,
  .money-due-interest-preview strong {
    display: block;
  }

  .money-due-interest-preview span {
    color: #64748b;
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .money-due-interest-preview strong {
    margin-top: 5px;
    color: #172033;
    font-size: 1rem;
    overflow-wrap: anywhere;
  }

  .money-due-interest-preview small {
    grid-column: 1 / -1;
    display: block;
    text-align: center;
    color: #6d5dfc;
    font-size: 0.72rem;
    font-weight: 800;
  }

  .money-due-form-error {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 13px;
    border: 1px solid rgba(239, 68, 68, 0.22);
    border-radius: 12px;
    background: rgba(239, 68, 68, 0.08);
    color: #b91c1c;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .money-due-form-error span {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #ef4444;
    color: white;
  }

  .money-due-form-error p { margin: 0; }

  .money-due-modal-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 4px;
  }

  .money-due-cancel-button {
    border: 1px solid rgba(148, 163, 184, 0.26);
    background: rgba(255, 255, 255, 0.7);
    color: #64748b;
  }

  .money-due-settlement-modal { width: min(680px, 100%); }
  .money-due-history-modal { width: min(720px, 100%); }

  .money-due-compact-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
    margin: 18px 0 4px;
    padding: 0 2px 16px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  }

  .money-due-compact-summary > div { min-width: 0; text-align: center; }

  .money-due-compact-summary span,
  .money-due-compact-summary strong { display: block; }

  .money-due-compact-summary span {
    color: #64748b;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .money-due-compact-summary strong {
    margin-top: 5px;
    color: #172033;
    font-size: 1.05rem;
    overflow-wrap: anywhere;
  }

  .money-due-history-list {
    display: grid;
    gap: 11px;
    max-height: 380px;
    margin-top: 18px;
    padding-right: 5px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #7c5cfc rgba(255, 255, 255, 0.3);
  }

  .money-due-history-list::-webkit-scrollbar { width: 7px; }
  .money-due-history-list::-webkit-scrollbar-track {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.3);
  }
  .money-due-history-list::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: linear-gradient(180deg, #5b8cff, #7b61ff);
  }

  .money-due-history-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
    border: 1px solid rgba(255, 255, 255, 0.78);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.6);
  }

  .money-due-history-icon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    border-radius: 13px;
    background: rgba(124, 92, 252, 0.11);
    color: #6d5dfc;
    font-size: 1rem;
    font-weight: 900;
  }

  .money-due-history-copy { min-width: 0; flex: 1; }

  .money-due-history-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .money-due-history-row strong {
    color: #172033;
    font-size: 0.96rem;
  }

  .money-due-history-row span {
    color: #64748b;
    font-size: 0.72rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .money-due-history-copy p {
    margin: 6px 0 0;
    color: #475569;
    font-size: 0.78rem;
    line-height: 1.5;
  }

  .money-due-history-copy small {
    display: block;
    margin-top: 6px;
    color: #94a3b8;
    font-size: 0.66rem;
  }

  .money-due-history-notice {
    margin-top: 16px;
  }

  .money-due-history-amount {
    display: block;
    color: #172033;
    font-size: 0.96rem;
  }

  .money-due-history-actions {
    flex: 0 0 auto;
    margin-left: auto;
  }

  .money-due-history-desktop-actions {
    display: flex;
    gap: 7px;
  }

  .money-due-history-desktop-actions button {
    min-height: 34px;
    padding: 0 11px;
    border-radius: 9px;
    cursor: pointer;
    font: inherit;
    font-size: 0.7rem;
    font-weight: 900;
  }

  .history-edit-button {
    border: 1px solid rgba(79, 124, 255, 0.22);
    background: rgba(79, 124, 255, 0.08);
    color: #315fda;
  }

  .history-delete-button {
    border: 1px solid rgba(239, 68, 68, 0.2);
    background: rgba(239, 68, 68, 0.08);
    color: #dc2626;
  }



  .money-due-history-mobile-menu {
    position: relative;
    display: none;
  }

  .money-due-history-mobile-menu summary {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.75);
    color: #475569;
    cursor: pointer;
    font-size: 1.2rem;
    font-weight: 900;
    list-style: none;
  }

  .money-due-history-mobile-menu summary::-webkit-details-marker {
    display: none;
  }

  .money-due-history-mobile-menu > div {
    position: absolute;
    top: 40px;
    right: 0;
    z-index: 20;
    display: grid;
    min-width: 165px;
    padding: 6px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    background: white;
    box-shadow: 0 15px 35px rgba(15, 23, 42, 0.18);
  }

  .money-due-history-mobile-menu button {
    min-height: 38px;
    padding: 0 10px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #334155;
    text-align: left;
    cursor: pointer;
    font: inherit;
    font-size: 0.72rem;
    font-weight: 800;
  }

  .money-due-history-mobile-menu button:hover {
    background: rgba(124, 92, 252, 0.08);
  }

  .money-due-history-mobile-menu button.danger {
    color: #dc2626;
  }

  .money-due-history-empty {
    display: grid;
    place-items: center;
    min-height: 230px;
    margin-top: 18px;
    padding: 24px;
    border: 1px dashed rgba(124, 92, 252, 0.24);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.45);
    text-align: center;
  }

  .money-due-history-empty > div { font-size: 2rem; }
  .money-due-history-empty h3 { margin: 12px 0 0; }

  .money-due-history-empty p {
    max-width: 430px;
    margin: 7px 0 0;
    color: #64748b;
    font-size: 0.8rem;
    line-height: 1.55;
  }

  .money-due-history-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid rgba(148, 163, 184, 0.18);
  }

  .money-due-history-dates {
    display: grid;
    gap: 3px;
    margin-top: 7px;
  }

  .money-due-history-dates small {
    margin-top: 0;
  }

  .money-due-history-dates small:first-child {
    color: #64748b;
    font-weight: 800;
  }

  .money-due-history-dates small:last-child {
    color: #94a3b8;
    font-size: 0.62rem;
  }

  @keyframes money-due-spin { to { transform: rotate(360deg); } }

  @media (max-width: 1100px) {
    .money-due-summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .money-due-card-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 700px) {
    .money-due-page { padding: 18px 6px 28px; }
    .money-due-header { flex-direction: column; }
    .money-due-primary-button { width: 100%; }

    .money-due-header h1 span {
      display: block;
      margin-top: 7px;
      font-size: 0.48em;
    }

    .money-due-toolbar { grid-template-columns: 1fr; }

    .money-due-tabs {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      width: 100%;
    }

    .money-due-card-head { align-items: flex-start; }

    .money-due-history-desktop-actions {
      display: none;
    }

    .money-due-history-mobile-menu {
      display: block;
    }

    .money-due-history-item {
      position: relative;
    }

    .money-due-history-actions {
      align-self: flex-start;
    }

    .money-due-modal-backdrop {
      align-items: end;
      padding: 10px 6px;
    }

    .money-due-modal {
      max-height: calc(100vh - 20px);
      padding: 18px 13px;
      border-radius: 22px 22px 16px 16px;
    }

    .money-due-create-form { grid-template-columns: 1fr; }

    .money-due-interest-preview {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 7px;
      padding: 13px 8px;
    }

    .money-due-interest-preview span { font-size: 0.58rem; }
    .money-due-interest-preview strong { font-size: 0.85rem; }
    .money-due-field-wide { grid-column: auto; }

    .money-due-modal-actions,
    .money-due-history-footer {
      grid-column: auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .money-due-modal-actions button,
    .money-due-history-footer button { width: 100%; padding: 0 8px; }

    .money-due-compact-summary {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    .money-due-compact-summary span { font-size: 0.6rem; }
    .money-due-compact-summary strong { font-size: 0.92rem; }
  }

  @media (max-width: 480px) {
    .money-due-summary-grid { gap: 9px; }

    .money-due-summary-card {
      min-height: 110px;
      padding: 14px;
    }

    .money-due-card { padding: 15px 13px; }

    .money-due-amount-row,
    .money-due-details { align-items: flex-start; }

    .money-due-card-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .money-due-card-actions button { width: 100%; padding: 0 8px; }

    .money-due-compact-summary {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 5px;
      padding-left: 0;
      padding-right: 0;
    }

    .money-due-compact-summary span {
      font-size: 0.54rem;
      letter-spacing: 0.02em;
    }

    .money-due-compact-summary strong { font-size: 0.82rem; }
  }
`;

export default MoneyDuePage;