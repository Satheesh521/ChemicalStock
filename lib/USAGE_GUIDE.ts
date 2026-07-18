/**
 * COMPREHENSIVE USAGE GUIDE: CHEMICAL INVENTORY SERVICE
 * 
 * This guide covers all aspects of the chemical inventory management system,
 * including setup, usage patterns, and best practices.
 */

// ============================================================================
// FILE STRUCTURE
// ============================================================================

/*
lib/
├── types.ts                          ← All TypeScript interfaces
├── supabaseClient.ts                 ← Supabase initialization & helpers
├── chemicalService.ts                ← Core database operations
└── useChemicalData.ts                ← React custom hook with state management

components/
└── ChemicalInventoryExample.tsx      ← Complete example React component
*/

// ============================================================================
// QUICK START
// ============================================================================

/*
1. Install dependencies:
   npm install @supabase/supabase-js

2. Set up environment variables in your .env.local:
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

3. Ensure your Supabase auth is configured and user is authenticated

4. Import and use in your components:
   import { useChemicalData } from '@/lib/useChemicalData';
*/

// ============================================================================
// BASIC USAGE PATTERNS
// ============================================================================

/*
### Pattern 1: Load Chemicals on Component Mount
```typescript
import { useChemicalData } from '@/lib/useChemicalData';

export function MyComponent() {
  const { chemicals, loadChemicals, chemicalState } = useChemicalData();
  
  useEffect(() => {
    loadChemicals();
  }, [loadChemicals]);
  
  if (chemicalState.loading) return <Text>Loading...</Text>;
  if (chemicalState.error) return <Text>Error: {chemicalState.error}</Text>;
  
  return (
    <ScrollView>
      {chemicals.map(c => (
        <Text key={c.id}>{c.chemical_name}: {c.current_stock}/{c.total_stock}</Text>
      ))}
    </ScrollView>
  );
}
```

### Pattern 2: Add a New Chemical
```typescript
const { addNewChemical, transactionState } = useChemicalData();

const handleAdd = async () => {
  try {
    const newChemical = await addNewChemical({
      chemical_name: 'Sulfuric Acid',
      chemical_formula: 'H2SO4',
      cas_number: '7664-93-9',
      hazard_class: 'Corrosive',
      total_stock: 100,
      current_stock: 100,
      unit: 'mL',
      min_threshold: 10,
      location: 'Lab A',
    });
    console.log('Added:', newChemical.id);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Pattern 3: Record Stock Movements
```typescript
const { recordStockIn, recordStockOut, transactionState } = useChemicalData();

// Stock In
await recordStockIn({
  chemical_id: 'chemical-uuid',
  quantity: 50,
  unit: 'mL',
  supplier: 'ChemSupply Inc',
  purpose: 'Lab experiments',
  department: 'Research',
  requested_by: 'Dr. Smith',
  approved_by: 'Manager',
});

// Stock Out (with validation - prevents over-withdrawal)
await recordStockOut({
  chemical_id: 'chemical-uuid',
  quantity: 25,
  unit: 'mL',
  purpose: 'Experiment #42',
  department: 'Research',
  requested_by: 'Dr. Smith',
  approved_by: 'Manager',
});
```

### Pattern 4: View Transaction History
```typescript
const { stockInHistory, stockOutHistory, loadStockInHistory, loadStockOutHistory } = useChemicalData();

useEffect(() => {
  loadStockInHistory(chemicalId);
  loadStockOutHistory(chemicalId);
}, [chemicalId]);

// Use stockInHistory and stockOutHistory
```

### Pattern 5: Manage Alerts
```typescript
const { alerts, unreadAlertCount, loadAlerts, markAlertRead, markAllRead } = useChemicalData();

useEffect(() => {
  loadAlerts();
}, [loadAlerts]);

// Handle single alert
const handleReadAlert = async (alertId) => {
  await markAlertRead(alertId);
};

// Mark all as read
await markAllRead();
```
*/

// ============================================================================
// ERROR HANDLING BEST PRACTICES
// ============================================================================

