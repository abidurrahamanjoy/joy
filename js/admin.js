import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc, updateDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const ADMIN_UID = "Ncb6CS4XZ3TDoc0IF9x6CkwMFJn2";
let adminChatUnsubscribe = null;
let activeClientId = null;

onAuthStateChanged(auth, (user) => {
    if (user && user.uid === ADMIN_UID) {
        document.getElementById("login-section")?.classList.add("hidden");
        document.getElementById("dashboard-section")?.classList.remove("hidden");
        loadAdminData();
    } else {
        document.getElementById("login-section")?.classList.remove("hidden");
        document.getElementById("dashboard-section")?.classList.add("hidden");
    }
});

document.getElementById("login-btn")?.addEventListener("click", async () => {
    const email = document.getElementById("admin-email").value.trim();
    const password = document.getElementById("admin-password").value.trim();
    
    if(!email || !password) {
        alert("দয়া করে ইমেইল এবং পাসওয়ার্ড দিন!");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (userCredential.user.uid !== ADMIN_UID) {
            alert("⚠️ আপনার অ্যাকাউন্টটি সুপার এডমিন নয়!");
            await signOut(auth);
        }
    } catch (error) {
        console.error("Login Error:", error.code, error.message);
        alert("লগইন ব্যর্থ হয়েছে! ইমেইল বা পাসওয়ার্ড ভুল অথবা ফায়ারবেস কনফিগারেশনে সমস্যা আছে। (Error: " + error.code + ")");
    }
});

document.getElementById("logout-btn")?.addEventListener("click", () => signOut(auth));

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
    const data = {};
    
    const badge = document.getElementById("hero-badge").value.trim();
    const name = document.getElementById("hero-name").value.trim();
    const desc = document.getElementById("hero-desc").value.trim();
    const bgColor = document.getElementById("hero-bg-color")?.value;
    const layout = document.getElementById("hero-layout")?.value;

    if(badge) data.badge = badge;
    if(name) data.name = name;
    if(desc) data.desc = desc;
    if(bgColor) data.bgColor = bgColor;
    if(layout) data.layout = layout;

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
    const data = {};
    const pTitle = document.getElementById("popup-title").value.trim();
    const pDesc = document.getElementById("popup-desc").value.trim();
    
    if(pTitle) data.title = pTitle;
    if(pDesc) data.desc = pDesc;
    if (file) { const img = await uploadImg(file); if(img) data.imageUrl = img; }
    
    await setDoc(doc(db, "siteData", "popup"), data, { merge: true });
    e.target.innerText = "Saved!"; setTimeout(() => e.target.innerText = "Save Popup", 2000);
});

document.getElementById("save-contact-btn")?.addEventListener("click", async (e) => {
    e.target.innerText = "Saving...";
    const data = {};
    const ph = document.getElementById("contact-phone").value.trim();
    const fb = document.getElementById("contact-fb").value.trim();
    const li = document.getElementById("contact-linkedin").value.trim();
    
    if(ph) data.phone = ph;
    if(fb) data.fb = fb;
    if(li) data.linkedin = li;

    await setDoc(doc(db, "siteData", "contact"), data, { merge: true });
    e.target.innerText = "Saved!"; setTimeout(() => e.target.innerText = "Save Links", 2000);
});

document.getElementById("add-srv-btn")?.addEventListener("click", async () => {
    await addDoc(collection(db, "services"), { title: document.getElementById("srv-title").value, desc: document.getElementById("srv-desc").value, isVisible: document.getElementById("srv-visible").checked, timestamp: Date.now() });
    document.getElementById("srv-title").value = ''; document.getElementById("srv-desc").value = '';
    loadAdminData();
});

document.getElementById("add-edu-btn")?.addEventListener("click", async () => {
    await addDoc(collection(db, "education"), {
        icon: document.getElementById("edu-icon").value.trim() || "🎓",
        title: document.getElementById("edu-title").value.trim(),
        desc: document.getElementById("edu-desc").value.trim(),
        isVisible: document.getElementById("edu-visible").checked,
        timestamp: Date.now()
    });
    document.getElementById("edu-icon").value = '';
    document.getElementById("edu-title").value = '';
    document.getElementById("edu-desc").value = '';
    loadAdminData();
});

