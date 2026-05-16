import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../../lib/firebase";

export type UserRole = "Startup" | "Mentor" | "Funder" | "Admin";

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (role: UserRole, specificData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Fetch user profile from Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  const completeOnboarding = async (role: UserRole, specificData: any) => {
    if (!user) throw new Error("No authenticated user");

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      role: role,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: Date.now(),
    };

    try {
      // 1. Save base profile to `users` collection
      await setDoc(doc(db, "users", user.uid), newProfile);
      
      // 2. Save role-specific profile (snake_case fields per shared contract)
      let collectionName = "";
      switch (role) {
        case "Startup": collectionName = "companies"; break;
        case "Mentor": collectionName = "mentors"; break;
        case "Funder": collectionName = "funders"; break;
        case "Admin": collectionName = "admins"; break;
      }
      
      if (collectionName) {
        await setDoc(doc(db, collectionName, user.uid), {
          ...specificData,
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }

      // Update local state
      setUserProfile(newProfile);
    } catch (error) {
      console.error("Error completing onboarding", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, loginWithGoogle, logout, completeOnboarding }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
