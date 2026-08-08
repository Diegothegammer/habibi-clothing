// Shared Firebase config + helpers for Habibi Clothing
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  update,
  query,
  orderByChild,
  equalTo
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBhZ3sOiXn0mOqMaV8VCJ3AoiKrrpqZ18A",
  authDomain: "habibi-clothing-4b976.firebaseapp.com",
  databaseURL: "https://habibi-clothing-4b976-default-rtdb.firebaseio.com",
  projectId: "habibi-clothing-4b976",
  storageBucket: "habibi-clothing-4b976.firebasestorage.app",
  messagingSenderId: "28615247653",
  appId: "1:28615247653:web:e809fb8e00fd4543573ccc",
  measurementId: "G-K4W47LHJRW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  ref,
  set,
  get,
  push,
  update,
  query,
  orderByChild,
  equalTo
};

/** Save / update user profile under users/{uid} */
export async function saveUserProfile(uid, data) {
  await set(ref(db, "users/" + uid), {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

/** Get user profile */
export async function getUserProfile(uid) {
  const snap = await get(ref(db, "users/" + uid));
  return snap.exists() ? snap.val() : null;
}

/** Create an order and return its id */
export async function createOrder(orderData) {
  const ordersRef = ref(db, "orders");
  const newRef = push(ordersRef);
  const id = newRef.key;
  await set(newRef, {
    ...orderData,
    id,
    createdAt: new Date().toISOString(),
    status: "pending"
  });
  return id;
}

/** Get all orders for a user (by uid) */
export async function getOrdersForUser(uid) {
  const snap = await get(ref(db, "orders"));
  if (!snap.exists()) return [];
  const all = snap.val();
  return Object.values(all)
    .filter((o) => o.userId === uid)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
