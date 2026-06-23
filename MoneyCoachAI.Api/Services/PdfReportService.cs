using MoneyCoachAI.Api.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MoneyCoachAI.Api.Services;

public class PdfReportService
{
    public byte[] GenerateMonthlyReportPdf(
        int month,
        int year,
        MonthlyReportPdfResponse report)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(12));

                page.Header()
                    .Text("MoneyCoachAI Monthly Report")
                    .FontSize(22)
                    .Bold()
                    .FontColor(Colors.Blue.Medium);

                page.Content()
                    .PaddingVertical(20)
                    .Column(column =>
                    {
                        column.Spacing(15);

                        column.Item()
                            .Text($"Report Month: {month}/{year}")
                            .FontSize(16)
                            .Bold();

                        column.Item().LineHorizontal(1);

                        column.Item().Text("Financial Summary")
                            .FontSize(18)
                            .Bold();

                        column.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Cell().Text("Total Income").Bold();
                            table.Cell().Text($"₹{report.TotalIncome}");

                            table.Cell().Text("Total Expenses").Bold();
                            table.Cell().Text($"₹{report.TotalSpent}");

                            table.Cell().Text("Savings").Bold();
                            table.Cell().Text($"₹{report.Savings}");

                            table.Cell().Text("Savings Rate").Bold();
                            table.Cell().Text($"{report.SavingsRate:F1}%");
                        });

                        column.Item().LineHorizontal(1);

                        column.Item().Text("Smart Suggestions")
                            .FontSize(18)
                            .Bold();

                        if (report.Suggestions.Count == 0)
                        {
                            column.Item().Text("No suggestions available.");
                        }
                        else
                        {
                            foreach (var suggestion in report.Suggestions)
                            {
                                column.Item().Text($"- {suggestion}");
                            }
                        }

                        column.Item().LineHorizontal(1);

                        column.Item().Text("AI Advisor Insights")
                            .FontSize(18)
                            .Bold();

                        if (report.AiInsights.Count == 0)
                        {
                            column.Item().Text("No AI insights available.");
                        }
                        else
                        {
                            foreach (var insight in report.AiInsights)
                            {
                                column.Item().Text($"- {insight}");
                            }
                        }
                    });

                page.Footer()
                    .AlignCenter()
                    .Text($"Generated on {DateTime.Now:dd MMM yyyy}");
            });
        });

        return document.GeneratePdf();
    }
}