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
  update
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

export const ADMIN_EMAIL = "diegothegammer1@gmail.com";

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
  update
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

/** Create an order (main list + per-user copy if logged in) */
export async function createOrder(orderData) {
  const ordersRef = ref(db, "orders");
  const newRef = push(ordersRef);
  const id = newRef.key;
  const payload = {
    ...orderData,
    id,
    createdAt: new Date().toISOString(),
    status: "pending"
  };
  await set(newRef, payload);

  // Copy under userOrders/{uid}/{id} so customers can read only their orders
  if (orderData.userId) {
    await set(ref(db, "userOrders/" + orderData.userId + "/" + id), payload);
  }
  return id;
}

/** Get orders for a user from their private path */
export async function getOrdersForUser(uid) {
  const snap = await get(ref(db, "userOrders/" + uid));
  if (!snap.exists()) return [];
  const all = snap.val();
  return Object.values(all).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

/** Get every order (admin) — includes Firebase key */
export async function getAllOrders() {
  const snap = await get(ref(db, "orders"));
  if (!snap.exists()) return [];
  const all = snap.val();
  return Object.keys(all)
    .map((key) => ({ ...all[key], _key: key }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/** Update order status (main + user copy if present) */
export async function updateOrderStatus(orderKey, status) {
  const patch = { status, updatedAt: new Date().toISOString() };
  await update(ref(db, "orders/" + orderKey), patch);

  // Keep user copy in sync when possible
  try {
    const snap = await get(ref(db, "orders/" + orderKey));
    if (snap.exists()) {
      const o = snap.val();
      if (o.userId) {
        await update(ref(db, "userOrders/" + o.userId + "/" + orderKey), patch);
      }
    }
  } catch (e) {
    console.warn("Could not sync userOrders status", e);
  }
}

export function isAdminEmail(email) {
  return (email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
