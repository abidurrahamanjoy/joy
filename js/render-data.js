import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

async function renderWebsiteData() {
    // 1. Render Hero & Apply Drag/Drop Style Logic
    try {
        const heroSnap = await getDoc(doc(db, "siteData", "hero"));
        if (heroSnap.exists()) {
            const data = heroSnap.data();
            
            // Text Replacement
            if(document.getElementById("dynamic-hero-badge") && data.badge) document.getElementById("dynamic-hero-badge").innerText = data.badge;
            if(document.getElementById("dynamic-hero-greeting") && data.greeting) document.getElementById("dynamic-hero-greeting").innerText = data.greeting;
            if(document.getElementById("dynamic-hero-name") && data.name) document.getElementById("dynamic-hero-name").innerText = data.name;
            if(document.getElementById("dynamic-hero-title") && data.title) document.getElementById("dynamic-hero-title").innerText = data.title;
            if(document.getElementById("dynamic-hero-desc") && data.desc) document.getElementById("dynamic-hero-desc").innerText = data.desc;
            if(document.getElementById("dynamic-hero-img") && data.imageUrl) document.getElementById("dynamic-hero-img").src = data.imageUrl;
            
            // Design Logic Injection
            if(data.bgColor && document.getElementById("hero-section")) {
                document.getElementById("hero-section").style.backgroundColor = data.bgColor;
            }
            if(data.layout === 'left' && document.getElementById("hero-layout")) {
                document.getElementById("hero-layout").classList.add("md:flex-row-reverse");
            } else if(document.getElementById("hero-layout")) {
                document.getElementById("hero-layout").classList.remove("md:flex-row-reverse");
            }
        }
    } catch(e){}

    // 2. Render Contacts
    try {
        const contactSnap = await getDoc(doc(db, "siteData", "contact"));
        if (contactSnap.exists()) {
            const cData = contactSnap.data();
            // Automatically update all call-to-action phone links across the site
            const phoneLinks = document.querySelectorAll('.dynamic-phone-link');
            phoneLinks.forEach(link => {
                link.href = `https://wa.me/${cData.phone.replace(/[^0-9]/g, '')}`;
            });
            const phoneTexts = document.querySelectorAll('.dynamic-phone-text');
            phoneTexts.forEach(text => { text.innerText = cData.phone; });
            
            if(document.getElementById("dyn-fb") && cData.fb) document.getElementById("dyn-fb").href = cData.fb;
            if(document.getElementById("dyn-linkedin") && cData.linkedin) document.getElementById("dyn-linkedin").href = cData.linkedin;
        }
    } catch(e){}

    // 3. Render Services
    try {
        const srvSnap = await getDocs(query(collection(db, "services"), orderBy("timestamp", "asc")));
        if(!srvSnap.empty) {
            let srvHtml = '';
            srvSnap.forEach(doc => {
                srvHtml += `
                <div class="glass-effect p-8 rounded-3xl hover:shadow-xl transition border-t-4 border-orange-500 bg-white/60 text-center md:text-left">
                    <h4 class="font-bold text-lg text-orange-700 mb-3">${doc.data().title}</h4>
                    <p class="text-sm text-gray-800 font-medium">${doc.data().desc}</p>
                </div>`;
            });
            if(document.getElementById("dynamic-srv-container")) document.getElementById("dynamic-srv-container").innerHTML = srvHtml;
        }
    } catch(e){}
}
setTimeout(renderWebsiteData, 800);
