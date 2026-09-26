import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const ADMIN_UID = "Ncb6CS4XZ3TDoc0IF9x6CkwMFJn2";

// Auth State Check
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

// Login & Logout
document.getElementById("login-btn").addEventListener("click", async () => {
    try {
        const email = document.getElementById("admin-email").value;
        const pass = document.getElementById("admin-password").value;
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        if (userCredential.user.uid !== ADMIN_UID) await signOut(auth);
    } catch { 
        alert("লগইন ফেইলড! ইমেইল বা পাসওয়ার্ড ভুল অথবা ফায়ারবেস পারমিশন নেই।"); 
    }
});
document.getElementById("logout-btn").addEventListener("click", () => signOut(auth));

// 100% Fixed Cloudinary Upload
async function uploadImg(file) {
    try {
        const fd = new FormData(); 
        fd.append("file", file); 
        fd.append("upload_preset", "joy_portfolio"); 
        
        // Notice: /image/upload is the correct endpoint
        const res = await fetch("https://api.cloudinary.com/v1_1/kzrmwfn8/image/upload", { 
            method: "POST", 
            body: fd 
        });
        
        const data = await res.json();
        
        if(!res.ok) {
            alert(`Cloudinary Error: ${data.error ? data.error.message : 'Unknown error'}`);
            return null;
        }
        return data.secure_url;
    } catch(err) {
        alert("Image Upload Failed! Check internet or adblocker.");
        return null;
    }
}

// Save Popup Data (Crash-proof)
document.getElementById("save-popup-btn").addEventListener("click", async (e) => {
    const btn = e.target;
    btn.innerText = "Saving Popup...";
    try {
        const fileInput = document.getElementById("popup-image");
        const file = fileInput ? fileInput.files[0] : null;
        
        const data = { 
            title: document.getElementById("popup-title")?.value || "", 
            desc: document.getElementById("popup-desc")?.value || "" 
        };
        
        if (file) {
            const imgUrl = await uploadImg(file);
            if(imgUrl) data.imageUrl = imgUrl;
        }
        
        await setDoc(doc(db, "siteData", "popup"), data, { merge: true });
        
        btn.innerText = "Saved Successfully!"; 
        setTimeout(() => btn.innerText = "💾 Save Popup Design", 2000);
    } catch (error) {
        alert("Error Saving Popup: " + error.message);
        btn.innerText = "Error! Try Again";
    }
});

// Save Hero Section (Crash-proof)
document.getElementById("save-hero-btn").addEventListener("click", async (e) => {
    const btn = e.target;
    btn.innerText = "Saving Hero Data...";
    try {
        const fileInput = document.getElementById("hero-image");
        const file = fileInput ? fileInput.files[0] : null;
        
        const data = { 
            badge: document.getElementById("hero-badge")?.value || "",
            greeting: document.getElementById("hero-greeting")?.value || "",
            name: document.getElementById("hero-name")?.value || "",
            title: document.getElementById("hero-title")?.value || "",
            desc: document.getElementById("hero-desc")?.value || "",
            bgColor: document.getElementById("hero-bg-color")?.value || "#FFF0E6",
            layout: document.getElementById("hero-layout")?.value || "right"
        };
        
        if (file) {
            const imgUrl = await uploadImg(file);
            if(imgUrl) data.imageUrl = imgUrl;
        }
        
        await setDoc(doc(db, "siteData", "hero"), data, { merge: true });
        
        btn.innerText = "Saved Successfully!"; 
        setTimeout(() => btn.innerText = "💾 Save Hero Design", 2000);
    } catch (error) {
        alert("Error Saving Hero: " + error.message);
        btn.innerText = "Error! Try Again";
    }
});

// Save Contact Information
document.getElementById("save-contact-btn").addEventListener("click", async (e) => {
    const btn = e.target;
    btn.innerText = "Saving Links...";
    try {
        await setDoc(doc(db, "siteData", "contact"), {
            phone: document.getElementById("contact-phone")?.value || "",
            fb: document.getElementById("contact-fb")?.value || "",
            linkedin: document.getElementById("contact-linkedin")?.value || ""
        }, { merge: true });
        
        btn.innerText = "Saved Successfully!"; 
        setTimeout(() => btn.innerText = "Save Links", 2000);
    } catch (error) {
        alert("Error Saving Contacts: " + error.message);
        btn.innerText = "Error! Try Again";
    }
});

