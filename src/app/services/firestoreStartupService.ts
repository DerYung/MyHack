/**
 * Firestore Startup (Company) Service — Person B owns this file.
 * CRUD operations for the `companies` collection.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { CompanyDoc } from "../types/firestore";

const COLLECTION = "companies";

/** Get a single company by UID */
export async function getCompany(uid: string): Promise<CompanyDoc | null> {
  const snap = await getDoc(doc(db, COLLECTION, uid));
  return snap.exists() ? ({ ...snap.data(), uid: snap.id } as CompanyDoc) : null;
}

/** Create a new company document (UID = Firebase Auth UID of the startup user) */
export async function createCompany(data: Partial<CompanyDoc>): Promise<void> {
  if (!data.uid) throw new Error("Company uid is required");
  await setDoc(doc(db, COLLECTION, data.uid), {
    name: data.name ?? "",
    description: data.description ?? "",
    sector: data.sector ?? "",
    stage: data.stage ?? "Idea",
    region: data.region ?? "Malaysia",
    budget_needed: data.budget_needed ?? 0,
    budget_breakdown: data.budget_breakdown ?? "",
    market_goals: data.market_goals ?? "",
    status: data.status ?? "submitted",
    ai_score: data.ai_score ?? null,
    mentor_uid: data.mentor_uid ?? null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

/** Partial update on a company document */
export async function updateCompany(
  uid: string,
  data: Partial<CompanyDoc>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, uid), {
    ...data,
    updated_at: serverTimestamp(),
  });
}

/** Get all companies, ordered by newest first */
export async function getAllCompanies(): Promise<CompanyDoc[]> {
  const q = query(collection(db, COLLECTION), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), uid: d.id } as CompanyDoc));
}

/** Get companies filtered by status */
export async function getCompaniesByStatus(
  status: CompanyDoc["status"]
): Promise<CompanyDoc[]> {
  const q = query(
    collection(db, COLLECTION),
    where("status", "==", status)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ ...d.data(), uid: d.id } as CompanyDoc));
  // Sort in memory to avoid needing a Firestore composite index during the hackathon
  return docs.sort((a, b) => {
    const timeA = typeof a.created_at === 'number' ? a.created_at : (a.created_at?.toMillis?.() || 0);
    const timeB = typeof b.created_at === 'number' ? b.created_at : (b.created_at?.toMillis?.() || 0);
    return timeB - timeA;
  });
}

/** Get companies assigned to a specific mentor */
export async function getCompaniesByMentor(
  mentorUid: string
): Promise<CompanyDoc[]> {
  const q = query(
    collection(db, COLLECTION),
    where("mentor_uid", "==", mentorUid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), uid: d.id } as CompanyDoc));
}