document.getElementById("add-cust-btn")?.addEventListener("click", async (e) => {
    const btn = e.target;
    btn.innerText = "Saving...";
    const file = document.getElementById("cust-image")?.files[0];
    let imgUrl = "";
    if (file) { const up = await uploadImg(file); if (up) imgUrl = up; }

    await addDoc(collection(db, "customSections"), {
        title: document.getElementById("cust-title").value.trim(),
        desc: document.getElementById("cust-desc").value.trim(),
        img: imgUrl,
        order: Number(document.getElementById("cust-order").value) || 0,
        isVisible: document.getElementById("cust-visible").checked,
        timestamp: Date.now()
    });
    document.getElementById("cust-title").value = '';
    document.getElementById("cust-desc").value = '';
    document.getElementById("cust-order").value = '1';
    btn.innerText = "Add Section";
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

        const eduSnap = await getDocs(collection(db, "education"));
        let eduHtml = '';
        eduSnap.forEach(doc => {
            const data = doc.data();
            const visColor = data.isVisible ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500";
            eduHtml += `<div class="flex justify-between items-center bg-white p-4 rounded-xl shadow border mb-2">
                        <div><span class="font-bold">${data.icon || ''} ${data.title}</span><span class="ml-2 text-xs px-2 py-1 rounded-full ${visColor}">${data.isVisible ? "Public" : "Hidden"}</span></div>
                        <div class="flex gap-2">
                            <button onclick="toggleVisibility('education', '${doc.id}', ${data.isVisible})" class="bg-blue-100 text-blue-700 px-3 py-1 rounded font-bold text-sm">Toggle</button>
                            <button onclick="deleteItem('education', '${doc.id}')" class="bg-red-100 text-red-600 px-3 py-1 rounded font-bold text-sm">Delete</button>
                        </div>
                    </div>`;
        });
        if(document.getElementById("admin-edu-list")) document.getElementById("admin-edu-list").innerHTML = eduHtml;

        const custSnap = await getDocs(query(collection(db, "customSections"), orderBy("order", "asc")));
        let custHtml = '';
        custSnap.forEach(doc => {
            const data = doc.data();
            const visColor = data.isVisible ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500";
            custHtml += `<div class="flex justify-between items-center bg-white p-4 rounded-xl shadow border mb-2">
                        <div><span class="font-bold">#${data.order ?? 0} — ${data.title}</span><span class="ml-2 text-xs px-2 py-1 rounded-full ${visColor}">${data.isVisible ? "Public" : "Hidden"}</span></div>
                        <div class="flex gap-2">
                            <button onclick="toggleVisibility('customSections', '${doc.id}', ${data.isVisible})" class="bg-blue-100 text-blue-700 px-3 py-1 rounded font-bold text-sm">Toggle</button>
                            <button onclick="deleteItem('customSections', '${doc.id}')" class="bg-red-100 text-red-600 px-3 py-1 rounded font-bold text-sm">Delete</button>
                        </div>
                    </div>`;
        });
        if(document.getElementById("admin-cust-list")) document.getElementById("admin-cust-list").innerHTML = custHtml;

        const inboxContainer = document.getElementById("inbox-messages");
        if(inboxContainer) {
            inboxContainer.innerHTML = `
                <div class="flex flex-col md:flex-row h-[70vh] md:h-[50vh] gap-4 w-full">
                    <div id="admin-user-list" class="w-full md:w-1/3 bg-white/60 rounded-xl overflow-y-auto border border-white space-y-2 p-2 h-1/3 md:h-full flex-shrink-0 shadow-inner">
                        <p class="text-sm text-center text-gray-600 p-2">Loading clients...</p>
                    </div>
                    <div class="w-full md:w-2/3 bg-white/90 rounded-xl border border-white flex flex-col relative h-2/3 md:h-full shadow-lg">
                        <div id="admin-chat-header" class="p-3 border-b bg-gray-50 rounded-t-xl font-bold text-gray-800 text-center">
                            Select a client to chat
                        </div>
                        <div id="admin-chat-box" class="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col bg-gray-50/50">
                        </div>
                        <div class="p-3 bg-white flex gap-2 border-t rounded-b-xl shadow-inner">
                            <input type="text" id="admin-chat-input" placeholder="Type reply..." class="flex-1 px-4 py-2 rounded-full border border-gray-300 outline-none focus:border-orange-500 bg-gray-50">
                            <button id="admin-chat-send" class="bg-orange-600 text-white w-10 h-10 rounded-full font-bold flex items-center justify-center hover:bg-orange-700 shadow-md">➤</button>
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
                
                if(clientsMap.size === 0) {
                    userListDiv.innerHTML = `<p class="text-sm text-center text-gray-500 mt-4">No messages yet</p>`;
                }
                
                Array.from(clientsMap.entries()).sort((a,b) => b[1].lastTime - a[1].lastTime).forEach(([cId, cData]) => {
                    const btn = document.createElement("button");
                    btn.className = `w-full text-left p-3 rounded-lg font-bold text-sm transition shadow-sm ${activeClientId === cId ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100'}`;
                    btn.innerText = `👤 ${cData.name}`;
                    btn.onclick = () => { activeClientId = cId; loadAdminData(); };
                    userListDiv.appendChild(btn);
                });

                const chatBox = document.getElementById("admin-chat-box");
                const chatHeader = document.getElementById("admin-chat-header");
                
                if(activeClientId) {
                    const activeClientData = clientsMap.get(activeClientId);
                    chatHeader.innerText = `Chatting with: ${activeClientData ? activeClientData.name : 'Client'}`;
                    
                    chatBox.innerHTML = "";
                    allMessages.filter(m => m.clientId === activeClientId).forEach(m => {
                        const isClient = m.sender === 'client';
                        const div = document.createElement("div");
                        div.className = `max-w-[85%] p-3 rounded-2xl text-sm ${isClient ? 'bg-gray-200 text-gray-800 self-start rounded-bl-none' : 'bg-orange-500 text-white self-end rounded-br-none shadow-sm'}`;
                        div.innerText = m.text;
                        chatBox.appendChild(div);
                    });
                    chatBox.scrollTop = chatBox.scrollHeight;
                }
            });

            const adminSendBtn = document.getElementById("admin-chat-send");
            const newAdminSendBtn = adminSendBtn.cloneNode(true);
            adminSendBtn.parentNode.replaceChild(newAdminSendBtn, adminSendBtn);
            
            const sendReply = async () => {
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
                    newAdminSendBtn.innerText = "➤";
                } catch (err) {
                    alert("Failed to send!");
                    newAdminSendBtn.innerText = "➤";
                    adminInput.value = text;
                }
            };
            
            newAdminSendBtn.addEventListener("click", sendReply);
            document.getElementById("admin-chat-input").addEventListener("keypress", (e) => { if(e.key === 'Enter') sendReply(); });
        }
    } catch(err) { console.error("Admin Load Error:", err); }
}

