/**
 * INTEGRATION GUIDE
 * Step-by-step instructions for integrating chemical service into your app
 */

// ============================================================================
// STEP 1: VERIFY FILE STRUCTURE
// ============================================================================

/*
Ensure you have this structure:

your-project/
├── lib/
│   ├── types.ts                      ✅ Created
│   ├── supabaseClient.ts             ✅ Created
│   ├── chemicalService.ts            ✅ Created
│   ├── useChemicalData.ts            ✅ Created
│   ├── USAGE_GUIDE.ts                ✅ Created
│   ├── CODE_SNIPPETS.tsx             ✅ Created
│   └── README_CHEMICAL_SERVICE.md    ✅ Created
│
├── components/
│   ├── ChemicalInventoryExample.tsx  ✅ Created
│   └── ... (your other components)
│
├── .env.local                        ⚠️ Create this
├── package.json                      (Already exists)
└── ...
*/

// ============================================================================
// STEP 2: INSTALL DEPENDENCIES
// ============================================================================

/*
Run in your project directory:

npm install @supabase/supabase-js

# Or if using yarn
yarn add @supabase/supabase-js
*/

// ============================================================================
// STEP 3: ENVIRONMENT VARIABLES
// ============================================================================

/*
Create .env.local in project root:

EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Get these from:
1. Supabase Dashboard → Settings → API
2. Copy the URL and anon key
3. Paste into .env.local
*/

// ============================================================================
// STEP 4: SUPABASE SCHEMA SETUP
// ============================================================================

/*
Run this SQL in your Supabase SQL Editor to create the required tables:

-- Chemicals Table
CREATE TABLE chemicals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  chemical_name text NOT NULL,
  chemical_formula text NOT NULL,
  cas_number text,
  hazard_class text,
  total_stock numeric,
  current_stock numeric,
  unit text,
  min_threshold numeric,
  location text,
  start_date date,
  end_date date,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Stock In Table
CREATE TABLE stock_in (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chemical_id uuid NOT NULL REFERENCES chemicals(id),
  quantity numeric NOT NULL,
  unit text,
  supplier text,
  purpose text,
  department text,
  requested_by text,
  approved_by text,
  created_at timestamp DEFAULT now()
);

-- Stock Out Table
CREATE TABLE stock_out (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chemical_id uuid NOT NULL REFERENCES chemicals(id),
  quantity numeric NOT NULL,
  unit text,
  purpose text,
  department text,
  requested_by text,
  approved_by text,
  created_at timestamp DEFAULT now()
);

-- Alerts Table
CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chemical_id uuid NOT NULL REFERENCES chemicals(id),
  alert_type text,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE chemicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own chemicals" ON chemicals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chemicals" ON chemicals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chemicals" ON chemicals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view stock for own chemicals" ON stock_in
  FOR SELECT USING (
    chemical_id IN (
      SELECT id FROM chemicals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stock for own chemicals" ON stock_in
  FOR INSERT WITH CHECK (
    chemical_id IN (
      SELECT id FROM chemicals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view stock out for own chemicals" ON stock_out
  FOR SELECT USING (
    chemical_id IN (
      SELECT id FROM chemicals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stock out for own chemicals" ON stock_out
  FOR INSERT WITH CHECK (
    chemical_id IN (
      SELECT id FROM chemicals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own alerts" ON alerts
  FOR SELECT USING (
    chemical_id IN (
      SELECT id FROM chemicals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own alerts" ON alerts
  FOR UPDATE USING (
    chemical_id IN (
      SELECT id FROM chemicals WHERE user_id = auth.uid()
    )
  );
*/

// ============================================================================
// STEP 5: BASIC COMPONENT INTEGRATION
// ============================================================================

/*
Here's a minimal component to test the integration:

---FILE: app/chemicals-test.tsx---

import React, { useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useChemicalData } from '@/lib/useChemicalData';

export default function ChemicalsTestScreen() {
  const { chemicals, loadChemicals, chemicalState } = useChemicalData();

  useEffect(() => {
    loadChemicals();
  }, [loadChemicals]);

  if (chemicalState.loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading chemicals...</Text>
      </View>
    );
  }

  if (chemicalState.error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red' }}>Error: {chemicalState.error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Chemicals ({chemicals.length})
      </Text>
      {chemicals.map(c => (
        <View
          key={c.id}
          style={{ padding: 10, marginBottom: 10, backgroundColor: '#f0f0f0', borderRadius: 5 }}
        >
          <Text style={{ fontWeight: 'bold' }}>{c.chemical_name}</Text>
          <Text>{c.chemical_formula}</Text>
          <Text>Stock: {c.current_stock}/{c.total_stock} {c.unit}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

---END FILE---

Then navigate to this screen to verify everything works.
*/

