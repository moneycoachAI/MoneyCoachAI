using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MoneyCoachAI.Api.Services;
using MoneyCoachAI.Api.Settings;
using MoneyCoachAI.Api.Repositories;
using System.Text;

var builder  = WebApplication.CreateBuilder(args);


//MongoDB settings
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

//JWT Settings
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("JwtSettings"));

//Google Auth
builder.Services.Configure<GoogleAuthSettings>(
    builder.Configuration.GetSection("GoogleAuth"));

builder.Services.Configure<OpenAISettings>(
    builder.Configuration.GetSection("OpenAISettings"));

//Email Settings
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("EmailSettings")
);

//Database Service
builder.Services.AddHttpClient<AIAdvisorService>();
builder.Services.AddSingleton<DatabaseService>();

builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<AuthService>();

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddScoped<FinancialGoalRepository>();
builder.Services.AddScoped<FinancialGoalService>();

builder.Services.AddScoped<NetWorthRepository>();
builder.Services.AddScoped<NetWorthService>();

builder.Services.AddScoped<RecurringTransactionRepository>();
builder.Services.AddScoped<RecurringTransactionService>();

builder.Services.AddScoped<NetWorthSnapshotRepository>();

builder.Services.AddScoped<InvestmentRepository>();
builder.Services.AddScoped<InvestmentService>();

builder.Services.AddScoped<NotificationRepository>();
builder.Services.AddScoped<NotificationService>();

builder.Services.AddScoped<UserSettingsRepository>();
builder.Services.AddScoped<UserSettingsService>();

builder.Services.AddScoped<ProfileService>();

builder.Services.AddScoped<PasswordResetTokenRepository>();

builder.Services.AddScoped<EmailService>();

builder.Services.AddScoped<PasswordResetService>();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter JWT token only. Do not write Bearer manually."
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration
            .GetSection("JwtSettings")
            .Get<JwtSettings>();

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtSettings!.Issuer,
            ValidAudience = jwtSettings.Audience,

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
        };
    });

builder.Services.AddScoped<ExpenseRepository>();
builder.Services.AddScoped<ExpenseService>();

builder.Services.AddScoped<BudgetRepository>();
builder.Services.AddScoped<BudgetService>();

builder.Services.AddScoped<ReportService>();

builder.Services.AddScoped<SuggestionService>();

builder.Services.AddScoped<DashboardService>();

builder.Services.AddScoped<IncomeRepository>();
builder.Services.AddScoped<IncomeService>();

builder.Services.AddScoped<PdfReportService>();


builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy",
        policy =>
        {
            policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .WithOrigins("http://localhost:5173");  //allow React to call ASP.NET.
        });
});
var app = builder.Build();

app.UseCors("ReactPolicy");

//Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();