/*
### Always Handle Errors in Try-Catch Blocks
```typescript
try {
  await addNewChemical(formData);
  Alert.alert('Success', 'Chemical added');
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  Alert.alert('Error', message);
}
```

### Error Types
- ChemicalServiceError: Expected errors from service operations (RLS, validation, etc)
- Error: Unexpected errors (network issues, parsing, etc)

### Error Code Reference
- ADD_CHEMICAL_FAILED: Failed to insert new chemical
- CHEMICAL_NOT_FOUND: Chemical doesn't exist or access denied (RLS)
- FETCH_CHEMICALS_FAILED: Failed to retrieve chemical list
- INSUFFICIENT_STOCK: Attempted to withdraw more than available
- STOCK_IN_FAILED: Failed to record stock in
- STOCK_OUT_FAILED: Failed to record stock out
- FETCH_HISTORY_FAILED: Failed to retrieve transaction history
- FETCH_ALERTS_FAILED: Failed to retrieve alerts
- UPDATE_CHEMICAL_FAILED: Failed to update chemical record
- UNEXPECTED_ERROR: Unhandled/unexpected error
*/

// ============================================================================
// SECURITY & RLS CONSIDERATIONS
// ============================================================================

/*
### Row-Level Security (RLS) is ENFORCED
✓ All queries automatically filter by authenticated user_id
✓ User cannot access other users' chemicals, stock records, or alerts
✓ Server-side RLS policies provide defense-in-depth

### Authentication Requirements
- User MUST be logged in via Supabase Auth
- If not authenticated, operations throw "User must be authenticated"
- Session is checked via requireAuth() in every operation

### Best Practices
1. Always await getCurrentUserId() before operations if needed
2. Never expose user_id in URLs or logs
3. Rely on RLS - don't try to filter by user_id in frontend
4. Keep Supabase anon key secure (use environment variables)
*/

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/*
### Hook Return Values
All operations return an object with:
- chemicals: Chemical[] - List of all chemicals for user
- selectedChemical: Chemical | null - Currently selected chemical
- chemicalState: OperationState - Loading/error state for chemical operations
- transactionState: OperationState - Loading/error state for add/update operations
- historyState: OperationState - Loading/error state for history queries
- alertState: OperationState - Loading/error state for alert operations

OperationState = {
  loading: boolean - Operation in progress
  error: string | null - Error message if operation failed
  success: boolean - True if last operation succeeded
}

### Usage Pattern
```typescript
const { chemicalState, chemicals } = useChemicalData();

if (chemicalState.loading) return <ActivityIndicator />;
if (chemicalState.error) return <ErrorBanner message={chemicalState.error} />;
return <ChemicalList data={chemicals} />;
```
*/

// ============================================================================
// COMPUTED VALUES
// ============================================================================

/*
Hook provides helpful computed values:
- lowStockChemicals: Chemical[] - Chemicals below min_threshold
- unreadAlertCount: number - Number of unread alerts

Example:
```typescript
const { lowStockChemicals, unreadAlertCount } = useChemicalData();

{lowStockChemicals.length > 0 && (
  <Warning>
    {lowStockChemicals.length} chemicals need reordering
  </Warning>
)}

{unreadAlertCount > 0 && (
  <Badge count={unreadAlertCount} />
)}
```
*/

// ============================================================================
// SERVICE FUNCTIONS (Direct Usage Without Hook)
// ============================================================================

/*
You can also use service functions directly if you prefer:

```typescript
import {
  addChemical,
  fetchChemicals,
  addStockIn,
  addStockOut,
  fetchAlerts,
} from '@/lib/chemicalService';

// These handle auth checks and RLS automatically
const chemicals = await fetchChemicals();
const newChemical = await addChemical(formData);
await addStockIn(stockInData);
```

However, using the hook (useChemicalData) is recommended because:
- Automatic loading/error state management
- Built-in caching and deduplication
- Simpler component code
- Better performance
*/

// ============================================================================
// WORKING WITH TRANSACTIONS
// ============================================================================

/*
### Atomic Operations
Stock In/Out operations are designed to be atomic:
1. Validate chemical exists and belongs to user (RLS check)
2. Validate stock levels (Stock Out only)
3. Insert transaction record
4. Update chemical's current_stock

If any step fails, entire operation fails and chemical stock is NOT updated.

### Example: Safe Stock Out with Validation
```typescript
try {
  // This will throw if quantity > current_stock
  await recordStockOut({
    chemical_id: 'chem-123',
    quantity: 50,
    unit: 'mL',
    purpose: 'Experiment',
    department: 'Lab',
    requested_by: 'Dr. Smith',
  });
  // Stock was only updated if all steps succeeded
} catch (error) {
  if (error.message.includes('Insufficient stock')) {
    // User attempted to withdraw more than available
    // Chemical stock was NOT changed
  }
}
```
*/