// ============================================================================
// STEP 6: FULL FEATURE INTEGRATION
// ============================================================================

/*
Once the basic test works, you can:

1. Copy ChemicalInventoryExample.tsx to your app
   → Provides complete UI for all operations

2. Use individual components from CODE_SNIPPETS.tsx
   → ChemicalListSimple
   → StockInFormComponent
   → StockOutFormComponent
   → TransactionHistory
   → AlertsBadge
   → etc.

3. Create your own custom components using useChemicalData hook
   → See USAGE_GUIDE.ts for patterns
*/

// ============================================================================
// STEP 7: NAVIGATION SETUP
// ============================================================================

/*
Example Expo Router setup (app/(tabs)/chemicals.tsx):

---FILE: app/(tabs)/chemicals.tsx---

import { Stack } from 'expo-router';
import ChemicalInventoryScreen from '@/components/ChemicalInventoryExample';

export default function ChemicalsTab() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Chemical Inventory',
          headerShown: true,
        }}
      />
      <ChemicalInventoryScreen />
    </>
  );
}

---END FILE---

Then add to your tab navigator in _layout.tsx
*/

// ============================================================================
// STEP 8: AUTHENTICATION VERIFICATION
// ============================================================================

/*
Add this to a debug screen to verify auth is working:

---FILE: app/debug.tsx---

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { getCurrentUserId, getCurrentSession } from '@/lib/supabaseClient';

export default function DebugScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const id = await getCurrentUserId();
      const sess = await getCurrentSession();
      setUserId(id);
      setSession(sess);
      setLoading(false);
    }
    checkAuth();
  }, []);

  if (loading) return <ActivityIndicator />;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Auth Debug Info</Text>
      <Text>User ID: {userId || 'NOT AUTHENTICATED'}</Text>
      <Text>Email: {session?.user?.email || 'N/A'}</Text>
      <Text>Session: {session ? 'Active' : 'None'}</Text>
    </View>
  );
}

---END FILE---

If you see a User ID, auth is working!
*/

// ============================================================================
// STEP 9: ERROR HANDLING SETUP
// ============================================================================

/*
Add global error handler to your app:

---FILE: app/_layout.tsx (or root layout)---

import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as ErrorHandler from 'react-native-error-handler';

const handleError = (error: Error) => {
  // Log to your error tracking service
  console.error('App Error:', error);
  
  // Show user-friendly message
  Alert.alert(
    'Error',
    'Something went wrong. Please try again.',
    [{ text: 'OK' }]
  );
};

// Configure in your root component
useEffect(() => {
  ErrorHandler.setHandlerforNonPromiseRejections(({ error }: any) => {
    handleError(error);
  });
}, []);

---END FILE---
*/

// ============================================================================
// STEP 10: COMMON INTEGRATION PATTERNS
// ============================================================================

/*
Pattern 1: Dashboard with Alerts
---
const { chemicals, lowStockChemicals, alerts, unreadAlertCount } = useChemicalData();

return (
  <View>
    {unreadAlertCount > 0 && (
      <AlertBanner count={unreadAlertCount} onPress={() => goToAlerts()} />
    )}
    {lowStockChemicals.length > 0 && (
      <LowStockBanner chemicals={lowStockChemicals} />
    )}
    <ChemicalList chemicals={chemicals} />
  </View>
);
---

Pattern 2: Add Chemical Modal
---
const [showAddModal, setShowAddModal] = useState(false);
const { addNewChemical, transactionState } = useChemicalData();

const handleAddChemical = async (formData) => {
  try {
    await addNewChemical(formData);
    setShowAddModal(false);
    Alert.alert('Success', 'Chemical added');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

return (
  <>
    <Button title="Add Chemical" onPress={() => setShowAddModal(true)} />
    <Modal visible={showAddModal}>
      <AddChemicalForm
        onSubmit={handleAddChemical}
        loading={transactionState.loading}
        onCancel={() => setShowAddModal(false)}
      />
    </Modal>
  </>
);
---

Pattern 3: Stock Transaction with History
---
const { recordStockIn, loadStockInHistory, stockInHistory } = useChemicalData();
const [selectedChemical, setSelectedChemical] = useState<string | null>(null);

const handleSelectChemical = async (chemicalId: string) => {
  setSelectedChemical(chemicalId);
  await loadStockInHistory(chemicalId);
};

return (
  <>
    <ChemicalSelector onSelect={handleSelectChemical} />
    {selectedChemical && (
      <>
        <StockInForm chemicalId={selectedChemical} onSuccess={refresh} />
        <TransactionHistory inHistory={stockInHistory} outHistory={[]} />
      </>
    )}
  </>
);
---
*/

