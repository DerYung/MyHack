/**
 * Firestore Funder Service — Person B owns this file.
 * CRUD operations for the `funders` collection.
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
import type { FunderDoc } from "../types/firestore";

const COLLECTION = "funders";

/** Get a single funder by UID */
export async function getFunder(uid: string): Promise<FunderDoc | null> {
  const snap = await getDoc(doc(db, COLLECTION, uid));
  return snap.exists() ? ({ ...snap.data(), uid: snap.id } as FunderDoc) : null;
}

/** Get all funders */
export async function getAllFunders(): Promise<FunderDoc[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  const docs = snap.docs.map((d) => ({ ...d.data(), uid: d.id } as FunderDoc));
  return docs.sort((a, b) => (b.successful_investments || 0) - (a.successful_investments || 0));
}

/** Create a new funder profile */
export async function createFunder(data: Partial<FunderDoc>): Promise<void> {
  if (!data.uid) throw new Error("Funder uid is required");
  await setDoc(doc(db, COLLECTION, data.uid), {
    name: data.name ?? "",
    email: data.email ?? "",
    investment_focus: data.investment_focus ?? [],
    stage_interest: data.stage_interest ?? [],
    min_investment: data.min_investment ?? 0,
    max_investment: data.max_investment ?? 0,
    region: data.region ?? "Malaysia",
    bio: data.bio ?? "",
    portfolio: data.portfolio ?? [],
    successful_investments: data.successful_investments ?? 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

/** Partial update on a funder document */
export async function updateFunder(
  uid: string,
  data: Partial<FunderDoc>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, uid), {
    ...data,
    updated_at: serverTimestamp(),
  });
}

/** Get funders filtered by investment focus industry */
export async function getFundersByIndustry(
  industry: string
): Promise<FunderDoc[]> {
  const q = query(
    collection(db, COLLECTION),
    where("investment_focus", "array-contains", industry)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), uid: d.id } as FunderDoc));
}
