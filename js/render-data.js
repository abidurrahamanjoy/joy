import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, orderBy, query, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let currentClientData = null;
let chatUnsubscribe = null;

async function renderWebsiteData() {
    
    // 1. Settings & Hero Data
    try {
        const setSnap = await getDoc(doc(db, "siteData", "settings"));
        if(setSnap.exists() && setSnap.data().maintenanceMode) { 
            document.body.innerHTML = `<div class="min-h-screen flex items-center justify-center bg-[#1c325b] text-white"><h1 class="text-3xl font-bold">Maintenance Mode</h1></div>`; 
            return; 
        }
        
        const heroSnap = await getDoc(doc(db, "siteData", "hero"));
        if (heroSnap.exists()) {
            const data = heroSnap.data();
            if(document.getElementById("dynamic-hero-badge") && data.badge) document.getElementById("dynamic-hero-badge").innerText = data.badge;
            if(document.getElementById("dynamic-hero-name") && data.name) document.getElementById("dynamic-hero-name").innerText = data.name;
            if(document.getElementById("dynamic-hero-desc") && data.desc) document.getElementById("dynamic-hero-desc").innerText = data.desc;
            
            // Hero Image & About Image
            if(document.getElementById("dynamic-hero-img") && data.imageUrl) document.getElementById("dynamic-hero-img").src = data.imageUrl;
            if(document.getElementById("dynamic-about-img") && data.imageUrl) document.getElementById("dynamic-about-img").src = data.imageUrl;
        }
    } catch(e) { console.log("Hero Error:", e); }

    // 2. Render Services (Using pure grid without restricted max-widths)
    try {
        const srvSnap = await getDocs(query(collection(db, "services"), orderBy("timestamp", "asc")));
        if(!srvSnap.empty && document.getElementById("dynamic-srv-container")) {
            let srvHtml = '';
            srvSnap.forEach(doc => { 
                if(doc.data().isVisible !== false) {
                    srvHtml += `
                        <div class="bg-white rounded-[2rem] overflow-hidden shadow-xl flex flex-col w-full relative group transform transition hover:-translate-y-2 text-left border border-gray-100">
                            <div class="relative h-56 bg-gray-100 rounded-t-[2rem] overflow-hidden">
                                <img src="https://via.placeholder.com/400x300" class="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-500" alt="Service">
                                <div class="absolute bottom-[-20px] left-[-10%] w-[120%] h-[40px] bg-white rounded-t-[50%] z-10"></div>
                                <div class="absolute bottom-[5px] left-6 w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#f48220] shadow-md z-20 border-2 border-[#fff7f0]">
                                    <i class="fas fa-layer-group text-2xl"></i>
                                </div>
                            </div>
                            <div class="px-8 pt-6 pb-6 flex-1 flex flex-col">
                                <h4 class="font-extrabold text-[#1c325b] text-xl mb-3">${doc.data().title}</h4>
                                <p class="text-sm text-gray-500 font-medium line-clamp-3 mb-6">${doc.data().desc}</p>
                                <div class="border-t border-gray-100 pt-4 grid grid-cols-3 gap-2 mt-auto text-center">
                                    <div><div class="text-[10px] text-gray-400 font-bold uppercase">Quality</div><div class="text-xs font-extrabold text-[#1c325b] mt-1">Premium</div></div>
                                    <div class="border-l border-gray-100"><div class="text-[10px] text-gray-400 font-bold uppercase">Target</div><div class="text-xs font-extrabold text-[#1c325b] mt-1">Global</div></div>
                                    <div class="border-l border-gray-100"><div class="text-[10px] text-gray-400 font-bold uppercase">Time</div><div class="text-xs font-extrabold text-[#1c325b] mt-1">On-Time</div></div>
                                </div>
                            </div>
                        </div>`; 
                }
            });
            document.getElementById("dynamic-srv-container").innerHTML = srvHtml;
        }
    } catch(e) { console.log("Services Error:", e); }

    // 3. Render Experience
    try {
        const expSnap = await getDocs(query(collection(db, "experience"), orderBy("timestamp", "asc")));
        if(!expSnap.empty && document.getElementById("dynamic-exp-container")) {
            let expHtml = '';
            expSnap.forEach(doc => { 
                expHtml += `
                    <div class="bg-white rounded-3xl p-5 shadow-lg border border-gray-100 group cursor-pointer flex flex-col w-full">
                        <div class="overflow-hidden rounded-2xl mb-4 h-48 w-full">
                            <img src="${doc.data().img || 'https://via.placeholder.com/300x200'}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt="Work">
                        </div>
                        <h4 class="font-bold text-[#1c325b] text-lg mb-2">${doc.data().title}</h4>
                        <p class="text-sm text-gray-500 line-clamp-2 mb-4">${doc.data().desc}</p>
                    </div>`;
            });
            document.getElementById("dynamic-exp-container").innerHTML = expHtml;
        }
    } catch(e) { console.log("Exp Error:", e); }

    // 4. Render FAQ
    try {
        const faqSnap = await getDocs(query(collection(db, "faq"), orderBy("timestamp", "asc")));
        if(!faqSnap.empty && document.getElementById("dynamic-faq-container")) {
            let faqHtml = '';
            faqSnap.forEach(doc => { 
                faqHtml += `
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition w-full">
                        <h4 class="font-bold text-[#1c325b] text-lg mb-2 flex items-start gap-2">
                            <i class="fas fa-question-circle text-[#f48220] mt-1"></i> ${doc.data().question}
                        </h4>
                        <p class="text-sm text-gray-500 leading-relaxed ml-7">${doc.data().answer}</p>
                    </div>`;
            });
            document.getElementById("dynamic-faq-container").innerHTML = faqHtml;
        }
    } catch(e) { console.log("FAQ Error:", e); }

    // 5. Contacts Setup
    try {
        const contactSnap = await getDoc(doc(db, "siteData", "contact"));
        if (contactSnap.exists()) {
            const cData = contactSnap.data();
            setTimeout(() => {
                if(cData.phone) {
                    const waLink = `https://wa.me/${cData.phone.replace(/[^0-9]/g, '')}`;
                    document.querySelectorAll('.dynamic-phone-link').forEach(link => { link.href = waLink; });
                    document.querySelectorAll('.dynamic-phone-text').forEach(text => { text.innerText = cData.phone; });
                }
                if(cData.fb && document.getElementById("dyn-fb")) document.getElementById("dyn-fb").href = cData.fb;
                if(cData.linkedin && document.getElementById("dyn-linkedin")) document.getElementById("dyn-linkedin").href = cData.linkedin;
            }, 1000);
        }
    } catch(e) {}

    setupFloatingUI();
}

