import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, orderBy, query, setDoc, increment, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let currentClientData = null;
let chatUnsubscribe = null;

async function renderWebsiteData() {
    
    // 1. Settings & Hero
    try {
        const setSnap = await getDoc(doc(db, "siteData", "settings"));
        if(setSnap.exists() && setSnap.data().maintenanceMode) { 
            document.body.innerHTML = `<div class="min-h-screen flex items-center justify-center bg-gray-900 text-white"><h1 class="text-4xl font-bold">Under Construction</h1></div>`; 
            return; 
        }
        
        const heroSnap = await getDoc(doc(db, "siteData", "hero"));
        if (heroSnap.exists()) {
            const data = heroSnap.data();
            if(document.getElementById("dynamic-hero-badge")) document.getElementById("dynamic-hero-badge").innerText = data.badge || 'Trial Nanny Free';
            if(document.getElementById("dynamic-hero-name")) document.getElementById("dynamic-hero-name").innerText = data.name || 'Abidur Rahman Joy';
            if(document.getElementById("dynamic-hero-desc")) document.getElementById("dynamic-hero-desc").innerText = data.desc || '';
            if(document.getElementById("dynamic-hero-img") && data.imageUrl) document.getElementById("dynamic-hero-img").src = data.imageUrl;
        }
    } catch(e) { console.log("Hero Error:", e); }

    // 2. Services (Cards matching the Image UI)
    try {
        const srvSnap = await getDocs(query(collection(db, "services"), orderBy("timestamp", "asc")));
        if(!srvSnap.empty && document.getElementById("dynamic-srv-container")) {
            let srvHtml = '';
            srvSnap.forEach(doc => { 
                if(doc.data().isVisible) {
                    srvHtml += `
                        <div class="bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col transform hover:-translate-y-2 transition duration-300 group z-20">
                            <!-- Top Half: Icon and Wavy divider -->
                            <div class="h-48 bg-[#fff8f0] relative flex items-center justify-center">
                                <div class="text-6xl group-hover:scale-110 transition-transform duration-500 z-10">💻</div>
                                <!-- Wavy Cutout matching the image -->
                                <div class="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
                                    <svg class="relative block w-full h-[30px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                                        <path d="M0,0 Q60,120 120,0 Q180,120 240,0 Q300,120 360,0 Q420,120 480,0 Q540,120 600,0 Q660,120 720,0 Q780,120 840,0 Q900,120 960,0 Q1020,120 1080,0 Q1140,120 1200,0 V120 H0 Z" fill="#ffffff"></path>
                                    </svg>
                                </div>
                            </div>
                            <!-- Bottom Half: Details -->
                            <div class="p-8 flex-1 flex flex-col items-center text-center bg-white z-20">
                                <h4 class="font-extrabold text-xl text-gray-800 mb-3">${doc.data().title}</h4>
                                <p class="text-sm text-gray-500 font-medium line-clamp-3 mb-6">${doc.data().desc}</p>
                            </div>
                        </div>`; 
                }
            });
            document.getElementById("dynamic-srv-container").innerHTML = srvHtml;
        }
    } catch(e) { console.log("Services Error:", e); }

    // 3. Contacts Setup
    try {
        const contactSnap = await getDoc(doc(db, "siteData", "contact"));
        if (contactSnap.exists()) {
            const cData = contactSnap.data();
            setTimeout(() => {
                if(cData.phone) {
                    const waLink = `https://wa.me/${cData.phone.replace(/[^0-9]/g, '')}`;
                    document.querySelectorAll('.dynamic-phone-link').forEach(link => { link.href = waLink; });
                    document.querySelectorAll('.dynamic-phone-text').forEach(text => { text.innerText = '📞 ' + cData.phone; });
                }
                if(cData.fb && document.getElementById("dyn-fb")) document.getElementById("dyn-fb").href = cData.fb;
                if(cData.linkedin && document.getElementById("dyn-linkedin")) document.getElementById("dyn-linkedin").href = cData.linkedin;
            }, 1000);
        }
    } catch(e) {}

    // 4. Setup Floating UI (Menu & Chat)
    setupFloatingUI();
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
    // Menu Toggle
    document.getElementById("fab-menu")?.addEventListener("click", () => {
        const m = document.getElementById("glass-menu");
        const c = document.getElementById("glass-chat");
        if(m && m.classList.contains("hidden")) {
            m.classList.remove("hidden"); setTimeout(() => m.classList.remove("opacity-0"), 10);
            if(c) c.classList.add("hidden", "opacity-0");
        } else if (m) {
            m.classList.add("opacity-0"); setTimeout(() => m.classList.add("hidden"), 300);
        }
    });

    document.querySelectorAll(".menu-link").forEach(l => l.addEventListener("click", () => {
        const m = document.getElementById("glass-menu");
        if(m) { m.classList.add("opacity-0"); setTimeout(() => m.classList.add("hidden"), 300); }
    }));

    // Chat Toggle
    const toggleChat = () => {
        const c = document.getElementById("glass-chat");
        const m = document.getElementById("glass-menu");
        if(c && c.classList.contains("hidden")) {
            c.classList.remove("hidden"); setTimeout(() => c.classList.remove("opacity-0"), 10);
            if(m) m.classList.add("hidden", "opacity-0");
            checkChatSession(); 
        } else if (c) {
            c.classList.add("opacity-0"); setTimeout(() => c.classList.add("hidden"), 300);
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
            document.getElementById("chat-box-screen")?.classList.add("flex");
            loadRealtimeMessages();
        } else {
            document.getElementById("chat-auth-screen")?.classList.remove("hidden");
            document.getElementById("chat-box-screen")?.classList.add("hidden");
            document.getElementById("chat-box-screen")?.classList.remove("flex");
        }
    }

    // Chat Login
    document.getElementById("chat-login-btn")?.addEventListener("click", () => {
        const name = document.getElementById("chat-name")?.value.trim();
        const errBox = document.getElementById("chat-auth-err");
        if(!name) { errBox.innerText = "Please enter your name!"; errBox.classList.remove("hidden"); return; }
        
        const uniqueId = "client_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
        currentClientData = { uid: uniqueId, name: name };
        localStorage.setItem("joy_chat_session", JSON.stringify(currentClientData)); 
        
        checkChatSession();
    });

    // Send Message
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

    // Load Messages
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
                    div.className = `max-w-[85%] p-3 rounded-2xl text-sm ${isClient ? 'bg-orange-500 text-white self-end rounded-br-none shadow-sm' : 'bg-white text-gray-800 self-start rounded-bl-none shadow-md border border-gray-200 font-medium'}`;
                    div.innerText = data.text;
                    chatBox.appendChild(div);
                }
            });
            
            if(!hasMessages) chatBox.innerHTML = `<p class="text-center text-gray-400 text-sm mt-10">Say hi! 👋</p>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        });
    }
}