// ============================================================================
// STEP 11: TESTING
// ============================================================================

/*
Manual Testing Checklist:

[ ] 1. Load app and verify auth (debug screen shows user ID)
[ ] 2. View chemicals list (should be empty or show existing)
[ ] 3. Add a test chemical
    - Fill form with test data
    - Click Add
    - Verify it appears in list
[ ] 4. Record stock in
    - Select the chemical
    - Enter quantity and supplier
    - Verify current_stock increases
[ ] 5. Record stock out
    - Select the chemical
    - Enter quantity less than current_stock
    - Verify current_stock decreases
[ ] 6. Test stock validation
    - Try to withdraw more than available
    - Should show error without updating stock
[ ] 7. Check alerts
    - Verify alerts appear (if any exist)
    - Mark as read
    - Verify unread count updates
[ ] 8. Test error handling
    - Go offline (flight mode)
    - Try to perform operation
    - Should show error message
    - Go back online
[ ] 9. Refresh data
    - Modify data in another session/browser
    - Pull to refresh or navigate away/back
    - Should see updated data
[ ] 10. Cross-user isolation
    - Log in with different user
    - Should only see that user's chemicals (RLS)
*/

// ============================================================================
// STEP 12: DEPLOYMENT CHECKLIST
// ============================================================================

/*
Before deploying to production:

[ ] Environment variables set in deployment platform
[ ] Supabase RLS policies verified
[ ] Error handling added to all screens
[ ] Loading states visible to users
[ ] Network error handling implemented
[ ] Authentication tested
[ ] Database schema matches types.ts
[ ] No console.errors in production
[ ] Analytics/logging configured
[ ] Backup plan for offline
[ ] Test on actual device
[ ] Test with slow network (throttle)
[ ] Test with large datasets
[ ] Security audit completed
[ ] Approved by team
*/

// ============================================================================
// TROUBLESHOOTING INTEGRATION ISSUES
// ============================================================================

/*
Issue: "Cannot find module @/lib/..."
Solution: Check import path matches your file structure.
          Make sure lib/ is at root or adjust import paths.

Issue: Auth fails but app has auth elsewhere
Solution: Verify your existing auth sets auth.users properly.
          chemicalService.ts uses supabase.auth.getUser().

Issue: RLS policies blocking access
Solution: Run schema setup SQL in Supabase SQL Editor.
          Verify policies reference auth.uid() correctly.

Issue: Types not recognized
Solution: Run: npm install (reinstall node_modules)
          Check tsconfig.json has proper paths

Issue: Component doesn't update when data changes
Solution: Call loadChemicals() after operations.
          Or implement real-time subscriptions (advanced).

Issue: Very slow performance
Solution: Add limit to queries: fetchChemicals({ limit: 50 })
          Check database indexes on user_id
          Consider pagination

Issue: Tests fail
Solution: Mock Supabase client for unit tests.
          See CODE_SNIPPETS for AsyncErrorHandler pattern.
*/

// ============================================================================
// NEXT INTEGRATION STEPS
// ============================================================================

/*
After basic integration works:

1. Add Real-time Updates
   - Import supabase.realtime
   - Subscribe to chemicals table
   - Update local state on changes

2. Add Offline Support
   - Queue operations locally
   - Sync when online
   - Show sync status

3. Add Batch Operations
   - Modify chemicalService.ts
   - Add bulk insert/update
   - Useful for imports

4. Add Search/Filter
   - Add search param to fetchChemicals
   - Implement full-text search in Supabase
   - Filter by hazard_class, location, etc.

5. Add Export
   - Export to CSV
   - Export to PDF
   - Share data with team

6. Add Analytics
   - Track usage patterns
   - Measure stock consumption
   - Report trends
*/

// ============================================================================
// GETTING HELP
// ============================================================================

/*
If you encounter issues:

1. Check README_CHEMICAL_SERVICE.md - answers most questions
2. Review USAGE_GUIDE.ts - has patterns and best practices
3. Look at CODE_SNIPPETS.tsx - working examples
4. Check ChemicalInventoryExample.tsx - complete implementation
5. Debug using: getCurrentUserId(), console.log() in service
6. Test RLS in Supabase SQL Editor

Important files to reference:
- types.ts - understand data structure
- chemicalService.ts - understand operations
- useChemicalData.ts - understand state management
*/

export const INTEGRATION_COMPLETE = true;
