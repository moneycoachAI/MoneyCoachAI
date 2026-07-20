using MoneyCoachAI.Api.DTOs.RecurringTransactions;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Repositories;

namespace MoneyCoachAI.Api.Services;

public class RecurringTransactionService
{
    private readonly RecurringTransactionRepository _repository;
    private readonly IncomeRepository _incomeRepository;
    private readonly ExpenseRepository _expenseRepository;

    public RecurringTransactionService(
    RecurringTransactionRepository repository,
    IncomeRepository incomeRepository,
    ExpenseRepository expenseRepository)
    {
        _repository = repository;
        _incomeRepository = incomeRepository;
        _expenseRepository = expenseRepository;
    }

    public async Task<List<RecurringTransactionResponse>>
        GetRecurringTransactionsAsync(string userId)
    {
        var transactions =
            await _repository.GetByUserAsync(userId);

        return transactions.Select(transaction =>
            new RecurringTransactionResponse
            {
                Id = transaction.Id,
                Title = transaction.Title,
                Amount = transaction.Amount,
                Category = transaction.Category,
                Type = transaction.Type,
                Frequency = transaction.Frequency,
                StartDate = transaction.StartDate,
                IsActive = transaction.IsActive
            }).ToList();
    }

    public async Task CreateRecurringTransactionAsync(
        string userId,
        CreateRecurringTransactionRequest request)
    {
        var transaction = new RecurringTransaction
        {
            UserId = userId,
            Title = request.Title,
            Amount = request.Amount,
            Category = request.Category,
            Type = request.Type,
            Frequency = request.Frequency,
            StartDate = request.StartDate,
            IsActive = true
        };

        await _repository.CreateAsync(transaction);
    }

    public async Task<bool> UpdateRecurringTransactionAsync(
    string id,
    string userId,
    CreateRecurringTransactionRequest request)
    {
        var transaction =
            await _repository.GetByIdAsync(id, userId);

        if (transaction == null)
        {
            return false;
        }

        transaction.Title = request.Title.Trim();
        transaction.Amount = request.Amount;
        transaction.Category = request.Category.Trim();
        transaction.Type = request.Type;
        transaction.Frequency = request.Frequency;
        transaction.StartDate = request.StartDate;

        return await _repository.UpdateAsync(transaction);
    }

    public async Task<int> GenerateForMonthAsync(
    string userId,
    int month,
    int year)
    {
        var recurringTransactions =
            await _repository.GetByUserAsync(userId);

        var monthStartDate = new DateTime(year, month, 1);

        var activeTransactions = recurringTransactions
            .Where(transaction =>
                transaction.IsActive &&
                transaction.StartDate <= monthStartDate &&
                (
                    transaction.EndDate == null ||
                    transaction.EndDate >= monthStartDate
                ))
            .ToList();

        var generatedCount = 0;

        foreach (var transaction in activeTransactions)
        {
            var entryDate = monthStartDate;

            if (transaction.Type == "Income")
            {
                var exists =
                    await _incomeRepository.ExistsRecurringIncomeAsync(
                        userId,
                        transaction.Id,
                        month,
                        year);

                if (exists)
                {
                    continue;
                }

                var income = new Income
                {
                    UserId = userId,
                    Amount = transaction.Amount,
                    Source = transaction.Category,
                    Description = transaction.Title,
                    Date = entryDate,
                    RecurringTransactionId = transaction.Id
                };

                await _incomeRepository.CreateAsync(income);
                generatedCount++;
            }
            else if (transaction.Type == "Expense")
            {
                var exists =
                    await _expenseRepository.ExistsRecurringExpenseAsync(
                        userId,
                        transaction.Id,
                        month,
                        year);

                if (exists)
                {
                    continue;
                }

                var expense = new Expense
                {
                    UserId = userId,
                    Amount = transaction.Amount,
                    Category = transaction.Category,
                    Description = transaction.Title,
                    Date = entryDate,
                    RecurringTransactionId = transaction.Id
                };

                await _expenseRepository.CreateAsync(expense);
                generatedCount++;
            }
        }

        return generatedCount;
    }

    public async Task DeleteRecurringTransactionAsync(
        string id,
        string userId)
    {
        await _repository.DeleteAsync(id, userId);
    }
}