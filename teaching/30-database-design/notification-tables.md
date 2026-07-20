# Tables: Notifications

Real code: [`apps/notifications/models.py`](../../backend/apps/notifications/models.py).

## `notifications_notification`
One row per message to a user, across three channels in one table.

| Column | Purpose |
|--------|---------|
| `recipient_id` | FK→user (CASCADE) |
| `channel` | enum: push / in_app / email (indexed) |
| `type` | enum: breaking / category / topic / system |
| `title`, `body` | content |
| `payload` | JSON — channel-specific extras (deep-link route, image…) |
| `is_read` | indexed, for the unread badge |
| `sent_at` | null until actually delivered |

One table for all channels keeps the "notification center" query simple. Actual
sending (FCM push, email) happens via Celery in Phase 7. Index
`(recipient, is_read)` powers the unread count.

## Interview questions
- **Junior:** Why a JSON `payload` column instead of many nullable columns?
- **Mid:** Trade-offs of one table for all channels vs a table per channel?
- **Senior:** How would you fan out a breaking-news alert to 1M users efficiently?
