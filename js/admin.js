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
        document.getElementById("login-error").classList.remove("hidden"); 
    }
});
document.getElementById("logout-btn").addEventListener("click", () => signOut(auth));

// Cloudinary Image Upload
async function uploadImg(file) {
    const fd = new FormData(); 
    fd.append("file", file); 
    fd.append("upload_preset", "joy portfolio");
    const res = await fetch("https://api.cloudinary.com/v1_1/kzrmwfn8/upload", { method: "POST", body: fd });
    const data = await res.json();
    return data.secure_url;
}

// Save Hero Section
document.getElementById("save-hero-btn").addEventListener("click", async (e) => {
    e.target.innerText = "Saving...";
    const file = document.getElementById("hero-image").files[0];
    const data = { 
        title: document.getElementById("hero-title").value, 
        desc: document.getElementById("hero-desc").value 
    };
    if (file) data.imageUrl = await uploadImg(file);
    await setDoc(doc(db, "siteData", "hero"), data, { merge: true });
    e.target.innerText = "Saved!"; 
    setTimeout(() => e.target.innerText = "Save Hero Info", 2000);
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
    setTimeout(() => e.target.innerText = "Save Contacts", 2000);
});

// Add Dynamic Collections (Education & Services)
async function addCollectionItem(colName, titleId, descId) {
    await addDoc(collection(db, colName), {
        title: document.getElementById(titleId).value,
        desc: document.getElementById(descId).value,
        timestamp: Date.now()
    });
    document.getElementById(titleId).value = ''; 
    document.getElementById(descId).value = '';
    loadAdminData();
}
document.getElementById("add-edu-btn").addEventListener("click", () => addCollectionItem("education", "edu-title", "edu-desc"));
document.getElementById("add-srv-btn").addEventListener("click", () => addCollectionItem("services", "srv-title", "srv-desc"));

// Delete Item globally
window.deleteItem = async (colName, id) => {
    if(confirm("Are you sure you want to delete this item?")) {
        await deleteDoc(doc(db, colName, id));
        loadAdminData();
    }
};

// Load Data into Admin Fields
async function loadAdminData() {
    const heroSnap = await getDoc(doc(db, "siteData", "hero"));
    if(heroSnap.exists()) { 
        document.getElementById("hero-title").value = heroSnap.data().title || ''; 
        document.getElementById("hero-desc").value = heroSnap.data().desc || ''; 
    }
    
    const contactSnap = await getDoc(doc(db, "siteData", "contact"));
    if(contactSnap.exists()) { 
        document.getElementById("contact-phone").value = contactSnap.data().phone || ''; 
        document.getElementById("contact-fb").value = contactSnap.data().fb || ''; 
        document.getElementById("contact-linkedin").value = contactSnap.data().linkedin || ''; 
    }

    const renderList = async (colName, listId) => {
        const snap = await getDocs(collection(db, colName));
        let html = '';
        snap.forEach(doc => {
            html += `<div class="flex justify-between items-center bg-white p-2 rounded border">
                        <span><b>${doc.data().title}</b></span>
                        <button onclick="deleteItem('${colName}', '${doc.id}')" class="text-red-500 font-bold hover:text-red-700">X</button>
                    </div>`;
        });
        document.getElementById(listId).innerHTML = html;
    };
    renderList("education", "admin-edu-list");
    renderList("services", "admin-srv-list");
}
