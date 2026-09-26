import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc, updateDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const ADMIN_UID = "Ncb6CS4XZ3TDoc0IF9x6CkwMFJn2";
let adminChatUnsubscribe = null;
let activeClientId = null;

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
        return res.ok ? data.secure_url : null;
    } catch(err) { return null; }
}

document.getElementById("save-hero-btn")?.addEventListener("click", async (e) => {
    e.target.innerText = "Saving...";
    const file = document.getElementById("hero-image")?.files[0];
    const data = { badge: document.getElementById("hero-badge").value, name: document.getElementById("hero-name").value, desc: document.getElementById("hero-desc").value, bgColor: document.getElementById("hero-bg-color")?.value || "#FFF0E6", layout: document.getElementById("hero-layout")?.value || "right" };
    if (file) { const img = await uploadImg(file); if(img) data.imageUrl = img; }
    await setDoc(doc(db, "siteData", "hero"), data, { merge: true });
    e.target.innerText = "Saved!"; setTimeout(() => e.target.innerText = "Save Hero Data", 2000);
});

document.getElementById("save-promo-btn")?.addEventListener("click", async (e) => {
    e.target.innerText = "Saving...";
    await setDoc(doc(db, "siteData", "settings"), { promoText: document.getElementById("promo-text").value, promoShow: document.getElementById("promo-show").checked, maintenanceMode: document.getElementById("maintenance-toggle").checked }, { merge: true });
    e.target.innerText = "Saved!"; setTimeout(() => e.target.innerText = "Save Promo", 2000);
});

document.getElementById("save-seo-btn")?.addEventListener("click", async (e) => {
    e.target.innerText = "Updating...";
    await setDoc(doc(db, "siteData", "seo"), { title: document.getElementById("seo-title").value, desc: document.getElementById("seo-desc").value, keywords: document.getElementById("seo-keywords").value }, { merge: true });
    e.target.innerText = "Updated!"; setTimeout(() => e.target.innerText = "Update SEO Data", 2000);
});

document.getElementById("save-popup-btn")?.addEventListener("click", async (e) => {
    e.target.innerText = "Saving...";
    const file = document.getElementById("popup-image")?.files[0];
    const data = { title: document.getElementById("popup-title").value, desc: document.getElementById("popup-desc").value };
    if (file) { const img = await uploadImg(file); if(img) data.imageUrl = img; }
    await setDoc(doc(db, "siteData", "popup"), data, { merge: true });
    e.target.innerText = "Saved!"; setTimeout(() => e.target.innerText = "Save Popup", 2000);
});

document.getElementById("save-contact-btn")?.addEventListener("click", async (e) => {
    e.target.innerText = "Saving...";
    await setDoc(doc(db, "siteData", "contact"), { phone: document.getElementById("contact-phone").value, fb: document.getElementById("contact-fb").value, linkedin: document.getElementById("contact-linkedin").value }, { merge: true });
    e.target.innerText = "Saved!"; setTimeout(() => e.target.innerText = "Save Links", 2000);
});

document.getElementById("add-srv-btn")?.addEventListener("click", async () => {
    await addDoc(collection(db, "services"), { title: document.getElementById("srv-title").value, desc: document.getElementById("srv-desc").value, isVisible: document.getElementById("srv-visible").checked, timestamp: Date.now() });
    document.getElementById("srv-title").value = ''; document.getElementById("srv-desc").value = '';
    loadAdminData();
});

window.toggleVisibility = async (colName, id, currentState) => { await updateDoc(doc(db, colName, id), { isVisible: !currentState }); loadAdminData(); };
window.deleteItem = async (colName, id) => { if(confirm("Delete this?")) { await deleteDoc(doc(db, colName, id)); loadAdminData(); } };

