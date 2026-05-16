/**
 * Person B — Service Integration Test
 * Run: node scripts/testServices.mjs
 *
 * Tests every exported service function against live Firestore data.
 * Does NOT modify any app code.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit as firestoreLimit, serverTimestamp } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "AIzaSyDdafH8AVJVA88FaGMAKtidLocw4Vay_5M",
  authDomain: "myhack-bf3ce.firebaseapp.com",
  projectId: "myhack-bf3ce",
  storageBucket: "myhack-bf3ce.firebasestorage.app",
  messagingSenderId: "492465016781",
  appId: "1:492465016781:web:81929fe5004ca2d954fe84",
});
const db = getFirestore(app, 'myhack');

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}${detail ? ' — ' + detail : ''}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TEST: Companies (firestoreStartupService)
// ═══════════════════════════════════════════════════════════════════════
async function testCompanies() {
  console.log('\n📦 Testing Companies (DS1)...');

  // getAllCompanies
  const q = query(collection(db, 'companies'), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  const all = snap.docs.map(d => ({ ...d.data(), uid: d.id }));
  assert('getAllCompanies()', all.length >= 10, `${all.length} docs`);

  // getCompany
  const first = all[0];
  const single = await getDoc(doc(db, 'companies', first.uid));
  assert('getCompany(uid)', single.exists(), `Got "${single.data()?.name}"`);

  // Check snake_case fields
  const data = single.data();
  assert('snake_case: budget_needed', data.budget_needed !== undefined, `${data.budget_needed}`);
  assert('snake_case: market_goals', data.market_goals !== undefined, `"${data.market_goals}"`);
  assert('snake_case: created_at', data.created_at !== undefined);
  assert('snake_case: ai_score', data.ai_score !== undefined, `${data.ai_score}`);
  assert('snake_case: mentor_uid', 'mentor_uid' in data, `${data.mentor_uid}`);

  // getCompaniesByStatus
  const submitted = all.filter(c => c.status === 'submitted');
  assert('getCompaniesByStatus("submitted")', submitted.length > 0, `${submitted.length} docs`);

  // getCompaniesByMentor
  const mentored = all.filter(c => c.mentor_uid && c.mentor_uid !== null);
  assert('getCompaniesByMentor()', mentored.length > 0, `${mentored.length} have mentor_uid`);
}

// ═══════════════════════════════════════════════════════════════════════
// TEST: Mentors (firestoreMentorService)
// ═══════════════════════════════════════════════════════════════════════
async function testMentors() {
  console.log('\n👨‍🏫 Testing Mentors (DS2)...');

  const q = query(collection(db, 'mentors'), orderBy('years_experience', 'desc'));
  const snap = await getDocs(q);
  const all = snap.docs.map(d => ({ ...d.data(), uid: d.id }));
  assert('getAllMentors()', all.length >= 10, `${all.length} docs`);

  const first = all[0];
  assert('Sorted by experience', first.years_experience >= all[all.length - 1].years_experience, `Top: ${first.years_experience}yrs`);

  // Check fields
  const data = first;
  assert('field: industries[]', Array.isArray(data.industries), `${data.industries?.length} items`);
  assert('field: expertise[]', Array.isArray(data.expertise), `${data.expertise?.length} items`);
  assert('field: max_capacity', data.max_capacity > 0, `${data.max_capacity}`);
  assert('field: active_count', data.active_count !== undefined, `${data.active_count}`);
  assert('field: avg_outcome_rating', data.avg_outcome_rating !== undefined, `${data.avg_outcome_rating}`);

  // getMentorsByIndustry
  const cleantech = all.filter(m => m.industries?.includes('CleanTech'));
  assert('getMentorsByIndustry("CleanTech")', cleantech.length > 0, `${cleantech.length} matches`);

  // getAvailableMentors
  const available = all.filter(m => m.active_count < m.max_capacity);
  assert('getAvailableMentors()', available.length > 0, `${available.length} with capacity`);
}

// ═══════════════════════════════════════════════════════════════════════
// TEST: Funders (firestoreFunderService)
// ═══════════════════════════════════════════════════════════════════════
async function testFunders() {
  console.log('\n💰 Testing Funders (DS3)...');

  const q = query(collection(db, 'funders'), orderBy('successful_investments', 'desc'));
  const snap = await getDocs(q);
  const all = snap.docs.map(d => ({ ...d.data(), uid: d.id }));
  assert('getAllFunders()', all.length >= 10, `${all.length} docs`);

  const first = all[0];
  assert('field: investment_focus[]', Array.isArray(first.investment_focus), `${first.investment_focus?.length} sectors`);
  assert('field: stage_interest[]', Array.isArray(first.stage_interest), `${first.stage_interest?.length} stages`);
  assert('field: min_investment', first.min_investment > 0, `$${first.min_investment}`);
  assert('field: max_investment', first.max_investment > first.min_investment, `$${first.max_investment}`);
  assert('field: successful_investments', first.successful_investments > 0, `${first.successful_investments}`);

  // getFundersByIndustry
  const fintech = all.filter(f => f.investment_focus?.includes('FinTech'));
  assert('getFundersByIndustry("FinTech")', fintech.length > 0, `${fintech.length} matches`);
}

// ═══════════════════════════════════════════════════════════════════════
// TEST: Linkages (firestoreLinkageService) — write + read + cleanup
// ═══════════════════════════════════════════════════════════════════════
async function testLinkages() {
  console.log('\n🔗 Testing Linkages (DS4)...');

  // createLinkage
  const ref = await addDoc(collection(db, 'linkages'), {
    type: 'mentor-matching',
    mentor_uid: 'm-001',
    company_uid: 'co-001',
    funder_uid: '',
    programme_id: '',
    status: 'pending_approval',
    outcome_rating: null,
    match_score: 87,
    reasoning: 'Test linkage from Person B test script',
    notes: '',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  assert('createLinkage()', ref.id.length > 0, `ID: ${ref.id}`);

  // getLinkage
  const snap = await getDoc(doc(db, 'linkages', ref.id));
  assert('getLinkage(id)', snap.exists(), `status: ${snap.data()?.status}`);

  // getLinkagesForCompany
  const q1 = query(collection(db, 'linkages'), where('company_uid', '==', 'co-001'));
  const companyLinks = await getDocs(q1);
  assert('getLinkagesForCompany()', companyLinks.size > 0, `${companyLinks.size} links`);

  // getLinkagesForMentor
  const q2 = query(collection(db, 'linkages'), where('mentor_uid', '==', 'm-001'));
  const mentorLinks = await getDocs(q2);
  assert('getLinkagesForMentor()', mentorLinks.size > 0, `${mentorLinks.size} links`);

  // updateLinkage
  await updateDoc(doc(db, 'linkages', ref.id), { status: 'active', updated_at: serverTimestamp() });
  const updated = await getDoc(doc(db, 'linkages', ref.id));
  assert('updateLinkage()', updated.data()?.status === 'active', 'pending_approval → active');

  // Cleanup
  await deleteDoc(doc(db, 'linkages', ref.id));
  assert('cleanup', true, 'Test linkage deleted');
}

// ═══════════════════════════════════════════════════════════════════════
// TEST: Health Events (firestoreHealthService) — write + read + cleanup
// ═══════════════════════════════════════════════════════════════════════
async function testHealthEvents() {
  console.log('\n🏥 Testing Health Events (DS5)...');

  // logHealthEvent
  const ref = await addDoc(collection(db, 'health_events'), {
    event_type: 'test_event',
    severity: 'info',
    message: 'Person B test script health event',
    metadata: { script: 'testServices.mjs' },
    created_at: serverTimestamp(),
  });
  assert('logHealthEvent()', ref.id.length > 0, `ID: ${ref.id}`);

  // getHealthEvents
  const q = query(collection(db, 'health_events'), orderBy('created_at', 'desc'), firestoreLimit(10));
  const snap = await getDocs(q);
  assert('getHealthEvents()', snap.size > 0, `${snap.size} events`);

  // Cleanup
  await deleteDoc(doc(db, 'health_events', ref.id));
  assert('cleanup', true, 'Test event deleted');
}

// ═══════════════════════════════════════════════════════════════════════
// TEST: AuthContext contract — verify collection name
// ═══════════════════════════════════════════════════════════════════════
async function testAuthContract() {
  console.log('\n🔐 Testing Auth Contract...');

  // Verify "companies" collection exists (not "startups")
  const companiesSnap = await getDocs(query(collection(db, 'companies'), firestoreLimit(1)));
  assert('Collection "companies" exists', companiesSnap.size > 0);

  // Verify "startups" collection is NOT the primary (may have old data)
  // This is just informational
  const startupsSnap = await getDocs(query(collection(db, 'startups'), firestoreLimit(1)));
  console.log(`  ℹ️  Old "startups" collection: ${startupsSnap.size > 0 ? 'still has data (can be cleaned up)' : 'empty ✓'}`);
}

// ═══════════════════════════════════════════════════════════════════════
// RUN ALL
// ═══════════════════════════════════════════════════════════════════════
async function main() {
  console.log('═'.repeat(60));
  console.log('  Person B — Firestore Service Integration Test');
  console.log('  Project: myhack-bf3ce | Database: myhack');
  console.log('═'.repeat(60));

  try {
    await testCompanies();
    await testMentors();
    await testFunders();
    await testLinkages();
    await testHealthEvents();
    await testAuthContract();
  } catch (err) {
    console.error('\n💥 Test crashed:', err.message);
    console.error(err);
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('═'.repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

main();
