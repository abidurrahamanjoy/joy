import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, orderBy, query, setDoc, increment, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let currentClientData = null;
let chatUnsubscribe = null;

async function renderWebsiteData() {
    // 1. Core Render Functions (Maintenance, Analytics, Hero, Services, Contacts, Popup)
    try {
        const setSnap = await getDoc(doc(db, "siteData", "settings"));
        if(setSnap.exists()) {
            const st = setSnap.data();
            if(st.maintenanceMode) { document.body.innerHTML = `<div class="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white text-center"><h1 class="text-4xl font-bold">Under Construction</h1></div>`; return; }
            if(st.promoShow && st.promoText) { const p = document.createElement('div'); p.className = "bg-orange-600 text-white text-center py-2 font-bold z-50 animate-pulse"; p.innerText = st.promoText; document.body.prepend(p); }
        }
        const seoSnap = await getDoc(doc(db, "siteData", "seo"));
        if(seoSnap.exists()) { const seo = seoSnap.data(); if(seo.title) document.title = seo.title; }
    } catch(e){}

    try { await setDoc(doc(db, "analytics", "stats"), { views: increment(1) }, { merge: true }); } catch(e){}

    try {
        const heroSnap = await getDoc(doc(db, "siteData", "hero"));
        if (heroSnap.exists()) {
            const data = heroSnap.data();
            if(document.getElementById("dynamic-hero-badge")) document.getElementById("dynamic-hero-badge").innerText = data.badge || '';
            if(document.getElementById("dynamic-hero-name")) document.getElementById("dynamic-hero-name").innerText = data.name || '';
            if(document.getElementById("dynamic-hero-desc")) document.getElementById("dynamic-hero-desc").innerText = data.desc || '';
            if(document.getElementById("dynamic-hero-img") && data.imageUrl) document.getElementById("dynamic-hero-img").src = data.imageUrl;
            if(data.bgColor && document.getElementById("hero-section")) document.getElementById("hero-section").style.backgroundColor = data.bgColor;
            if(data.layout === 'left' && document.getElementById("hero-layout")) document.getElementById("hero-layout").classList.add("md:flex-row-reverse");
        }
    } catch(e){}

    try {
        const srvSnap = await getDocs(query(collection(db, "services"), orderBy("timestamp", "asc")));
        if(!srvSnap.empty) {
            let srvHtml = '';
            srvSnap.forEach(doc => { if(doc.data().isVisible) srvHtml += `<div class="glass-effect p-8 rounded-3xl shadow-md border-t-4 border-orange-500 bg-white/60"><h4 class="font-bold text-lg text-orange-700 mb-3">${doc.data().title}</h4><p class="text-sm text-gray-800 font-medium">${doc.data().desc}</p></div>`; });
            if(document.getElementById("dynamic-srv-container")) document.getElementById("dynamic-srv-container").innerHTML = srvHtml;
        }
    } catch(e){}

    try {
        const contactSnap = await getDoc(doc(db, "siteData", "contact"));
        if (contactSnap.exists()) {
            const cData = contactSnap.data();
            document.querySelectorAll('.dynamic-phone-link').forEach(link => { link.href = `https://wa.me/${cData.phone.replace(/[^0-9]/g, '')}`; });
            document.querySelectorAll('.dynamic-phone-text').forEach(text => { text.innerText = cData.phone; });
            if(document.getElementById("dyn-fb") && cData.fb) document.getElementById("dyn-fb").href = cData.fb;
            if(document.getElementById("dyn-linkedin") && cData.linkedin) document.getElementById("dyn-linkedin").href = cData.linkedin;
        }
    } catch(e){}

    setTimeout(async () => {
        const lastSeen = localStorage.getItem('joy_popup_seen');
        if (!lastSeen || Date.now() - lastSeen > 86400000) {
            const popSnap = await getDoc(doc(db, "siteData", "popup"));
            if(popSnap.exists() && document.getElementById("popup-title")) {
                const p = popSnap.data();
                document.getElementById("popup-title").innerText = p.title; document.getElementById("popup-desc").innerText = p.desc;
                if(p.imageUrl) document.getElementById("popup-img").src = p.imageUrl;
                const overlay = document.getElementById('welcome-popup-overlay');
                overlay.classList.remove('hidden'); setTimeout(() => overlay.classList.remove('opacity-0'), 50);
                const closePop = () => { overlay.classList.add('opacity-0'); setTimeout(() => overlay.classList.add('hidden'), 500); localStorage.setItem('joy_popup_seen', Date.now()); };
                document.getElementById('close-popup-btn').addEventListener('click', closePop); document.getElementById('popup-action-btn').addEventListener('click', closePop);
            }
        }
    }, 1500);

    // ==========================================
    // FLOATING UI & SMART CHAT LOGIC
    // ==========================================
    
    // Toggle Menu
    document.getElementById("fab-menu")?.addEventListener("click", () => {
        const m = document.getElementById("glass-menu");
        if(m.classList.contains("hidden")) {
            m.classList.remove("hidden"); setTimeout(() => { m.classList.remove("opacity-0", "translate-y-4"); }, 10);
            document.getElementById("glass-chat").classList.add("hidden", "opacity-0", "translate-y-4");
        } else {
            m.classList.add("opacity-0", "translate-y-4"); setTimeout(() => m.classList.add("hidden"), 300);
        }
    });

    document.querySelectorAll(".menu-link").forEach(l => l.addEventListener("click", () => {
        document.getElementById("glass-menu").classList.add("opacity-0", "translate-y-4"); setTimeout(() => document.getElementById("glass-menu").classList.add("hidden"), 300);
    }));

    // Toggle Chat
    const toggleChat = () => {
        const c = document.getElementById("glass-chat");
        if(c.classList.contains("hidden")) {
            c.classList.remove("hidden"); setTimeout(() => { c.classList.remove("opacity-0", "translate-y-4"); }, 10);
            document.getElementById("glass-menu").classList.add("hidden", "opacity-0", "translate-y-4");
            checkChatSession(); // Check if user already logged in before
        } else {
            c.classList.add("opacity-0", "translate-y-4"); setTimeout(() => c.classList.add("hidden"), 300);
        }
    };
    document.getElementById("fab-chat")?.addEventListener("click", toggleChat);
    document.getElementById("close-chat-btn")?.addEventListener("click", toggleChat);

    // Smart LocalStorage Session Logic
    function checkChatSession() {
        const savedSession = localStorage.getItem("joy_chat_session");
        if(savedSession) {
            currentClientData = JSON.parse(savedSession);
            document.getElementById("chat-auth-screen").classList.add("hidden");
            document.getElementById("chat-box-screen").classList.remove("hidden");
            loadRealtimeMessages();
        } else {
            document.getElementById("chat-auth-screen").classList.remove("hidden");
            document.getElementById("chat-box-screen").classList.add("hidden");
        }
    }

    document.getElementById("chat-login-btn")?.addEventListener("click", () => {
        const name = document.getElementById("chat-name").value.trim();
        const errBox = document.getElementById("chat-auth-err");
        if(!name) { errBox.innerText = "Please enter your name!"; errBox.classList.remove("hidden"); return; }
        
        // Generate a random unique ID for this device
        const uniqueId = "client_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
        
        currentClientData = { uid: uniqueId, name: name };
        localStorage.setItem("joy_chat_session", JSON.stringify(currentClientData)); // Save to memory
        
        document.getElementById("chat-auth-screen").classList.add("hidden");
        document.getElementById("chat-box-screen").classList.remove("hidden");
        loadRealtimeMessages();
    });

    // Send Message
    const sendMsg = async () => {
        const input = document.getElementById("chat-input");
        const text = input.value.trim();
        if(!text || !currentClientData) return;
        input.value = "";
        
        await addDoc(collection(db, "messages"), {
            clientId: currentClientData.uid,
            clientName: currentClientData.name,
            sender: 'client',
            text: text,
            timestamp: Date.now()
        });
    };
    document.getElementById("chat-send-btn")?.addEventListener("click", sendMsg);
    document.getElementById("chat-input")?.addEventListener("keypress", (e) => { if(e.key === 'Enter') sendMsg(); });

    // Load Realtime Messages
    function loadRealtimeMessages() {
        if(chatUnsubscribe) chatUnsubscribe();
        const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
        
        chatUnsubscribe = onSnapshot(q, (snapshot) => {
            const chatBox = document.getElementById("chat-messages");
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
            
            if(!hasMessages) {
                chatBox.innerHTML = `<p class="text-center text-gray-500 text-sm mt-10">Say hi to Abidur Rahman Joy! 👋</p>`;
            }
            chatBox.scrollTop = chatBox.scrollHeight;
        });
    }
}

setTimeout(() => {
    if(typeof loadComponent === 'function') loadComponent('popup-container', 'components/popup.html').then(() => renderWebsiteData());
    else renderWebsiteData();
}, 800);
