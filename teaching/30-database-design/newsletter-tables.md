# Tables: Newsletters

Real code: [`apps/newsletters/models.py`](../../backend/apps/newsletters/models.py).

## `newsletters_newslettersubscriber` (`NewsletterSubscriber`)
| Column | Purpose |
|--------|---------|
| `email` | unique; anonymous signups allowed |
| `user_id` | FK→user (SET_NULL) — optional link to an account |
| `categories` | M2M→category — topic preferences (empty = general) |
| `is_confirmed` | double opt-in flag |
| `is_active` | subscribed vs unsubscribed |
| `token` | random unguessable string for one-click unsubscribe links |

The `token` (from `secrets.token_urlsafe`) lets us build unsubscribe URLs that
work without login and can't be guessed for someone else's address.

## Interview questions
- **Junior:** Why allow a subscriber row with no linked user?
- **Mid:** What is double opt-in and why does it matter legally?
- **Senior:** How do you make unsubscribe both frictionless and secure?
