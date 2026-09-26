import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, orderBy, query, setDoc, increment, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let currentClientData = null;
let chatUnsubscribe = null;

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
                p.className = "bg-orange-600 text-white text-center py-2 font-bold z-50 animate-pulse relative"; 
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
        }
    } catch(e) { console.log("Hero Error:", e); }

    // 4. Render Services (UI exactly matching the reference card style)
    try {
        const srvSnap = await getDocs(query(collection(db, "services"), orderBy("timestamp", "asc")));
        if(!srvSnap.empty && document.getElementById("dynamic-srv-container")) {
            let srvHtml = '';
            srvSnap.forEach(doc => { 
                if(doc.data().isVisible) {
                    srvHtml += `
                        <div class="bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col transform hover:-translate-y-3 transition duration-300 group z-20">
                            <!-- Top Half -->
                            <div class="h-40 md:h-48 bg-[#fff7f0] relative flex items-center justify-center">
                                <div class="text-6xl group-hover:scale-110 transition-transform duration-500 z-10">💻</div>
                                <!-- Inner Wave -->
                                <div class="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
                                    <svg class="relative block w-full h-[30px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                                        <path d="M0,0V120H1200V0C1014.28,97.77,816.57,110.15,595.6,83.47,381.18,57.59,190.49,67.62,0,0Z" fill="#ffffff"></path>
                                    </svg>
                                </div>
                            </div>
                            <!-- Bottom Half -->
                            <div class="p-8 flex-1 flex flex-col text-center bg-white z-20">
                                <h4 class="font-extrabold text-xl text-gray-800 mb-3">${doc.data().title}</h4>
                                <p class="text-sm text-gray-500 font-medium line-clamp-3 mb-6">${doc.data().desc}</p>
                                <div class="mt-auto">
                                    <button class="px-6 py-2 bg-orange-50 text-orange-500 rounded-full font-bold text-sm hover:bg-orange-500 hover:text-white transition">Read More</button>
                                </div>
                            </div>
                        </div>`; 
                }
            });
            document.getElementById("dynamic-srv-container").innerHTML = srvHtml;
        }
    } catch(e) { console.log("Services Error:", e); }

    // 5. Render Contacts
    try {
        const contactSnap = await getDoc(doc(db, "siteData", "contact"));
        if (contactSnap.exists()) {
            const cData = contactSnap.data();
            const linkTimer = setInterval(() => {
                const fbElem = document.getElementById("dyn-fb");
                const phElems = document.querySelectorAll('.dynamic-phone-link');
                if (fbElem || phElems.length > 0) {
                    clearInterval(linkTimer);
                    if(cData.phone) {
                        const waLink = `https://wa.me/${cData.phone.replace(/[^0-9]/g, '')}`;
                        phElems.forEach(link => { link.href = waLink; });
                        document.querySelectorAll('.dynamic-phone-text').forEach(text => { text.innerText = cData.phone; });
                    }
                    if(cData.fb && fbElem) fbElem.href = cData.fb;
                    if(cData.linkedin && document.getElementById("dyn-linkedin")) document.getElementById("dyn-linkedin").href = cData.linkedin;
                }
            }, 300);
            setTimeout(() => clearInterval(linkTimer), 8000);
        }
    } catch(e) { console.log("Contact Error:", e); }

    // 6. Floating UI Setup
    setupFloatingUI();

    // 7. Welcome Popup (24h logic)
    setTimeout(async () => {
        const lastSeen = localStorage.getItem('joy_popup_seen');
        if (!lastSeen || Date.now() - lastSeen > 86400000) {
            try {
                const popSnap = await getDoc(doc(db, "siteData", "popup"));
                if(popSnap.exists()) {
                    const p = popSnap.data();
                    if(p.title && document.getElementById("popup-title")) document.getElementById("popup-title").innerText = p.title;
                    if(p.desc && document.getElementById("popup-desc")) document.getElementById("popup-desc").innerText = p.desc;
                    if(p.imageUrl && document.getElementById("popup-img")) document.getElementById("popup-img").src = p.imageUrl;
                    
                    const overlay = document.getElementById('welcome-popup-overlay');
                    if(overlay && (p.title || p.desc || p.imageUrl)) { 
                        overlay.classList.remove('hidden'); 
                        setTimeout(() => overlay.classList.remove('opacity-0'), 50);
                        const closePop = () => { 
                            overlay.classList.add('opacity-0'); 
                            setTimeout(() => overlay.classList.add('hidden'), 500); 
                            localStorage.setItem('joy_popup_seen', Date.now()); 
                        };
                        document.getElementById('close-popup-btn')?.addEventListener('click', closePop);
                        document.getElementById('popup-action-btn')?.addEventListener('click', closePop);
                    }
                }
            } catch(error) { console.error("Popup Error:", error); }
        }
    }, 2000);
}

// DOM Loader
const domChecker = setInterval(() => {
    if (document.getElementById("dynamic-hero-name")) {
        clearInterval(domChecker);
        renderWebsiteData();
    }
}, 200);
setTimeout(() => clearInterval(domChecker), 8000);

// ==========================================
// FLOATING UI & SMART CHAT LOGIC
// ==========================================
function setupFloatingUI() {
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

    const sendMsg = async () => {
        const input = document.getElementById("chat-input");
        const btn = document.getElementById("chat-send-btn");
        const text = input.value.trim();
        if(!text || !currentClientData) return;
        
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
            
            if(!hasMessages) chatBox.innerHTML = `<p class="text-center text-gray-500 text-sm mt-10">Say hi! 👋</p>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        });
    }
}
