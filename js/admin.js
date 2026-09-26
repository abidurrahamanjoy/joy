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
    } catch { document.getElementById("login-error").classList.remove("hidden"); }
});
document.getElementById("logout-btn").addEventListener("click", () => signOut(auth));

// Robust Cloudinary Upload with Error Logging
async function uploadImg(file) {
    try {
        const fd = new FormData(); 
        fd.append("file", file); 
        // ⚠️ Note: Try renaming "joy portfolio" to "joy_portfolio" in Cloudinary settings if it still fails.
        fd.append("upload_preset", "joy portfolio"); 
        
        const res = await fetch("https://api.cloudinary.com/v1_1/kzrmwfn8/upload", { method: "POST", body: fd });
        const data = await res.json();
        
        if(!res.ok) {
            alert(`Cloudinary Error: ${data.error ? data.error.message : 'Unknown error'}`);
            return null;
        }
        return data.secure_url;
    } catch(err) {
        alert("Upload Failed! Check your internet or adblocker. Error details in console.");
        console.error("Upload Error:", err);
        return null;
    }
}

// Granular Hero Save
document.getElementById("save-hero-btn").addEventListener("click", async (e) => {
    e.target.innerText = "Saving Data & Image...";
    const file = document.getElementById("hero-image").files[0];
    
    const data = { 
        badge: document.getElementById("hero-badge").value,
        greeting: document.getElementById("hero-greeting").value,
        name: document.getElementById("hero-name").value,
        title: document.getElementById("hero-title").value,
        desc: document.getElementById("hero-desc").value,
        bgColor: document.getElementById("hero-bg-color").value,
        layout: document.getElementById("hero-layout").value
    };
    
    if (file) {
        const imgUrl = await uploadImg(file);
        if(imgUrl) data.imageUrl = imgUrl;
    }
    
    await setDoc(doc(db, "siteData", "hero"), data, { merge: true });
    e.target.innerText = "Saved Successfully!"; 
    setTimeout(() => e.target.innerText = "💾 Save Hero Design", 2000);
});

// Save Contact Information
document.getElementById("save-contact-btn").addEventListener("click", async (e) => {
    e.target.innerText = "Saving...";
    await setDoc(doc(db, "siteData", "contact"), {
        phone: document.getElementById("contact-phone").value,
        fb: document.getElementById("contact-fb").value,
        linkedin: document.getElementById("contact-linkedin").value
    });
    e.target.innerText = "Saved!"; 
    setTimeout(() => e.target.innerText = "Save Links", 2000);
});

// Add & Load Services dynamically
async function addCollectionItem(colName, titleId, descId) {
    await addDoc(collection(db, colName), {
        title: document.getElementById(titleId).value,
        desc: document.getElementById(descId).value,
        timestamp: Date.now()
    });
    document.getElementById(titleId).value = ''; document.getElementById(descId).value = '';
    loadAdminData();
}
document.getElementById("add-srv-btn").addEventListener("click", () => addCollectionItem("services", "srv-title", "srv-desc"));

window.deleteItem = async (colName, id) => {
    if(confirm("Delete this?")) { await deleteDoc(doc(db, colName, id)); loadAdminData(); }
};

// Load Admin Data
async function loadAdminData() {
    const heroSnap = await getDoc(doc(db, "siteData", "hero"));
    if(heroSnap.exists()) { 
        const d = heroSnap.data();
        document.getElementById("hero-badge").value = d.badge || '';
        document.getElementById("hero-greeting").value = d.greeting || '';
        document.getElementById("hero-name").value = d.name || '';
        document.getElementById("hero-title").value = d.title || '';
        document.getElementById("hero-desc").value = d.desc || '';
        if(d.bgColor) document.getElementById("hero-bg-color").value = d.bgColor;
        if(d.layout) document.getElementById("hero-layout").value = d.layout;
    }
    
    const contactSnap = await getDoc(doc(db, "siteData", "contact"));
    if(contactSnap.exists()) { 
        document.getElementById("contact-phone").value = contactSnap.data().phone || ''; 
        document.getElementById("contact-fb").value = contactSnap.data().fb || ''; 
        document.getElementById("contact-linkedin").value = contactSnap.data().linkedin || ''; 
    }

    const snap = await getDocs(collection(db, "services"));
    let html = '';
    snap.forEach(doc => {
        html += `<div class="flex justify-between items-center bg-gray-50 p-2 rounded border">
                    <span><b>${doc.data().title}</b></span>
                    <button onclick="deleteItem('services', '${doc.id}')" class="text-red-500 font-bold hover:text-red-700">Delete</button>
                </div>`;
    });
    document.getElementById("admin-srv-list").innerHTML = html;
}
