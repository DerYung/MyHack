/**
 * Barrel export for all Firestore services — Person B owns this file.
 *
 * Usage by Person C / D:
 *   import { getCompany, getAllMentors, createLinkage } from '../services';
 */

// DS1 — Companies (Startups)
export {
  getCompany,
  createCompany,
  updateCompany,
  getAllCompanies,
  getCompaniesByStatus,
  getCompaniesByMentor,
  archiveCompany,
  unarchiveCompany,
  archiveAllMatchedCompanies,
} from "./firestoreStartupService";

// DS2 — Mentors
export {
  getMentor,
  getAllMentors,
  createMentor,
  updateMentor,
  getMentorsByIndustry,
  getAvailableMentors,
} from "./firestoreMentorService";

// DS3 — Funders
export {
  getFunder,
  getAllFunders,
  createFunder,
  updateFunder,
  getFundersByIndustry,
} from "./firestoreFunderService";

// DS4 — Linkages
export {
  createLinkage,
  getLinkage,
  getLinkagesForCompany,
  getLinkagesForMentor,
  getLinkagesForFunder,
  getLinkagesByStatus,
  getAllLinkages,
  updateLinkage,
} from "./firestoreLinkageService";

// DS5 — Health Events
export {
  logHealthEvent,
  getHealthEvents,
  getHealthEventsBySeverity,
} from "./firestoreHealthService";
