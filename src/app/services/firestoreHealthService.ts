/**
 * Firestore Health Event Service — Person B owns this file.
 * CRUD operations for the `health_events` collection.
 *
 * Health events are logged by the platform to track ecosystem-level
 * signals: match approvals, rejection spikes, mentor capacity warnings, etc.
 */
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { HealthEventDoc } from "../types/firestore";

const COLLECTION = "health_events";

/** Log a new health event */
export async function logHealthEvent(
  event: Partial<HealthEventDoc>
): Promise<void> {
  await addDoc(collection(db, COLLECTION), {
    event_type: event.event_type ?? "unknown",
    severity: event.severity ?? "info",
    message: event.message ?? "",
    metadata: event.metadata ?? {},
    created_at: serverTimestamp(),
  });
}

/** Get recent health events (newest first) */
export async function getHealthEvents(
  maxResults: number = 50
): Promise<HealthEventDoc[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy("created_at", "desc"),
    firestoreLimit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as HealthEventDoc));
}

/** Get health events filtered by severity */
export async function getHealthEventsBySeverity(
  severity: HealthEventDoc["severity"],
  maxResults: number = 20
): Promise<HealthEventDoc[]> {
  // Firestore doesn't support inequality + orderBy on different fields easily,
  // so we fetch all and filter client-side for simplicity
  const all = await getHealthEvents(200);
  return all.filter((e) => e.severity === severity).slice(0, maxResults);
}
