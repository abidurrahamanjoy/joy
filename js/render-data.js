import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, orderBy, query, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

async function renderWebsiteData() {
    
    // 1. Check Maintenance Mode & SEO First
    try {
        const setSnap = await getDoc(doc(db, "siteData", "settings"));
        if(setSnap.exists()) {
            const st = setSnap.data();
            // Maintenance Mode Check
            if(st.maintenanceMode) {
                document.body.innerHTML = `<div class="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
                    <span class="text-6xl mb-4">🛠️</span><h1 class="text-4xl font-bold mb-2">Website is under construction</h1>
                    <p class="text-gray-400">We are upgrading our systems. Please check back shortly.</p>
                </div>`;
                return; // Stop rendering everything else
            }
            
            // Promo Bar Injection
            if(st.promoShow && st.promoText) {
                const promo = document.createElement('div');
                promo.className = "bg-orange-600 text-white text-center py-2 font-bold px-4 z-50 relative animate-pulse";
                promo.innerText = st.promoText;
                document.body.prepend(promo);
            }
        }

        const seoSnap = await getDoc(doc(db, "siteData", "seo"));
        if(seoSnap.exists()) {
            const seo = seoSnap.data();
            if(seo.title) document.title = seo.title;
            if(seo.desc) document.querySelector('meta[name="description"]')?.setAttribute("content", seo.desc);
            if(seo.keywords) document.querySelector('meta[name="keywords"]')?.setAttribute("content", seo.keywords);
        }
    } catch(e){}

    // 2. Track Analytics
    try { await setDoc(doc(db, "analytics", "stats"), { views: increment(1) }, { merge: true }); } catch(e){}

    // 3. Render Hero Data
    try {
        const heroSnap = await getDoc(doc(db, "siteData", "hero"));
        if (heroSnap.exists()) {
            const data = heroSnap.data();
            if(document.getElementById("dynamic-hero-badge") && data.badge) document.getElementById("dynamic-hero-badge").innerText = data.badge;
            if(document.getElementById("dynamic-hero-name") && data.name) document.getElementById("dynamic-hero-name").innerText = data.name;
            if(document.getElementById("dynamic-hero-desc") && data.desc) document.getElementById("dynamic-hero-desc").innerText = data.desc;
            if(document.getElementById("dynamic-hero-img") && data.imageUrl) document.getElementById("dynamic-hero-img").src = data.imageUrl;
        }
    } catch(e){}

    // 4. Render Services (ONLY IF isVisible == true)
    try {
        const srvSnap = await getDocs(query(collection(db, "services"), orderBy("timestamp", "asc")));
        if(!srvSnap.empty) {
            let srvHtml = '';
            srvSnap.forEach(doc => {
                const data = doc.data();
                // Filter hidden services
                if(data.isVisible) {
                    srvHtml += `
                    <div class="glass-effect p-8 rounded-3xl hover:shadow-xl transition border-t-4 border-orange-500 bg-white/60">
                        <h4 class="font-bold text-lg text-orange-700 mb-3">${data.title}</h4>
                        <p class="text-sm text-gray-800 font-medium">${data.desc}</p>
                    </div>`;
                }
            });
            if(document.getElementById("dynamic-srv-container")) document.getElementById("dynamic-srv-container").innerHTML = srvHtml;
        }
    } catch(e){}
}

setTimeout(() => { renderWebsiteData(); }, 800);
