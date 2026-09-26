import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, orderBy, query, setDoc, increment, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

async function renderWebsiteData() {
    
    // 1. Maintenance & Meta
    try {
        const setSnap = await getDoc(doc(db, "siteData", "settings"));
        if(setSnap.exists() && setSnap.data().maintenanceMode) { 
            document.body.innerHTML = `<div class="min-h-screen flex items-center justify-center bg-gray-900 text-white"><h1 class="text-4xl font-bold">Under Construction</h1></div>`; 
            return; 
        }
    } catch(e) { console.log("Settings Error:", e); }

    // 2. Analytics
    try { await setDoc(doc(db, "analytics", "stats"), { views: increment(1) }, { merge: true }); } catch(e){}

    // 3. Render Hero Section
    try {
        const heroSnap = await getDoc(doc(db, "siteData", "hero"));
        if (heroSnap.exists()) {
            const data = heroSnap.data();
            if(document.getElementById("dynamic-hero-badge")) document.getElementById("dynamic-hero-badge").innerText = data.badge || 'Expert Services';
            
            // Name handling (Ensuring it doesn't overwrite the static "Welcome to" part in HTML if we had it, but here we replace the span)
            if(document.getElementById("dynamic-hero-name")) {
                document.getElementById("dynamic-hero-name").innerText = data.name || 'Abidur Rahman Joy';
            }
            
            if(document.getElementById("dynamic-hero-desc")) document.getElementById("dynamic-hero-desc").innerText = data.desc || '';
            if(document.getElementById("dynamic-hero-img") && data.imageUrl) document.getElementById("dynamic-hero-img").src = data.imageUrl;
        }
    } catch(e) { console.log("Hero Error:", e); }

    // 4. Render Services (Perfect Match for Reference UI)
    try {
        const srvSnap = await getDocs(query(collection(db, "services"), orderBy("timestamp", "asc")));
        if(!srvSnap.empty && document.getElementById("dynamic-srv-container")) {
            let srvHtml = '';
            srvSnap.forEach(doc => { 
                if(doc.data().isVisible) {
                    srvHtml += `
                        <div class="bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col transform hover:-translate-y-2 transition duration-300 group z-20">
                            <!-- Top Half: Image/Icon with Wave Mask -->
                            <div class="h-48 bg-[#fff7f0] relative flex items-center justify-center">
                                <div class="text-6xl group-hover:scale-110 transition-transform duration-500 z-10">💻</div>
                                <!-- Inner White Wave matching the reference image bottom mask -->
                                <div class="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
                                    <svg class="relative block w-full h-[40px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                                        <path d="M0,0V120H1200V0C1014.28,97.77,816.57,110.15,595.6,83.47,381.18,57.59,190.49,67.62,0,0Z" fill="#ffffff"></path>
                                    </svg>
                                </div>
                            </div>
                            <!-- Bottom Half: Text Content -->
                            <div class="p-8 flex-1 flex flex-col items-center text-center bg-white z-20">
                                <h4 class="font-extrabold text-xl text-gray-800 mb-3">${doc.data().title}</h4>
                                <p class="text-sm text-gray-500 font-medium line-clamp-3 mb-6">${doc.data().desc}</p>
                                <div class="mt-auto">
                                    <button class="px-8 py-2 bg-[#fff7f0] text-orange-500 rounded-full font-bold text-sm hover:bg-orange-500 hover:text-white transition shadow-sm border border-orange-100">Details</button>
                                </div>
                            </div>
                        </div>`; 
                }
            });
            document.getElementById("dynamic-srv-container").innerHTML = srvHtml;
        }
    } catch(e) { console.log("Services Error:", e); }

    // 5. Render Contacts for Top Bar
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
                        document.querySelectorAll('.dynamic-phone-text').forEach(text => { text.innerText = '📞 ' + cData.phone; });
                    }
                    if(cData.fb && fbElem) fbElem.href = cData.fb;
                    if(cData.linkedin && document.getElementById("dyn-linkedin")) document.getElementById("dyn-linkedin").href = cData.linkedin;
                }
            }, 300);
            setTimeout(() => clearInterval(linkTimer), 5000);
        }
    } catch(e) { console.log("Contact Error:", e); }
}

// DOM Loader
const domChecker = setInterval(() => {
    if (document.getElementById("dynamic-hero-name")) {
        clearInterval(domChecker);
        renderWebsiteData();
    }
}, 200);
setTimeout(() => clearInterval(domChecker), 8000);
