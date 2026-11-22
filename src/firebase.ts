import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export interface UserProfileDoc {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  communityConnected: boolean;
}

export interface CloudGenerationDoc {
  id: string;
  ownerId: string;
  mode: "single" | "dialogue";
  model: "gemini-3.8-flash-tts" | "gemini-3.8-flash-lite-tts";
  text: string;
  style: string;
  voiceName: string;
  emphasizedWords: string[];
  durationSeconds: number;
  byteLength: number;
  createdAtMs: number;
}

export async function signInWithGooglePopup(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function ensureUserProfile(user: User): Promise<UserProfileDoc> {
  const path = `users/${user.uid}`;
  const ref = doc(db, "users", user.uid);

  try {
    const snap = await getDoc(ref);
    const displayName = (user.displayName || "Creator").slice(0, 120);
    const email = (user.email || "").slice(0, 200);
    const photoURL = user.photoURL ? user.photoURL.slice(0, 500) : undefined;

    if (!snap.exists()) {
      const payload: Record<string, unknown> = {
        uid: user.uid,
        displayName,
        email,
        communityConnected: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (photoURL) payload.photoURL = photoURL;
      await setDoc(ref, payload);
      return {
        uid: user.uid,
        displayName,
        email,
        photoURL,
        communityConnected: false,
      };
    }

    const existing = snap.data();
    return {
      uid: user.uid,
      displayName: String(existing.displayName || displayName),
      email: String(existing.email || email),
      photoURL: existing.photoURL ? String(existing.photoURL) : photoURL,
      communityConnected: Boolean(existing.communityConnected),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateCommunityConnected(
  uid: string,
  connected: boolean
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, "users", uid), {
      communityConnected: connected,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveGenerationToCloud(params: {
  ownerId: string;
  mode: "single" | "dialogue";
  model: string;
  text: string;
  style: string;
  voiceName: string;
  emphasizedWords: string[];
  durationSeconds: number;
  byteLength: number;
}): Promise<string> {
  const path = "generations";
  const normalizedModel =
    params.model === "gemini-3.8-flash-lite-tts"
      ? "gemini-3.8-flash-lite-tts"
      : "gemini-3.8-flash-tts";

  const payload = {
    ownerId: params.ownerId,
    mode: params.mode,
    model: normalizedModel,
    text: params.text.slice(0, 4000),
    style: params.style.slice(0, 1000),
    voiceName: params.voiceName.slice(0, 80),
    emphasizedWords: params.emphasizedWords
      .map((w) => String(w).slice(0, 60))
      .slice(0, 30),
    durationSeconds: Number.isFinite(params.durationSeconds)
      ? Math.max(0, params.durationSeconds)
      : 0,
    byteLength: Number.isFinite(params.byteLength)
      ? Math.max(0, params.byteLength)
      : 0,
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, "generations"), payload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserGenerations(
  uid: string,
  onData: (records: CloudGenerationDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = "generations";
  const q = query(
    collection(db, "generations"),
    where("ownerId", "==", uid),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records: CloudGenerationDoc[] = snapshot.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: d.id,
          ownerId: String(data.ownerId || ""),
          mode: data.mode === "dialogue" ? "dialogue" : "single",
          model:
            data.model === "gemini-3.8-flash-lite-tts"
              ? "gemini-3.8-flash-lite-tts"
              : "gemini-3.8-flash-tts",
          text: String(data.text || ""),
          style: String(data.style || ""),
          voiceName: String(data.voiceName || "Kore"),
          emphasizedWords: Array.isArray(data.emphasizedWords)
            ? data.emphasizedWords.map(String)
            : [],
          durationSeconds: Number(data.durationSeconds || 0),
          byteLength: Number(data.byteLength || 0),
          createdAtMs: ts?.toMillis ? ts.toMillis() : Date.now(),
        };
      });

      records.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function deleteCloudGeneration(generationId: string): Promise<void> {
  const path = `generations/${generationId}`;
  try {
    await deleteDoc(doc(db, "generations", generationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
