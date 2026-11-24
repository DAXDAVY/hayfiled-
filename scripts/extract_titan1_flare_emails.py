"""
Extract sent and received Outlook emails about the Titan 1 VRU / Flare project.

Requirements
------------
- Windows PC with CLASSIC Outlook desktop installed and signed in
  (the "new Outlook" app does not support this automation).
- Python 3.8+ and pywin32:   pip install pywin32

Run
---
    python extract_titan1_flare_emails.py

Output (in a folder next to this script, "Titan1_Flare_Emails"):
- Titan1_Flare_Email_Log.csv  -> one row per email (opens in Excel)
- msg\\*.msg                   -> a copy of each email, with attachments

Read-only: the script does not move, delete, or modify any email.
"""

import csv
import os
import re
from datetime import datetime

import win32com.client

# ----------------------------- SETTINGS -------------------------------------
# An email matches when its subject or body contains at least one word from
# EVERY group below (case-insensitive).
KEYWORD_GROUPS = [
    ["titan 1", "titan1", "titan-1", "ttn1", "ttn-1", "plant 1", "plant1"],
    ["flare", "vru"],
]

# Folders whose emails are ALL taken, with no keyword check (exact folder
# names, case-insensitive). Emails in other folders still need the keywords.
INCLUDE_ALL_FROM_FOLDERS = {"activities"}

# Only emails on/after this date (YYYY-MM-DD). Set to None for all dates.
SINCE = "2026-09-01"

# Folders to skip (exact names, case-insensitive).
SKIP_FOLDERS = {
    "deleted items", "junk email", "junk e-mail", "spam", "trash",
    "conversation history", "sync issues", "conflicts", "local failures",
    "server failures", "rss feeds", "outbox", "drafts",
}

SAVE_MSG_FILES = True  # set False to produce only the CSV
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "Titan1_Flare_Emails")
# ----------------------------------------------------------------------------

OL_MAIL_ITEM = 43   # Outlook item class for an email
OL_MSG_UNICODE = 9  # SaveAs format: Unicode .msg
PR_SMTP = "http://schemas.microsoft.com/mapi/proptag/0x39FE001E"
PR_MSG_ID = "http://schemas.microsoft.com/mapi/proptag/0x1035001F"


def dasl_prefilter():
    """Server-side filter: subject/body contains any keyword from the first group
    AND any from the second, etc. Python re-checks afterwards."""
    groups = []
    for group in KEYWORD_GROUPS:
        likes = []
        for word in group:
            w = word.replace("'", "''")
            likes.append(f"\"urn:schemas:httpmail:subject\" LIKE '%{w}%'")
            likes.append(f"\"urn:schemas:httpmail:textdescription\" LIKE '%{w}%'")
        groups.append("(" + " OR ".join(likes) + ")")
    return "@SQL=" + " AND ".join(groups)


def matches(text):
    t = text.lower()
    return all(any(w in t for w in group) for group in KEYWORD_GROUPS)


def smtp_of(address_entry, fallback=""):
    """Return a real e-mail address, resolving Exchange (X500) addresses."""
    try:
        if address_entry is None:
            return fallback
        if address_entry.Type == "EX":
            user = address_entry.GetExchangeUser()
            if user is not None and user.PrimarySmtpAddress:
                return user.PrimarySmtpAddress
            return address_entry.PropertyAccessor.GetProperty(PR_SMTP)
        return address_entry.Address or fallback
    except Exception:
        return fallback


def recipients(item, rtype):
    """rtype 1=To, 2=CC."""
    out = []
    try:
        for r in item.Recipients:
            if r.Type == rtype:
                addr = smtp_of(r.AddressEntry, r.Address or "")
                out.append(f"{r.Name} <{addr}>" if addr else r.Name)
    except Exception:
        pass
    return "; ".join(out)


def safe_name(text, limit=80):
    text = re.sub(r'[\\/:*?"<>|\r\n\t]+', "_", text or "no subject").strip(" ._")
    return text[:limit] or "no subject"


