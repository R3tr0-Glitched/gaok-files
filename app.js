import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAlsIWQNJwjhofD07hyrEqSSJCI2uqfBvY",
  authDomain: "gaok-89901.firebaseapp.com",
  projectId: "gaok-89901",
  storageBucket: "gaok-89901.firebasestorage.app",
  messagingSenderId: "287365042202",
  appId: "1:287365042202:web:1c0dc4a94b37f395d981a3"
};

const ADMINS = [
  "wOtvS062McPzHF5CpR1p9Loh4QW2"
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const loginBtn = document.getElementById("loginBtn");
const adminBox = document.getElementById("adminBox");
const postsDiv = document.getElementById("posts");
const postBtn = document.getElementById("postBtn");

loginBtn.onclick = async () => {
  if (auth.currentUser) {
    await signOut(auth);
  } else {
    const email = prompt("Email:");
    const pass = prompt("Password:");
    await signInWithEmailAndPassword(auth, email, pass);
  }
};

async function ensureUser(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const name = prompt("Username:");
    await setDoc(ref, { username: name });
  }
}

async function getUsername(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data().username;
  return "User_" + uid.slice(-4);
}

onAuthStateChanged(auth, async (user) => {
  loginBtn.textContent = user ? "Logout" : "Login";

  if (user) {
    await ensureUser(user);
    if (ADMINS.includes(user.uid)) {
      adminBox.classList.remove("hidden");
    } else {
      adminBox.classList.add("hidden");
    }
  } else {
    adminBox.classList.add("hidden");
  }

  loadPosts();
});

postBtn.onclick = async () => {
  const user = auth.currentUser;
  if (!user || !ADMINS.includes(user.uid)) return;

  await addDoc(collection(db, "posts"), {
    text: document.getElementById("text").value,
    image: document.getElementById("image").value,
    uid: user.uid,
    createdAt: Date.now(),
    likes: 0
  });

  loadPosts();
};

window.loadPosts = async () => {
  postsDiv.innerHTML = "";
  const search = document.getElementById("search").value.toLowerCase();
  const snap = await getDocs(collection(db, "posts"));

  for (const d of snap.docs) {
    const p = d.data();
    if (search && !p.text.toLowerCase().includes(search)) continue;

    const username = await getUsername(p.uid);

    const div = document.createElement("div");
    div.className = "post";

    div.innerHTML = `
      <small>${username} • ${new Date(p.createdAt).toLocaleString()}</small>
      <p>${p.text}</p>
      ${p.image ? `<img src="${p.image}">` : ""}
      <div class="actions">
        <span>❤️ ${p.likes || 0}</span>
        <button onclick="likePost('${d.id}', ${p.likes || 0})">Like</button>
        ${auth.currentUser && ADMINS.includes(auth.currentUser.uid) ? `
          <button onclick="editPost('${d.id}')">Edit</button>
          <button onclick="deletePost('${d.id}')">Delete</button>
        ` : ""}
      </div>
    `;

    postsDiv.appendChild(div);
  }
};

window.likePost = async (id, likes) => {
  await updateDoc(doc(db, "posts", id), { likes: likes + 1 });
  loadPosts();
};

window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  loadPosts();
};

window.editPost = async (id) => {
  const text = prompt("Edit:");
  await updateDoc(doc(db, "posts", id), { text });
  loadPosts();
};

document.getElementById("search").oninput = loadPosts;

loadPosts();
