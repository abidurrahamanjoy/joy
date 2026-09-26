import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

async function renderWebsiteData() {
    // 1. Render Hero Section
    try {
        const heroSnap = await getDoc(doc(db, "siteData", "hero"));
        if (heroSnap.exists()) {
            const data = heroSnap.data();
            if(document.getElementById("dynamic-hero-title") && data.title) document.getElementById("dynamic-hero-title").innerHTML = data.title;
            if(document.getElementById("dynamic-hero-desc") && data.desc) document.getElementById("dynamic-hero-desc").innerText = data.desc;
            if(document.getElementById("dynamic-hero-img") && data.imageUrl) document.getElementById("dynamic-hero-img").src = data.imageUrl;
        }
    } catch(e){}

    // 2. Render Contact Links
    try {
        const contactSnap = await getDoc(doc(db, "siteData", "contact"));
        if (contactSnap.exists()) {
            const cData = contactSnap.data();
            if(document.getElementById("dyn-phone") && cData.phone) {
                document.getElementById("dyn-phone").href = `https://wa.me/${cData.phone.replace(/[^0-9]/g, '')}`;
                document.getElementById("dyn-phone-text").innerText = cData.phone;
            }
            if(document.getElementById("dyn-fb") && cData.fb) document.getElementById("dyn-fb").href = cData.fb;
            if(document.getElementById("dyn-linkedin") && cData.linkedin) document.getElementById("dyn-linkedin").href = cData.linkedin;
        }
    } catch(e){}

    // 3. Render Education List (Only overwrite if Firebase has custom data)
    try {
        const eduSnap = await getDocs(query(collection(db, "education"), orderBy("timestamp", "asc")));
        if(!eduSnap.empty) {
            let eduHtml = '';
            eduSnap.forEach(doc => {
                eduHtml += `
                <div class="bg-white p-8 rounded-3xl shadow-lg border border-orange-100 hover:-translate-y-2 transition duration-300">
                    <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-6 text-xl">🎓</div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${doc.data().title}</h3>
                    <p class="text-gray-600">${doc.data().desc}</p>
                </div>`;
            });
            if(document.getElementById("dynamic-edu-container")) document.getElementById("dynamic-edu-container").innerHTML = eduHtml;
        }
    } catch(e){}

    // 4. Render Services List (Only overwrite if Firebase has custom data)
    try {
        const srvSnap = await getDocs(query(collection(db, "services"), orderBy("timestamp", "asc")));
        if(!srvSnap.empty) {
            let srvHtml = '';
            srvSnap.forEach(doc => {
                srvHtml += `
                <div class="glass-effect p-8 rounded-3xl hover:shadow-xl transition border-t-4 border-orange-500 bg-white/60">
                    <h4 class="font-bold text-lg text-orange-700 mb-3">${doc.data().title}</h4>
                    <p class="text-sm text-gray-800 font-medium">${doc.data().desc}</p>
                </div>`;
            });
            if(document.getElementById("dynamic-srv-container")) document.getElementById("dynamic-srv-container").innerHTML = srvHtml;
        }
    } catch(e){}
}

// Timeout ensures loader.js has already painted the components before checking DB
setTimeout(renderWebsiteData, 800);
