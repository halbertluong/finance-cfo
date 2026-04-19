/**
 * Standalone test for date-related null guards.
 * Run with: node test-date-guards.mjs
 */

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function assertThrows(fn, label) {
  try {
    fn();
    console.error(`  ✗ FAIL (expected throw but didn't): ${label}`);
    failed++;
  } catch {
    console.log(`  ✓ (throws as expected) ${label}`);
    passed++;
  }
}

// ── Replicate the critical functions exactly as they exist in the codebase ──

// lib/budgets.ts — CURRENT (guarded) version
function monthKey(date) {
  if (!date || isNaN(date.getTime())) return '0000-00';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthKey_ORIGINAL(date) {
  // Original unguarded version — should crash on null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// lib/budgets.ts — getAvailableMonthKeys CURRENT (guarded)
function getAvailableMonthKeys(transactions) {
  const keys = new Set();
  for (const t of transactions) {
    if (!t.date) continue;
    const d = new Date(t.date);
    if (isNaN(d.getTime())) continue;
    keys.add(monthKey(d));
  }
  return Array.from(keys).sort().reverse();
}

// lib/analysis/aggregator.ts — getMonthlySpendingData CURRENT (guarded)
function getMonthlySpendingData(transactions) {
  const months = new Map();
  for (const t of transactions) {
    if (t.categoryId === 'transfer') continue;
    if (!t.date) continue;
    const d = t.date instanceof Date ? t.date : new Date(t.date);
    if (!d || isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = months.get(key) ?? { income: 0, expenses: 0 };
    if (t.type === 'credit') entry.income += t.amount;
    else entry.expenses += t.amount;
    months.set(key, entry);
  }
  return Array.from(months.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// api-client.ts — loadTransactions simulation CURRENT (with null filter)
function simulateLoadTransactions(rawRows) {
  return rawRows
    .filter((t) => t.date != null)
    .map((t) => ({ ...t, date: new Date(t.date) }));
}

// ── Test Suite ────────────────────────────────────────────────────────────────

console.log('\n=== monthKey() ===');
assert(monthKey(null) === '0000-00', 'monthKey(null) returns "0000-00"');
assert(monthKey(undefined) === '0000-00', 'monthKey(undefined) returns "0000-00"');
assert(monthKey(new Date('invalid')) === '0000-00', 'monthKey(Invalid Date) returns "0000-00"');
assert(monthKey(new Date(0)) === '1970-01', 'monthKey(epoch) returns "1970-01"');
assert(monthKey(new Date('2024-03-15')) === '2024-03', 'monthKey(valid date) returns correct key');
assert(monthKey(new Date('2024-12-31')) === '2024-12', 'monthKey(Dec 31) returns "2024-12"');

console.log('\n=== Original monthKey() WOULD crash ===');
assertThrows(() => monthKey_ORIGINAL(null), 'Original monthKey(null) throws TypeError');
assertThrows(() => monthKey_ORIGINAL(undefined), 'Original monthKey(undefined) throws TypeError');

console.log('\n=== getAvailableMonthKeys() with null/invalid dates ===');
const txsWithNulls = [
  { date: new Date('2024-01-15'), type: 'debit', amount: 100 },
  { date: null, type: 'debit', amount: 50 },            // null date
  { date: new Date('invalid'), type: 'debit', amount: 30 }, // Invalid Date
  { date: new Date('2024-03-20'), type: 'credit', amount: 200 },
  { date: undefined, type: 'debit', amount: 75 },         // undefined date
];
const keys = getAvailableMonthKeys(txsWithNulls);
assert(!keys.includes('0000-00'), 'getAvailableMonthKeys skips null/invalid (no "0000-00" key)');
assert(keys.includes('2024-01'), 'getAvailableMonthKeys includes 2024-01');
assert(keys.includes('2024-03'), 'getAvailableMonthKeys includes 2024-03');
assert(keys.length === 2, 'getAvailableMonthKeys returns exactly 2 valid keys');

console.log('\n=== getMonthlySpendingData() with null/invalid dates ===');
const data = getMonthlySpendingData(txsWithNulls);
assert(Array.isArray(data), 'getMonthlySpendingData returns an array');
assert(data.length === 2, 'getMonthlySpendingData returns 2 valid months (skips null/invalid)');
assert(data[0].month === '2024-01', 'First month is 2024-01');
assert(data[0].expenses === 100, 'Expenses correctly summed for 2024-01');

console.log('\n=== api-client loadTransactions simulation ===');
const rawApiRows = [
  { id: '1', date: '2024-01-15T00:00:00.000Z', amount: 100 },
  { id: '2', date: null, amount: 50 },        // null date from DB
  { id: '3', date: '2024-03-20T00:00:00.000Z', amount: 200 },
  { id: '4', date: undefined, amount: 75 },   // undefined (missing field)
];
const loaded = simulateLoadTransactions(rawApiRows);
assert(loaded.length === 2, 'Filters out null/undefined date rows (keeps 2)');
assert(loaded[0].date instanceof Date, 'Date field is a proper Date object');
assert(!isNaN(loaded[0].date.getTime()), 'Date is a valid (non-Invalid) Date');
assert(loaded.every((t) => t.date instanceof Date), 'All loaded transactions have Date objects');
assert(loaded.every((t) => !isNaN(t.date.getTime())), 'All Date objects are valid');

console.log('\n=== Dashboard monthTransactions filter simulation ===');
function filterMonthTransactions(transactions, selectedMonth) {
  return transactions.filter((t) => {
    if (!t.date) return false;
    const d = new Date(t.date);
    if (isNaN(d.getTime())) return false;
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return k === selectedMonth;
  });
}
const loaded2 = simulateLoadTransactions(rawApiRows); // already has Date objects
const jan = filterMonthTransactions(loaded2, '2024-01');
assert(jan.length === 1, 'Dashboard filter returns exactly 1 transaction for 2024-01');
assert(jan[0].id === '1', 'Correct transaction ID for January');

console.log('\n=== Edge cases ===');
// What new Date() does with various inputs
assert(!isNaN(new Date(0).getTime()), 'new Date(0) is valid (epoch)');
assert(isNaN(new Date(undefined).getTime()), 'new Date(undefined) is Invalid Date');
assert(!isNaN(new Date(null).getTime()), 'new Date(null) is epoch (not invalid!)');
assert(new Date(null).getFullYear() === 1970, 'new Date(null).getFullYear() = 1970 (no crash)');
assert(new Date(new Date('2024-01-15')).getFullYear() === 2024, 'new Date(Date) works correctly');

// ── Summary ────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\nSome tests FAILED. Do not merge until all pass.');
  process.exit(1);
} else {
  console.log('\nAll tests passed ✓');
}