async function loadAdminData() {
    try {
        const statSnap = await getDoc(doc(db, "analytics", "stats"));
        if(statSnap.exists()) {
            const s = statSnap.data();
            if(document.getElementById("stat-views")) document.getElementById("stat-views").innerText = s.views || 0;
            if(document.getElementById("stat-wa")) document.getElementById("stat-wa").innerText = s.clicks_wa || 0;
        }

        const setSnap = await getDoc(doc(db, "siteData", "settings"));
        if(setSnap.exists()) {
            const st = setSnap.data();
            if(document.getElementById("promo-text")) document.getElementById("promo-text").value = st.promoText || "";
            if(document.getElementById("promo-show")) document.getElementById("promo-show").checked = st.promoShow || false;
            if(document.getElementById("maintenance-toggle")) document.getElementById("maintenance-toggle").checked = st.maintenanceMode || false;
        }

        const seoSnap = await getDoc(doc(db, "siteData", "seo"));
        if(seoSnap.exists()) {
            const seo = seoSnap.data();
            if(document.getElementById("seo-title")) document.getElementById("seo-title").value = seo.title || "";
            if(document.getElementById("seo-desc")) document.getElementById("seo-desc").value = seo.desc || "";
            if(document.getElementById("seo-keywords")) document.getElementById("seo-keywords").value = seo.keywords || "";
        }

        const heroSnap = await getDoc(doc(db, "siteData", "hero"));
        if(heroSnap.exists()) { 
            const d = heroSnap.data();
            if(document.getElementById("hero-badge")) document.getElementById("hero-badge").value = d.badge || '';
            if(document.getElementById("hero-name")) document.getElementById("hero-name").value = d.name || '';
            if(document.getElementById("hero-desc")) document.getElementById("hero-desc").value = d.desc || '';
            if(document.getElementById("hero-bg-color") && d.bgColor) document.getElementById("hero-bg-color").value = d.bgColor;
            if(document.getElementById("hero-layout") && d.layout) document.getElementById("hero-layout").value = d.layout;
        }
        
        const popSnap = await getDoc(doc(db, "siteData", "popup"));
        if(popSnap.exists()) {
            if(document.getElementById("popup-title")) document.getElementById("popup-title").value = popSnap.data().title || '';
            if(document.getElementById("popup-desc")) document.getElementById("popup-desc").value = popSnap.data().desc || '';
        }

        const contactSnap = await getDoc(doc(db, "siteData", "contact"));
        if(contactSnap.exists()) { 
            if(document.getElementById("contact-phone")) document.getElementById("contact-phone").value = contactSnap.data().phone || ''; 
            if(document.getElementById("contact-fb")) document.getElementById("contact-fb").value = contactSnap.data().fb || ''; 
            if(document.getElementById("contact-linkedin")) document.getElementById("contact-linkedin").value = contactSnap.data().linkedin || ''; 
        }

        const srvSnap = await getDocs(collection(db, "services"));
        let html = '';
        srvSnap.forEach(doc => {
            const data = doc.data();
            const visColor = data.isVisible ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500";
            html += `<div class="flex justify-between items-center bg-white p-4 rounded-xl shadow border mb-2">
                        <div><span class="font-bold">${data.title}</span><span class="ml-2 text-xs px-2 py-1 rounded-full ${visColor}">${data.isVisible ? "Public" : "Hidden"}</span></div>
                        <div class="flex gap-2">
                            <button onclick="toggleVisibility('services', '${doc.id}', ${data.isVisible})" class="bg-blue-100 text-blue-700 px-3 py-1 rounded font-bold text-sm">Toggle</button>
                            <button onclick="deleteItem('services', '${doc.id}')" class="bg-red-100 text-red-600 px-3 py-1 rounded font-bold text-sm">Delete</button>
                        </div>
                    </div>`;
        });
        if(document.getElementById("admin-srv-list")) document.getElementById("admin-srv-list").innerHTML = html;

        // BULLETPROOF ADMIN INBOX
        const inboxContainer = document.getElementById("inbox-messages");
        if(inboxContainer) {
            inboxContainer.innerHTML = `
                <div class="flex h-[50vh] gap-4">
                    <div id="admin-user-list" class="w-1/3 bg-white/50 rounded-xl overflow-y-auto border border-white space-y-2 p-2"></div>
                    <div class="w-2/3 bg-white/80 rounded-xl border border-white flex flex-col relative">
                        <div id="admin-chat-box" class="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col">
                            <p class="text-center text-gray-400 mt-10">Select a client to view chat</p>
                        </div>
                        <div class="p-3 bg-gray-100 flex gap-2 border-t rounded-b-xl">
                            <input type="text" id="admin-chat-input" placeholder="Type reply..." class="flex-1 px-4 py-2 rounded-lg border outline-none">
                            <button id="admin-chat-send" class="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700">Send</button>
                        </div>
                    </div>
                </div>
            `;

            const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
            if(adminChatUnsubscribe) adminChatUnsubscribe();
            
            adminChatUnsubscribe = onSnapshot(q, (snapshot) => {
                const clientsMap = new Map();
                const allMessages = [];
                
                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    if(data.clientId) {
                        allMessages.push({ id: docSnap.id, ...data });
                        clientsMap.set(data.clientId, { name: data.clientName, lastTime: data.timestamp });
                    }
                });

                const userListDiv = document.getElementById("admin-user-list");
                userListDiv.innerHTML = "";
                
                Array.from(clientsMap.entries()).sort((a,b) => b[1].lastTime - a[1].lastTime).forEach(([cId, cData]) => {
                    const btn = document.createElement("button");
                    btn.className = `w-full text-left p-3 rounded-lg font-bold text-sm transition ${activeClientId === cId ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`;
                    btn.innerText = `👤 ${cData.name}`;
                    btn.onclick = () => { activeClientId = cId; loadAdminData(); };
                    userListDiv.appendChild(btn);
                });

                const chatBox = document.getElementById("admin-chat-box");
                if(activeClientId) {
                    chatBox.innerHTML = "";
                    allMessages.filter(m => m.clientId === activeClientId).forEach(m => {
                        const isClient = m.sender === 'client';
                        const div = document.createElement("div");
                        div.className = `max-w-[75%] p-3 rounded-xl text-sm ${isClient ? 'bg-gray-200 text-gray-800 self-start' : 'bg-orange-500 text-white self-end'}`;
                        div.innerText = m.text;
                        chatBox.appendChild(div);
                    });
                    chatBox.scrollTop = chatBox.scrollHeight;
                }
            }, (error) => {
                alert("Inbox Sync Failed! Check Firebase Rules.");
                console.error(error);
            });

            // Instant Admin Reply
            const adminSendBtn = document.getElementById("admin-chat-send");
            const newAdminSendBtn = adminSendBtn.cloneNode(true);
            adminSendBtn.parentNode.replaceChild(newAdminSendBtn, adminSendBtn);
            
            newAdminSendBtn.addEventListener("click", async () => {
                const adminInput = document.getElementById("admin-chat-input");
                const text = adminInput.value.trim();
                if(!text || !activeClientId) return;
                
                adminInput.value = "";
                newAdminSendBtn.innerText = "⏳";
                
                try {
                    await addDoc(collection(db, "messages"), {
                        clientId: activeClientId,
                        clientName: "Admin", 
                        sender: 'admin',
                        text: text,
                        timestamp: Date.now()
                    });
                    newAdminSendBtn.innerText = "Send";
                } catch (err) {
                    alert("Failed to send! Check Firebase Rules.");
                    newAdminSendBtn.innerText = "Send";
                    adminInput.value = text;
                }
            });
        }
    } catch(err) { console.error(err); }
}

