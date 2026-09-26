import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, orderBy, query, setDoc, increment, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let currentClientData = null;
let chatUnsubscribe = null;

// মূল ডেটা রেন্ডার ফাংশন
async function renderWebsiteData() {
    
    // 1. Maintenance & SEO
    try {
        const setSnap = await getDoc(doc(db, "siteData", "settings"));
        if(setSnap.exists()) {
            const st = setSnap.data();
            if(st.maintenanceMode) { 
                document.body.innerHTML = `<div class="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white text-center"><h1 class="text-4xl font-bold">Under Construction</h1></div>`; 
                return; 
            }
            if(st.promoShow && st.promoText && !document.getElementById('promo-bar')) { 
                const p = document.createElement('div'); 
                p.id = 'promo-bar';
                p.className = "bg-orange-600 text-white text-center py-2 font-bold z-50 animate-pulse"; 
                p.innerText = st.promoText; 
                document.body.prepend(p); 
            }
        }
        const seoSnap = await getDoc(doc(db, "siteData", "seo"));
        if(seoSnap.exists() && seoSnap.data().title) document.title = seoSnap.data().title;
    } catch(e) { console.log("Settings Error:", e); }

    // 2. Analytics
    try { await setDoc(doc(db, "analytics", "stats"), { views: increment(1) }, { merge: true }); } catch(e){}

    // 3. Render Hero Section
    try {
        const heroSnap = await getDoc(doc(db, "siteData", "hero"));
        if (heroSnap.exists()) {
            const data = heroSnap.data();
            if(document.getElementById("dynamic-hero-badge")) document.getElementById("dynamic-hero-badge").innerText = data.badge || '';
            if(document.getElementById("dynamic-hero-name")) document.getElementById("dynamic-hero-name").innerText = data.name || '';
            if(document.getElementById("dynamic-hero-desc")) document.getElementById("dynamic-hero-desc").innerText = data.desc || '';
            if(document.getElementById("dynamic-hero-img") && data.imageUrl) document.getElementById("dynamic-hero-img").src = data.imageUrl;
            if(data.bgColor && document.getElementById("hero-section")) document.getElementById("hero-section").style.backgroundColor = data.bgColor;
        }
    } catch(e) { console.log("Hero Error:", e); }

    // 4. Render Services
    try {
        const srvSnap = await getDocs(query(collection(db, "services"), orderBy("timestamp", "asc")));
        if(!srvSnap.empty && document.getElementById("dynamic-srv-container")) {
            let srvHtml = '';
            srvSnap.forEach(doc => { 
                if(doc.data().isVisible) {
                    srvHtml += `<div class="glass-effect p-8 rounded-3xl shadow-md border-t-4 border-orange-500 bg-white/60">
                                    <h4 class="font-bold text-lg text-orange-700 mb-3">${doc.data().title}</h4>
                                    <p class="text-sm text-gray-800 font-medium">${doc.data().desc}</p>
                                </div>`; 
                }
            });
            document.getElementById("dynamic-srv-container").innerHTML = srvHtml;
        }
    } catch(e) { console.log("Services Error:", e); }

    // 5. Render Contacts (100% Fixed Links)
    try {
        const contactSnap = await getDoc(doc(db, "siteData", "contact"));
        if (contactSnap.exists()) {
            const cData = contactSnap.data();
            
            // WhatsApp Link
            if(cData.phone) {
                const waLink = `https://wa.me/${cData.phone.replace(/[^0-9]/g, '')}`;
                document.querySelectorAll('.dynamic-phone-link').forEach(link => { link.href = waLink; });
                document.querySelectorAll('.dynamic-phone-text').forEach(text => { text.innerText = cData.phone; });
            }
            
            // Facebook Link
            if(cData.fb && document.getElementById("dyn-fb")) {
                document.getElementById("dyn-fb").href = cData.fb;
            }
            
            // LinkedIn Link
            if(cData.linkedin && document.getElementById("dyn-linkedin")) {
                document.getElementById("dyn-linkedin").href = cData.linkedin;
            }
        }
    } catch(e) { console.log("Contact Error:", e); }

    // 6. Floating Menu & Chat Logic
    setupFloatingUI();
}

// 100% Safe DOM Loader (Waits for exactly 1.2 seconds to ensure HTML is ready)
setTimeout(() => {
    if(typeof loadComponent === 'function') {
        loadComponent('popup-container', 'components/popup.html').then(() => renderWebsiteData());
    } else {
        renderWebsiteData();
    }
}, 1200);


