import os

# ---------------------------------------------------------------------------
# COMPANY EMAIL RULE
# Put your company's email domain(s) here, e.g.  ["mycompany.com"]
# Only these emails can request an account.
# If you leave the list empty, personal emails (Gmail, Yahoo, Hotmail,
# Outlook.com, iCloud...) are blocked and every other domain is accepted.
# You can also set it without editing this file:  COMPANY_EMAIL_DOMAINS=mycompany.com,other.com
# ---------------------------------------------------------------------------
COMPANY_EMAIL_DOMAINS: list[str] = []

_env = os.getenv("COMPANY_EMAIL_DOMAINS", "")
if _env.strip():
    COMPANY_EMAIL_DOMAINS = [d.strip().lower().lstrip("@") for d in _env.split(",") if d.strip()]

FREE_EMAIL_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.com.ph", "ymail.com", "outlook.com",
    "hotmail.com", "live.com", "msn.com", "icloud.com", "me.com", "aol.com", "proton.me",
    "protonmail.com", "gmx.com", "mail.com", "zoho.com", "yandex.com",
}


def company_email_error(email: str) -> str | None:
    """Return a message if this email is not allowed, otherwise None."""
    domain = email.rsplit("@", 1)[-1].lower()
    if COMPANY_EMAIL_DOMAINS:
        if any(domain == d or domain.endswith("." + d) for d in COMPANY_EMAIL_DOMAINS):
            return None
        shown = " or ".join("@" + d for d in COMPANY_EMAIL_DOMAINS)
        return f"Please use your company email ({shown})."
    if domain in FREE_EMAIL_DOMAINS:
        return "Please use your company email, not a personal one like Gmail or Yahoo."
    return None


# ---- Public ticket form protection ----
PUBLIC_RATE_LIMIT = int(os.getenv("PUBLIC_RATE_LIMIT", "10"))                    # tickets per connection...
PUBLIC_RATE_WINDOW_SECONDS = int(os.getenv("PUBLIC_RATE_WINDOW_SECONDS", "600"))  # ...per this many seconds
PUBLIC_DUPLICATE_SECONDS = 120  # an identical ticket sent again within this time is treated as a double click
