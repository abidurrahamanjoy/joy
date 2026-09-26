import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const ADMIN_UID = "Ncb6CS4XZ3TDoc0IF9x6CkwMFJn2"; // Replace if needed

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
    } catch { alert("লগইন ফেইলড! ইমেইল বা পাসওয়ার্ড ভুল।"); }
});
document.getElementById("logout-btn").addEventListener("click", () => signOut(auth));

async function uploadImg(file) {
    try {
        const fd = new FormData(); fd.append("file", file); fd.append("upload_preset", "joy_portfolio"); 
        const res = await fetch("https://api.cloudinary.com/v1_1/kzrmwfn8/image/upload", { method: "POST", body: fd });
        const data = await res.json();
        if(!res.ok) { alert(`Error: ${data.error ? data.error.message : 'Unknown'}`); return null; }
        return data.secure_url;
    } catch(err) { alert("Upload Failed!"); return null; }
}

// Save Promo & Maintenance Mode
document.getElementById("save-promo-btn")?.addEventListener("click", async (e) => {
    e.target.innerText = "Saving...";
    await setDoc(doc(db, "siteData", "settings"), {
        promoText: document.getElementById("promo-text").value,
        promoShow: document.getElementById("promo-show").checked,
        maintenanceMode: document.getElementById("maintenance-toggle").checked
    }, { merge: true });
    e.target.innerText = "Saved!"; setTimeout(() => e.target.innerText = "Save Promo", 2000);
});

// Save SEO Data
document.getElementById("save-seo-btn")?.addEventListener("click", async (e) => {
    e.target.innerText = "Updating SEO...";
    await setDoc(doc(db, "siteData", "seo"), {
        title: document.getElementById("seo-title").value,
        desc: document.getElementById("seo-desc").value,
        keywords: document.getElementById("seo-keywords").value
    }, { merge: true });
    e.target.innerText = "SEO Updated!"; setTimeout(() => e.target.innerText = "Update SEO Data", 2000);
});

// Save Hero (Crash-proof logic applies here from previous implementation)
document.getElementById("save-hero-btn")?.addEventListener("click", async (e) => {
    e.target.innerText = "Saving...";
    const file = document.getElementById("hero-image")?.files[0];
    const data = { badge: document.getElementById("hero-badge").value, name: document.getElementById("hero-name").value, desc: document.getElementById("hero-desc").value };
    if (file) { const img = await uploadImg(file); if(img) data.imageUrl = img; }
    await setDoc(doc(db, "siteData", "hero"), data, { merge: true });
    e.target.innerText = "Saved!"; setTimeout(() => e.target.innerText = "Save Hero Data", 2000);
});

// Add Service with Show/Hide Toggle
document.getElementById("add-srv-btn")?.addEventListener("click", async () => {
    try {
        await addDoc(collection(db, "services"), {
            title: document.getElementById("srv-title").value,
            desc: document.getElementById("srv-desc").value,
            isVisible: document.getElementById("srv-visible").checked, // visibility flag
            timestamp: Date.now()
        });
        document.getElementById("srv-title").value = ''; document.getElementById("srv-desc").value = '';
        loadAdminData();
    } catch(err) { alert("Error adding service."); }
});

// Toggle Visibility of existing service globally
window.toggleVisibility = async (colName, id, currentState) => {
    await updateDoc(doc(db, colName, id), { isVisible: !currentState });
    loadAdminData();
};

window.deleteItem = async (colName, id) => {
    if(confirm("Delete this?")) { await deleteDoc(doc(db, colName, id)); loadAdminData(); }
};

// Load Admin Data
async function loadAdminData() {
    try {
        // Analytics
        const statSnap = await getDoc(doc(db, "analytics", "stats"));
        if(statSnap.exists()) {
            const s = statSnap.data();
            if(document.getElementById("stat-views")) document.getElementById("stat-views").innerText = s.views || 0;
            if(document.getElementById("stat-wa")) document.getElementById("stat-wa").innerText = s.clicks_wa || 0;
        }

        // Settings (Promo & Maintenance)
        const setSnap = await getDoc(doc(db, "siteData", "settings"));
        if(setSnap.exists()) {
            const st = setSnap.data();
            if(document.getElementById("promo-text")) document.getElementById("promo-text").value = st.promoText || "";
            if(document.getElementById("promo-show")) document.getElementById("promo-show").checked = st.promoShow || false;
            if(document.getElementById("maintenance-toggle")) document.getElementById("maintenance-toggle").checked = st.maintenanceMode || false;
        }

        // SEO
        const seoSnap = await getDoc(doc(db, "siteData", "seo"));
        if(seoSnap.exists()) {
            const seo = seoSnap.data();
            if(document.getElementById("seo-title")) document.getElementById("seo-title").value = seo.title || "";
            if(document.getElementById("seo-desc")) document.getElementById("seo-desc").value = seo.desc || "";
            if(document.getElementById("seo-keywords")) document.getElementById("seo-keywords").value = seo.keywords || "";
        }

        // Services List with Edit/Toggle Option
        const snap = await getDocs(collection(db, "services"));
        let html = '';
        snap.forEach(doc => {
            const data = doc.data();
            const visColor = data.isVisible ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500";
            const visText = data.isVisible ? "Public" : "Hidden";
            html += `<div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border mb-2">
                        <div>
                            <span class="font-bold text-lg">${data.title}</span>
                            <span class="ml-2 text-xs px-2 py-1 rounded-full ${visColor}">${visText}</span>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="toggleVisibility('services', '${doc.id}', ${data.isVisible})" class="bg-blue-100 text-blue-700 px-3 py-1 rounded font-bold text-sm">Toggle Show/Hide</button>
                            <button onclick="deleteItem('services', '${doc.id}')" class="bg-red-100 text-red-600 px-3 py-1 rounded font-bold text-sm">Delete</button>
                        </div>
                    </div>`;
        });
        if(document.getElementById("admin-srv-list")) document.getElementById("admin-srv-list").innerHTML = html;

    } catch(err) { console.error(err); }
}