// ============================================================================
// ADVANCED PATTERNS
// ============================================================================

/*
### Pattern: Auto-Load Data on Mount + Refresh
```typescript
export function Dashboard() {
  const {
    chemicals,
    loadChemicals,
    alerts,
    loadAlerts,
    chemicalState,
    alertState,
  } = useChemicalData();

  // Load on mount
  useEffect(() => {
    loadChemicals();
    loadAlerts();
  }, [loadChemicals, loadAlerts]);

  // Manual refresh
  const handleRefresh = async () => {
    await Promise.all([loadChemicals(), loadAlerts()]);
  };

  return (
    <View>
      <Button title="Refresh" onPress={handleRefresh} />
      {/* Content * /}
    </View>
  );
}
```

### Pattern: Dependent Loads
```typescript
const { selectChemical, loadStockInHistory, loadStockOutHistory } = useChemicalData();

const handleSelectChemical = async (chemicalId) => {
  // Load main chemical details
  await selectChemical(chemicalId);
  
  // Then load its history
  await Promise.all([
    loadStockInHistory(chemicalId),
    loadStockOutHistory(chemicalId),
  ]);
};
```

### Pattern: Optimistic Updates
```typescript
const { chemicals, recordStockIn } = useChemicalData();

const handleQuickAdd = async (chemicalId, quantity) => {
  // Update UI immediately (optimistic)
  const updatedChemicals = chemicals.map(c =>
    c.id === chemicalId
      ? { ...c, current_stock: c.current_stock + quantity }
      : c
  );
  setChemicals(updatedChemicals);
  
  // Then sync with server
  try {
    await recordStockIn({
      chemical_id: chemicalId,
      quantity,
      // ... other fields
    });
  } catch (error) {
    // Revert on failure
    loadChemicals(); // Reload from server
    Alert.alert('Error', 'Failed to save change');
  }
};
```
*/

// ============================================================================
// PERFORMANCE OPTIMIZATION
// ============================================================================

/*
### Prevent Unnecessary Renders
```typescript
// Use useCallback to memoize handler functions
const handleAddChemical = useCallback(async (data) => {
  await addNewChemical(data);
}, [addNewChemical]);

// Only load data when needed, not on every render
useEffect(() => {
  loadChemicals();
}, []); // Empty dependency array = runs once on mount
```

### Limit Query Results
```typescript
// Fetch only what you need
const result = await fetchChemicals({
  limit: 50,
  sortBy: 'updated_at',
  sortOrder: 'desc',
});

// For history, use limits
const history = await fetchStockInHistory(chemicalId, 50); // Max 50 records
```

### Handle Large Lists
```typescript
// Use FlatList for large chemical lists
<FlatList
  data={chemicals}
  renderItem={({ item }) => <ChemicalCard chemical={item} />}
  keyExtractor={item => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```
*/

// ============================================================================
// TESTING & DEBUGGING
// ============================================================================

/*
### Enable Debug Logging
All service functions log important operations:
- ✓ Chemical added successfully: chem-123
- ✓ Stock in recorded and inventory updated
- Error loading chemicals: [error message]

### Manual Testing Checklist
- [ ] Add a chemical (verify it appears in list)
- [ ] Record stock in (verify current_stock increases)
- [ ] Record stock out (verify current_stock decreases)
- [ ] Try over-withdrawal (should throw error)
- [ ] View transaction history (verify order and data)
- [ ] Check alerts (verify unread count)
- [ ] Try accessing without auth (should throw)
- [ ] Test error states (network offline, invalid input)

### Debug Tips
```typescript
// Log state changes
console.log('Chemicals loaded:', chemicals.length);
console.log('Unread alerts:', unreadAlertCount);
console.log('Low stock items:', lowStockChemicals);

// Check authentication
import { getCurrentUserId } from '@/lib/supabaseClient';
const userId = await getCurrentUserId();
console.log('Current user:', userId);
```
*/

// ============================================================================
// KNOWN LIMITATIONS & CONSIDERATIONS
// ============================================================================

/*
1. Real-time Updates
   - Hook doesn't auto-refresh when data changes in database
   - Solution: Call loadChemicals() after operations or use realtime subscriptions

2. Offline Support
   - Service requires network connection
   - Solution: Implement local caching/queue for offline operations

3. Large Datasets
   - No pagination implemented in hook (loads all records)
   - Solution: Add limit parameter and implement infinite scroll

4. Transaction Conflicts
   - If multiple users modify same chemical, last write wins
   - Solution: Add version control / optimistic locking if needed

5. Alerts Table Structure
   - Currently assumes alerts table has user_id for filtering
   - If your schema differs, update fetchAlerts() query
*/

