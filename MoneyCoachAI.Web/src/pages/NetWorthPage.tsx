import { useEffect, useMemo, useRef, useState } from "react";
import {
  createNetWorthItem,
  deleteNetWorthItem,
  getNetWorthItems,
  getNetWorthSummary,
  getNetWorthTrend,
  updateNetWorthItem,
} from "../services/netWorthService";
import type {
  NetWorthItem,
  NetWorthSummary,
  NetWorthTrendPoint,
} from "../types/netWorthTypes";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppLayout from "../components/AppLayout";

type ItemType = "Asset" | "Liability";
type FilterType = "All" | ItemType;
type SortType = "highest" | "lowest" | "name";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatCompactCurrency = (value: number) => {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 10_000_000) {
    return `₹${(value / 10_000_000).toFixed(1)}Cr`;
  }

  if (absoluteValue >= 100_000) {
    return `₹${(value / 100_000).toFixed(1)}L`;
  }

  if (absoluteValue >= 1_000) {
    return `₹${(value / 1_000).toFixed(1)}K`;
  }

  return `₹${value.toLocaleString("en-IN")}`;
};

function NetWorthPage() {
  const [items, setItems] = useState<NetWorthItem[]>([]);
  const [summary, setSummary] = useState<NetWorthSummary | null>(null);
  const [trend, setTrend] = useState<NetWorthTrendPoint[]>([]);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<ItemType>("Asset");

  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("All");
  const [sortType, setSortType] = useState<SortType>("highest");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingAmount, setEditingAmount] = useState("");
  const [editingType, setEditingType] = useState<ItemType>("Asset");

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const menuRef = useRef<HTMLDivElement | null>(null);

  const loadNetWorthData = async () => {
    try {
      setError("");

      const [itemsData, summaryData, trendData] = await Promise.all([
        getNetWorthItems(),
        getNetWorthSummary(),
        getNetWorthTrend(),
      ]);

      setItems(itemsData);
      setSummary(summaryData);
      setTrend(trendData);
    } catch {
      setError("Unable to load your net worth data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNetWorthData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        openMenuId &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openMenuId]);

  const handleCreateItem = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsedAmount = Number(amount);

    if (!name.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid item name and an amount greater than zero.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await createNetWorthItem({
        name: name.trim(),
        amount: parsedAmount,
        type,
      });

      setName("");
      setAmount("");
      setType("Asset");

      await loadNetWorthData();
    } catch {
      setError("Unable to add this item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const confirmed = window.confirm("Delete this net worth item?");

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setOpenMenuId(null);
      await deleteNetWorthItem(id);
      await loadNetWorthData();
    } catch {
      setError("Unable to delete this item. Please try again.");
    }
  };

  const startEditing = (item: NetWorthItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setEditingAmount(String(item.amount));
    setEditingType(item.type as ItemType);
    setOpenMenuId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
    setEditingAmount("");
    setEditingType("Asset");
  };

  const saveEditing = async (id: string) => {
    const parsedAmount = Number(editingAmount);

    if (
      !editingName.trim() ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      setError("Enter a valid item name and an amount greater than zero.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await updateNetWorthItem(id, {
        name: editingName.trim(),
        amount: parsedAmount,
        type: editingType,
      });

      cancelEditing();
      await loadNetWorthData();
    } catch {
      setError("Unable to update this item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return items
      .filter((item) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          item.name.toLowerCase().includes(normalizedSearch);

        const matchesType = filterType === "All" || item.type === filterType;

        return matchesSearch && matchesType;
      })
      .sort((firstItem, secondItem) => {
        if (sortType === "lowest") {
          return firstItem.amount - secondItem.amount;
        }

        if (sortType === "name") {
          return firstItem.name.localeCompare(secondItem.name);
        }

        return secondItem.amount - firstItem.amount;
      });
  }, [filterType, items, searchText, sortType]);

  const assets = filteredItems.filter((item) => item.type === "Asset");
  const liabilities = filteredItems.filter(
    (item) => item.type === "Liability",
  );

  const assetRatio = summary?.totalAssets
    ? Math.max(
        0,
        Math.min(100, (summary.netWorth / summary.totalAssets) * 100),
      )
    : 0;

  const healthLabel =
    assetRatio >= 80
      ? "Excellent"
      : assetRatio >= 55
        ? "Healthy"
        : assetRatio >= 25
          ? "Needs attention"
          : "High debt pressure";

  const trendData = trend.map((point) => ({
    date: new Date(point.snapshotDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    netWorth: point.netWorth,
  }));

  const renderItemCard = (item: NetWorthItem) => {
    const isAsset = item.type === "Asset";
    const isEditing = editingId === item.id;

    return (
      <article
        className={`net-worth-item ${isAsset ? "asset-item" : "liability-item"}`}
        key={item.id}
      >
        <div className="net-worth-item-main">
          <div className={`net-worth-item-icon ${isAsset ? "asset-icon" : "liability-icon"}`}>
            {isAsset ? "↗" : "↘"}
          </div>

          <div className="net-worth-item-copy">
            <span className="net-worth-item-type">{item.type}</span>
            <h3>{item.name}</h3>
            <strong className={isAsset ? "positive-value" : "negative-value"}>
              {formatCurrency(item.amount)}
            </strong>
          </div>
        </div>

        <div className="net-worth-item-actions desktop-actions">
          <button
            type="button"
            className="action-button edit-button"
            onClick={() => startEditing(item)}
          >
            Update
          </button>
          <button
            type="button"
            className="action-button delete-button"
            onClick={() => void handleDeleteItem(item.id)}
          >
            Delete
          </button>
        </div>

        <div
          className="mobile-menu-wrap"
          ref={openMenuId === item.id ? menuRef : undefined}
        >
          <button
            type="button"
            className="mobile-menu-button"
            aria-label={`Actions for ${item.name}`}
            onClick={() =>
              setOpenMenuId((currentId) =>
                currentId === item.id ? null : item.id,
              )
            }
          >
            ⋮
          </button>

          {openMenuId === item.id && (
            <div className="mobile-menu">
              <button type="button" onClick={() => startEditing(item)}>
                Update
              </button>
              <button
                type="button"
                className="mobile-delete-action"
                onClick={() => void handleDeleteItem(item.id)}
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="net-worth-editor">
            <div className="editor-field editor-name-field">
              <label htmlFor={`edit-name-${item.id}`}>Name</label>
              <input
                id={`edit-name-${item.id}`}
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
              />
            </div>

            <div className="editor-field editor-amount-field">
              <label htmlFor={`edit-amount-${item.id}`}>Amount</label>
              <input
                id={`edit-amount-${item.id}`}
                type="number"
                min="0"
                step="0.01"
                value={editingAmount}
                onChange={(event) => setEditingAmount(event.target.value)}
              />
            </div>

            <div className="editor-field editor-type-field">
              <label htmlFor={`edit-type-${item.id}`}>Type</label>
              <select
                id={`edit-type-${item.id}`}
                value={editingType}
                onChange={(event) =>
                  setEditingType(event.target.value as ItemType)
                }
              >
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
              </select>
            </div>

            <div className="editor-actions">
              <button
                type="button"
                className="editor-save-button"
                disabled={isSubmitting}
                onClick={() => void saveEditing(item.id)}
              >
                Save
              </button>
              <button
                type="button"
                className="editor-cancel-button"
                onClick={cancelEditing}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </article>
    );
  };

  return (
    <AppLayout>
      <main className="net-worth-page">
        <header className="net-worth-header">
          <div>
            <span className="net-worth-eyebrow">Financial position</span>
            <h1>Net Worth</h1>
            <p>Track everything you own, everything you owe, and your progress over time.</p>
          </div>

          <div className="health-pill">
            <span>Financial health</span>
            <strong>{healthLabel}</strong>
          </div>
        </header>

        {error && <div className="net-worth-error">{error}</div>}

        <section className="summary-grid" aria-label="Net worth summary">
          <article className="summary-card asset-summary">
            <div className="summary-card-top">
              <span>Total Assets</span>
              <span className="summary-icon">↗</span>
            </div>
            <strong>{formatCompactCurrency(summary?.totalAssets ?? 0)}</strong>
            <small>{formatCurrency(summary?.totalAssets ?? 0)}</small>
          </article>

          <article className="summary-card liability-summary">
            <div className="summary-card-top">
              <span>Total Liabilities</span>
              <span className="summary-icon">↘</span>
            </div>
            <strong>{formatCompactCurrency(summary?.totalLiabilities ?? 0)}</strong>
            <small>{formatCurrency(summary?.totalLiabilities ?? 0)}</small>
          </article>

          <article className="summary-card worth-summary">
            <div className="summary-card-top">
              <span>Net Worth</span>
              <span className="summary-icon">◆</span>
            </div>
            <strong className={(summary?.netWorth ?? 0) >= 0 ? "positive-value" : "negative-value"}>
              {formatCompactCurrency(summary?.netWorth ?? 0)}
            </strong>
            <small>{formatCurrency(summary?.netWorth ?? 0)}</small>
          </article>

          <article className="summary-card items-summary">
            <div className="summary-card-top">
              <span>Total Items</span>
              <span className="summary-icon">#</span>
            </div>
            <strong>{items.length}</strong>
            <small>{items.filter((item) => item.type === "Asset").length} assets · {items.filter((item) => item.type === "Liability").length} liabilities</small>
          </article>
        </section>

        <section className="net-worth-overview-grid">
          <article className="glass-panel trend-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Progress</span>
                <h2>Net Worth Trend</h2>
                <p>Every create, update, or delete action adds a new snapshot.</p>
              </div>
            </div>

            <div className="chart-area">
              {isLoading ? (
                <div className="panel-empty">Loading trend...</div>
              ) : trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148, 163, 184, 0.24)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={formatCompactCurrency} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), "Net Worth"]}
                      contentStyle={{ borderRadius: 14, border: "1px solid rgba(124, 92, 252, 0.2)", boxShadow: "0 14px 34px rgba(15, 23, 42, 0.12)" }}
                    />
                    <Line type="monotone" dataKey="netWorth" stroke="#6d5dfc" strokeWidth={3} dot={{ r: 4, fill: "#6d5dfc", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="panel-empty">
                  <strong>No trend data yet</strong>
                  <span>Add your first asset or liability to start tracking progress.</span>
                </div>
              )}
            </div>
          </article>

          <article className="glass-panel health-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Health score</span>
                <h2>{healthLabel}</h2>
                <p>Based on the portion of assets remaining after liabilities.</p>
              </div>
            </div>

            <div className="health-score-wrap">
              <div className="health-score-ring" style={{ "--score": `${assetRatio}%` } as React.CSSProperties}>
                <div>
                  <strong>{Math.round(assetRatio)}%</strong>
                  <span>asset strength</span>
                </div>
              </div>

              <div className="health-details">
                <div>
                  <span>Asset coverage</span>
                  <strong>{summary?.totalLiabilities ? `${(summary.totalAssets / summary.totalLiabilities).toFixed(1)}x` : "No debt"}</strong>
                </div>
                <div>
                  <span>Current position</span>
                  <strong className={(summary?.netWorth ?? 0) >= 0 ? "positive-value" : "negative-value"}>
                    {(summary?.netWorth ?? 0) >= 0 ? "Positive" : "Negative"}
                  </strong>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="add-item-section">
          <div className="section-heading-row">
            <div>
              <span className="panel-kicker">Add position</span>
              <h2>Add Asset or Liability</h2>
            </div>
          </div>

          <form className="net-worth-form" onSubmit={handleCreateItem}>
            <div className="form-field name-field">
              <label htmlFor="net-worth-name">Name</label>
              <input
                id="net-worth-name"
                type="text"
                placeholder="Bank account, home loan..."
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="form-field amount-field">
              <label htmlFor="net-worth-amount">Amount</label>
              <input
                id="net-worth-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>

            <div className="form-field type-field">
              <label htmlFor="net-worth-type">Type</label>
              <select
                id="net-worth-type"
                value={type}
                onChange={(event) => setType(event.target.value as ItemType)}
              >
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
              </select>
            </div>

            <button className="add-item-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "+ Add Item"}
            </button>
          </form>
        </section>

        <section className="portfolio-section">
          <div className="portfolio-toolbar">
            <div>
              <span className="panel-kicker">Portfolio</span>
              <h2>Your Net Worth Items</h2>
            </div>

            <div className="portfolio-controls">
              <input
                type="search"
                aria-label="Search net worth items"
                placeholder="Search items..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />

              <select
                aria-label="Filter item type"
                value={filterType}
                onChange={(event) => setFilterType(event.target.value as FilterType)}
              >
                <option value="All">All types</option>
                <option value="Asset">Assets</option>
                <option value="Liability">Liabilities</option>
              </select>

              <select
                aria-label="Sort net worth items"
                value={sortType}
                onChange={(event) => setSortType(event.target.value as SortType)}
              >
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="items-empty-state">Loading your items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="items-empty-state">
              <strong>No matching items</strong>
              <span>Add a new item or adjust your search and filters.</span>
            </div>
          ) : (
            <div className="items-columns">
              {(filterType === "All" || filterType === "Asset") && (
                <section className="items-column">
                  <div className="items-column-heading">
                    <div>
                      <span className="column-dot asset-dot" />
                      <h3>Assets</h3>
                    </div>
                    <span>{assets.length}</span>
                  </div>

                  <div className="items-list">
                    {assets.length > 0 ? assets.map(renderItemCard) : <div className="column-empty">No assets match your filters.</div>}
                  </div>
                </section>
              )}

              {(filterType === "All" || filterType === "Liability") && (
                <section className="items-column">
                  <div className="items-column-heading">
                    <div>
                      <span className="column-dot liability-dot" />
                      <h3>Liabilities</h3>
                    </div>
                    <span>{liabilities.length}</span>
                  </div>

                  <div className="items-list">
                    {liabilities.length > 0 ? liabilities.map(renderItemCard) : <div className="column-empty">No liabilities match your filters.</div>}
                  </div>
                </section>
              )}
            </div>
          )}
        </section>
      </main>

      <style>{`
        .net-worth-page {
          width: 100%;
          min-height: 100vh;
          padding: 1%;
          color: #111827;
        }

        .net-worth-header,
        .summary-card,
        .glass-panel,
        .net-worth-item {
          border: 1px solid rgba(255, 255, 255, 0.68);
          background: rgba(255, 255, 255, 0.66);
          box-shadow: 0 10px 35px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .net-worth-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 24px 26px;
          border-radius: 24px;
          margin-bottom: 16px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(244, 240, 255, 0.72));
        }

        .net-worth-eyebrow,
        .panel-kicker {
          display: inline-block;
          margin-bottom: 5px;
          color: #6d5dfc;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .net-worth-header h1,
        .panel-heading h2,
        .section-heading-row h2,
        .portfolio-toolbar h2 {
          margin: 0;
          color: #111827;
        }

        .net-worth-header h1 {
          font-size: clamp(1.65rem, 2vw, 2.25rem);
        }

        .net-worth-header p,
        .panel-heading p {
          margin: 7px 0 0;
          color: #64748b;
          line-height: 1.55;
        }

        .health-pill {
          display: flex;
          flex-direction: column;
          min-width: 180px;
          padding: 12px 16px;
          border: 1px solid rgba(109, 93, 252, 0.16);
          border-radius: 16px;
          background: rgba(109, 93, 252, 0.08);
        }

        .health-pill span {
          color: #64748b;
          font-size: 0.78rem;
        }

        .health-pill strong {
          margin-top: 3px;
          color: #5b4ae6;
        }

        .net-worth-error {
          margin-bottom: 14px;
          padding: 12px 15px;
          border: 1px solid rgba(239, 68, 68, 0.24);
          border-radius: 14px;
          background: rgba(254, 226, 226, 0.82);
          color: #b91c1c;
          font-weight: 700;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }

        .summary-card {
          position: relative;
          overflow: hidden;
          min-height: 138px;
          padding: 18px;
          border-radius: 21px;
        }

        .summary-card::after {
          content: "";
          position: absolute;
          right: -32px;
          bottom: -42px;
          width: 105px;
          height: 105px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.48);
        }

        .asset-summary { background: linear-gradient(145deg, rgba(236, 253, 245, 0.86), rgba(255, 255, 255, 0.7)); }
        .liability-summary { background: linear-gradient(145deg, rgba(255, 241, 242, 0.88), rgba(255, 255, 255, 0.7)); }
        .worth-summary { background: linear-gradient(145deg, rgba(243, 232, 255, 0.88), rgba(255, 255, 255, 0.72)); }
        .items-summary { background: linear-gradient(145deg, rgba(239, 246, 255, 0.88), rgba(255, 255, 255, 0.72)); }

        .summary-card-top {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #64748b;
          font-size: 0.84rem;
          font-weight: 700;
        }

        .summary-icon {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.74);
          color: #6d5dfc;
          font-weight: 900;
        }

        .summary-card > strong {
          position: relative;
          z-index: 1;
          display: block;
          margin-top: 17px;
          font-size: clamp(1.3rem, 2vw, 1.85rem);
          line-height: 1;
        }

        .summary-card small {
          position: relative;
          z-index: 1;
          display: block;
          margin-top: 8px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .positive-value { color: #059669 !important; }
        .negative-value { color: #dc2626 !important; }

        .net-worth-overview-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.7fr);
          gap: 16px;
          margin-bottom: 18px;
        }

        .glass-panel {
          border-radius: 23px;
          padding: 20px;
        }

        .panel-heading h2,
        .section-heading-row h2,
        .portfolio-toolbar h2 {
          font-size: 1.15rem;
        }

        .chart-area {
          height: 310px;
          margin-top: 14px;
        }

        .panel-empty,
        .items-empty-state,
        .column-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 150px;
          text-align: center;
          color: #64748b;
        }

        .panel-empty strong,
        .items-empty-state strong {
          margin-bottom: 5px;
          color: #334155;
        }

        .health-panel {
          background: linear-gradient(155deg, rgba(250, 248, 255, 0.88), rgba(255, 255, 255, 0.68));
        }

        .health-score-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          padding-top: 18px;
        }

        .health-score-ring {
          --score: 0%;
          display: grid;
          place-items: center;
          width: 164px;
          height: 164px;
          border-radius: 50%;
          background: conic-gradient(#6d5dfc var(--score), rgba(109, 93, 252, 0.12) 0);
          box-shadow: 0 16px 38px rgba(109, 93, 252, 0.2);
        }

        .health-score-ring > div {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 126px;
          height: 126px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.92);
        }

        .health-score-ring strong {
          color: #3f3a72;
          font-size: 1.75rem;
        }

        .health-score-ring span {
          color: #64748b;
          font-size: 0.72rem;
        }

        .health-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          width: 100%;
        }

        .health-details > div {
          padding: 12px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.62);
        }

        .health-details span,
        .health-details strong {
          display: block;
        }

        .health-details span {
          color: #64748b;
          font-size: 0.74rem;
        }

        .health-details strong {
          margin-top: 4px;
          color: #1e293b;
        }

        .add-item-section,
        .portfolio-section {
          margin-bottom: 18px;
        }

        .section-heading-row,
        .portfolio-toolbar {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 12px;
          padding: 0 2px;
        }

        .net-worth-form {
          display: grid;
          grid-template-columns: minmax(220px, 1.4fr) minmax(150px, 0.75fr) minmax(150px, 0.65fr) auto;
          gap: 11px;
          align-items: end;
          padding: 15px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.48);
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .form-field,
        .editor-field {
          min-width: 0;
        }

        .form-field label,
        .editor-field label {
          display: block;
          margin: 0 0 6px 2px;
          color: #475569;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .form-field input,
        .form-field select,
        .portfolio-controls input,
        .portfolio-controls select,
        .editor-field input,
        .editor-field select {
          width: 100%;
          min-height: 44px;
          box-sizing: border-box;
          padding: 0 13px;
          border: 1px solid rgba(148, 163, 184, 0.26);
          border-radius: 13px;
          outline: none;
          background: rgba(255, 255, 255, 0.78);
          color: #1e293b;
          font: inherit;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .form-field input:focus,
        .form-field select:focus,
        .portfolio-controls input:focus,
        .portfolio-controls select:focus,
        .editor-field input:focus,
        .editor-field select:focus {
          border-color: rgba(109, 93, 252, 0.58);
          box-shadow: 0 0 0 4px rgba(109, 93, 252, 0.1);
        }

        .add-item-button,
        .editor-save-button,
        .editor-cancel-button,
        .action-button {
          border: 0;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 800;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .editor-field select,
        .form-field select {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .net-worth-editor,
        .editor-field,
        .form-field {
          min-width: 0;
        }

        .add-item-button {
          min-height: 44px;
          padding: 0 20px;
          color: white;
          background: linear-gradient(135deg, #5b8cff, #7b61ff);
          box-shadow: 0 10px 24px rgba(91, 140, 255, 0.25);
          white-space: nowrap;
        }

        .add-item-button:hover,
        .editor-save-button:hover,
        .action-button:hover {
          transform: translateY(-1px);
        }

        .add-item-button:disabled,
        .editor-save-button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .portfolio-controls {
          display: grid;
          grid-template-columns: minmax(180px, 1fr) 145px 160px;
          gap: 9px;
          width: min(100%, 570px);
        }

        .items-columns {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .items-column {
          min-width: 0;
        }

        .items-column-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 9px;
          padding: 0 3px;
        }

        .items-column-heading > div {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .items-column-heading h3 {
          margin: 0;
          font-size: 1rem;
        }

        .items-column-heading > span {
          display: grid;
          place-items: center;
          min-width: 28px;
          height: 28px;
          padding: 0 7px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.68);
          color: #64748b;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .column-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .asset-dot { background: #10b981; box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.1); }
        .liability-dot { background: #ef4444; box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.1); }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 560px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .items-list::-webkit-scrollbar { width: 7px; }
        .items-list::-webkit-scrollbar-track { background: transparent; }
        .items-list::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: linear-gradient(#5b8cff, #7b61ff);
        }

        .net-worth-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px;
          border-radius: 18px;
        }

        .asset-item { border-left: 3px solid rgba(16, 185, 129, 0.7); }
        .liability-item { border-left: 3px solid rgba(239, 68, 68, 0.7); }

        .net-worth-item-main {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .net-worth-item-icon {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 42px;
          height: 42px;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 900;
        }

        .asset-icon { color: #047857; background: rgba(16, 185, 129, 0.12); }
        .liability-icon { color: #b91c1c; background: rgba(239, 68, 68, 0.11); }

        .net-worth-item-copy {
          min-width: 0;
        }

        .net-worth-item-copy h3 {
          margin: 2px 0 4px;
          overflow: hidden;
          color: #1e293b;
          font-size: 0.96rem;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .net-worth-item-copy strong {
          font-size: 0.94rem;
        }

        .net-worth-item-type {
          color: #94a3b8;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .net-worth-item-actions {
          display: flex;
          gap: 7px;
        }

        .action-button {
          padding: 8px 11px;
          font-size: 0.76rem;
        }

        .edit-button { color: #5b4ae6; background: rgba(109, 93, 252, 0.1); }
        .delete-button { color: #b91c1c; background: rgba(239, 68, 68, 0.09); }

        .mobile-menu-wrap { display: none; }

        .net-worth-editor {
          display: grid;
          grid-template-columns: 1.2fr 1fr 140px 170px;
          gap: 10px;
          align-items: end;
          width: 100%;
          margin-top: 12px;
          padding-top: 14px;
          border-top: 1px solid rgba(148, 163, 184, 0.18);
        }

        .net-worth-item:has(.net-worth-editor) {
          flex-wrap: wrap;
        }

        .editor-actions {
          display: flex;
          align-items: end;
          justify-content: flex-start;
          gap: 8px;
          min-width: 170px;
        }         

        .editor-save-button,
        .editor-cancel-button {
          height: 40px;
          padding: 0 16px;
          white-space: nowrap;
          flex: 1;
        }

        

        .editor-save-button { color: white; background: linear-gradient(135deg, #5b8cff, #7b61ff); }
        .editor-cancel-button { color: #475569; background: rgba(148, 163, 184, 0.12); }

        .column-empty {
          min-height: 110px;
          padding: 18px;
          border: 1px dashed rgba(148, 163, 184, 0.34);
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.38);
          font-size: 0.84rem;
        }

        .items-empty-state {
          min-height: 180px;
          border: 1px dashed rgba(148, 163, 184, 0.34);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.4);
        }

        @media (max-width: 1120px) {
          .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .net-worth-overview-grid { grid-template-columns: 1fr; }
          .health-score-wrap { flex-direction: row; justify-content: center; }
          .health-details { max-width: 360px; }
          .net-worth-form { grid-template-columns: 1fr 1fr 160px; }
          .add-item-button { grid-column: 1 / -1; }
          .portfolio-toolbar { align-items: flex-start; flex-direction: column; }
          .portfolio-controls { width: 100%; }
        }

        @media (max-width: 760px) {
          .net-worth-page { padding: 0 6px 24px; }
          .net-worth-header { align-items: flex-start; padding: 18px; border-radius: 20px; }
          .health-pill { min-width: 0; }
          .summary-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
          .summary-card { min-height: 105px; padding: 10px 8px; border-radius: 15px; }
          .summary-card-top { font-size: 0.62rem; }
          .summary-icon { width: 25px; height: 25px; border-radius: 8px; }
          .summary-card > strong { margin-top: 12px; font-size: clamp(0.85rem, 3.3vw, 1.12rem); }
          .summary-card small { display: none; }
          .glass-panel { padding: 15px 10px; border-radius: 19px; }
          .chart-area { height: 250px; }
          .health-score-wrap { flex-direction: column; }
          .health-score-ring { width: 145px; height: 145px; }
          .health-score-ring > div { width: 111px; height: 111px; }
          .net-worth-form { grid-template-columns: 1fr; padding: 12px; }
          .add-item-button { grid-column: auto; width: 100%; }
          .portfolio-controls { grid-template-columns: 1fr; }
          .items-columns { grid-template-columns: 1fr; }
          .items-list { max-height: none; overflow: visible; padding-right: 0; }
          .desktop-actions { display: none; }
          .mobile-menu-wrap { display: block; position: relative; margin-left: auto; }
          .mobile-menu-button {
            display: grid;
            place-items: center;
            width: 34px;
            height: 34px;
            border: 0;
            border-radius: 11px;
            background: rgba(148, 163, 184, 0.12);
            color: #475569;
            cursor: pointer;
            font-size: 1.25rem;
          }
          .mobile-menu {
            position: absolute;
            z-index: 20;
            top: 39px;
            right: 0;
            display: flex;
            flex-direction: column;
            min-width: 118px;
            padding: 6px;
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.97);
            box-shadow: 0 14px 32px rgba(15, 23, 42, 0.14);
          }
          .mobile-menu button {
            padding: 9px 10px;
            border: 0;
            border-radius: 9px;
            background: transparent;
            color: #334155;
            text-align: left;
            cursor: pointer;
            font-weight: 700;
          }
          .mobile-menu button:hover { background: rgba(109, 93, 252, 0.08); }
          .mobile-menu .mobile-delete-action { color: #b91c1c; }
          .net-worth-editor { grid-template-columns: 1fr; }
          .editor-actions { width: 100%; }
          .editor-save-button,
          .editor-cancel-button { flex: 1; }

          .net-worth-editor {
            grid-template-columns: minmax(0, 1fr);
            width: 100%;
          }

          .editor-field select,
          .editor-field input {
            width: 100%;
            max-width: 100%;
          }
        }

        @media (max-width: 520px) {
          .net-worth-header { flex-direction: column; gap: 12px; }
          .health-pill { width: 100%; box-sizing: border-box; }
          .summary-grid { gap: 4px; }
          .summary-card { min-height: 0px; padding: 9px 6px; }
          .summary-card-top { align-items: flex-start; }
          .summary-card-top > span:first-child { max-width: 58px; line-height: 1.15; }
          .summary-icon { width: 22px; height: 22px; font-size: 0.7rem; }
          .summary-card > strong { font-size: clamp(0.72rem, 3.4vw, 1rem); }
          .health-details { grid-template-columns: 1fr; }
          .net-worth-item { align-items: flex-start; padding: 12px; }
          .net-worth-item-icon { width: 38px; height: 38px; }
        }
      `}</style>
    </AppLayout>
  );
}

export default NetWorthPage;