using MoneyCoachAI.Api.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;

namespace MoneyCoachAI.Api.Services;

public class AnnualPdfReportService
{
    private const string Purple = "#6D28D9";
    private const string PurpleDark = "#4C1D95";
    private const string PurpleSoft = "#F5F3FF";
    private const string Green = "#15803D";
    private const string GreenSoft = "#F0FDF4";
    private const string Red = "#B91C1C";
    private const string RedSoft = "#FEF2F2";
    private const string Amber = "#B45309";
    private const string AmberSoft = "#FFFBEB";
    private const string Blue = "#1D4ED8";
    private const string Slate = "#334155";
    private const string SlateLight = "#64748B";
    private const string Border = "#D9E1EC";
    private const string Surface = "#F8FAFC";
    private const string White = "#FFFFFF";

    private static readonly CultureInfo IndianCulture =
        CultureInfo.GetCultureInfo("en-IN");

    public byte[] GenerateAnnualReportPdf(
        AnnualReportPdfResponse report)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            // One flowing A4 document.
            // QuestPDF automatically creates the next page only when the
            // previous page is full, so we do not waste large blank areas.
            container.Page(page =>
            {
                ConfigurePage(page);

                page.Content()
                    .Column(column =>
                    {
                        column.Spacing(8);

                        // -------------------------------------------------
                        // Annual overview
                        // -------------------------------------------------

                        column.Item()
                            .Element(c =>
                                ComposeAnnualHeader(
                                    c,
                                    report));

                        column.Item()
                            .Element(c =>
                                ComposeAnnualSummary(
                                    c,
                                    report));

                        column.Item()
                            .Element(c =>
                                ComposeMonthlyHighlights(
                                    c,
                                    report));

                        column.Item()
                            .Element(c =>
                                ComposeYearInsights(
                                    c,
                                    report));


                        // -------------------------------------------------
                        // Current financial position
                        // These are current/global values, not a historical
                        // snapshot of a particular month.
                        // -------------------------------------------------

                        column.Item()
                            .PaddingTop(4)
                            .Element(c =>
                                ComposePageTitle(
                                    c,
                                    "CURRENT FINANCIAL POSITION",
                                    $"Goals, investments and net worth available when the {report.Year} report was generated"));

                        column.Item()
                            .Element(c =>
                                ComposeGoals(
                                    c,
                                    report));

                        column.Item()
                            .Element(c =>
                                ComposeInvestments(
                                    c,
                                    report));

                        column.Item()
                            .Element(c =>
                                ComposeNetWorth(
                                    c,
                                    report));

                        column.Item()
                            .PaddingTop(4)
                            .Element(c =>
                                ComposePageTitle(
                                    c,
                                    "MONEY DUE",
                                    "Current receivables and payables, including outstanding balances and due dates"));

                        column.Item()
                            .Element(c =>
                                ComposeMoneyDue(
                                    c,
                                    report));


                        // -------------------------------------------------
                        // Recurring transactions
                        // Kept in the same flowing document instead of
                        // forcing a dedicated mostly-empty page.
                        // -------------------------------------------------

                        column.Item()
                            .PaddingTop(4)
                            .Element(c =>
                                ComposePageTitle(
                                    c,
                                    "RECURRING TRANSACTIONS",
                                    "Current recurring financial commitments and upcoming schedule"));

                        column.Item()
                            .Element(c =>
                                ComposeRecurring(
                                    c,
                                    report));
                    });

                ComposeFooter(
                    page,
                    report.Year);
            });
        });

        return document.GeneratePdf();
    }

    private static void ConfigurePage(PageDescriptor page)
    {
        page.Size(PageSizes.A4);
        page.Margin(14);

        page.DefaultTextStyle(style =>
            style
                .FontSize(8.3f)
                .FontColor(Slate));
    }

    private static void ComposeAnnualHeader(
        IContainer container,
        AnnualReportPdfResponse report)
    {
        container
            .Border(1)
            .BorderColor("#C4B5FD")
            .Background(White)
            .Padding(12)
            .Row(row =>
            {
                row.RelativeItem()
                    .DefaultTextStyle(style =>
                        style
                            .FontSize(20)
                            .Bold())
                    .Text(brand =>
                    {
                        brand.Span("Money")
                            .FontColor("#8B5CF6");

                        brand.Span("Coach")
                            .FontColor("#111827");

                        brand.Span("A")
                            .FontColor("#F59E0B");

                        brand.Span("I")
                            .FontColor("#111827");
                    });

                row.RelativeItem(1.6f)
                    .AlignCenter()
                    .Column(column =>
                    {
                        column.Item()
                            .AlignCenter()
                            .Text("ANNUAL FINANCIAL REPORT")
                            .FontSize(15)
                            .Bold()
                            .FontColor(PurpleDark);

                        column.Item()
                            .AlignCenter()
                            .Text(report.Year.ToString())
                            .FontSize(13)
                            .Bold();

                        column.Item()
                            .AlignCenter()
                            .Text("Complete yearly financial highlights")
                            .FontSize(7)
                            .FontColor(SlateLight);
                    });

                row.RelativeItem()
                    .AlignRight()
                    .Column(column =>
                    {
                        column.Item()
                            .AlignRight()
                            .Text("YEAR HEALTH")
                            .FontSize(6)
                            .SemiBold()
                            .FontColor(SlateLight);

                        column.Item()
                            .AlignRight()
                            .Text($"{report.AverageHealthScore}/100")
                            .FontSize(15)
                            .Bold()
                            .FontColor(
                                GetHealthColor(
                                    report.OverallHealthStatus));

                        column.Item()
                            .AlignRight()
                            .Text(
                                Safe(
                                    report.OverallHealthStatus,
                                    "Not rated"))
                            .FontSize(7)
                            .SemiBold()
                            .FontColor(
                                GetHealthColor(
                                    report.OverallHealthStatus));
                    });
            });
    }

    private static void ComposeAnnualSummary(
        IContainer container,
        AnnualReportPdfResponse report)
    {
        SectionCard(
            container,
            "YEARLY FINANCIAL SUMMARY",
            Purple,
            content =>
            {
                content.Item()
                    .Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        SummaryCell(
                            table,
                            "Total Income",
                            Money(report.TotalIncome),
                            GreenSoft,
                            Green);

                        SummaryCell(
                            table,
                            "Total Expenses",
                            Money(report.TotalSpent),
                            RedSoft,
                            Red);

                        SummaryCell(
                            table,
                            "Total Savings",
                            Money(report.TotalSavings),
                            report.TotalSavings >= 0
                                ? GreenSoft
                                : RedSoft,
                            report.TotalSavings >= 0
                                ? Green
                                : Red);

                        SummaryCell(
                            table,
                            "Avg Savings Rate",
                            $"{report.AverageSavingsRate:F1}%",
                            PurpleSoft,
                            PurpleDark);
                    });
            });
    }

    private static void ComposeMonthlyHighlights(
        IContainer container,
        AnnualReportPdfResponse report)
    {
        var months = report.Months
            .OrderBy(x => x.Month)
            .ToList();

        SectionCard(
            container,
            "MONTH-BY-MONTH HIGHLIGHTS",
            Blue,
            content =>
            {
                content.Item()
                    .Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(1.1f);
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn(0.8f);
                            columns.RelativeColumn(0.8f);
                        });

                        HeaderCell(table, "Month", false);
                        HeaderCell(table, "Income", true);
                        HeaderCell(table, "Expenses", true);
                        HeaderCell(table, "Savings", true);
                        HeaderCell(table, "Rate", true);
                        HeaderCell(table, "Health", true);

                        if (months.Count == 0)
                        {
                            EmptyRow(
                                table,
                                6,
                                "No monthly financial data found for this year.");
                        }
                        else
                        {
                            foreach (var month in months)
                            {
                                BodyCell(
                                    table,
                                    month.MonthName,
                                    false);

                                BodyCell(
                                    table,
                                    Money(month.TotalIncome),
                                    true);

                                BodyCell(
                                    table,
                                    Money(month.TotalSpent),
                                    true);

                                BodyCell(
                                    table,
                                    Money(month.Savings),
                                    true,
                                    month.Savings >= 0
                                        ? Green
                                        : Red,
                                    true);

                                BodyCell(
                                    table,
                                    $"{month.SavingsRate:F1}%",
                                    true);

                                BodyCell(
                                    table,
                                    $"{month.HealthScore}",
                                    true,
                                    GetHealthColor(
                                        month.HealthStatus),
                                    true);
                            }
                        }
                    });
            });
    }

    private static void ComposeYearInsights(
        IContainer container,
        AnnualReportPdfResponse report)
    {
        var alerts = report.Months
            .SelectMany(month =>
                month.Suggestions.Select(item => new
                {
                    Month = month.MonthName,
                    Item = item
                }))
            .OrderByDescending(x =>
                SeverityRank(x.Item.Severity))
            .Take(6)
            .ToList();

        var ai = report.Months
            .SelectMany(month =>
                month.AiInsights.Select(item => new
                {
                    Month = month.MonthName,
                    Item = item
                }))
            .OrderByDescending(x =>
                SeverityRank(x.Item.Severity))
            .Take(4)
            .ToList();

        SectionCard(
            container,
            "YEAR HIGHLIGHTS & AI INSIGHTS",
            Amber,
            content =>
            {
                content.Item()
                    .Row(row =>
                    {
                        row.Spacing(10);

                        row.RelativeItem()
                            .Column(left =>
                            {
                                left.Item()
                                    .Text("IMPORTANT ALERTS")
                                    .FontSize(6.5f)
                                    .SemiBold()
                                    .FontColor(Amber);

                                if (alerts.Count == 0)
                                {
                                    left.Item()
                                        .PaddingTop(3)
                                        .Text("No yearly alerts available.")
                                        .FontSize(6.5f)
                                        .FontColor(SlateLight);
                                }
                                else
                                {
                                    foreach (var alert in alerts)
                                    {
                                        left.Item()
                                            .PaddingTop(3)
                                            .Text(
                                                $"{alert.Month}: {Shorten(alert.Item.Message, 120)}")
                                            .FontSize(6.4f)
                                            .FontColor(
                                                GetSeverityColor(
                                                    alert.Item.Severity));
                                    }
                                }
                            });

                        row.RelativeItem()
                            .Column(right =>
                            {
                                right.Item()
                                    .Text("AI ADVISOR")
                                    .FontSize(6.5f)
                                    .SemiBold()
                                    .FontColor(PurpleDark);

                                if (ai.Count == 0)
                                {
                                    right.Item()
                                        .PaddingTop(3)
                                        .Text("No AI insights available.")
                                        .FontSize(6.5f)
                                        .FontColor(SlateLight);
                                }
                                else
                                {
                                    foreach (var insight in ai)
                                    {
                                        right.Item()
                                            .PaddingTop(3)
                                            .Text(
                                                $"{insight.Month}: {Safe(insight.Item.Title, "Insight")} - {Shorten(insight.Item.Message, 110)}")
                                            .FontSize(6.4f);
                                    }
                                }
                            });
                    });
            });
    }

    private static void ComposeGoals(
        IContainer container,
        AnnualReportPdfResponse report)
    {
        var goals = report.FinancialGoals
            .OrderByDescending(x => x.ProgressPercentage)
            .ToList();

        SectionCard(
            container,
            "FINANCIAL GOALS",
            Purple,
            content =>
            {
                content.Item()
                    .Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(1.3f);
                            columns.RelativeColumn(0.8f);
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn(1.8f);
                        });

                        HeaderCell(table, "Goal", false);
                        HeaderCell(table, "Progress", true);
                        HeaderCell(table, "Current", true);
                        HeaderCell(table, "Target", true);
                        HeaderCell(table, "Recommendation", false);

                        if (goals.Count == 0)
                        {
                            EmptyRow(
                                table,
                                5,
                                "No financial goals available.");
                        }
                        else
                        {
                            foreach (var goal in goals)
                            {
                                BodyCell(table, goal.Name, false);
                                BodyCell(
                                    table,
                                    $"{goal.ProgressPercentage:F0}%",
                                    true,
                                    Purple,
                                    true);
                                BodyCell(
                                    table,
                                    Money(goal.CurrentAmount),
                                    true);
                                BodyCell(
                                    table,
                                    Money(goal.TargetAmount),
                                    true);
                                BodyCell(
                                    table,
                                    Shorten(
                                        goal.Recommendation,
                                        90),
                                    false);
                            }
                        }
                    });
            });
    }

    private static void ComposeInvestments(
        IContainer container,
        AnnualReportPdfResponse report)
    {
        var summary = report.InvestmentSummary;

        SectionCard(
            container,
            "INVESTMENTS",
            Green,
            content =>
            {
                content.Item()
                    .Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        SummaryCell(
                            table,
                            "Invested",
                            Money(summary.TotalInvested),
                            Surface,
                            Slate);

                        SummaryCell(
                            table,
                            "Current Value",
                            Money(summary.TotalCurrentValue),
                            GreenSoft,
                            Green);

                        SummaryCell(
                            table,
                            "Profit / Loss",
                            Money(summary.TotalProfitOrLoss),
                            summary.TotalProfitOrLoss >= 0
                                ? GreenSoft
                                : RedSoft,
                            summary.TotalProfitOrLoss >= 0
                                ? Green
                                : Red);

                        SummaryCell(
                            table,
                            "Return",
                            $"{summary.ProfitOrLossPercentage:F1}%",
                            PurpleSoft,
                            PurpleDark);
                    });

                content.Item()
                    .PaddingTop(5)
                    .Text("ALLOCATION")
                    .FontSize(6.5f)
                    .SemiBold()
                    .FontColor(Green);

                foreach (
                    var allocation
                    in report.InvestmentAllocation
                        .OrderByDescending(x => x.Amount))
                {
                    content.Item()
                        .PaddingTop(2)
                        .Row(row =>
                        {
                            row.RelativeItem()
                                .Text(allocation.Type)
                                .FontSize(7);

                            row.RelativeItem()
                                .AlignRight()
                                .Text(
                                    $"{Money(allocation.Amount)} • {allocation.Percentage:F1}%")
                                .FontSize(7)
                                .SemiBold();
                        });
                }
            });
    }

    private static void ComposeNetWorth(
        IContainer container,
        AnnualReportPdfResponse report)
    {
        var netWorth = report.NetWorth;

        var assets = report.NetWorthItems
            .Where(item =>
                string.Equals(
                    item.Type,
                    "Asset",
                    StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(item =>
                item.Amount)
            .ToList();

        var liabilities = report.NetWorthItems
            .Where(item =>
                string.Equals(
                    item.Type,
                    "Liability",
                    StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(item =>
                item.Amount)
            .ToList();

        SectionCard(
            container,
            "NET WORTH",
            Amber,
            content =>
            {
                // Overall totals
                content.Item()
                    .Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        SummaryCell(
                            table,
                            "Assets",
                            Money(netWorth.TotalAssets),
                            GreenSoft,
                            Green);

                        SummaryCell(
                            table,
                            "Liabilities",
                            Money(netWorth.TotalLiabilities),
                            RedSoft,
                            Red);

                        SummaryCell(
                            table,
                            "Net Worth",
                            Money(netWorth.NetWorth),
                            PurpleSoft,
                            netWorth.NetWorth >= 0
                                ? PurpleDark
                                : Red);
                    });

                // Actual item-level data
                content.Item()
                    .PaddingTop(7)
                    .Row(row =>
                    {
                        row.Spacing(10);

                        row.RelativeItem()
                            .Column(assetColumn =>
                            {
                                assetColumn.Item()
                                    .Text($"ASSETS ({assets.Count})")
                                    .FontSize(6.8f)
                                    .SemiBold()
                                    .FontColor(Green);

                                assetColumn.Item()
                                    .PaddingTop(3)
                                    .Table(table =>
                                    {
                                        table.ColumnsDefinition(columns =>
                                        {
                                            columns.RelativeColumn(1.5f);
                                            columns.RelativeColumn();
                                        });

                                        HeaderCell(
                                            table,
                                            "Asset",
                                            false);

                                        HeaderCell(
                                            table,
                                            "Amount",
                                            true);

                                        if (assets.Count == 0)
                                        {
                                            EmptyRow(
                                                table,
                                                2,
                                                "No asset items available.");
                                        }
                                        else
                                        {
                                            foreach (var item in assets)
                                            {
                                                BodyCell(
                                                    table,
                                                    item.Name,
                                                    false);

                                                BodyCell(
                                                    table,
                                                    Money(item.Amount),
                                                    true,
                                                    Green,
                                                    true);
                                            }
                                        }
                                    });
                            });

                        row.RelativeItem()
                            .Column(liabilityColumn =>
                            {
                                liabilityColumn.Item()
                                    .Text($"LIABILITIES ({liabilities.Count})")
                                    .FontSize(6.8f)
                                    .SemiBold()
                                    .FontColor(Red);

                                liabilityColumn.Item()
                                    .PaddingTop(3)
                                    .Table(table =>
                                    {
                                        table.ColumnsDefinition(columns =>
                                        {
                                            columns.RelativeColumn(1.5f);
                                            columns.RelativeColumn();
                                        });

                                        HeaderCell(
                                            table,
                                            "Liability",
                                            false);

                                        HeaderCell(
                                            table,
                                            "Amount",
                                            true);

                                        if (liabilities.Count == 0)
                                        {
                                            EmptyRow(
                                                table,
                                                2,
                                                "No liability items available.");
                                        }
                                        else
                                        {
                                            foreach (var item in liabilities)
                                            {
                                                BodyCell(
                                                    table,
                                                    item.Name,
                                                    false);

                                                BodyCell(
                                                    table,
                                                    Money(item.Amount),
                                                    true,
                                                    Red,
                                                    true);
                                            }
                                        }
                                    });
                            });
                    });
            });
    }

    private static void ComposeMoneyDue(
        IContainer container,
        AnnualReportPdfResponse report)
    {
        var items = report.MoneyDueItems
            .OrderBy(item =>
                item.Status == "Completed" ? 1 : 0)
            .ThenBy(item =>
                item.DueDate)
            .ToList();

        var openItems = items
            .Where(item =>
                !string.Equals(
                    item.Status,
                    "Completed",
                    StringComparison.OrdinalIgnoreCase))
            .ToList();

        var receivableRemaining = openItems
            .Where(item =>
                string.Equals(
                    item.DueType,
                    "Receivable",
                    StringComparison.OrdinalIgnoreCase))
            .Sum(item =>
                item.RemainingAmount);

        var payableRemaining = openItems
            .Where(item =>
                string.Equals(
                    item.DueType,
                    "Payable",
                    StringComparison.OrdinalIgnoreCase))
            .Sum(item =>
                item.RemainingAmount);

        var overdueCount = openItems.Count(item =>
            item.IsOverdue);

        SectionCard(
            container,
            "MONEY DUE ITEMS",
            Amber,
            content =>
            {
                content.Item()
                    .Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        SummaryCell(
                            table,
                            "Receivable Remaining",
                            Money(receivableRemaining),
                            GreenSoft,
                            Green);

                        SummaryCell(
                            table,
                            "Payable Remaining",
                            Money(payableRemaining),
                            RedSoft,
                            Red);

                        SummaryCell(
                            table,
                            "Overdue Items",
                            overdueCount.ToString(),
                            overdueCount > 0
                                ? RedSoft
                                : GreenSoft,
                            overdueCount > 0
                                ? Red
                                : Green);
                    });

                content.Item()
                    .PaddingTop(7)
                    .Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(1.25f);
                            columns.RelativeColumn(1.05f);
                            columns.RelativeColumn(0.8f);
                            columns.RelativeColumn(0.9f);
                            columns.RelativeColumn(0.9f);
                            columns.RelativeColumn(0.85f);
                            columns.RelativeColumn(0.9f);
                        });

                        HeaderCell(table, "Title", false);
                        HeaderCell(table, "Type / Category", false);
                        HeaderCell(table, "Total", true);
                        HeaderCell(table, "Settled", true);
                        HeaderCell(table, "Remaining", true);
                        HeaderCell(table, "Due Date", true);
                        HeaderCell(table, "Status", true);

                        if (items.Count == 0)
                        {
                            EmptyRow(
                                table,
                                7,
                                "No Money Due records available.");
                        }
                        else
                        {
                            foreach (var item in items)
                            {
                                BodyCell(
                                    table,
                                    Safe(item.Title, "Untitled"),
                                    false);

                                BodyCell(
                                    table,
                                    $"{Safe(item.DueType, "-")} • {Safe(item.Category, "-")}",
                                    false,
                                    string.Equals(
                                        item.DueType,
                                        "Receivable",
                                        StringComparison.OrdinalIgnoreCase)
                                        ? Green
                                        : Red,
                                    true);

                                BodyCell(
                                    table,
                                    Money(item.TotalAmount),
                                    true);

                                BodyCell(
                                    table,
                                    Money(item.SettledAmount),
                                    true,
                                    Green);

                                BodyCell(
                                    table,
                                    Money(item.RemainingAmount),
                                    true,
                                    item.RemainingAmount > 0
                                        ? Amber
                                        : Green,
                                    true);

                                BodyCell(
                                    table,
                                    item.DueDate.ToString("dd MMM yyyy"),
                                    true,
                                    item.IsOverdue
                                        ? Red
                                        : Slate);

                                BodyCell(
                                    table,
                                    item.IsOverdue
                                        ? "Overdue"
                                        : Safe(item.Status, "-"),
                                    true,
                                    item.IsOverdue
                                        ? Red
                                        : string.Equals(
                                            item.Status,
                                            "Completed",
                                            StringComparison.OrdinalIgnoreCase)
                                            ? Green
                                            : Amber,
                                    true);
                            }
                        }
                    });
            });
    }

    private static void ComposeRecurring(
        IContainer container,
        AnnualReportPdfResponse report)
    {
        SectionCard(
            container,
            "RECURRING TRANSACTION SCHEDULE",
            Blue,
            content =>
            {
                content.Item()
                    .Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(1.4f);
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        HeaderCell(table, "Transaction", false);
                        HeaderCell(table, "Type", false);
                        HeaderCell(table, "Amount", true);
                        HeaderCell(table, "Next Date", true);
                        HeaderCell(table, "Status", true);

                        if (report.RecurringTransactions.Count == 0)
                        {
                            EmptyRow(
                                table,
                                5,
                                "No recurring transactions available.");
                        }
                        else
                        {
                            foreach (
                                var item
                                in report.RecurringTransactions
                                    .OrderBy(x => x.NextOccurrenceDate))
                            {
                                BodyCell(
                                    table,
                                    Safe(
                                        item.OtherDescription,
                                        item.Title),
                                    false);

                                BodyCell(
                                    table,
                                    item.Type,
                                    false);

                                BodyCell(
                                    table,
                                    Money(item.Amount),
                                    true);

                                BodyCell(
                                    table,
                                    item.NextOccurrenceDate
                                        .ToString("dd MMM yyyy"),
                                    true);

                                BodyCell(
                                    table,
                                    item.ReminderStatus,
                                    true,
                                    item.DaysUntilDue < 0
                                        ? Red
                                        : Green,
                                    true);
                            }
                        }
                    });
            });
    }

    private static void ComposePageTitle(
        IContainer container,
        string title,
        string subtitle)
    {
        container
            .BorderBottom(2)
            .BorderColor(Purple)
            .PaddingBottom(6)
            .Column(column =>
            {
                column.Item()
                    .Text(title)
                    .FontSize(15)
                    .Bold()
                    .FontColor(PurpleDark);

                column.Item()
                    .Text(subtitle)
                    .FontSize(7)
                    .FontColor(SlateLight);
            });
    }

    private static void ComposeFooter(
        PageDescriptor page,
        int year)
    {
        page.Footer()
            .PaddingTop(4)
            .Row(row =>
            {
                row.RelativeItem()
                    .Text(
                        $"Generated by MoneyCoachAI • {DateTime.Now:dd MMM yyyy}")
                    .FontSize(6)
                    .FontColor(SlateLight);

                row.RelativeItem()
                    .AlignCenter()
                    .Text($"{year} Annual Financial Report")
                    .FontSize(6)
                    .FontColor(SlateLight);

                row.RelativeItem()
                    .AlignRight()
                    .DefaultTextStyle(style =>
                        style
                            .FontSize(6)
                            .FontColor(SlateLight))
                    .Text(text =>
                    {
                        text.Span("Page ");
                        text.CurrentPageNumber();
                        text.Span(" / ");
                        text.TotalPages();
                    });
            });
    }

    private static void SectionCard(
        IContainer container,
        string title,
        string accent,
        Action<ColumnDescriptor> composeContent)
    {
        container
            .Border(1)
            .BorderColor(Border)
            .Background(White)
            .Padding(9)
            .Column(column =>
            {
                column.Spacing(4);

                column.Item()
                    .Row(row =>
                    {
                        row.ConstantItem(3)
                            .Height(12)
                            .Background(accent);

                        row.RelativeItem()
                            .PaddingLeft(5)
                            .Text(title)
                            .FontSize(8)
                            .Bold();
                    });

                composeContent(column);
            });
    }

    private static void SummaryCell(
        TableDescriptor table,
        string label,
        string value,
        string background,
        string color)
    {
        table.Cell()
            .PaddingRight(3)
            .Background(background)
            .PaddingVertical(8)
            .PaddingHorizontal(4)
            .Column(column =>
            {
                column.Item()
                    .AlignCenter()
                    .Text(label)
                    .FontSize(6)
                    .FontColor(SlateLight);

                column.Item()
                    .AlignCenter()
                    .Text(value)
                    .FontSize(8.5f)
                    .Bold()
                    .FontColor(color);
            });
    }

    private static void HeaderCell(
        TableDescriptor table,
        string text,
        bool alignRight)
    {
        table.Cell()
            .Background(Surface)
            .BorderBottom(1)
            .BorderColor(Border)
            .PaddingVertical(4.5f)
            .PaddingHorizontal(3)
            .Element(cell =>
            {
                var aligned =
                    alignRight
                        ? cell.AlignRight()
                        : cell.AlignLeft();

                aligned
                    .Text(text)
                    .FontSize(6.2f)
                    .SemiBold()
                    .FontColor(SlateLight);
            });
    }

    private static void BodyCell(
        TableDescriptor table,
        string text,
        bool alignRight,
        string? color = null,
        bool bold = false)
    {
        table.Cell()
            .BorderBottom(0.5f)
            .BorderColor("#EEF2F7")
            .PaddingVertical(4.5f)
            .PaddingHorizontal(3)
            .Element(cell =>
            {
                var aligned =
                    alignRight
                        ? cell.AlignRight()
                        : cell.AlignLeft();

                var descriptor =
                    aligned
                        .Text(Safe(text, "-"))
                        .FontSize(6.5f)
                        .FontColor(color ?? Slate);

                if (bold)
                {
                    descriptor.Bold();
                }
            });
    }

    private static void EmptyRow(
        TableDescriptor table,
        int columns,
        string message)
    {
        table.Cell()
            .ColumnSpan((uint)columns)
            .PaddingVertical(8)
            .Text(message)
            .FontSize(6.5f)
            .FontColor(SlateLight);
    }

    private static string Money(decimal amount)
    {
        var absolute =
            Math.Abs(amount)
                .ToString(
                    "N0",
                    IndianCulture);

        return amount < 0
            ? $"-₹{absolute}"
            : $"₹{absolute}";
    }

    private static int SeverityRank(string? severity)
    {
        return severity?.Trim().ToLowerInvariant() switch
        {
            "danger" => 4,
            "warning" => 3,
            "info" => 2,
            "success" => 1,
            _ => 0
        };
    }

    private static string GetSeverityColor(string? severity)
    {
        return severity?.Trim().ToLowerInvariant() switch
        {
            "danger" => Red,
            "warning" => Amber,
            "success" => Green,
            "info" => Blue,
            _ => Slate
        };
    }

    private static string GetHealthColor(string? status)
    {
        return status?.Trim().ToLowerInvariant() switch
        {
            "healthy" => Green,
            "moderate" => Amber,
            "risky" => Red,
            _ => PurpleDark
        };
    }

    private static string Shorten(
        string? text,
        int maxLength)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return "No details available.";
        }

        var cleaned =
            text.Trim()
                .Replace("\r", " ")
                .Replace("\n", " ");

        if (cleaned.Length <= maxLength)
        {
            return cleaned;
        }

        return cleaned[..Math.Max(0, maxLength - 1)]
            .TrimEnd()
            + "…";
    }

    private static string Safe(
        string? value,
        string fallback)
    {
        return string.IsNullOrWhiteSpace(value)
            ? fallback
            : value.Trim();
    }
}