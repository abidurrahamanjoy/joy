import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, orderBy, query, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let currentClientData = null;
let chatUnsubscribe = null;

async function applySEO() {
    try {
        const seoSnap = await getDoc(doc(db, "siteData", "seo"));
        if (seoSnap.exists()) {
            const seo = seoSnap.data();
            if (seo.title) {
                document.title = seo.title;
                document.getElementById("og-title")?.setAttribute("content", seo.title);
            }
            if (seo.desc) {
                document.getElementById("meta-description")?.setAttribute("content", seo.desc);
                document.getElementById("og-description")?.setAttribute("content", seo.desc);
            }
            if (seo.keywords) {
                document.getElementById("meta-keywords")?.setAttribute("content", seo.keywords);
            }
        }
    } catch (e) { console.log("SEO Error:", e); }
}

async function applyBranding() {
    try {
        const brandSnap = await getDoc(doc(db, "siteData", "branding"));
        if (brandSnap.exists()) {
            const b = brandSnap.data();
            if (b.name) {
                document.querySelectorAll("#site-logo-text, #foot-logo-text").forEach(el => { el.innerText = b.name; });
            }
            if (b.logoUrl) {
                document.querySelectorAll("#site-logo-img, #foot-logo-img").forEach(img => {
                    img.src = b.logoUrl;
                    img.classList.remove("hidden");
                });
                document.querySelectorAll("#site-logo-icon, #foot-logo-icon").forEach(el => el.classList.add("hidden"));
            }
        }
    } catch (e) { console.log("Branding Error:", e); }
}

async function applyPageContent() {
    try {
        const headerSnap = await getDoc(doc(db, "siteData", "header"));
        if (headerSnap.exists()) {
            const h = headerSnap.data();
            if (h.topbarLocation && document.getElementById("topbar-location")) document.getElementById("topbar-location").innerText = h.topbarLocation;
            if (h.topbarEmail && document.getElementById("topbar-email")) document.getElementById("topbar-email").innerText = h.topbarEmail;
        }
    } catch (e) { console.log("Header Content Error:", e); }

    try {
        const aboutSnap = await getDoc(doc(db, "siteData", "about"));
        if (aboutSnap.exists()) {
            const a = aboutSnap.data();
            const map = {
                "about-eyebrow": a.eyebrow, "about-title": a.title, "about-paragraph": a.paragraph,
                "about-badge-title": a.badgeTitle, "about-badge-desc": a.badgeDesc,
                "about-feat1-title": a.feat1Title, "about-feat1-desc": a.feat1Desc,
                "about-feat2-title": a.feat2Title, "about-feat2-desc": a.feat2Desc,
                "about-feat3-title": a.feat3Title, "about-feat3-desc": a.feat3Desc,
                "about-feat4-title": a.feat4Title
            };
            Object.entries(map).forEach(([id, val]) => { if (val && document.getElementById(id)) document.getElementById(id).innerText = val; });
        }
    } catch (e) { console.log("About Content Error:", e); }

    try {
        const secSnap = await getDoc(doc(db, "siteData", "sections"));
        if (secSnap.exists()) {
            const s = secSnap.data();
            const map = {
                "services-eyebrow": s.servicesEyebrow, "services-title": s.servicesTitle,
                "edu-eyebrow": s.eduEyebrow, "edu-title": s.eduTitle,
                "cert-heading-title": s.certTitle, "cert-heading-desc": s.certDesc,
                "portfolio-title": s.portfolioTitle
            };
            Object.entries(map).forEach(([id, val]) => { if (val && document.getElementById(id)) document.getElementById(id).innerText = val; });
        }
    } catch (e) { console.log("Sections Content Error:", e); }

    try {
        const ctaSnap = await getDoc(doc(db, "siteData", "contactCta"));
        if (ctaSnap.exists()) {
            const c = ctaSnap.data();
            if (c.title && document.getElementById("contact-cta-title")) document.getElementById("contact-cta-title").innerText = c.title;
            if (c.subtitle && document.getElementById("contact-cta-subtitle")) document.getElementById("contact-cta-subtitle").innerText = c.subtitle;
        }
    } catch (e) { console.log("Contact CTA Content Error:", e); }

    try {
        const footSnap = await getDoc(doc(db, "siteData", "footer"));
        if (footSnap.exists()) {
            const f = footSnap.data();
            if (f.copyright && document.getElementById("footer-copyright")) document.getElementById("footer-copyright").innerText = f.copyright;
        }
    } catch (e) { console.log("Footer Content Error:", e); }
}