// ==========================================
// FLOATING UI & SMART CHAT LOGIC
// ==========================================
function setupFloatingUI() {
    
    // Toggle Menu
    document.getElementById("fab-menu")?.addEventListener("click", () => {
        const m = document.getElementById("glass-menu");
        const c = document.getElementById("glass-chat");
        if(m && m.classList.contains("hidden")) {
            m.classList.remove("hidden"); setTimeout(() => m.classList.remove("opacity-0", "translate-y-4"), 10);
            if(c) c.classList.add("hidden", "opacity-0", "translate-y-4");
        } else if (m) {
            m.classList.add("opacity-0", "translate-y-4"); setTimeout(() => m.classList.add("hidden"), 300);
        }
    });

    document.querySelectorAll(".menu-link").forEach(l => l.addEventListener("click", () => {
        const m = document.getElementById("glass-menu");
        if(m) { m.classList.add("opacity-0", "translate-y-4"); setTimeout(() => m.classList.add("hidden"), 300); }
    }));

    // Toggle Chat
    const toggleChat = () => {
        const c = document.getElementById("glass-chat");
        const m = document.getElementById("glass-menu");
        if(c && c.classList.contains("hidden")) {
            c.classList.remove("hidden"); setTimeout(() => c.classList.remove("opacity-0", "translate-y-4"), 10);
            if(m) m.classList.add("hidden", "opacity-0", "translate-y-4");
            checkChatSession(); 
        } else if (c) {
            c.classList.add("opacity-0", "translate-y-4"); setTimeout(() => c.classList.add("hidden"), 300);
        }
    };
    document.getElementById("fab-chat")?.addEventListener("click", toggleChat);
    document.getElementById("close-chat-btn")?.addEventListener("click", toggleChat);

    function checkChatSession() {
        const savedSession = localStorage.getItem("joy_chat_session");
        if(savedSession) {
            currentClientData = JSON.parse(savedSession);
            document.getElementById("chat-auth-screen")?.classList.add("hidden");
            document.getElementById("chat-box-screen")?.classList.remove("hidden");
            loadRealtimeMessages();
        } else {
            document.getElementById("chat-auth-screen")?.classList.remove("hidden");
            document.getElementById("chat-box-screen")?.classList.add("hidden");
        }
    }

    document.getElementById("chat-login-btn")?.addEventListener("click", () => {
        const name = document.getElementById("chat-name")?.value.trim();
        const errBox = document.getElementById("chat-auth-err");
        if(!name) { errBox.innerText = "Please enter your name!"; errBox.classList.remove("hidden"); return; }
        
        const uniqueId = "client_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
        currentClientData = { uid: uniqueId, name: name };
        localStorage.setItem("joy_chat_session", JSON.stringify(currentClientData)); 
        
        document.getElementById("chat-auth-screen").classList.add("hidden");
        document.getElementById("chat-box-screen").classList.remove("hidden");
        loadRealtimeMessages();
    });

    // INSTANT SEND LOGIC 
    const sendMsg = async () => {
        const input = document.getElementById("chat-input");
        const btn = document.getElementById("chat-send-btn");
        const text = input.value.trim();
        if(!text || !currentClientData) return;
        
        // Show instantly on screen
        const chatBox = document.getElementById("chat-messages");
        const instantDiv = document.createElement("div");
        instantDiv.className = "max-w-[85%] p-3 rounded-2xl text-sm bg-orange-400 text-white self-end rounded-br-none shadow-sm opacity-70"; 
        instantDiv.innerText = text;
        
        const emptyText = chatBox.querySelector("p.text-gray-500");
        if (emptyText) emptyText.remove();
        
        chatBox.appendChild(instantDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        input.value = "";
        btn.innerText = "⏳";
        
        try {
            await addDoc(collection(db, "messages"), {
                clientId: currentClientData.uid,
                clientName: currentClientData.name,
                sender: 'client',
                text: text,
                timestamp: Date.now()
            });
            btn.innerText = "➤";
            instantDiv.classList.remove("opacity-70", "bg-orange-400");
            instantDiv.classList.add("bg-orange-500");
        } catch(error) {
            btn.innerText = "➤";
            instantDiv.innerText = "❌ Failed to send";
            instantDiv.classList.add("bg-red-500");
            input.value = text;
        }
    };
    document.getElementById("chat-send-btn")?.addEventListener("click", sendMsg);
    document.getElementById("chat-input")?.addEventListener("keypress", (e) => { if(e.key === 'Enter') sendMsg(); });

    function loadRealtimeMessages() {
        if(chatUnsubscribe) chatUnsubscribe();
        const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
        
        chatUnsubscribe = onSnapshot(q, (snapshot) => {
            const chatBox = document.getElementById("chat-messages");
            if(!chatBox) return;
            chatBox.innerHTML = "";
            let hasMessages = false;
            
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if(data.clientId === currentClientData.uid) {
                    hasMessages = true;
                    const isClient = data.sender === 'client';
                    const div = document.createElement("div");
                    div.className = `max-w-[85%] p-3 rounded-2xl text-sm ${isClient ? 'bg-orange-500 text-white self-end rounded-br-none shadow-sm' : 'bg-white text-gray-800 self-start rounded-bl-none shadow-md border border-gray-100 font-medium'}`;
                    div.innerText = data.text;
                    chatBox.appendChild(div);
                }
            });
            
            if(!hasMessages) chatBox.innerHTML = `<p class="text-center text-gray-500 text-sm mt-10">Say hi to Abidur Rahman Joy! 👋</p>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        });
    }
}