// ADVANCED TOOLS
document.getElementById("ai-generate-btn")?.addEventListener("click", () => {
    const topic = document.getElementById("ai-topic").value.trim();
    if(!topic) return alert("Please enter a topic first! (e.g., Facebook Ads)");
    const templates = [
        `Are you looking for professional ${topic} services? I provide top-tier, high-converting solutions tailored to grow your business rapidly. Let's skyrocket your sales today!`,
        `Stop wasting money on poor strategies. As an expert in ${topic}, I apply data-driven methods to ensure maximum ROI for your brand. Get premium quality at an affordable cost!`,
        `Need the best ${topic} expert in Bangladesh? You found him. I build highly optimized, visually stunning, and result-oriented solutions that your customers will love.`
    ];
    document.getElementById("ai-output").value = templates[Math.floor(Math.random() * templates.length)];
});

document.getElementById("generate-invoice-btn")?.addEventListener("click", () => {
    const cName = document.getElementById("inv-client").value.trim();
    const srv = document.getElementById("inv-service").value.trim();
    const amt = document.getElementById("inv-amount").value.trim();
    if(!cName || !srv || !amt) return alert("Please fill all invoice fields!");
    document.getElementById("inv-output").value = `*INVOICE / BILL*\n\nHello ${cName},\nHere are the payment details for your project:\n\n*Service:* ${srv}\n*Total Amount:* ৳${amt}\n\n*Payment Methods:*\nBkash/Nagad: 01786689656 (Personal)\n\nPlease reply with a screenshot after sending the payment. Thanks!\n- Abidur Rahman Joy`;
});

document.getElementById("backup-btn")?.addEventListener("click", async (e) => {
    e.target.innerText = "⏳ Preparing Backup...";
    try {
        const backupData = { siteData: {}, services: [], backupDate: new Date().toISOString() };
        const siteDataSnap = await getDocs(collection(db, "siteData"));
        siteDataSnap.forEach(doc => { backupData.siteData[doc.id] = doc.data(); });
        const srvSnap = await getDocs(collection(db, "services"));
        srvSnap.forEach(doc => { backupData.services.push({ id: doc.id, ...doc.data() }); });

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `Joy_Portfolio_Backup.json`);
        document.body.appendChild(dlAnchorElem); dlAnchorElem.click(); dlAnchorElem.remove();
        
        e.target.innerText = "✅ Backup Downloaded!";
        setTimeout(() => e.target.innerHTML = "⬇️ Download Full Backup", 3000);
    } catch(error) {
        alert("Backup failed! Check your internet connection.");
        e.target.innerHTML = "⬇️ Download Full Backup";
    }
});