async function renderWebsiteData() {
    await applySEO();
    await applyBranding();
    await applyPageContent();

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
            
            if(document.getElementById("dynamic-hero-img") && data.imageUrl) document.getElementById("dynamic-hero-img").src = data.imageUrl;
            if(document.getElementById("dynamic-about-img") && data.imageUrl) document.getElementById("dynamic-about-img").src = data.imageUrl;

            const heroSection = document.getElementById("hero-section");
            if(heroSection && data.bgColor) heroSection.style.backgroundColor = data.bgColor;

            const heroTextCol = document.getElementById("hero-text-col");
            const heroImageCol = document.getElementById("hero-image-col");
            if(heroTextCol && heroImageCol) {
                if(data.layout === "left") {
                    heroTextCol.classList.remove("md:order-1"); heroTextCol.classList.add("md:order-2");
                    heroImageCol.classList.remove("md:order-2"); heroImageCol.classList.add("md:order-1");
                } else {
                    heroTextCol.classList.remove("md:order-2"); heroTextCol.classList.add("md:order-1");
                    heroImageCol.classList.remove("md:order-1"); heroImageCol.classList.add("md:order-2");
                }
            }
        }
    } catch(e) { console.log("Hero Error:", e); }

    try {
        const srvSnap = await getDocs(query(collection(db, "services"), orderBy("timestamp", "asc")));
        if(!srvSnap.empty && document.getElementById("dynamic-srv-container")) {
            let srvHtml = '';
            srvSnap.forEach(doc => { 
                if(doc.data().isVisible !== false) {
                    const imgSrc = doc.data().img || 'https://via.placeholder.com/400x300';
                    srvHtml += `
                        <div class="bg-white rounded-[2rem] overflow-hidden shadow-xl flex flex-col w-full relative group transform transition hover:-translate-y-2 text-left border border-gray-100">
                            <div class="relative h-56 bg-gray-100 rounded-t-[2rem] overflow-hidden">
                                <img src="${imgSrc}" class="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-500" alt="Service">
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

    try {
        const eduSnap = await getDocs(query(collection(db, "education"), orderBy("timestamp", "asc")));
        if(!eduSnap.empty && document.getElementById("dynamic-edu-container")) {
            let eduHtml = '';
            eduSnap.forEach(doc => {
                const d = doc.data();
                if(d.isVisible !== false) {
                    eduHtml += `
                        <div class="bg-white p-8 rounded-3xl shadow-lg border border-orange-100 hover:-translate-y-2 transition duration-300">
                            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-6 text-xl">${d.icon || '🎓'}</div>
                            <h3 class="text-xl font-bold text-gray-900 mb-2">${d.title}</h3>
                            <p class="text-gray-600">${d.desc}</p>
                        </div>`;
                }
            });
            if(eduHtml) document.getElementById("dynamic-edu-container").innerHTML = eduHtml;
        }
    } catch(e) { console.log("Education Error:", e); }

    try {
        const certSnap = await getDocs(query(collection(db, "certificates"), orderBy("timestamp", "asc")));
        if(!certSnap.empty && document.getElementById("cert-track")) {
            let certHtml = '';
            certSnap.forEach(doc => {
                const d = doc.data();
                if(d.isVisible !== false) {
                    certHtml += `
                        <div class="cert-card shrink-0 w-64 md:w-72 bg-white rounded-2xl shadow-lg overflow-hidden" data-cat="${d.category || 'dev'}">
                            <img src="${d.img || 'https://via.placeholder.com/400x260?text=Certificate'}" class="w-full h-40 object-cover" alt="${d.title || 'Certificate'}">
                            <div class="p-4"><p class="font-bold text-navy text-sm">${d.title || ''}</p><p class="text-xs text-gray-500">${d.subtitle || ''}</p></div>
                        </div>`;
                }
            });
            if(certHtml) document.getElementById("cert-track").innerHTML = certHtml;
        }
    } catch(e) { console.log("Certificates Error:", e); }

    try {
        const custSnap = await getDocs(query(collection(db, "customSections"), orderBy("order", "asc")));
        if(!custSnap.empty && document.getElementById("custom-sections-container")) {
            let custHtml = '';
            custSnap.forEach(doc => {
                const d = doc.data();
                if(d.isVisible !== false) {
                    custHtml += `
                        <section class="max-w-6xl mx-auto px-6 py-16 fade-in-up">
                            <div class="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden md:flex items-center">
                                ${d.img ? `<div class="md:w-1/2 h-64 md:h-80"><img src="${d.img}" class="w-full h-full object-cover" alt="${d.title}"></div>` : ''}
                                <div class="p-8 md:p-10 ${d.img ? 'md:w-1/2' : 'w-full'}">
                                    <h2 class="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4">${d.title}</h2>
                                    <p class="text-gray-600 leading-relaxed whitespace-pre-line">${d.desc}</p>
                                </div>
                            </div>
                        </section>`;
                }
            });
            document.getElementById("custom-sections-container").innerHTML = custHtml;
        }
    } catch(e) { console.log("Custom Sections Error:", e); }

    try {
        const expSnap = await getDocs(query(collection(db, "experience"), orderBy("timestamp", "asc")));
        if(!expSnap.empty && document.getElementById("dynamic-exp-container")) {
            let expHtml = '';
            expSnap.forEach(doc => { 
    if(doc.data().isVisible === false) return;
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
               if(cData.fb) {
    document.querySelectorAll('#dyn-fb, #top-fb, #foot-fb').forEach(a => a.href = cData.fb);
}
if(cData.linkedin) {
    document.querySelectorAll('#dyn-linkedin, #top-linkedin, #foot-linkedin').forEach(a => a.href = cData.linkedin);
}
            }, 500);
        }
    } catch(e) {}
}

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
            btn.innerHTML = "➤";
            instantDiv.classList.remove("opacity-70");
        } catch(error) {
            btn.innerHTML = "➤";
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

function setupCertificateCarousel() {
    const track = document.getElementById("cert-track");
    const prevBtn = document.getElementById("cert-prev");
    const nextBtn = document.getElementById("cert-next");
    const filterBtns = document.querySelectorAll(".cert-filter-btn");
    if(!track) return;

    prevBtn?.addEventListener("click", () => track.scrollBy({ left: -300, behavior: "smooth" }));
    nextBtn?.addEventListener("click", () => track.scrollBy({ left: 300, behavior: "smooth" }));

    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => {
                b.classList.remove("active", "bg-white", "text-orange");
                b.classList.add("bg-white/20", "text-white");
            });
            btn.classList.add("active", "bg-white", "text-orange");
            btn.classList.remove("bg-white/20", "text-white");

            const filter = btn.dataset.filter;
            document.querySelectorAll(".cert-card").forEach(card => {
                card.style.display = (filter === "all" || card.dataset.cat === filter) ? "" : "none";
            });
        });
    });
}

document.addEventListener("componentsLoaded", () => {
    setupFloatingUI();
    setupCertificateCarousel();
    renderWebsiteData();
});