def walk(folder, path=""):
    """Yield every mail folder under `folder` (recursively)."""
    full = f"{path}/{folder.Name}" if path else folder.Name
    if folder.Name.lower() in SKIP_FOLDERS:
        return
    try:
        if folder.DefaultItemType == 0:  # 0 = mail folder
            yield folder, full
    except Exception:
        pass
    try:
        for sub in folder.Folders:
            yield from walk(sub, full)
    except Exception:
        pass


def main():
    since = datetime.strptime(SINCE, "%Y-%m-%d").date() if SINCE else None
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    msg_dir = os.path.join(OUTPUT_DIR, "msg")
    if SAVE_MSG_FILES:
        os.makedirs(msg_dir, exist_ok=True)

    outlook = win32com.client.Dispatch("Outlook.Application")
    ns = outlook.GetNamespace("MAPI")

    my_addresses = set()
    for acct in ns.Accounts:
        try:
            if acct.SmtpAddress:
                my_addresses.add(acct.SmtpAddress.lower())
        except Exception:
            pass

    flt = dasl_prefilter()
    rows, seen = [], set()

    for store in ns.Stores:
        try:
            root = store.GetRootFolder()
        except Exception:
            continue
        for folder, fpath in walk(root):
            take_all = folder.Name.lower() in INCLUDE_ALL_FROM_FOLDERS
            try:
                items = folder.Items if take_all else folder.Items.Restrict(flt)
            except Exception:
                items = folder.Items  # fall back to full scan
            print(f"Scanning {fpath} ({items.Count} candidates)")

            for item in items:
                try:
                    if item.Class != OL_MAIL_ITEM:
                        continue
                    subject = item.Subject or ""
                    body = item.Body or ""
                    if not take_all and not matches(subject + "\n" + body):
                        continue

                    sender = smtp_of(item.Sender, item.SenderEmailAddress or "")
                    is_sent = ("sent" in fpath.lower()
                               or sender.lower() in my_addresses)
                    when = item.SentOn if is_sent else item.ReceivedTime
                    if since and when.date() < since:
                        continue

                    try:
                        key = item.PropertyAccessor.GetProperty(PR_MSG_ID)
                    except Exception:
                        key = f"{subject}|{when}|{sender}"
                    if key in seen:
                        continue
                    seen.add(key)

                    attachments = "; ".join(a.FileName for a in item.Attachments)
                    saved = ""
                    if SAVE_MSG_FILES:
                        base = (f"{when:%Y-%m-%d_%H%M}_"
                                f"{'SENT' if is_sent else 'RECV'}_"
                                f"{safe_name(subject)}")
                        saved = os.path.join(msg_dir, base + ".msg")
                        n = 2
                        while os.path.exists(saved):
                            saved = os.path.join(msg_dir, f"{base}_{n}.msg")
                            n += 1
                        item.SaveAs(saved, OL_MSG_UNICODE)

                    # Drop quoted reply history so each row holds just this message.
                    body_only = re.split(r"\n\s*(?:From:|-----Original Message-----)", body)[0]
                    preview = re.sub(r"\s+", " ", body_only).strip()[:4000]
                    rows.append({
                        "Date": f"{when:%Y-%m-%d %H:%M}",
                        "Direction": "Sent" if is_sent else "Received",
                        "From": f"{item.SenderName} <{sender}>",
                        "To": recipients(item, 1),
                        "CC": recipients(item, 2),
                        "Subject": subject,
                        "Attachments": attachments,
                        "Folder": fpath,
                        "Body Preview": preview,
                        "Saved File": os.path.basename(saved),
                    })
                except Exception as e:
                    print(f"  skipped one item: {e}")

    rows.sort(key=lambda r: r["Date"])
    csv_path = os.path.join(OUTPUT_DIR, "Titan1_Flare_Email_Log.csv")
    fields = ["Date", "Direction", "From", "To", "CC", "Subject",
              "Attachments", "Folder", "Body Preview", "Saved File"]
    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

    sent = sum(r["Direction"] == "Sent" for r in rows)
    print(f"\nDone: {len(rows)} emails ({sent} sent, {len(rows) - sent} received)")
    print(f"Log:  {csv_path}")


if __name__ == "__main__":
    main()
