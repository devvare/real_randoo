# CRITICAL APPOINTMENT VISIBILITY FIXES

## Problem Summary
Appointments created by businesses are not showing up in the customer calendar view due to:
1. Customer calendar was using mock data (✅ FIXED)
2. RLS policy errors preventing proper data access
3. Customer ID architecture issues with `customer_info` JSONB field

## Solution Applied

### 1. Frontend Fix (✅ COMPLETED)
- Updated `/app/(customer)/calendar.tsx` to fetch real appointment data from Supabase
- Added proper error handling and loading states
- Implemented support for both customer-created and business-created appointments
- Added VIP appointment indicators and status-based styling

### 2. Backend Fix (⚠️ REQUIRES MANUAL APPLICATION)
Created comprehensive SQL script: `fix-customer-appointment-visibility-critical.sql`

## How to Apply the SQL Script

### Option 1: Supabase Dashboard (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `crmjtblrhcebcnjcfvqm`
3. Navigate to **SQL Editor**
4. Copy the entire content of `fix-customer-appointment-visibility-critical.sql`
5. Paste it into the SQL Editor
6. Click **Run** to execute the script

### Option 2: Supabase CLI
```bash
cd /home/ahmet/CascadeProjects/bolt
npx supabase db push --file fix-customer-appointment-visibility-critical.sql
```

## What the SQL Script Fixes

### 1. RLS Policies
- **appointments table**: Allows customers to see appointments via both `customer_id` and `customer_info->>'email'`
- **business_notifications table**: Fixes notification creation and access
- **business_available_slots table**: Ensures proper slot visibility and updates

### 2. Triggers
- **Appointment Notification Trigger**: Creates notifications when appointments are created
- **Slot Sync Trigger**: Updates slot availability when appointments are created/updated/deleted

### 3. Customer Visibility Logic
- Customers can see appointments where `customer_id = auth.uid()` (their own created appointments)
- Customers can see appointments where `customer_info->>'email' = auth.email()` (business-created appointments for them)

## Testing After Application

### 1. Test Customer Calendar
1. Open the app as a customer
2. Navigate to the calendar tab
3. Verify that appointments created by businesses are now visible
4. Check that appointment details (business name, service, time, VIP status) are displayed correctly

### 2. Test Business Appointment Creation
1. Open the app as a business owner
2. Create a new appointment for a customer
3. Verify that:
   - The appointment is saved successfully
   - A notification is created for the business
   - The customer can see the appointment in their calendar

### 3. Test Slot Availability
1. Create an appointment for a specific time slot
2. Verify that the slot becomes unavailable for other appointments
3. Delete the appointment and verify the slot becomes available again

## Expected Results After Fix

✅ **Customer Calendar**: Shows all appointments (own + business-created)
✅ **Notifications**: Business receives notifications when appointments are created
✅ **Slot Management**: Slots are properly updated when appointments change
✅ **RLS Security**: Proper access control while maintaining functionality

## Debugging Commands

If issues persist after applying the script, run these queries in Supabase SQL Editor:

```sql
-- Check if customer can see their appointments
SELECT * FROM appointments 
WHERE customer_id = auth.uid() 
   OR customer_info->>'email' = auth.email();

-- Check recent notifications
SELECT * FROM business_notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Check slot availability
SELECT * FROM business_available_slots 
WHERE date >= CURRENT_DATE 
ORDER BY date, start_time;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('appointments', 'business_notifications', 'business_available_slots');
```

## Next Steps After Application

1. **Apply the SQL script** to Supabase database
2. **Test the customer calendar** to verify appointments are visible
3. **Test appointment creation** from business side
4. **Verify notifications** are being created
5. **Test slot conflict detection** in customer booking flow

## Files Modified

- ✅ `/app/(customer)/calendar.tsx` - Updated to fetch real data
- ✅ `fix-customer-appointment-visibility-critical.sql` - Comprehensive backend fix
- ✅ `APPLY_CRITICAL_FIXES.md` - This instruction guide

## Critical Success Metrics

After applying these fixes:
- [ ] Customer calendar shows business-created appointments
- [ ] Customer calendar shows customer-created appointments  
- [ ] Appointment notifications are created for businesses
- [ ] Slot availability updates correctly
- [ ] No RLS policy errors in console
- [ ] Customer slot booking shows conflicts correctly
