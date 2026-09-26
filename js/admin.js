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

// Cloudinary Upload & Other Save Functions (Keeping them short)
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
    const data = { badge: document.getElementById("hero-badge").value, name: document.getElementById("hero-name").value, desc: document.getElementById("hero-desc").value };
    if (file) { const img = await uploadImg(file); if(img) data.imageUrl = img; }
    await setDoc(doc(db, "siteData", "hero"), data, { merge: true });
    e.target.innerText = "Saved!"; setTimeout(() => e.target.innerText = "Save Hero Data", 2000);
});
// (Skipping other basic saves for brevity, they remain same logic)

window.toggleVisibility = async (colName, id, currentState) => { await updateDoc(doc(db, colName, id), { isVisible: !currentState }); loadAdminData(); };
window.deleteItem = async (colName, id) => { if(confirm("Delete this?")) { await deleteDoc(doc(db, colName, id)); loadAdminData(); } };

async function loadAdminData() {
    try {
        // Load Analytics & Basic Data
        const statSnap = await getDoc(doc(db, "analytics", "stats"));
        if(statSnap.exists()) {
            const s = statSnap.data();
            if(document.getElementById("stat-views")) document.getElementById("stat-views").innerText = s.views || 0;
            if(document.getElementById("stat-wa")) document.getElementById("stat-wa").innerText = s.clicks_wa || 0;
        }
        
        // ADMIN REAL-TIME INBOX SYSTEM
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
                    allMessages.push({ id: docSnap.id, ...data });
                    clientsMap.set(data.clientId, { name: data.clientName, lastTime: data.timestamp });
                });

                // Render User List
                const userListDiv = document.getElementById("admin-user-list");
                userListDiv.innerHTML = "";
                
                Array.from(clientsMap.entries()).sort((a,b) => b[1].lastTime - a[1].lastTime).forEach(([cId, cData]) => {
                    const btn = document.createElement("button");
                    btn.className = `w-full text-left p-3 rounded-lg font-bold text-sm transition ${activeClientId === cId ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`;
                    btn.innerText = `👤 ${cData.name}`;
                    btn.onclick = () => {
                        activeClientId = cId;
                        loadAdminData(); // re-render to highlight active
                    };
                    userListDiv.appendChild(btn);
                });

                // Render Active Chat
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
            });

            // Admin Send Logic
            const adminSendBtn = document.getElementById("admin-chat-send");
            const adminInput = document.getElementById("admin-chat-input");
            
            // Remove old listener to avoid duplicates
            const newAdminSendBtn = adminSendBtn.cloneNode(true);
            adminSendBtn.parentNode.replaceChild(newAdminSendBtn, adminSendBtn);
            
            newAdminSendBtn.addEventListener("click", async () => {
                const text = adminInput.value.trim();
                if(!text || !activeClientId) return;
                adminInput.value = "";
                await addDoc(collection(db, "messages"), {
                    clientId: activeClientId,
                    clientName: "Admin", // Internal reference
                    sender: 'admin',
                    text: text,
                    timestamp: Date.now()
                });
            });
        }
    } catch(err) { console.error(err); }
}
