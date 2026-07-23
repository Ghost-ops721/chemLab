import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getFirebaseAuth } from "./client";
import {
  ensureUserProfile,
  type SignupProfileFields,
} from "./profile";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";

export function formatAuthError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/configuration-not-found":
        return "Auth is not ready for this domain. Try again, or refresh the page.";
      case "auth/email-already-in-use":
        return "That email is already registered. Try logging in.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Incorrect email or password.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a moment and try again.";
      default:
        return err.message.replace(/^Firebase:\s*/i, "").replace(/\s*\(.*\)$/, "");
    }
  }
  if (err instanceof Error) return err.message;
  return "Authentication failed";
}

export async function signUp(
  email: string,
  password: string,
  signup: SignupProfileFields,
) {
  const fields = {
    displayName: signup.displayName.trim(),
    phone: signup.phone.trim(),
  };
  // So AuthProvider's race creates the profile with name/phone
  useAuthStore.getState().setPendingSignup(fields);

  const cred = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  if (fields.displayName) {
    await updateProfile(cred.user, { displayName: fields.displayName });
  }

  const progress = useProgressStore.getState();
  const badgeIds = progress.badges.filter((b) => b.earnedAt).map((b) => b.id);
  const profile = await ensureUserProfile(
    cred.user.uid,
    cred.user.email ?? email.trim(),
    {
      xp: progress.xp,
      discoveredIds: progress.discoveredIds,
      badgeIds,
    },
    fields,
  );
  useAuthStore.getState().setPendingSignup(null);
  useAuthStore.getState().setProfile(profile);
  return cred.user;
}

export async function signIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  return cred.user;
}

export async function signOut() {
  await firebaseSignOut(getFirebaseAuth());
}

export function subscribeAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}
