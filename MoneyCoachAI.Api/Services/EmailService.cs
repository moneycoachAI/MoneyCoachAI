using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using MoneyCoachAI.Api.Settings;

namespace MoneyCoachAI.Api.Services;

public class EmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IOptions<EmailSettings> options,
        ILogger<EmailService> logger
    )
    {
        _settings = options.Value;
        _logger = logger;
    }

    public async Task SendPasswordResetEmailAsync(
        string recipientEmail,
        string recipientName,
        string resetLink
    )
    {
        if (
            string.IsNullOrWhiteSpace(
                _settings.Username
            ) ||
            string.IsNullOrWhiteSpace(
                _settings.Password
            )
        )
        {
            throw new InvalidOperationException(
                "Email service is not configured."
            );
        }

        var message = new MimeMessage();

        message.From.Add(
            new MailboxAddress(
                _settings.SenderName,
                _settings.SenderEmail
            )
        );

        message.To.Add(
            MailboxAddress.Parse(recipientEmail)
        );

        message.Subject =
            "Reset your MoneyCoachAI password";

        var safeName = string.IsNullOrWhiteSpace(
            recipientName
        )
            ? "there"
            : recipientName;

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = BuildPasswordResetHtml(
                safeName,
                resetLink
            ),

            TextBody =
                $"""
                Hello {safeName},

                We received a request to reset your MoneyCoachAI password.

                Open this link to create a new password:

                {resetLink}

                This link expires in 30 minutes.

                If you did not request this reset, you can ignore this email.

                MoneyCoachAI
                """
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var smtpClient = new SmtpClient();

        try
        {
            await smtpClient.ConnectAsync(
                _settings.SmtpServer,
                _settings.SmtpPort,
                SecureSocketOptions.StartTls
            );

            await smtpClient.AuthenticateAsync(
                _settings.Username,
                _settings.Password
            );

            await smtpClient.SendAsync(message);
            await smtpClient.DisconnectAsync(true);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Failed to send password reset email to {Email}.",
                recipientEmail
            );

            throw;
        }
    }

    private static string BuildPasswordResetHtml(
        string recipientName,
        string resetLink
    )
    {
        return $$"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            />
        </head>

        <body
            style="
                margin:0;
                padding:0;
                background:#f7f3ff;
                font-family:Arial,sans-serif;
                color:#17172b;
            "
        >
            <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                style="padding:34px 16px;"
            >
                <tr>
                    <td align="center">
                        <table
                            role="presentation"
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            style="
                                max-width:560px;
                                background:#ffffff;
                                border-radius:24px;
                                overflow:hidden;
                                box-shadow:
                                    0 20px 55px
                                    rgba(109,40,217,.12);
                            "
                        >
                            <tr>
                                <td
                                    style="
                                        height:8px;
                                        background:
                                            linear-gradient(
                                                90deg,
                                                #6d28d9,
                                                #8b5cf6,
                                                #ff8500
                                            );
                                    "
                                ></td>
                            </tr>

                            <tr>
                                <td style="padding:38px 34px;">
                                    <h1
                                        style="
                                            margin:0;
                                            color:#17172b;
                                            font-size:28px;
                                        "
                                    >
                                        Reset your password
                                    </h1>

                                    <p
                                        style="
                                            margin:20px 0 0;
                                            color:#667085;
                                            font-size:15px;
                                            line-height:1.7;
                                        "
                                    >
                                        Hello {{recipientName}},
                                    </p>

                                    <p
                                        style="
                                            margin:12px 0 0;
                                            color:#667085;
                                            font-size:15px;
                                            line-height:1.7;
                                        "
                                    >
                                        We received a request to reset
                                        your MoneyCoachAI password.
                                    </p>

                                    <table
                                        role="presentation"
                                        cellspacing="0"
                                        cellpadding="0"
                                        style="margin:28px 0;"
                                    >
                                        <tr>
                                            <td
                                                style="
                                                    border-radius:13px;
                                                    background:#6d28d9;
                                                "
                                            >
                                                <a
                                                    href="{{resetLink}}"
                                                    style="
                                                        display:inline-block;
                                                        padding:14px 26px;
                                                        color:#ffffff;
                                                        text-decoration:none;
                                                        font-size:15px;
                                                        font-weight:700;
                                                    "
                                                >
                                                    Reset Password
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    <p
                                        style="
                                            margin:0;
                                            color:#667085;
                                            font-size:13px;
                                            line-height:1.6;
                                        "
                                    >
                                        This link expires in 30 minutes.
                                        If you did not request a password
                                        reset, you can safely ignore this
                                        email.
                                    </p>

                                    <p
                                        style="
                                            margin:28px 0 0;
                                            color:#98a2b3;
                                            font-size:12px;
                                        "
                                    >
                                        MoneyCoachAI — Smart today,
                                        wealthy tomorrow.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """;
    }
}