import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

async function renderLiveData() {
    try {
        const docSnap = await getDoc(doc(db, "portfolioData", "heroSection"));
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Update HTML dynamically if elements exist
            setTimeout(() => {
                const titleEl = document.getElementById("dynamic-hero-title");
                const descEl = document.getElementById("dynamic-hero-desc");
                const imgEl = document.getElementById("dynamic-hero-img");
                
                if (titleEl && data.title) titleEl.innerHTML = data.title;
                if (descEl && data.desc) descEl.innerText = data.desc;
                if (imgEl && data.imageUrl) imgEl.src = data.imageUrl;
            }, 1000); // 1 sec delay to let components load first
        }
    } catch (error) {
        console.log("Error loading live data: ", error);
    }
}

// Run the function
renderLiveData();