document.getElementById("ai-generate-btn")?.addEventListener("click", () => {
    const topic = document.getElementById("ai-topic").value.trim();
    if(!topic) return alert("Please enter a topic first!");
    const templates = [
        `Are you looking for professional ${topic} services? I provide top-tier, high-converting solutions tailored to grow your business rapidly.`,
        `Stop wasting money on poor strategies. As an expert in ${topic}, I apply data-driven methods to ensure maximum ROI for your brand.`
    ];
    document.getElementById("ai-output").value = templates[Math.floor(Math.random() * templates.length)];
});

document.getElementById("generate-invoice-btn")?.addEventListener("click", () => {
    const cName = document.getElementById("inv-client").value.trim();
    const srv = document.getElementById("inv-service").value.trim();
    const amt = document.getElementById("inv-amount").value.trim();
    if(!cName || !srv || !amt) return alert("Please fill all invoice fields!");
    document.getElementById("inv-output").value = `*INVOICE*\nHello ${cName},\n*Service:* ${srv}\n*Amount:* ৳${amt}\n*Bkash:* 01786689656\n- Abidur Rahman Joy`;
});

document.getElementById("backup-btn")?.addEventListener("click", async (e) => {
    e.target.innerText = "⏳ Preparing...";
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
        
        e.target.innerText = "✅ Downloaded!";
        setTimeout(() => e.target.innerHTML = "⬇️ Download Full Backup", 3000);
    } catch(error) { alert("Backup failed!"); }
});