// ============================================================================
// SUPABASE SCHEMA REFERENCE
// ============================================================================

/*
### Minimal Required Schema

-- Profiles (from Supabase Auth)
create table profiles (
  id uuid primary key references auth.users,
  email text,
  name text,
  created_at timestamp default now()
);

-- Chemicals
create table chemicals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  chemical_name text not null,
  chemical_formula text not null,
  cas_number text,
  hazard_class text,
  total_stock numeric,
  current_stock numeric,
  unit text,
  min_threshold numeric,
  location text,
  start_date date,
  end_date date,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Stock In
create table stock_in (
  id uuid primary key default gen_random_uuid(),
  chemical_id uuid not null references chemicals,
  quantity numeric not null,
  unit text,
  supplier text,
  purpose text,
  department text,
  requested_by text,
  approved_by text,
  created_at timestamp default now()
);

-- Stock Out
create table stock_out (
  id uuid primary key default gen_random_uuid(),
  chemical_id uuid not null references chemicals,
  quantity numeric not null,
  unit text,
  purpose text,
  department text,
  requested_by text,
  approved_by text,
  created_at timestamp default now()
);

-- Alerts
create table alerts (
  id uuid primary key default gen_random_uuid(),
  chemical_id uuid not null references chemicals,
  alert_type text,
  message text,
  is_read boolean default false,
  created_at timestamp default now()
);

-- RLS Policies
alter table chemicals enable row level security;
alter table stock_in enable row level security;
alter table stock_out enable row level security;
alter table alerts enable row level security;

-- Policy: Users can only see their chemicals
create policy "Users can view own chemicals" on chemicals
  for select using (auth.uid() = user_id);

create policy "Users can insert own chemicals" on chemicals
  for insert with check (auth.uid() = user_id);

create policy "Users can update own chemicals" on chemicals
  for update using (auth.uid() = user_id);

-- Policy: Users can only see stock for their chemicals
create policy "Users can view stock for own chemicals" on stock_in
  for select using (
    chemical_id in (select id from chemicals where user_id = auth.uid())
  );

create policy "Users can view stock for own chemicals" on stock_out
  for select using (
    chemical_id in (select id from chemicals where user_id = auth.uid())
  );
*/

// ============================================================================
// COMMON ERRORS & SOLUTIONS
// ============================================================================

/*
Error: "User must be authenticated to perform this action"
Solution: Ensure user is logged in via Supabase Auth before operations

Error: "Chemical not found or access denied"
Solution: 
  - Verify chemical_id exists
  - Verify current user owns the chemical
  - Check RLS policies are enabled

Error: "Insufficient stock. Available: 10, Requested: 20"
Solution: Reduce withdrawal quantity or restock the chemical

Error: "Failed to fetch chemicals: [PGRST error]"
Solution:
  - Check Supabase project is online
  - Verify table/column names match schema
  - Check RLS policies aren't blocking access
  - Check network connectivity

Error: EXPO_PUBLIC_SUPABASE_URL not defined
Solution: Add to .env.local:
  EXPO_PUBLIC_SUPABASE_URL=your_url
  EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
*/

// ============================================================================
// NEXT STEPS & ENHANCEMENTS
// ============================================================================

/*
Possible improvements:
1. Add real-time subscriptions using supabase.realtime
2. Implement offline queue for stock transactions
3. Add batch operations (bulk add, bulk update)
4. Add data export (CSV, PDF)
5. Add analytics queries (top used chemicals, usage trends)
6. Add approval workflows for stock requests
7. Add multi-user permissions (view-only, edit, admin)
8. Add barcode/QR code scanning
9. Add waste tracking
10. Add supplier management
*/

// ============================================================================
// SUPPORT & DOCUMENTATION
// ============================================================================

/*
Key Files:
- lib/types.ts - All TypeScript interfaces
- lib/supabaseClient.ts - Supabase client setup
- lib/chemicalService.ts - Core operations
- lib/useChemicalData.ts - React hook
- components/ChemicalInventoryExample.tsx - Complete example

External Resources:
- Supabase Docs: https://supabase.com/docs
- Supabase JS Client: https://supabase.com/docs/reference/javascript
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
*/

export const USAGE_GUIDE = 'See comments in this file for complete guide';
