import type { MoneyDueReportResponse } from "../../types/reportTypes";

type MoneyDueAnalyticsProps = {
  data: MoneyDueReportResponse;
  monthName: string;
  year: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function percentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function MoneyDueAnalytics({ data, monthName, year }: MoneyDueAnalyticsProps) {
  const totalAmount = data.totalReceivable + data.totalPayable;
  const receivableShare = percentage(data.totalReceivable, totalAmount);
  const payableShare = totalAmount > 0 ? 100 - receivableShare : 0;

  

  const maxInterest = Math.max(
    data.receivableInterest,
    data.payableInterest,
    1
  );

  const maxActive = Math.max(
    data.activeReceivableCount,
    data.activePayableCount,
    1
  );

  const statusItems = [
    { label: "Pending", value: data.pendingCount },
    { label: "Partially paid", value: data.partiallyPaidCount },
    { label: "Completed", value: data.completedCount },
    { label: "Overdue", value: data.overdueCount, danger: true },
  ];

  return (
    <section className="reports-section money-due-report-section">
      <div className="reports-section-heading">
        <div>
          <span className="reports-section-kicker">Receivables &amp; Payables</span>
          <h2>Money Due Analytics</h2>
          <p>
            Records with a due date in {monthName} {year}. Amounts show the
            outstanding balance for those records.
          </p>
        </div>

        <span className="reports-section-count">
          {data.activeReceivableCount + data.activePayableCount} active records
        </span>
      </div>

      <div className="reports-divider" />

      <div className="money-due-report-amount-grid">
        <article className="money-due-report-card receivable">
          <span>To Receive</span>
          <strong>{formatCurrency(data.totalReceivable)}</strong>
          <small>{data.activeReceivableCount} active receivables</small>
        </article>

        <article className="money-due-report-card payable">
          <span>To Pay</span>
          <strong>{formatCurrency(data.totalPayable)}</strong>
          <small>{data.activePayableCount} active payables</small>
        </article>

        <article className="money-due-report-card interest-receivable">
          <span>Receivable Interest</span>
          <strong>{formatCurrency(data.receivableInterest)}</strong>
          <small>Interest on records due this month</small>
        </article>

        <article className="money-due-report-card interest-payable">
          <span>Payable Interest</span>
          <strong>{formatCurrency(data.payableInterest)}</strong>
          <small>Interest on records due this month</small>
        </article>
      </div>

      <div className="money-due-report-status-grid">
        {statusItems.map((item) => (
          <div key={item.label} className={item.danger ? "money-due-report-overdue" : ""}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="money-due-chart-grid">
        <article className="money-due-chart-card">
          <div className="money-due-chart-heading">
            <div>
              <span>Outstanding balance</span>
              <h3>Receivable vs payable</h3>
            </div>
            <small>{formatCurrency(totalAmount)} total</small>
          </div>

          <div className="money-due-donut-layout">
            <div
              className="money-due-donut"
              style={{
                background: totalAmount > 0
                  ? `conic-gradient(#21c77a 0 ${receivableShare}%, #ff6467 ${receivableShare}% 100%)`
                  : "rgba(148, 163, 184, 0.16)",
              }}
              aria-label={`${receivableShare}% receivable and ${payableShare}% payable`}
            >
              <div>
                <strong>{receivableShare}%</strong>
                <span>Receivable</span>
              </div>
            </div>

            <div className="money-due-legend">
              <div>
                <i className="receive" />
                <span>To Receive</span>
                <strong>{formatCurrency(data.totalReceivable)}</strong>
              </div>
              <div>
                <i className="pay" />
                <span>To Pay</span>
                <strong>{formatCurrency(data.totalPayable)}</strong>
              </div>
            </div>
          </div>
        </article>

       

        <article className="money-due-chart-card">
          <div className="money-due-chart-heading">
            <div>
              <span>Interest analysis</span>
              <h3>Receivable vs payable interest</h3>
            </div>
          </div>

          <div className="money-due-horizontal-bars interest-bars">
            <div className="money-due-bar-row">
              <div>
                <span>Receivable interest</span>
                <strong>{formatCurrency(data.receivableInterest)}</strong>
              </div>
              <div className="money-due-bar-track">
                <div style={{ width: `${(data.receivableInterest / maxInterest) * 100}%` }} />
              </div>
            </div>
            <div className="money-due-bar-row">
              <div>
                <span>Payable interest</span>
                <strong>{formatCurrency(data.payableInterest)}</strong>
              </div>
              <div className="money-due-bar-track orange">
                <div style={{ width: `${(data.payableInterest / maxInterest) * 100}%` }} />
              </div>
            </div>
          </div>
        </article>

        <article className="money-due-chart-card">
          <div className="money-due-chart-heading">
            <div>
              <span>Active records</span>
              <h3>Receivable vs payable count</h3>
            </div>
          </div>

          <div className="money-due-horizontal-bars active-bars">
            <div className="money-due-bar-row">
              <div>
                <span>Receivables</span>
                <strong>{data.activeReceivableCount}</strong>
              </div>
              <div className="money-due-bar-track green">
                <div style={{ width: `${(data.activeReceivableCount / maxActive) * 100}%` }} />
              </div>
            </div>
            <div className="money-due-bar-row">
              <div>
                <span>Payables</span>
                <strong>{data.activePayableCount}</strong>
              </div>
              <div className="money-due-bar-track red">
                <div style={{ width: `${(data.activePayableCount / maxActive) * 100}%` }} />
              </div>
            </div>
          </div>
        </article>
      </div>

      <style>{moneyDueAnalyticsStyles}</style>
    </section>
  );
}

const moneyDueAnalyticsStyles = `
  .money-due-report-amount-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 13px;
    margin-top: 20px;
  }

  .money-due-report-card,
  .money-due-chart-card {
    min-width: 0;
    border: 1px solid rgba(255, 255, 255, 0.72);
    border-radius: 17px;
    background: rgba(255, 255, 255, 0.62);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.86);
  }

  .money-due-report-card { padding: 15px; }
  .money-due-report-card span,
  .money-due-report-card strong,
  .money-due-report-card small { display: block; }
  .money-due-report-card span {
    color: #64748b;
    font-size: 0.69rem;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .money-due-report-card strong {
    margin-top: 8px;
    color: #172033;
    font-size: 1.22rem;
    overflow-wrap: anywhere;
  }
  .money-due-report-card small {
    margin-top: 6px;
    color: #94a3b8;
    font-size: 0.67rem;
  }
  .money-due-report-card.receivable { border-bottom: 3px solid #21c77a; background: rgba(33, 199, 122, 0.055); }
  .money-due-report-card.payable { border-bottom: 3px solid #ff6467; background: rgba(255, 100, 103, 0.055); }
  .money-due-report-card.interest-receivable { border-bottom: 3px solid #7c5cfc; background: rgba(124, 92, 252, 0.055); }
  .money-due-report-card.interest-payable { border-bottom: 3px solid #f59e0b; background: rgba(245, 158, 11, 0.06); }

  .money-due-report-status-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-top: 18px;
    padding: 16px 0;
    border-top: 1px solid rgba(148, 163, 184, 0.17);
    border-bottom: 1px solid rgba(148, 163, 184, 0.17);
  }
  .money-due-report-status-grid > div {
    padding: 4px 18px;
    border-right: 1px solid rgba(148, 163, 184, 0.17);
    text-align: center;
  }
  .money-due-report-status-grid > div:last-child { border-right: 0; }
  .money-due-report-status-grid span,
  .money-due-report-status-grid strong { display: block; }
  .money-due-report-status-grid span {
    color: #64748b;
    font-size: 0.67rem;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .money-due-report-status-grid strong { margin-top: 6px; color: #172033; font-size: 1.05rem; }
  .money-due-report-overdue strong { color: #dc2626; }

  .money-due-chart-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-top: 20px;
  }
  .money-due-chart-card { padding: 18px; }
  .money-due-chart-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .money-due-chart-heading span {
    color: #7c5cfc;
    font-size: 0.66rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .money-due-chart-heading h3 { margin: 5px 0 0; color: #172033; font-size: 1rem; }
  .money-due-chart-heading small { color: #94a3b8; font-size: 0.67rem; }

  .money-due-donut-layout {
    display: grid;
    grid-template-columns: 150px 1fr;
    align-items: center;
    gap: 22px;
    margin-top: 20px;
  }
  .money-due-donut {
    width: 145px;
    height: 145px;
    display: grid;
    place-items: center;
    border-radius: 50%;
  }
  .money-due-donut > div {
    width: 92px;
    height: 92px;
    display: grid;
    place-content: center;
    border-radius: 50%;
    background: rgba(248, 250, 252, 0.96);
    text-align: center;
  }
  .money-due-donut strong,
  .money-due-donut span { display: block; }
  .money-due-donut strong { color: #172033; font-size: 1.2rem; }
  .money-due-donut span { margin-top: 3px; color: #64748b; font-size: 0.64rem; }
  .money-due-legend { display: grid; gap: 13px; }
  .money-due-legend > div {
    display: grid;
    grid-template-columns: 10px minmax(0, 1fr);
    grid-template-areas:
        "dot label"
        ". amount";
    align-items: center;
    column-gap: 8px;
    row-gap: 2px;
  }
  .money-due-legend i.receive { background: #21c77a; }
  .money-due-legend i.pay { background: #ff6467; }
  .money-due-legend i {
    grid-area: dot;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    align-self: center;
 }

  .money-due-legend span {
    grid-area: label;
    color: #64748b;
    font-size: 0.72rem;
    align-self: center;
 }

    .money-due-legend strong {
    grid-area: amount;
    color: #172033;
    font-size: 0.76rem;
    font-weight: 700;
    white-space: nowrap;
    }

  .money-due-horizontal-bars { display: grid; gap: 15px; margin-top: 22px; }
  .money-due-bar-row > div:first-child {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 7px;
  }
  .money-due-bar-row span { color: #64748b; font-size: 0.72rem; font-weight: 800; }
  .money-due-bar-row strong { color: #172033; font-size: 0.76rem; }
  .money-due-bar-track {
    height: 9px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.16);
  }
  .money-due-bar-track > div {
    height: 100%;
    min-width: 0;
    border-radius: inherit;
    background: linear-gradient(90deg, #5b8cff, #7b61ff);
  }
  .money-due-bar-track > div.danger { background: linear-gradient(90deg, #fb7185, #ef4444); }
  .money-due-bar-track.orange > div { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
  .money-due-bar-track.green > div { background: linear-gradient(90deg, #34d399, #10b981); }
  .money-due-bar-track.red > div { background: linear-gradient(90deg, #fb7185, #ef4444); }

  @media (max-width: 900px) {
    .money-due-report-amount-grid,
    .money-due-chart-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 760px) {
    .money-due-chart-grid { grid-template-columns: 1fr; }
    .money-due-report-status-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .money-due-report-status-grid > div { padding: 12px 8px; border-right: 0; border-bottom: 1px solid rgba(148, 163, 184, 0.14); }
    .money-due-report-status-grid > div:nth-last-child(-n + 2) { border-bottom: 0; }
  }

  @media (max-width: 480px) {
    .money-due-report-amount-grid { gap: 8px; }
    .money-due-report-card { padding: 14px 11px; }
    .money-due-report-card strong { font-size: 1rem; }
    .money-due-donut-layout { grid-template-columns: 1fr; justify-items: center; }
    .money-due-legend { width: 100%; }
  }
`;

export default MoneyDueAnalytics;