// Add Dynamic Collections (Education & Services)
async function addCollectionItem(colName, titleId, descId) {
    try {
        await addDoc(collection(db, colName), {
            title: document.getElementById(titleId).value,
            desc: document.getElementById(descId).value,
            timestamp: Date.now()
        });
        document.getElementById(titleId).value = ''; 
        document.getElementById(descId).value = '';
        loadAdminData();
    } catch(error) {
        alert("Error Adding Item: " + error.message);
    }
}
document.getElementById("add-srv-btn")?.addEventListener("click", () => addCollectionItem("services", "srv-title", "srv-desc"));

// Delete Item globally
window.deleteItem = async (colName, id) => {
    if(confirm("Are you sure you want to delete this item?")) {
        try {
            await deleteDoc(doc(db, colName, id));
            loadAdminData();
        } catch(error) {
            alert("Error Deleting: " + error.message);
        }
    }
};

// Load Data into Admin Fields
async function loadAdminData() {
    try {
        // Load Analytics
        const statSnap = await getDoc(doc(db, "analytics", "stats"));
        if(statSnap.exists()) {
            const s = statSnap.data();
            if(document.getElementById("stat-views")) document.getElementById("stat-views").innerText = s.views || 0;
            if(document.getElementById("stat-wa")) document.getElementById("stat-wa").innerText = s.clicks_wa || 0;
            if(document.getElementById("stat-fb")) document.getElementById("stat-fb").innerText = s.clicks_fb || 0;
            const totalSecs = s.totalTime || 0;
            const views = s.views || 1;
            const avgSecs = Math.floor(totalSecs / views);
            if(document.getElementById("stat-time")) document.getElementById("stat-time").innerText = avgSecs > 60 ? `${Math.floor(avgSecs/60)}m ${avgSecs%60}s` : `${avgSecs}s`;
        }

        // Load Popup
        const popSnap = await getDoc(doc(db, "siteData", "popup"));
        if(popSnap.exists()) {
            if(document.getElementById("popup-title")) document.getElementById("popup-title").value = popSnap.data().title || '';
            if(document.getElementById("popup-desc")) document.getElementById("popup-desc").value = popSnap.data().desc || '';
        }

        // Load Hero
        const heroSnap = await getDoc(doc(db, "siteData", "hero"));
        if(heroSnap.exists()) { 
            const d = heroSnap.data();
            if(document.getElementById("hero-badge")) document.getElementById("hero-badge").value = d.badge || '';
            if(document.getElementById("hero-greeting")) document.getElementById("hero-greeting").value = d.greeting || '';
            if(document.getElementById("hero-name")) document.getElementById("hero-name").value = d.name || '';
            if(document.getElementById("hero-title")) document.getElementById("hero-title").value = d.title || '';
            if(document.getElementById("hero-desc")) document.getElementById("hero-desc").value = d.desc || '';
            if(document.getElementById("hero-bg-color") && d.bgColor) document.getElementById("hero-bg-color").value = d.bgColor;
            if(document.getElementById("hero-layout") && d.layout) document.getElementById("hero-layout").value = d.layout;
        }
        
        // Load Contact
        const contactSnap = await getDoc(doc(db, "siteData", "contact"));
        if(contactSnap.exists()) { 
            if(document.getElementById("contact-phone")) document.getElementById("contact-phone").value = contactSnap.data().phone || ''; 
            if(document.getElementById("contact-fb")) document.getElementById("contact-fb").value = contactSnap.data().fb || ''; 
            if(document.getElementById("contact-linkedin")) document.getElementById("contact-linkedin").value = contactSnap.data().linkedin || ''; 
        }

        // Load Services
        const snap = await getDocs(collection(db, "services"));
        let html = '';
        snap.forEach(doc => {
            html += `<div class="flex justify-between items-center bg-gray-50 p-2 rounded border">
                        <span><b>${doc.data().title}</b></span>
                        <button onclick="deleteItem('services', '${doc.id}')" class="text-red-500 font-bold hover:text-red-700">Delete</button>
                    </div>`;
        });
        if(document.getElementById("admin-srv-list")) document.getElementById("admin-srv-list").innerHTML = html;

    } catch(error) {
        console.log("Admin Load Error:", error);
    }
}
