/**
 * Firestore Linkage Service — Person B owns this file.
 * CRUD operations for the `linkages` collection.
 *
 * Linkages are the core "Programmable Entity" — every relationship
 * between a company↔mentor or company↔funder is stored here.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { LinkageDoc } from "../types/firestore";

const COLLECTION = "linkages";

/** Create a new linkage — returns the auto-generated document ID */
export async function createLinkage(
  data: Partial<LinkageDoc>
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    type: data.type ?? "mentor-matching",
    mentor_uid: data.mentor_uid ?? "",
    company_uid: data.company_uid ?? "",
    funder_uid: data.funder_uid ?? "",
    programme_id: data.programme_id ?? "",
    status: data.status ?? "pending_approval",
    outcome_rating: data.outcome_rating ?? null,
    match_score: data.match_score ?? null,
    reasoning: data.reasoning ?? "",
    notes: data.notes ?? "",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
}

/** Get a single linkage by document ID */
export async function getLinkage(id: string): Promise<LinkageDoc | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists()
    ? ({ ...snap.data(), id: snap.id } as LinkageDoc)
    : null;
}

/** Get all linkages for a specific company */
export async function getLinkagesForCompany(
  companyUid: string
): Promise<LinkageDoc[]> {
  const q = query(
    collection(db, COLLECTION),
    where("company_uid", "==", companyUid),
    orderBy("created_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as LinkageDoc));
}

/** Get all linkages for a specific mentor */
export async function getLinkagesForMentor(
  mentorUid: string
): Promise<LinkageDoc[]> {
  const q = query(
    collection(db, COLLECTION),
    where("mentor_uid", "==", mentorUid),
    orderBy("created_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as LinkageDoc));
}

/** Get all linkages for a specific funder */
export async function getLinkagesForFunder(
  funderUid: string
): Promise<LinkageDoc[]> {
  const q = query(
    collection(db, COLLECTION),
    where("funder_uid", "==", funderUid),
    orderBy("created_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as LinkageDoc));
}

/** Get all linkages filtered by status */
export async function getLinkagesByStatus(
  status: LinkageDoc["status"]
): Promise<LinkageDoc[]> {
  const q = query(
    collection(db, COLLECTION),
    where("status", "==", status),
    orderBy("created_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as LinkageDoc));
}

/** Get all linkages (for admin dashboard) */
export async function getAllLinkages(): Promise<LinkageDoc[]> {
  const q = query(collection(db, COLLECTION), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as LinkageDoc));
}

/** Partial update on a linkage document */
export async function updateLinkage(
  id: string,
  data: Partial<LinkageDoc>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updated_at: serverTimestamp(),
  });
}
