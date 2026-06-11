using Microsoft.Extensions.Options;
using MoneyCoachAI.Api.DTOs;
using MoneyCoachAI.Api.Settings;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

using MoneyCoachAI.Api.Services;

public class AIAdvisorService
{
    private readonly OpenAISettings _openAISettings;
    private readonly ReportService _reportService;
    private readonly SuggestionService _suggestionService;
    private readonly HttpClient _httpClient;

    public AIAdvisorService(
        IOptions<OpenAISettings> openAISettings, ReportService reportService,
        SuggestionService suggestionService, HttpClient httpClient)
    {
        _openAISettings = openAISettings.Value;
        _reportService = reportService;
        _suggestionService = suggestionService;
        _httpClient = httpClient;
    }

    public async Task<AIAdviceResponse> GetAdviceAsync(string userId, AIAdviceRequest request)
    {
        var monthlyReport = await _reportService.GetMonthlyReportAsync(
           userId,
           request.Month,
           request.Year);

        var categoryReport = await _reportService.GetCategoryReportAsync(
            userId,
            request.Month,
            request.Year);

        var suggestions = await _suggestionService.GetSuggestionsAsync(
            userId,
            request.Month,
            request.Year);

        if(string.IsNullOrWhiteSpace(_openAISettings.ApiKey))
        {
            return new AIAdviceResponse
            {
                Advice = "AI Advisor is ready, but openAI Api key is not configure yet. Add your API key later to enable real AI advice."
            };
        }

        var prompt = BuildPrompt(request.Question, monthlyReport, categoryReport, suggestions);

        var requestBody = new
        {
            model = _openAISettings.Model,
            messages = new[]
            {
                new
                {
                    role = "System",
                    content = "You are MoneyCoachAI, a helpful personal finance assistant. Give practical, safe, simple financial advice based only on the provided spending data. Do not give investment guarantees."
                },
                new
                {
                    role = "user",
                    content = prompt
                }
            },
            temperature = 0.4
        };

        var json = JsonSerializer.Serialize(requestBody);

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");

        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _openAISettings.ApiKey);

        httpRequest.Content = new StringContent(json, Encoding.UTF8,"application/json");

        var response = await _httpClient.SendAsync(httpRequest);

        if(!response.IsSuccessStatusCode)
        {
            return new AIAdviceResponse
            {
                Advice = "AI Advisor could not generate advice right now. Please check your OpenAI API key, billing, or model settings."
            };
        }

        var responseContent = await response.Content.ReadAsStringAsync();

        using var document  = JsonDocument.Parse(responseContent);

        var advice = document
            .RootElement
            .GetProperty("choice")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return new AIAdviceResponse
        {
            Advice = advice ?? "No advice generated."
        };

    }

    private string BuildPrompt(
        string question,
        MonthlyReportResponse monthlyReport,
        List<CategoryReportResponse> categoryReport,
        List<SuggestionResponse> suggestions)
    {
        var categoriesText = string.Join(
            "\n",
            categoryReport.Select(category =>
            $"- {category.Category}: ₹{category.TotalSpent}"));

        var suggestionsText = string.Join(
            "\n",
            suggestions.Select(suggestion =>
            $"-{suggestion.Message}"));

        return $@"
User question:
{question}

Monthly report:
Month: {monthlyReport.Month}
Year: {monthlyReport.Year}
Total spent: ₹{monthlyReport.TotalSpent}

Category spending:
{categoriesText}

Rule-based suggestions:
{suggestionsText}

Give clear, practical financial advice in simple language.
";
    }
}