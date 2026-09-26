import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const ADMIN_UID = "Ncb6CS4XZ3TDoc0IF9x6CkwMFJn2";

// UI Elements
const loginSec = document.getElementById("login-section");
const dashboardSec = document.getElementById("dashboard-section");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const saveHeroBtn = document.getElementById("save-hero-btn");

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user && user.uid === ADMIN_UID) {
        loginSec.classList.add("hidden");
        dashboardSec.classList.remove("hidden");
        loadExistingData();
    } else {
        loginSec.classList.remove("hidden");
        dashboardSec.classList.add("hidden");
    }
});

// Login Logic
loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("admin-email").value;
    const password = document.getElementById("admin-password").value;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (userCredential.user.uid !== ADMIN_UID) {
            await signOut(auth);
            throw new Error("Unauthorized");
        }
    } catch (error) {
        document.getElementById("login-error").classList.remove("hidden");
    }
});

// Logout Logic
logoutBtn.addEventListener("click", () => signOut(auth));

// Cloudinary Upload Function
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "joy portfolio"); // Your preset

    const res = await fetch("https://api.cloudinary.com/v1_1/kzrmwfn8/upload", {
        method: "POST",
        body: formData
    });
    const data = await res.json();
    return data.secure_url;
}

// Save Data to Firestore
saveHeroBtn.addEventListener("click", async () => {
    saveHeroBtn.innerText = "Saving...";
    const title = document.getElementById("hero-title").value;
    const desc = document.getElementById("hero-desc").value;
    const file = document.getElementById("hero-image").files[0];
    
    let imageUrl = null;
    if (file) {
        imageUrl = await uploadToCloudinary(file);
    }

    const updateData = { title, desc };
    if (imageUrl) updateData.imageUrl = imageUrl;

    await setDoc(doc(db, "portfolioData", "heroSection"), updateData, { merge: true });
    
    saveHeroBtn.innerText = "Save Changes";
    document.getElementById("save-msg").classList.remove("hidden");
    setTimeout(() => document.getElementById("save-msg").classList.add("hidden"), 3000);
});

// Load Existing Data to Inputs
async function loadExistingData() {
    const docSnap = await getDoc(doc(db, "portfolioData", "heroSection"));
    if (docSnap.exists()) {
        const data = docSnap.data();
        if(data.title) document.getElementById("hero-title").value = data.title;
        if(data.desc) document.getElementById("hero-desc").value = data.desc;
    }
}
