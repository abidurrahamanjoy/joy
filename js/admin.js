import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const ADMIN_UID = "Ncb6CS4XZ3TDoc0IF9x6CkwMFJn2";

onAuthStateChanged(auth, (user) => {
    if (user && user.uid === ADMIN_UID) {
        document.getElementById("login-section").classList.add("hidden");
        document.getElementById("dashboard-section").classList.remove("hidden");
        loadAdminData();
    } else {
        document.getElementById("login-section").classList.remove("hidden");
        document.getElementById("dashboard-section").classList.add("hidden");
    }
});

document.getElementById("login-btn").addEventListener("click", async () => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, document.getElementById("admin-email").value, document.getElementById("admin-password").value);
        if (userCredential.user.uid !== ADMIN_UID) await signOut(auth);
    } catch { alert("Access Denied or Wrong Credentials!"); }
});
document.getElementById("logout-btn").addEventListener("click", () => signOut(auth));

async function uploadImg(file) {
    try {
        const fd = new FormData(); fd.append("file", file); fd.append("upload_preset", "joy_portfolio"); 
        const res = await fetch("https://api.cloudinary.com/v1_1/kzrmwfn8/upload", { method: "POST", body: fd });
        const data = await res.json();
        return data.secure_url;
    } catch(err) { return null; }
}

// Save Popup Data
document.getElementById("save-popup-btn").addEventListener("click", async (e) => {
    e.target.innerText = "Saving...";
    const file = document.getElementById("popup-image").files[0];
    const data = { title: document.getElementById("popup-title").value, desc: document.getElementById("popup-desc").value };
    if (file) {
        const imgUrl = await uploadImg(file);
        if(imgUrl) data.imageUrl = imgUrl;
    }
    await setDoc(doc(db, "siteData", "popup"), data, { merge: true });
    e.target.innerText = "Saved!"; setTimeout(() => e.target.innerText = "💾 Save Popup Design", 2000);
});

// Existing Hero & Contact Saves (Keep your existing JS logic here)
document.getElementById("save-hero-btn").addEventListener("click", async (e) => {
    e.target.innerText = "Saving Data...";
    const file = document.getElementById("hero-image").files[0];
    const data = { badge: document.getElementById("hero-badge").value, name: document.getElementById("hero-name").value, desc: document.getElementById("hero-desc").value };
    if (file) { const imgUrl = await uploadImg(file); if(imgUrl) data.imageUrl = imgUrl; }
    await setDoc(doc(db, "siteData", "hero"), data, { merge: true });
    e.target.innerText = "Saved!"; setTimeout(() => e.target.innerText = "💾 Save Hero Design", 2000);
});

document.getElementById("save-contact-btn").addEventListener("click", async (e) => {
    e.target.innerText = "Saving...";
    await setDoc(doc(db, "siteData", "contact"), {
        phone: document.getElementById("contact-phone").value, fb: document.getElementById("contact-fb").value, linkedin: document.getElementById("contact-linkedin").value
    }, { merge: true });
    e.target.innerText = "Saved!"; setTimeout(() => e.target.innerText = "Save Links", 2000);
});

async function loadAdminData() {
    // Load Analytics
    const statSnap = await getDoc(doc(db, "analytics", "stats"));
    if(statSnap.exists()) {
        const s = statSnap.data();
        document.getElementById("stat-views").innerText = s.views || 0;
        document.getElementById("stat-wa").innerText = s.clicks_wa || 0;
        document.getElementById("stat-fb").innerText = s.clicks_fb || 0;
        const totalSecs = s.totalTime || 0;
        const views = s.views || 1;
        const avgSecs = Math.floor(totalSecs / views);
        document.getElementById("stat-time").innerText = avgSecs > 60 ? `${Math.floor(avgSecs/60)}m ${avgSecs%60}s` : `${avgSecs}s`;
    }

    // Load Popup Data
    const popSnap = await getDoc(doc(db, "siteData", "popup"));
    if(popSnap.exists()) {
        document.getElementById("popup-title").value = popSnap.data().title || '';
        document.getElementById("popup-desc").value = popSnap.data().desc || '';
    }

    // Load Hero & Contacts
    const heroSnap = await getDoc(doc(db, "siteData", "hero"));
    if(heroSnap.exists()) { 
        document.getElementById("hero-badge").value = heroSnap.data().badge || '';
        document.getElementById("hero-name").value = heroSnap.data().name || '';
        document.getElementById("hero-desc").value = heroSnap.data().desc || '';
    }
    const contactSnap = await getDoc(doc(db, "siteData", "contact"));
    if(contactSnap.exists()) { 
        document.getElementById("contact-phone").value = contactSnap.data().phone || ''; 
        document.getElementById("contact-fb").value = contactSnap.data().fb || ''; 
        document.getElementById("contact-linkedin").value = contactSnap.data().linkedin || ''; 
    }
}
