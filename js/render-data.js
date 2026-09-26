import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

async function renderWebsiteData() {
    // 1. Render Hero Section
    const heroSnap = await getDoc(doc(db, "siteData", "hero"));
    if (heroSnap.exists()) {
        const data = heroSnap.data();
        if(document.getElementById("dynamic-hero-title") && data.title) document.getElementById("dynamic-hero-title").innerHTML = data.title;
        if(document.getElementById("dynamic-hero-desc") && data.desc) document.getElementById("dynamic-hero-desc").innerText = data.desc;
        if(document.getElementById("dynamic-hero-img") && data.imageUrl) document.getElementById("dynamic-hero-img").src = data.imageUrl;
    }

    // 2. Render Contact Links
    const contactSnap = await getDoc(doc(db, "siteData", "contact"));
    if (contactSnap.exists()) {
        const cData = contactSnap.data();
        if(document.getElementById("dyn-phone")) {
            document.getElementById("dyn-phone").href = `https://wa.me/${cData.phone.replace(/[^0-9]/g, '')}`;
            document.getElementById("dyn-phone-text").innerText = cData.phone;
        }
        if(document.getElementById("dyn-fb")) document.getElementById("dyn-fb").href = cData.fb;
        if(document.getElementById("dyn-linkedin")) document.getElementById("dyn-linkedin").href = cData.linkedin;
    }

    // 3. Render Education List
    const eduSnap = await getDocs(query(collection(db, "education"), orderBy("timestamp", "asc")));
    let eduHtml = '';
    eduSnap.forEach(doc => {
        eduHtml += `
        <div class="bg-white p-8 rounded-3xl shadow-lg border border-orange-50 hover:-translate-y-2 transition duration-300">
            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-6 text-xl">🎓</div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">${doc.data().title}</h3>
            <p class="text-gray-600">${doc.data().desc}</p>
        </div>`;
    });
    if(document.getElementById("dynamic-edu-container") && eduHtml !== '') {
        document.getElementById("dynamic-edu-container").innerHTML = eduHtml;
    }

    // 4. Render Services List
    const srvSnap = await getDocs(query(collection(db, "services"), orderBy("timestamp", "asc")));
    let srvHtml = '';
    srvSnap.forEach(doc => {
        srvHtml += `
        <div class="glass-effect p-8 rounded-3xl hover:shadow-xl transition">
            <h4 class="font-bold text-lg text-orange-600 mb-3">${doc.data().title}</h4>
            <p class="text-sm text-gray-700">${doc.data().desc}</p>
        </div>`;
    });
    if(document.getElementById("dynamic-srv-container") && srvHtml !== '') {
        document.getElementById("dynamic-srv-container").innerHTML = srvHtml;
    }
}

// Run after a short delay to ensure HTML components are loaded via loader.js
setTimeout(renderWebsiteData, 800);
