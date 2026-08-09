using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MoneyCoachAI.Api.Models;
using MoneyCoachAI.Api.Settings;

namespace MoneyCoachAI.Api.Services;

public class DatabaseService
{
    private readonly IMongoDatabase _database;

    public DatabaseService(IOptions<MongoDbSettings> mongoDbSettings)
    {
        var mongoClient = new MongoClient(
            mongoDbSettings.Value.ConnectionString);

        _database = mongoClient.GetDatabase(
            mongoDbSettings.Value.DatabaseName);
    }

    public IMongoCollection<User> UsersCollection =>
        _database.GetCollection<User>("Users");

    public IMongoCollection<Expense> ExpensesCollection =>
        _database.GetCollection<Expense>("Expenses");

    public IMongoCollection<Budget> BudgetsCollection =>
        _database.GetCollection<Budget>("Budgets");

    public IMongoCollection<Income> IncomesCollection =>
        _database.GetCollection<Income>("Incomes");

    public IMongoCollection<FinancialGoal> FinancialGoals =>
    _database.GetCollection<FinancialGoal>("FinancialGoals");

    public IMongoCollection<NetWorthItem> NetWorthItems =>
    _database.GetCollection<NetWorthItem>("NetWorthItems");

    public IMongoCollection<RecurringTransaction> RecurringTransactions =>
        _database.GetCollection<RecurringTransaction>("RecurringTransactions");

    public IMongoCollection<MoneyDue> MoneyDueCollection =>
    _database.GetCollection<MoneyDue>("MoneyDue");

    public IMongoCollection<NetWorthSnapshot> NetWorthSnapshots =>
        _database.GetCollection<NetWorthSnapshot>("NetWorthSnapshots");

    public IMongoCollection<Investment> Investments =>
    _database.GetCollection<Investment>("Investments");

    public IMongoCollection<Notification> NotificationsCollection =>
    _database.GetCollection<Notification>("Notifications");

    public IMongoCollection<UserSettings> UserSettingsCollection =>
    _database.GetCollection<UserSettings>("UserSettings");

    public IMongoCollection<PasswordResetToken> PasswordResetTokens =>
    _database.GetCollection<PasswordResetToken>("PasswordResetTokens");

    public async Task EnsureIndexesAsync()
    {
        // Financial Goals
        await FinancialGoals.Indexes.CreateOneAsync(
            new CreateIndexModel<FinancialGoal>(
                Builders<FinancialGoal>.IndexKeys
                    .Ascending(goal => goal.UserId),
                new CreateIndexOptions
                {
                    Name = "IX_FinancialGoals_UserId"
                }));

        // Expenses
        await ExpensesCollection.Indexes.CreateOneAsync(
            new CreateIndexModel<Expense>(
                Builders<Expense>.IndexKeys
                    .Ascending(expense => expense.UserId)
                    .Ascending(expense => expense.Date),
                new CreateIndexOptions
                {
                    Name = "IX_Expenses_UserId_Date"
                }));

        // Incomes
        await IncomesCollection.Indexes.CreateOneAsync(
            new CreateIndexModel<Income>(
                Builders<Income>.IndexKeys
                    .Ascending(income => income.UserId)
                    .Ascending(income => income.Date),
                new CreateIndexOptions
                {
                    Name = "IX_Incomes_UserId_Date"
                }));

        // Budgets
        await BudgetsCollection.Indexes.CreateOneAsync(
            new CreateIndexModel<Budget>(
                Builders<Budget>.IndexKeys
                    .Ascending(budget => budget.UserId)
                    .Ascending(budget => budget.Year)
                    .Ascending(budget => budget.Month),
                new CreateIndexOptions
                {
                    Name = "IX_Budgets_UserId_Year_Month"
                }));
    }
}