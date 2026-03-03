

## Fix: Klaviyo Phone & Location Still Missing

### Root Cause

The `subscribeToList` function (line 461-540) is called AFTER `syncProfile` sets phone/location. The subscription job creates a profile payload with **only email** — no phone, no location. Klaviyo's subscription bulk-create endpoint can overwrite profile data, stripping the phone and location that were just set.

Additionally, the `KlaviyoProfile` TypeScript interface (line 13) doesn't include `location`, which could cause issues in strict compilation.

### Changes

**1. `supabase/functions/klaviyo-sync/index.ts`**

a. **Update `KlaviyoProfile` interface** (line 13-19): Add `location` field to the interface for type correctness.

b. **Update `subscribeToList` function** (line 461): Accept optional `phoneNumber` parameter and include it + SMS consent in the subscription payload so phone isn't stripped:
```typescript
async function subscribeToList(email: string, listId: string, phoneNumber?: string) {
  // In the profile attributes of the subscription payload:
  attributes: {
    email,
    phone_number: phoneNumber || undefined,
    subscriptions: {
      email: { marketing: { consent: "SUBSCRIBED" } },
      ...(phoneNumber ? { sms: { marketing: { consent: "SUBSCRIBED" } } } : {}),
    },
  }
}
```

c. **Update `autoSyncNewUser`** (line 880-884): Pass phone number to `subscribeToList`:
```typescript
const listResult = await subscribeToList(email, lists.all_users, formattedPhone);
```

d. **Update `autoSyncExistingUser`** (line 920-943): Pass phone number from userData to all `subscribeToList` calls:
```typescript
const userPhone = userData.phone_number;
// Pass to each subscribeToList call
```

e. **Add debug logging** to `syncProfile` to log the actual payload being sent (phone_number and location fields) for troubleshooting.

**2. Redeploy the edge function**

**3. Trigger bulk re-sync** of existing test profiles from admin panel to backfill phone/location for profiles created before the fix.

