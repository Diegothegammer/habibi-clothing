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
  remove
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

export function shippingForProvince(province) {
  if (!province) return 200;
  return province.trim().toLowerCase() === "gauteng" ? 100 : 200;
}

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
  remove
};

export async function saveUserProfile(uid, data) {
  await set(ref(db, "users/" + uid), {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

export async function getUserProfile(uid) {
  const snap = await get(ref(db, "users/" + uid));
  return snap.exists() ? snap.val() : null;
}

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

  if (orderData.userId) {
    await set(ref(db, "userOrders/" + orderData.userId + "/" + id), payload);
  }

  try {
    const items = orderData.items || [];
    for (const item of items) {
      if (!item.id) continue;
      const pRef = ref(db, "products/" + item.id);
      const snap = await get(pRef);
      if (snap.exists()) {
        const p = snap.val();
        const qty = item.qty || 1;
        const next = Math.max(0, (Number(p.stock) || 0) - qty);
        await update(pRef, { stock: next, updatedAt: new Date().toISOString() });
      }
    }
  } catch (e) {
    console.warn("Stock update failed", e);
  }

  return id;
}

export async function getOrdersForUser(uid) {
  const snap = await get(ref(db, "userOrders/" + uid));
  if (!snap.exists()) return [];
  const all = snap.val();
  return Object.values(all).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export async function getAllOrders() {
  const snap = await get(ref(db, "orders"));
  if (!snap.exists()) return [];
  const all = snap.val();
  return Object.keys(all)
    .map((key) => ({ ...all[key], _key: key }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function updateOrderStatus(orderKey, status) {
  const patch = { status, updatedAt: new Date().toISOString() };
  await update(ref(db, "orders/" + orderKey), patch);
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

export async function getAllProducts() {
  const snap = await get(ref(db, "products"));
  if (!snap.exists()) return [];
  const all = snap.val();
  return Object.keys(all)
    .map((key) => ({ ...all[key], id: key }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export async function getActiveProducts() {
  const list = await getAllProducts();
  return list.filter((p) => p.active !== false);
}

export async function saveProduct(productId, data) {
  const img = data.img || "";
  const payload = {
    name: data.name,
    price: Number(data.price) || 0,
    stock: Number(data.stock) || 0,
    img,
    imgBack: data.imgBack || img,
    category: data.category || "tshirts",
    active: data.active !== false,
    updatedAt: new Date().toISOString()
  };
  if (productId) {
    await update(ref(db, "products/" + productId), payload);
    return productId;
  }
  payload.createdAt = new Date().toISOString();
  const newRef = push(ref(db, "products"));
  await set(newRef, payload);
  return newRef.key;
}

export async function deleteProduct(productId) {
  await remove(ref(db, "products/" + productId));
}

export async function setProductStock(productId, stock) {
  await update(ref(db, "products/" + productId), {
    stock: Number(stock) || 0,
    updatedAt: new Date().toISOString()
  });
}

export async function seedProductsIfEmpty() {
  const snap = await get(ref(db, "products"));
  if (snap.exists()) return false;

  const defaults = [
    {
      name: "Habibi Fresh Cap",
      price: 899,
      stock: 20,
      category: "hats",
      img: "https://d1yei2z3i6k35z.cloudfront.net/11623554/69fa81cd795457.83783842_OCWw9.jpg"
    },
    {
      name: "Signature Logo Tee",
      price: 449,
      stock: 30,
      category: "tshirts",
      img: "https://d1yei2z3i6k35z.cloudfront.net/11623554/69fa7e5591c840.37735287_ooFb51.jpg"
    },
    {
      name: "Emirates Bomber Jacket",
      price: 1499,
      stock: 10,
      category: "hoodies",
      img: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800"
    },
    {
      name: "Sahara Cargo Pants",
      price: 799,
      stock: 15,
      category: "pants",
      img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800"
    },
    {
      name: "Habibi Signature Hoodie",
      price: 1499,
      stock: 12,
      category: "hoodies",
      img: "https://d1yei2z3i6k35z.cloudfront.net/11623554/69fa8205110098.48449366_4Vjsh.jpg"
    }
  ];

  for (const p of defaults) {
    await saveProduct(null, { ...p, imgBack: p.img, active: true });
  }
  return true;
}

export function isAdminEmail(email) {
  return (email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
