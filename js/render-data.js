import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, orderBy, query, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

async function renderWebsiteData() {
    
    // ======== ANALYTICS TRACKING SYSTEM ========
    const statRef = doc(db, "analytics", "stats");
    
    // 1. Track Views (Runs once per page load)
    try { await setDoc(statRef, { views: increment(1) }, { merge: true }); } catch(e){}

    // 2. Track Time Spent
    let startTime = Date.now();
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'hidden') {
            let timeSpentSecs = Math.floor((Date.now() - startTime) / 1000);
            try { setDoc(statRef, { totalTime: increment(timeSpentSecs) }, { merge: true }); } catch(e){}
        }
    });

    // 3. Click Tracking Function
    window.trackClick = async (platform) => {
        try { await setDoc(statRef, { [`clicks_${platform}`]: increment(1) }, { merge: true }); } catch(e){}
    };

    // ======== WELCOME POPUP SYSTEM ========
    setTimeout(async () => {
        const lastSeen = localStorage.getItem('joy_popup_seen');
        const now = Date.now();
        // Show if never seen, or if 24 hours (86400000 ms) have passed
        if (!lastSeen || now - lastSeen > 86400000) {
            
            // Fetch dynamic popup data
            const popSnap = await getDoc(doc(db, "siteData", "popup"));
            if(popSnap.exists()) {
                const p = popSnap.data();
                if(document.getElementById("popup-title") && p.title) document.getElementById("popup-title").innerText = p.title;
                if(document.getElementById("popup-desc") && p.desc) document.getElementById("popup-desc").innerText = p.desc;
                if(document.getElementById("popup-img") && p.imageUrl) document.getElementById("popup-img").src = p.imageUrl;
            }

            const overlay = document.getElementById('welcome-popup-overlay');
            if(overlay) {
                overlay.classList.remove('hidden');
                setTimeout(() => overlay.classList.remove('opacity-0'), 50); // Fade in
                
                const closePopup = () => {
                    overlay.classList.add('opacity-0');
                    setTimeout(() => overlay.classList.add('hidden'), 500);
                    localStorage.setItem('joy_popup_seen', Date.now()); // Save to local storage
                };
                
                document.getElementById('close-popup-btn').addEventListener('click', closePopup);
                document.getElementById('popup-action-btn').addEventListener('click', closePopup);
            }
        }
    }, 1500); // Show popup 1.5 seconds after page loads

    // ======== RENDER HERO & CONTACTS ========
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

    try {
        const contactSnap = await getDoc(doc(db, "siteData", "contact"));
        if (contactSnap.exists()) {
            const cData = contactSnap.data();
            const phoneLinks = document.querySelectorAll('.dynamic-phone-link');
            phoneLinks.forEach(link => { 
                link.href = `https://wa.me/${cData.phone.replace(/[^0-9]/g, '')}`; 
                // Add click tracker
                link.addEventListener('click', () => trackClick('wa'));
            });
            const phoneTexts = document.querySelectorAll('.dynamic-phone-text');
            phoneTexts.forEach(text => { text.innerText = cData.phone; });
            
            if(document.getElementById("dyn-fb") && cData.fb) {
                document.getElementById("dyn-fb").href = cData.fb;
                document.getElementById("dyn-fb").addEventListener('click', () => trackClick('fb'));
            }
            if(document.getElementById("dyn-linkedin") && cData.linkedin) {
                document.getElementById("dyn-linkedin").href = cData.linkedin;
                document.getElementById("dyn-linkedin").addEventListener('click', () => trackClick('linkedin'));
            }
        }
    } catch(e){}
    
    // (Ensure you keep the render code for Services and Education from the previous script here)
}

// Check loader.js implementation to load popup.html dynamically
setTimeout(() => {
    // We add popup loading to loader if it wasn't added
    if(typeof loadComponent === 'function') loadComponent('popup-container', 'components/popup.html').then(() => renderWebsiteData());
    else renderWebsiteData();
}, 800);
