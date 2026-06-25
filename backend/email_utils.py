import re
import secrets
import hashlib
import asyncio
from config import settings


def generate_token() -> tuple[str, str]:
    """Return (raw_token, sha256_hash). Store only the hash; send the raw token."""
    raw = secrets.token_urlsafe(32)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


# ── HTML email templates ────────────────────────────────────────────────────────

def _base_html(title: str, heading: str, body_html: str, cta_url: str, cta_label: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#070D0B;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070D0B;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:10px;vertical-align:middle;">
              <div style="width:22px;height:4px;border-radius:99px;background:#8FCBA8;margin-bottom:4px;"></div>
              <div style="width:15px;height:4px;border-radius:99px;background:#8FCBA8;opacity:.7;margin-bottom:4px;margin-left:auto;"></div>
              <div style="width:9px;height:4px;border-radius:99px;background:#8FCBA8;opacity:.45;margin-left:auto;"></div>
            </td>
            <td style="font-size:18px;font-weight:700;color:#ECF1ED;vertical-align:middle;">Cairn</td>
          </tr></table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:28px;overflow:hidden;">

          <!-- Card header -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:linear-gradient(165deg,#1f4438,#0e1a15);padding:36px 36px 28px;">
              <div style="font-size:36px;color:#fff;font-weight:300;line-height:1.1;margin-bottom:10px;">{heading}</div>
            </td></tr>
          </table>

          <!-- Card body -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:28px 36px 36px;">
              {body_html}
              <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr><td>
                  <a href="{cta_url}"
                     style="display:inline-block;background:#8FCBA8;color:#0B1310;font-weight:700;font-size:15px;
                            text-decoration:none;padding:14px 32px;border-radius:99px;">
                    {cta_label}
                  </a>
                </td></tr>
              </table>
              <p style="color:rgba(255,255,255,0.3);font-size:12px;margin-top:20px;line-height:1.6;">
                This link expires in 15&nbsp;minutes. If you didn't request this, you can safely ignore this email.
              </p>
              <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:8px;">
                Or copy this URL:<br>
                <span style="color:rgba(255,255,255,0.4);word-break:break-all;">{cta_url}</span>
              </p>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;color:rgba(255,255,255,0.2);font-size:11px;">
          Sent by Cairn Expense Tracker
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""


def reset_email_html(reset_url: str) -> str:
    body = """
    <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 8px;">
      We received a request to reset your Cairn password. Click the button below to choose a new one.
    </p>
    """
    return _base_html(
        title="Reset your Cairn password",
        heading="Reset your password.",
        body_html=body,
        cta_url=reset_url,
        cta_label="Reset password",
    )


def verify_email_html(verify_url: str) -> str:
    body = """
    <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 8px;">
      Thanks for signing up for Cairn. Click the button below to verify your email address and start tracking.
    </p>
    """
    return _base_html(
        title="Verify your Cairn email",
        heading="Verify your email.",
        body_html=body,
        cta_url=verify_url,
        cta_label="Verify email",
    )


# ── Sending functions ───────────────────────────────────────────────────────────

def _brevo_send(to: str, subject: str, html: str) -> None:
    import requests
    resp = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": settings.BREVO_API_KEY, "content-type": "application/json"},
        json={
            "sender": {"name": settings.MAIL_FROM_NAME, "email": settings.MAIL_FROM},
            "to": [{"email": to}],
            "subject": subject,
            "htmlContent": html,
        },
        timeout=10,
    )
    if resp.status_code >= 400:
        raise Exception(f"Brevo {resp.status_code}: {resp.text}")


async def send_email(to: str, subject: str, html: str) -> None:
    if not settings.BREVO_API_KEY:
        print(f"\n[DEV EMAIL] To: {to}\nSubject: {subject}")
        urls = re.findall(r'href="(http[^"]+)"', html)
        if urls:
            print(f"Link: {urls[0]}\n")
        return
    try:
        await asyncio.to_thread(_brevo_send, to, subject, html)
    except Exception as e:
        print(f"[EMAIL FAILED] To: {to} — {e}")


async def send_reset_email(to: str, raw_token: str) -> None:
    url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
    await send_email(to, "Reset your Cairn password", reset_email_html(url))


async def send_verification_email(to: str, raw_token: str) -> None:
    url = f"{settings.FRONTEND_URL}/verify-email?token={raw_token}"
    await send_email(to, "Verify your Cairn email", verify_email_html(url))