const domChecker = setInterval(() => {
    if (document.getElementById("dynamic-hero-name")) {
        clearInterval(domChecker);
        renderWebsiteData();
    }
}, 200);
setTimeout(() => clearInterval(domChecker), 8000);

// FLOATING UI & CHAT LOGIC
function setupFloatingUI() {
    document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
        const mMenu = document.getElementById("mobile-menu-dropdown");
        if(mMenu) mMenu.classList.toggle("hidden");
    });
    document.querySelectorAll("#mobile-menu-dropdown a").forEach(link => {
        link.addEventListener("click", () => {
            document.getElementById("mobile-menu-dropdown")?.classList.add("hidden");
        });
    });

    const toggleChat = () => {
        const c = document.getElementById("glass-chat");
        if(c && c.classList.contains("hidden")) {
            c.classList.remove("hidden"); setTimeout(() => c.classList.remove("opacity-0"), 10);
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

    document.getElementById("chat-login-btn")?.addEventListener("click", () => {
        const name = document.getElementById("chat-name")?.value.trim();
        const errBox = document.getElementById("chat-auth-err");
        if(!name) { errBox.innerText = "Please enter your name!"; errBox.classList.remove("hidden"); return; }
        
        const uniqueId = "client_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
        currentClientData = { uid: uniqueId, name: name };
        localStorage.setItem("joy_chat_session", JSON.stringify(currentClientData)); 
        checkChatSession();
    });

    const sendMsg = async () => {
        const input = document.getElementById("chat-input");
        const btn = document.getElementById("chat-send-btn");
        const text = input.value.trim();
        if(!text || !currentClientData) return;
        
        const chatBox = document.getElementById("chat-messages");
        const instantDiv = document.createElement("div");
        instantDiv.className = "max-w-[85%] p-3 rounded-2xl text-sm bg-[#f48220] text-white self-end rounded-br-none shadow-sm opacity-70"; 
        instantDiv.innerText = text;
        
        const emptyText = chatBox.querySelector("p.text-gray-500");
        if (emptyText) emptyText.remove();
        
        chatBox.appendChild(instantDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        input.value = "";
        btn.innerHTML = "<i class='fas fa-spinner fa-spin text-sm'></i>";
        
        try {
            await addDoc(collection(db, "messages"), {
                clientId: currentClientData.uid,
                clientName: currentClientData.name,
                sender: 'client',
                text: text,
                timestamp: Date.now()
            });
            btn.innerHTML = "<i class='fas fa-paper-plane'></i>";
            instantDiv.classList.remove("opacity-70");
        } catch(error) {
            btn.innerHTML = "<i class='fas fa-paper-plane'></i>";
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
                    div.className = `max-w-[85%] p-3 rounded-2xl text-sm ${isClient ? 'bg-[#f48220] text-white self-end rounded-br-none shadow-sm' : 'bg-white text-[#1c325b] self-start rounded-bl-none shadow-sm border border-gray-100 font-medium'}`;
                    div.innerText = data.text;
                    chatBox.appendChild(div);
                }
            });
            
            if(!hasMessages) chatBox.innerHTML = `<p class="text-center text-gray-400 text-sm mt-10">Say hi! 👋</p>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        });
    }
}
