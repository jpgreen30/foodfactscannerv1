-- Backfill user emails from profiles for users with email_recall_alerts enabled
UPDATE notification_preferences np
SET user_email = p.email
FROM profiles p
WHERE np.user_id = p.id
AND np.email_recall_alerts = true
AND (np.user_email IS NULL OR np.user_email = '')
AND p.email IS NOT NULL;