import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, orderBy, query, setDoc, increment, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

async function renderWebsiteData() {
    
    // 1. Maintenance & SEO & Promo
    try {
        const setSnap = await getDoc(doc(db, "siteData", "settings"));
        if(setSnap.exists()) {
            const st = setSnap.data();
            if(st.maintenanceMode) {
                document.body.innerHTML = `<div class="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center"><span class="text-6xl mb-4">🛠️</span><h1 class="text-4xl font-bold mb-2">Under Construction</h1><p class="text-gray-400">Please check back shortly.</p></div>`;
                return;
            }
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
            
            if(data.bgColor && document.getElementById("hero-section")) document.getElementById("hero-section").style.backgroundColor = data.bgColor;
            if(data.layout === 'left' && document.getElementById("hero-layout")) document.getElementById("hero-layout").classList.add("md:flex-row-reverse");
        }
    } catch(e){}

    // 4. Render Services (Public only)
    try {
        const srvSnap = await getDocs(query(collection(db, "services"), orderBy("timestamp", "asc")));
        if(!srvSnap.empty) {
            let srvHtml = '';
            srvSnap.forEach(doc => {
                const data = doc.data();
                if(data.isVisible) {
                    srvHtml += `<div class="glass-effect p-8 rounded-3xl hover:shadow-xl transition border-t-4 border-orange-500 bg-white/60"><h4 class="font-bold text-lg text-orange-700 mb-3">${data.title}</h4><p class="text-sm text-gray-800 font-medium">${data.desc}</p></div>`;
                }
            });
            if(document.getElementById("dynamic-srv-container")) document.getElementById("dynamic-srv-container").innerHTML = srvHtml;
        }
    } catch(e){}

    // 5. Render Contacts
    try {
        const contactSnap = await getDoc(doc(db, "siteData", "contact"));
        if (contactSnap.exists()) {
            const cData = contactSnap.data();
            document.querySelectorAll('.dynamic-phone-link').forEach(link => { 
                link.href = `https://wa.me/${cData.phone.replace(/[^0-9]/g, '')}`; 
                link.addEventListener('click', () => setDoc(doc(db, "analytics", "stats"), { clicks_wa: increment(1) }, { merge: true }));
            });
            document.querySelectorAll('.dynamic-phone-text').forEach(text => { text.innerText = cData.phone; });
            
            if(document.getElementById("dyn-fb") && cData.fb) {
                document.getElementById("dyn-fb").href = cData.fb;
                document.getElementById("dyn-fb").addEventListener('click', () => setDoc(doc(db, "analytics", "stats"), { clicks_fb: increment(1) }, { merge: true }));
            }
            if(document.getElementById("dyn-linkedin") && cData.linkedin) document.getElementById("dyn-linkedin").href = cData.linkedin;
        }
    } catch(e){}

    // 6. Welcome Popup (24 hours check)
    setTimeout(async () => {
        const lastSeen = localStorage.getItem('joy_popup_seen');
        if (!lastSeen || Date.now() - lastSeen > 86400000) {
            const popSnap = await getDoc(doc(db, "siteData", "popup"));
            if(popSnap.exists()) {
                const p = popSnap.data();
                if(document.getElementById("popup-title") && p.title) document.getElementById("popup-title").innerText = p.title;
                if(document.getElementById("popup-desc") && p.desc) document.getElementById("popup-desc").innerText = p.desc;
                if(document.getElementById("popup-img") && p.imageUrl) document.getElementById("popup-img").src = p.imageUrl;
            }
            const overlay = document.getElementById('welcome-popup-overlay');
            if(overlay) {
                overlay.classList.remove('hidden'); setTimeout(() => overlay.classList.remove('opacity-0'), 50);
                const closePop = () => { overlay.classList.add('opacity-0'); setTimeout(() => overlay.classList.add('hidden'), 500); localStorage.setItem('joy_popup_seen', Date.now()); };
                document.getElementById('close-popup-btn').addEventListener('click', closePop);
                document.getElementById('popup-action-btn').addEventListener('click', closePop);
            }
        }
    }, 1500);
}

setTimeout(() => {
    if(typeof loadComponent === 'function') loadComponent('popup-container', 'components/popup.html').then(() => renderWebsiteData());
    else renderWebsiteData();
}, 800);

// Client Contact Form Submission logic
setTimeout(() => {
    const contactForm = document.getElementById("client-contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = document.getElementById("client-submit-btn");
            btn.innerText = "Sending Message...";
            try {
                await addDoc(collection(db, "messages"), {
                    name: document.getElementById("client-name").value,
                    email: document.getElementById("client-email").value,
                    message: document.getElementById("client-message").value,
                    timestamp: Date.now()
                });
                contactForm.reset();
                btn.innerText = "Send Message 🚀";
                document.getElementById("form-success-msg").classList.remove("hidden");
                setTimeout(() => document.getElementById("form-success-msg").classList.add("hidden"), 5000);
            } catch(error) {
                btn.innerText = "Error! Try again.";
            }
        });
    }
}, 1200);
