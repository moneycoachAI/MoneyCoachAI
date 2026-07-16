import { useEffect, useMemo, useState } from "react";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import AppLayout from "../components/AppLayout";

import {
    createInvestment,
    deleteInvestment,
    updateInvestmentCurrentValue,
    getInvestmentAllocation,
    getInvestments,
    getInvestmentSummary
} from "../services/investmentService";

import type {
  Investment,
  InvestmentAllocation,
  InvestmentSummary,
} from "../types/investmentTypes";

const investmentTypes = [
  "Mutual Fund",
  "Stock",
  "Gold",
  "FD",
  "Crypto",
  "Other",
];

const allocationColors = [
  "#4F7CFF",
  "#7C5CFC",
  "#21C77A",
  "#FFB547",
  "#FF6467",
  "#38BDF8",
];

function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] =
    useState<InvestmentSummary | null>(null);

  const [allocation, setAllocation] = useState<
    InvestmentAllocation[]
  >([]);

  const [name, setName] = useState("");
  const [type, setType] = useState("Mutual Fund");
  const [customType, setCustomType] = useState("");
  const [investedAmount, setInvestedAmount] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [investmentDate, setInvestmentDate] = useState("");

  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sortOption, setSortOption] = useState<
    "Newest" | "HighestValue" | "HighestReturn"
  >("Newest");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingInvestmentId, setEditingInvestmentId] =
    useState<string | null>(null);

  const [editingCurrentValue, setEditingCurrentValue] =
      useState("");

  const [deletingInvestmentId, setDeletingInvestmentId] =
    useState<string | null>(null);

  const [openActionMenuId, setOpenActionMenuId] =
    useState<string | null>(null);

  const loadInvestments = async () => {
    try {
      const [
        investmentData,
        summaryData,
        allocationData,
      ] = await Promise.all([
        getInvestments(),
        getInvestmentSummary(),
        getInvestmentAllocation(),
      ]);

      setInvestments(investmentData);
      setSummary(summaryData);
      setAllocation(allocationData);
    } catch (error) {
      console.error("Failed to load investments:", error);
      alert("Failed to load investments");
    }
  };

  useEffect(() => {
    const loadInitialInvestments = async () => {
      try {
        const [
          investmentData,
          summaryData,
          allocationData,
        ] = await Promise.all([
          getInvestments(),
          getInvestmentSummary(),
          getInvestmentAllocation(),
        ]);

        setInvestments(investmentData);
        setSummary(summaryData);
        setAllocation(allocationData);
      } catch (error) {
        console.error(
          "Failed to load investments:",
          error
        );

        alert("Failed to load investments");
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(() => {
      void loadInitialInvestments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setName("");
    setType("Mutual Fund");
    setCustomType("");
    setInvestedAmount("");
    setCurrentValue("");
    setInvestmentDate("");
  };

  const startEditingInvestment = (
    investment: Investment
  ) => {
      setEditingInvestmentId(investment.id);

      setEditingCurrentValue(
          investment.currentValue.toString()
      );
  };

  const cancelEditingInvestment = () => {
    setEditingInvestmentId(null);

      setEditingCurrentValue("");
  };

  const saveCurrentValue = async (
      investmentId: string
  ) => {

      if (
          Number(editingCurrentValue) < 0
      ) {
          alert("Invalid value");
          return;
      }

      try {

          await updateInvestmentCurrentValue(
              investmentId,
              Number(editingCurrentValue)
          );

          cancelEditingInvestment();

          await loadInvestments();

      } catch {

          alert("Failed to update investment.");

      }

  };

  const handleCreateInvestment = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      alert("Please enter an investment name");
      return;
    }

    if (!investedAmount || Number(investedAmount) <= 0) {
      alert("Please enter a valid invested amount");
      return;
    }

    if (!currentValue || Number(currentValue) < 0) {
      alert("Please enter a valid current value");
      return;
    }

    if (!investmentDate) {
      alert("Please select an investment date");
      return;
    }

    const finalType =
      type === "Other" ? customType.trim() : type;

    if (!finalType) {
      alert("Please enter the custom investment type");
      return;
    }

    try {
      setSaving(true);

      await createInvestment({
        name: name.trim(),
        type: finalType,
        investedAmount: Number(investedAmount),
        currentValue: Number(currentValue),
        investmentDate,
      });

      resetForm();
      await loadInvestments();

      alert("Investment added successfully");
    } catch (error) {
      console.error(
        "Failed to create investment:",
        error
      );

      alert("Failed to add investment");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvestment = async (
    investmentId: string
  ) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this investment?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingInvestmentId(investmentId);
      setOpenActionMenuId(null);

      await deleteInvestment(investmentId);

      await loadInvestments();

      alert("Investment deleted successfully");
    } catch (error) {
      console.error(
        "Failed to delete investment:",
        error
      );

      alert("Failed to delete investment");
    } finally {
      setDeletingInvestmentId(null);
    }
  };

  const filteredInvestments = useMemo(() => {
    const normalizedSearch =
      searchText.trim().toLowerCase();

    const filtered = investments.filter((investment) => {
      const matchesSearch =
        !normalizedSearch ||
        investment.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        investment.type
          .toLowerCase()
          .includes(normalizedSearch) ||
        investment.investedAmount
          .toString()
          .includes(normalizedSearch) ||
        investment.currentValue
          .toString()
          .includes(normalizedSearch);

      const matchesType =
        !filterType || investment.type === filterType;

      return matchesSearch && matchesType;
    });

    return [...filtered].sort(
      (firstInvestment, secondInvestment) => {
        if (sortOption === "HighestValue") {
          return (
            secondInvestment.currentValue -
            firstInvestment.currentValue
          );
        }

        if (sortOption === "HighestReturn") {
          return (
            secondInvestment.profitOrLossPercentage -
            firstInvestment.profitOrLossPercentage
          );
        }

        return (
          new Date(
            secondInvestment.investmentDate
          ).getTime() -
          new Date(
            firstInvestment.investmentDate
          ).getTime()
        );
      }
    );
  }, [
    filterType,
    investments,
    searchText,
    sortOption,
  ]);

  const availableTypes = useMemo(() => {
    return Array.from(
      new Set(investments.map((investment) => investment.type))
    ).sort((firstType, secondType) =>
      firstType.localeCompare(secondType)
    );
  }, [investments]);

  const formatMoney = (value: number) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getInvestmentIcon = (
    investmentType: string
  ) => {
    const normalizedType =
      investmentType.toLowerCase();

    if (normalizedType.includes("stock")) {
      return "📈";
    }

    if (
      normalizedType.includes("mutual") ||
      normalizedType.includes("fund")
    ) {
      return "📊";
    }

    if (normalizedType.includes("gold")) {
      return "🪙";
    }

    if (
      normalizedType.includes("fd") ||
      normalizedType.includes("deposit")
    ) {
      return "🏦";
    }

    if (
      normalizedType.includes("crypto") ||
      normalizedType.includes("bitcoin")
    ) {
      return "₿";
    }

    if (
      normalizedType.includes("property") ||
      normalizedType.includes("real estate")
    ) {
      return "🏠";
    }

    return "💼";
  };

  const totalProfitOrLoss =
    summary?.totalProfitOrLoss || 0;

  const totalReturnPercentage =
    summary?.profitOrLossPercentage || 0;

  return (
    <AppLayout>
      <style>
        {`
          .investments-page {
            width: 100%;
            max-width: 100%;
            min-width: 0;

            margin: 0;
            padding: 1%;

            box-sizing: border-box;
            background: transparent;
            overflow-x: hidden;
          }

          .investments-header {
            width: 100%;
            margin-bottom: 22px;
          }

          .investments-title {
            margin: 0;

            color: #111827;

            font-size: clamp(30px, 4vw, 42px);
            font-weight: 900;
            line-height: 1.1;
            letter-spacing: -0.8px;
          }

          .investments-subtitle {
            margin: 10px 0 0;

            color: var(--mca-muted);

            font-size: 15px;
            line-height: 1.6;
          }

          /* =========================
             Summary cards
          ========================= */

          .investment-summary-grid {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));

            gap: 18px;
            margin-bottom: 24px;
          }

          .investment-summary-card {
            min-width: 0;
            padding: 20px;
          }

          .investment-summary-icon {
            width: 46px;
            height: 46px;

            display: grid;
            place-items: center;

            margin-bottom: 14px;

            border-radius: 16px;

            font-size: 21px;

            background: rgba(255, 255, 255, 0.68);

            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.95),
              0 8px 20px rgba(49, 66, 104, 0.07);
          }

          .investment-summary-label {
            color: var(--mca-muted);

            font-size: 13px;
            font-weight: 800;
          }

          .investment-summary-value {
            margin-top: 8px;

            color: #111827;

            font-size: 26px;
            font-weight: 900;

            overflow-wrap: anywhere;
          }

          .investment-summary-change {
            display: block;

            margin-top: 7px;

            font-size: 12px;
            font-weight: 800;
          }

          /* =========================
             Shared section headers
          ========================= */

          .investment-section-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;

            gap: 14px;
            margin-bottom: 18px;
          }

          .investment-section-header h2 {
            margin: 0;

            color: #111827;

            font-size: 19px;
            font-weight: 900;
          }

          .investment-section-header p {
            margin: 7px 0 0;

            color: var(--mca-muted);

            font-size: 13px;
            line-height: 1.5;
          }

          /* =========================
             Allocation
          ========================= */

          .investment-allocation-section {
            width: 100%;
            min-width: 0;

            margin-bottom: 28px;
            padding: 22px;

            border:
              1px solid rgba(255, 255, 255, 0.72);

            border-radius: 24px;

            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.76),
                rgba(248, 250, 255, 0.64)
              );

            box-shadow:
              0 12px 32px rgba(49, 66, 104, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);

            overflow: hidden;
          }

          .investment-chart-wrapper {
            width: 100%;
            height: 340px;
            min-width: 0;
          }

          /* =========================
             Form
          ========================= */

          .investment-form-section {
            width: 100%;
            min-width: 0;

            margin-bottom: 28px;
            padding: 6px 2px 22px;

            border-bottom:
              1px solid rgba(17, 24, 39, 0.08);
          }

          .investment-inline-form {
            width: 100%;
            min-width: 0;

            display: grid;
            grid-template-columns:
              minmax(180px, 1.1fr)
              minmax(155px, 0.8fr)
              minmax(155px, 0.8fr)
              minmax(155px, 0.8fr)
              minmax(165px, 0.8fr)
              auto;

            gap: 12px;
            align-items: end;
          }

          .investment-inline-form.has-custom-type {
            grid-template-columns:
              minmax(170px, 1fr)
              minmax(135px, 0.7fr)
              minmax(160px, 0.85fr)
              minmax(140px, 0.72fr)
              minmax(140px, 0.72fr)
              minmax(155px, 0.75fr)
              auto;
          }

          .investment-field {
            min-width: 0;

            display: flex;
            flex-direction: column;

            gap: 7px;
          }

          .investment-field label {
            color: #374151;

            font-size: 13px;
            font-weight: 800;
          }

          .investment-input {
            width: 100%;
            min-width: 0;

            padding: 13px 14px;

            border:
              1px solid rgba(255, 255, 255, 0.72);

            border-radius: 15px;
            outline: none;

            color: #111827;
            background: rgba(255, 255, 255, 0.62);

            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.9);

            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .investment-input:focus {
            border-color: rgba(79, 124, 255, 0.58);

            box-shadow:
              0 0 0 4px rgba(79, 124, 255, 0.11);
          }

          .investment-create-button {
            min-height: 46px;
            white-space: nowrap;
          }

          /* =========================
             Portfolio section
          ========================= */

          .investment-portfolio-section {
            width: 100%;
            max-width: 100%;
            min-width: 0;

            padding: 22px;

            border:
              1px solid rgba(255, 255, 255, 0.7);

            border-radius: 24px;

            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.76),
                rgba(248, 250, 255, 0.64)
              );

            box-shadow:
              0 12px 32px rgba(49, 66, 104, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
          }

          .investment-toolbar {
            width: 100%;
            min-width: 0;

            display: grid;
            grid-template-columns:
              minmax(0, 1fr)
              minmax(170px, 0.35fr)
              minmax(180px, 0.35fr);

            gap: 12px;
            margin-bottom: 18px;
          }

          .investment-list {
            max-height: 680px;

            display: flex;
            flex-direction: column;

            gap: 14px;
            overflow-y: auto;

            padding-right: 5px;

            scrollbar-width: thin;
            scrollbar-color: #bda8ec transparent;
          }

          .investment-list::-webkit-scrollbar {
            width: 7px;
          }

          .investment-list::-webkit-scrollbar-track {
            background: transparent;
          }

          .investment-list::-webkit-scrollbar-thumb {
            border-radius: 999px;

            background:
              linear-gradient(
                180deg,
                #a98bf2,
                #7c5cfc
              );
          }

          .investment-card {
            position: relative;

            width: 100%;
            min-width: 0;

            padding: 18px;

            border:
              1px solid rgba(255, 255, 255, 0.75);

            border-radius: 21px;

            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.72),
                rgba(247, 249, 255, 0.57)
              );

            box-shadow:
              0 9px 24px rgba(49, 66, 104, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);

            overflow: visible;
          }

          .investment-card-main {
            display: grid;
            grid-template-columns:
              minmax(210px, 1.2fr)
              repeat(4, minmax(120px, 0.75fr))
              auto;

            gap: 16px;
            align-items: center;
          }

          .investment-name-area {
            min-width: 0;

            display: flex;
            align-items: center;

            gap: 12px;
          }

          .investment-type-icon {
            width: 46px;
            height: 46px;

            flex-shrink: 0;

            display: grid;
            place-items: center;

            border-radius: 15px;

            font-size: 21px;

            background: rgba(255, 255, 255, 0.72);

            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.95),
              0 8px 18px rgba(49, 66, 104, 0.06);
          }

          .investment-name {
            margin: 0;

            color: #111827;

            font-size: 17px;
            font-weight: 900;

            overflow-wrap: anywhere;
          }

          .investment-type-badge {
            display: inline-flex;

            margin-top: 6px;
            padding: 5px 9px;

            border-radius: 999px;

            color: #6c4dff;
            background: rgba(124, 92, 252, 0.11);

            font-size: 11px;
            font-weight: 800;
          }

          .investment-stat {
            min-width: 0;
          }

          .investment-stat span {
            display: block;

            color: var(--mca-muted);

            font-size: 11px;
            font-weight: 800;
          }

          .investment-stat strong {
            display: block;

            margin-top: 5px;

            color: #111827;

            font-size: 14px;
            font-weight: 900;

            overflow-wrap: anywhere;
          }

          .investment-return-positive {
            color: #16a764 !important;
          }

          .investment-return-negative {
            color: #e5444a !important;
          }

          .investment-delete-button {
            min-height: 40px;

            padding: 9px 13px;

            border: none;
            border-radius: 13px;

            color: #ffffff;

            background:
              linear-gradient(
                135deg,
                #ff6467,
                #e5444a
              );

            font-size: 12px;
            font-weight: 800;

            cursor: pointer;
          }

          .investment-delete-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .investment-mobile-menu {
            display: none;
          }

          /* =========================
             Loading / empty
          ========================= */

          .investment-loading {
            min-height: 320px;

            display: grid;
            place-items: center;

            color: var(--mca-muted);
            font-weight: 800;
          }

          .investment-empty-state {
            min-height: 300px;

            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            padding: 30px;
            text-align: center;
          }

          .investment-empty-icon {
            width: 82px;
            height: 82px;

            display: grid;
            place-items: center;

            border-radius: 28px;

            font-size: 40px;

            background:
              radial-gradient(
                circle,
                rgba(79, 124, 255, 0.18),
                rgba(124, 92, 252, 0.09)
              );
          }

          .investment-empty-state h3 {
            margin: 18px 0 7px;

            color: #111827;

            font-size: 22px;
            font-weight: 900;
          }

          .investment-empty-state p {
            max-width: 450px;
            margin: 0;

            color: var(--mca-muted);

            font-size: 14px;
            line-height: 1.6;
          }

          .investment-update-button {

            height:40px;

            padding:0 18px;

            border:none;

            border-radius:12px;

            cursor:pointer;

            font-weight:700;

            color:white;

            background:
            linear-gradient(
            135deg,
            #5B8CFF,
            #7B61FF
            );

            transition:.25s;

          }

            .investment-update-button:hover{

            transform:translateY(-2px);

            box-shadow:
            0 8px 20px
            rgba(91,140,255,.25);

            }


            .investment-desktop-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

/* Compact update editor */
.investment-value-editor {
  width: 100%;
  min-width: 0;

  display: flex;
  grid-template-columns: minmax(220px, 1fr) auto;
  align-items: flex-end;
  gap: 12px;

  margin-top: 12px;
  padding: 10px 0px;

  border-top: 1px solid rgba(79,124,255,.12);
  border-radius: 14px;

  background: rgba(255, 255, 255, 0.5);
  box-sizing: border-box;
}

.investment-value-editor-field {
  width: 320px;
  min-width: 0;

  display: flex;
  flex-direction: column;
  gap: 6px;
}

.investment-value-editor-field label {
  color: #374151;
  font-size: 12px;
  font-weight: 800;
}

.investment-value-editor-field .investment-input {
  width: 100%;
  min-width: 0;
  height: 40px;

  padding: 0 14px;

  border-radius: 12px;
  font-size: 13px;

  box-sizing: border-box;
}

.investment-value-editor-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.investment-save-button,
.investment-cancel-button {
  min-width: 90px;
  height: 40px;

  padding: 0 16px;

  border: none;
  border-radius: 12px;

  color: #ffffff;
  font-size: 12px;
  font-weight: 800;

  cursor: pointer;
  white-space: nowrap;
}

.investment-save-button {
  background: linear-gradient(
    135deg,
    #21c77a,
    #16a764
  );
}

.investment-cancel-button {
  background: linear-gradient(
    135deg,
    #ff6467,
    #e5444a
  );
}

.investment-save-button:hover,
.investment-cancel-button:hover {
  transform: translateY(-1px);
}
          


          /* =========================
             Responsive tablet
          ========================= */

          @media (max-width: 1280px) {
            .investment-inline-form,
            .investment-inline-form.has-custom-type {
              grid-template-columns:
                repeat(3, minmax(0, 1fr));
            }

            .investment-card-main {
              grid-template-columns:
                minmax(190px, 1.2fr)
                repeat(2, minmax(120px, 0.7fr))
                auto;
            }

            .investment-card-main .investment-stat:nth-child(4),
            .investment-card-main .investment-stat:nth-child(5) {
              grid-row: 2;
            }
          }

          @media (max-width: 900px) {
            .investment-toolbar {
              grid-template-columns: 1fr;
            }

            .investment-card-main {
              grid-template-columns:
                minmax(190px, 1fr)
                repeat(2, minmax(120px, 0.65fr))
                auto;
            }
          }

          /* =========================
             Mobile
          ========================= */

          @media (max-width: 650px) {
            .investments-page {
              width: 100%;
              max-width: 100%;
              min-width: 0;

              margin: 0;
              padding: 0 6px;

              box-sizing: border-box;
              overflow-x: hidden;
            }

            .investments-header {
              padding: 0 6px;
              margin-bottom: 18px;
            }

            .investment-summary-grid {
              width: 100%;

              grid-template-columns:
                repeat(3, minmax(0, 1fr));

              gap: 7px;
              margin-bottom: 18px;
            }

            .investment-summary-card {
              min-width: 0;
              min-height: 0;

              padding: 10px 7px;

              border-radius: 17px;
            }

            .investment-summary-icon {
              width: 31px;
              height: 31px;

              margin-bottom: 7px;

              border-radius: 10px;
              font-size: 15px;
            }

            .investment-summary-label {
              font-size: 8px;
              line-height: 1.25;
            }

            .investment-summary-value {
              margin-top: 5px;

              font-size: 13px;
              line-height: 1.2;
            }

            .investment-summary-change {
              margin-top: 4px;

              font-size: 8px;
              line-height: 1.25;
            }

            .investment-allocation-section {
              padding: 16px 8px;
              border-radius: 20px;
            }

            .investment-chart-wrapper {
              height: 300px;
            }

            .investment-form-section {
              width: 100%;
              max-width: 100%;

              padding: 4px 0 20px;
            }

            .investment-inline-form,
            .investment-inline-form.has-custom-type {
              width: 100%;

              grid-template-columns: 1fr;
              gap: 12px;
            }

            .investment-field,
            .investment-input {
              width: 100%;
              max-width: 100%;
              min-width: 0;
            }

            .investment-create-button {
              width: 100%;
            }

            .investment-portfolio-section {
              width: 100%;
              max-width: 100%;

              padding: 16px 10px;

              border-radius: 20px;
            }

            .investment-toolbar {
              width: 100%;

              grid-template-columns: 1fr;
              gap: 10px;
            }

            .investment-list {
              max-height: 580px;
            }

            .investment-card {
                width: 100%;
                padding: 14px 42px 14px 12px;
                overflow: visible;
            }

            .investment-card-main {
              width: 100%;
              min-width: 0;

              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
              gap: 10px 8px;
            }

            .investment-name-area {
              grid-column: 1;
              grid-row: 1;
            }

            .investment-type-icon {
              width: 38px;
              height: 38px;

              border-radius: 12px;
              font-size: 17px;
            }

            .investment-name {
              font-size: 15px;
            }

            .investment-type-badge {
              margin-top: 4px;

              padding: 4px 7px;

              font-size: 9px;
            }

            .investment-card-main .investment-stat {
              padding: 0;
            }

            .investment-card-main .investment-stat:nth-child(2) {
              grid-column: 2;
              grid-row: 1;

              text-align: right;
            }

            .investment-card-main .investment-stat:nth-child(3) {
              grid-column: 1;
              grid-row: 2;
            }

            .investment-card-main .investment-stat:nth-child(4) {
              grid-column: 2;
              grid-row: 2;

              text-align: right;
            }

            .investment-card-main .investment-stat:nth-child(5) {
              grid-column: 1 / -1;
              grid-row: 3;
            }

            .investment-stat span {
              font-size: 9px;
            }

            .investment-stat strong {
              margin-top: 3px;

              font-size: 12px;
            }

            .investment-delete-button {
              display: none;
            }

            .investment-mobile-menu {
              position: absolute;
              top: 10px;
              right: 8px;

              display: block;
            }

            .investment-menu-trigger {
              width: 32px;
              height: 32px;
              padding: 0;

              display: grid;
              place-items: center;

              border: none;
              border-radius: 11px;

              color: #6c4dff;
              background: rgba(124, 92, 252, 0.12);

              font-size: 22px;
              font-weight: 900;
              line-height: 1;

              cursor: pointer;
            }

            .investment-menu-trigger:hover {
              transform: none;
              background: rgba(124, 92, 252, 0.2);
            }

            .investment-menu-dropdown {
              position: absolute;
              top: 36px;
              right: 0;
              z-index: 40;

              min-width: 135px;
              padding: 6px;

              border:
                1px solid rgba(255, 255, 255, 0.85);

              border-radius: 14px;

              background: rgba(255, 255, 255, 0.97);

              box-shadow:
                0 14px 32px rgba(17, 24, 39, 0.17);

              backdrop-filter: blur(18px);
            }

            .investment-menu-dropdown button {
              width: 100%;

              padding: 9px 10px;

              border: none;
              border-radius: 9px;

              text-align: left;

              color: #e5444a;
              background: transparent;

              font-size: 12px;
              font-weight: 800;

              cursor: pointer;
            }

            .investment-menu-dropdown button:hover {
              transform: none;
              background: rgba(255, 100, 103, 0.09);
            }

            .investment-empty-state {
              min-height: 240px;
              padding: 20px 10px;
            }

            .investment-desktop-actions,
              .investment-update-button,
              .investment-delete-button {
                display: none !important;
              }
            
            .investment-value-editor {
  width: 100%;
  min-width: 0;

  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 9px;

  margin-top: 10px;
  padding: 10px;

  border-radius: 12px;
  box-sizing: border-box;
}

.investment-value-editor-field {
  width: 100%;
  min-width: 0;
}

.investment-value-editor-field label {
  font-size: 11px;
}

.investment-value-editor-field .investment-input {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: 38px;

  padding: 0 11px;

  font-size: 12px;
  box-sizing: border-box;
}

.investment-value-editor-actions {
  width: 100%;

  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 8px;
}

.investment-save-button,
.investment-cancel-button {
  width: 100%;
  min-width: 0;
  height: 36px;

  padding: 0 8px;

  border-radius: 11px;
  font-size: 11px;
}
             
          }

          @media (max-width: 390px) {
            .investment-summary-grid {
              gap: 5px;
            }

            .investment-summary-card {
              padding: 9px 5px;
            }

            .investment-summary-value {
              font-size: 11px;
            }
          }
        `}
      </style>

      <div className="investments-page">
        <header className="investments-header">
          <h1 className="investments-title">
            📈 Investments
          </h1>

          <p className="investments-subtitle">
            Track portfolio value, investment returns and
            asset allocation in one place.
          </p>
        </header>

        <section className="investment-summary-grid">
          <div className="mca-glass-card investment-summary-card mca-glow-purple">
            <div className="investment-summary-icon">
              💼
            </div>

            <div className="investment-summary-label">
              Total Invested
            </div>

            <div className="investment-summary-value">
              {formatMoney(summary?.totalInvested || 0)}
            </div>
          </div>

          <div className="mca-glass-card investment-summary-card mca-glow-blue">
            <div className="investment-summary-icon">
              📊
            </div>

            <div className="investment-summary-label">
              Current Portfolio
            </div>

            <div className="investment-summary-value">
              {formatMoney(
                summary?.totalCurrentValue || 0
              )}
            </div>
          </div>

          <div
            className={`mca-glass-card investment-summary-card ${
              totalProfitOrLoss >= 0
                ? "mca-glow-green"
                : "mca-glow-red"
            }`}
          >
            <div className="investment-summary-icon">
              {totalProfitOrLoss >= 0 ? "🚀" : "📉"}
            </div>

            <div className="investment-summary-label">
              Total Return
            </div>

            <div
              className="investment-summary-value"
              style={{
                color:
                  totalProfitOrLoss >= 0
                    ? "#16A764"
                    : "#E5444A",
              }}
            >
              {totalProfitOrLoss >= 0 ? "+" : ""}
              {formatMoney(totalProfitOrLoss)}
            </div>

            <span
              className="investment-summary-change"
              style={{
                color:
                  totalReturnPercentage >= 0
                    ? "#16A764"
                    : "#E5444A",
              }}
            >
              {totalReturnPercentage >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(totalReturnPercentage).toFixed(2)}%
            </span>
          </div>
        </section>

        {allocation.length > 0 && (
          <section className="investment-allocation-section">
            <div className="investment-section-header">
              <div>
                <h2>Investment Allocation</h2>

                <p>
                  See how your current portfolio is distributed
                  across different investment types.
                </p>
              </div>
            </div>

            <div className="investment-chart-wrapper">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={allocation}
                    dataKey="amount"
                    nameKey="type"
                    cx="50%"
                    cy="45%"
                    innerRadius={58}
                    outerRadius={108}
                    paddingAngle={4}
                   
                  >
                    {allocation.map((item, index) => (
                      <Cell
                        key={`${item.type}-${index}`}
                        fill={
                          allocationColors[
                            index %
                              allocationColors.length
                          ]
                        }
                        stroke="#ffffff"
                        strokeWidth={3}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatMoney(Number(value))
                    }
                  />

                  <Legend
                    verticalAlign="bottom"
                    height={36}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <section className="investment-form-section">
          <div className="investment-section-header">
            <div>
              <h2>Add New Investment</h2>

              <p>
                Add the invested amount, current value and
                purchase date.
              </p>
            </div>
          </div>

          <form
            className={`investment-inline-form ${
              type === "Other"
                ? "has-custom-type"
                : ""
            }`}
            onSubmit={handleCreateInvestment}
          >
            <div className="investment-field">
              <label htmlFor="investment-name">
                Investment Name
              </label>

              <input
                id="investment-name"
                className="investment-input"
                type="text"
                placeholder="Example: HDFC Index Fund"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
              />
            </div>

            <div className="investment-field">
              <label htmlFor="investment-type">
                Investment Type
              </label>

              <select
                id="investment-type"
                className="investment-input"
                value={type}
                onChange={(event) => {
                  const selectedType =
                    event.target.value;

                  setType(selectedType);

                  if (selectedType !== "Other") {
                    setCustomType("");
                  }
                }}
                required
              >
                {investmentTypes.map(
                  (investmentType) => (
                    <option
                      key={investmentType}
                      value={investmentType}
                    >
                      {investmentType}
                    </option>
                  )
                )}
              </select>
            </div>

            {type === "Other" && (
              <div className="investment-field">
                <label htmlFor="custom-investment-type">
                  Custom Type
                </label>

                <input
                  id="custom-investment-type"
                  className="investment-input"
                  type="text"
                  placeholder="Example: Real Estate"
                  value={customType}
                  onChange={(event) =>
                    setCustomType(event.target.value)
                  }
                  required
                />
              </div>
            )}

            <div className="investment-field">
              <label htmlFor="invested-amount">
                Invested Amount
              </label>

              <input
                id="invested-amount"
                className="investment-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter invested amount"
                value={investedAmount}
                onChange={(event) =>
                  setInvestedAmount(
                    event.target.value
                  )
                }
                required
              />
            </div>

            <div className="investment-field">
              <label htmlFor="current-value">
                Current Value
              </label>

              <input
                id="current-value"
                className="investment-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter current value"
                value={currentValue}
                onChange={(event) =>
                  setCurrentValue(
                    event.target.value
                  )
                }
                required
              />
            </div>

            <div className="investment-field">
              <label htmlFor="investment-date">
                Investment Date
              </label>

              <input
                id="investment-date"
                className="investment-input"
                type="date"
                value={investmentDate}
                onChange={(event) =>
                  setInvestmentDate(
                    event.target.value
                  )
                }
                required
              />
            </div>

            <button
              className="mca-gradient-button investment-create-button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Adding..."
                : "➕ Add Investment"}
            </button>
          </form>
        </section>

        <section className="investment-portfolio-section">
          <div className="investment-section-header">
            <div>
              <h2>Investment Portfolio</h2>

              <p>
                {filteredInvestments.length} of{" "}
                {investments.length} investments
              </p>
            </div>
          </div>

          <div className="investment-toolbar">
            <input
              className="investment-input"
              type="search"
              placeholder="Search name, type or amount..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
            />

            <select
              className="investment-input"
              value={filterType}
              onChange={(event) =>
                setFilterType(event.target.value)
              }
            >
              <option value="">
                All Investment Types
              </option>

              {availableTypes.map(
                (availableType) => (
                  <option
                    key={availableType}
                    value={availableType}
                  >
                    {availableType}
                  </option>
                )
              )}
            </select>

            <select
              className="investment-input"
              value={sortOption}
              onChange={(event) =>
                setSortOption(
                  event.target.value as
                    | "Newest"
                    | "HighestValue"
                    | "HighestReturn"
                )
              }
            >
              <option value="Newest">
                Newest First
              </option>

              <option value="HighestValue">
                Highest Current Value
              </option>

              <option value="HighestReturn">
                Highest Return
              </option>
            </select>
          </div>

          {loading ? (
            <div className="investment-loading">
              Loading investments...
            </div>
          ) : filteredInvestments.length === 0 ? (
            <div className="investment-empty-state">
              <div className="investment-empty-icon">
                📈
              </div>

              <h3>No investments found</h3>

              <p>
                Add your first investment or change the current
                portfolio filters.
              </p>
            </div>
          ) : (
            <div className="investment-list">
              {filteredInvestments.map(
                (investment) => {
                  const profitable =
                    investment.profitOrLoss >= 0;

                  const deleting =
                    deletingInvestmentId ===
                    investment.id;

                  const menuOpen =
                    openActionMenuId ===
                    investment.id;

                  return (
                    <article
                      className="investment-card"
                      key={investment.id}
                      style={{
                        borderLeft: `5px solid ${
                          profitable ? "#21C77A" : "#FF6467"
                        }`,
                      }}
                    >
                      <div className="investment-card-main">
                        <div className="investment-name-area">
                          <div className="investment-type-icon">
                            {getInvestmentIcon(investment.type)}
                          </div>

                          <div>
                            <h3 className="investment-name">
                              {investment.name}
                            </h3>

                            <span className="investment-type-badge">
                              {investment.type}
                            </span>
                          </div>
                        </div>

                        <div className="investment-stat">
                          <span>Invested</span>
                          <strong>
                            {formatMoney(investment.investedAmount)}
                          </strong>
                        </div>

                        <div className="investment-stat">
                          <span>Current Value</span>
                          <strong>
                            {formatMoney(investment.currentValue)}
                          </strong>
                        </div>

                        <div className="investment-stat">
                          <span>{profitable ? "Profit" : "Loss"}</span>

                          <strong
                            className={
                              profitable
                                ? "investment-return-positive"
                                : "investment-return-negative"
                            }
                          >
                            {profitable ? "+" : ""}
                            {formatMoney(investment.profitOrLoss)} (
                            {investment.profitOrLossPercentage.toFixed(2)}%)
                          </strong>
                        </div>

                        <div className="investment-stat">
                          <span>Investment Date</span>

                          <strong>
                            📅 {formatDate(investment.investmentDate)}
                          </strong>
                        </div>

                        <div className="investment-desktop-actions">
                          <button
                            type="button"
                            className="investment-update-button"
                            onClick={() =>
                              startEditingInvestment(investment)
                            }
                          >
                            ✏ Update Value
                          </button>

                          <button
                            type="button"
                            className="investment-delete-button"
                            disabled={deleting}
                            onClick={() =>
                              void handleDeleteInvestment(investment.id)
                            }
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </div>

                       {editingInvestmentId === investment.id && (
                        <div className="investment-value-editor">
                          <div className="investment-value-editor-field">
                            <label htmlFor={`update-value-${investment.id}`}>
                              New Current Value
                            </label>

                            <input
                              id={`update-value-${investment.id}`}
                              className="investment-input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={editingCurrentValue}
                              onChange={(event) =>
                                setEditingCurrentValue(event.target.value)
                              }
                              placeholder="Enter new current value"
                            />
                          </div>

                          <div className="investment-value-editor-actions">
                            <button
                              type="button"
                              className="investment-save-button"
                              onClick={() =>
                                void saveCurrentValue(investment.id)
                              }
                            >
                              Save
                            </button>

                            <button
                              type="button"
                              className="investment-cancel-button"
                              onClick={cancelEditingInvestment}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}


                      <div className="investment-mobile-menu">
                        <button
                          type="button"
                          className="investment-menu-trigger"
                          aria-label="Investment actions"
                          onClick={() =>
                            setOpenActionMenuId((currentId) =>
                              currentId === investment.id
                                ? null
                                : investment.id
                            )
                          }
                        >
                          ⋮
                        </button>

                        {menuOpen && (
                          <div className="investment-menu-dropdown">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                startEditingInvestment(investment);
                              }}
                            >
                              ✏️ Update Value
                            </button>

                            <button
                              type="button"
                              className="investment-menu-delete"
                              disabled={deleting}
                              onClick={() =>
                                void handleDeleteInvestment(investment.id)
                              }
                            >
                              🗑️ {deleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

export default InvestmentsPage;