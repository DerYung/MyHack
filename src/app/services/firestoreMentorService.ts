/**
 * Firestore Mentor Service — Person B owns this file.
 * CRUD operations for the `mentors` collection.
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
import type { MentorDoc } from "../types/firestore";

const COLLECTION = "mentors";

/** Get a single mentor by UID */
export async function getMentor(uid: string): Promise<MentorDoc | null> {
  const snap = await getDoc(doc(db, COLLECTION, uid));
  return snap.exists() ? ({ ...snap.data(), uid: snap.id } as MentorDoc) : null;
}

/** Get all mentors */
export async function getAllMentors(): Promise<MentorDoc[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  const docs = snap.docs.map((d) => ({ ...d.data(), uid: d.id } as MentorDoc));
  return docs.sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));
}

/** Create a new mentor profile */
export async function createMentor(data: Partial<MentorDoc>): Promise<void> {
  if (!data.uid) throw new Error("Mentor uid is required");
  await setDoc(doc(db, COLLECTION, data.uid), {
    name: data.name ?? "",
    email: data.email ?? "",
    industries: data.industries ?? [],
    expertise: data.expertise ?? [],
    region: data.region ?? "Malaysia",
    max_capacity: data.max_capacity ?? 5,
    active_count: data.active_count ?? 0,
    bio: data.bio ?? "",
    years_experience: data.years_experience ?? 0,
    startups_helped: data.startups_helped ?? 0,
    avg_outcome_rating: data.avg_outcome_rating ?? 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

/** Partial update on a mentor document */
export async function updateMentor(
  uid: string,
  data: Partial<MentorDoc>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, uid), {
    ...data,
    updated_at: serverTimestamp(),
  });
}

/** Get mentors filtered by industry */
export async function getMentorsByIndustry(
  industry: string
): Promise<MentorDoc[]> {
  const q = query(
    collection(db, COLLECTION),
    where("industries", "array-contains", industry)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), uid: d.id } as MentorDoc));
}

/** Get mentors with available capacity */
export async function getAvailableMentors(): Promise<MentorDoc[]> {
  const all = await getAllMentors();
  return all.filter((m) => m.active_count < m.max_capacity);
}
