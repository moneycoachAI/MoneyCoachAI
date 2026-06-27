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

    public IMongoCollection<NetWorthSnapshot> NetWorthSnapshots =>
        _database.GetCollection<NetWorthSnapshot>("NetWorthSnapshots");

    public IMongoCollection<Investment> Investments =>
    _database.GetCollection<Investment>("Investments");
}