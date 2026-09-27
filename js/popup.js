import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Popup daily display logic
const POPUP_STORAGE_KEY = "joy_popup_last_shown_date";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function shouldShowPopup() {
  const today = getTodayKey();
  const lastShown = localStorage.getItem(POPUP_STORAGE_KEY);
  return lastShown !== today;
}

async function loadAndShowPopup() {
  // Check if popup should be shown today
  if (!shouldShowPopup()) {
    console.log("Popup already shown today");
    return;
  }

  const overlay = document.getElementById("welcome-popup-overlay");
  if (!overlay) {
    console.warn("Popup element not found");
    return;
  }

  try {
    // Load popup data from Firebase
    const popupDoc = await getDoc(doc(db, "siteData", "popup"));
    
    if (popupDoc.exists()) {
      const data = popupDoc.data();
      
      // Update popup content from Firebase
      const titleEl = document.getElementById("popup-title");
      const descEl = document.getElementById("popup-desc");
      const imgEl = document.getElementById("popup-img");
      
      if (titleEl && data.title) {
        titleEl.textContent = data.title;
      }
      if (descEl && data.desc) {
        descEl.textContent = data.desc;
      }
      if (imgEl && data.imageUrl) {
        imgEl.src = data.imageUrl;
      }
    }
  } catch (err) {
    console.error("Error loading popup data from Firebase:", err);
    // Popup will still show with default content
  }

  // Show popup with smooth animation
  overlay.classList.remove("hidden");
  overlay.classList.add("flex");
  
  // Trigger animation
  requestAnimationFrame(() => {
    overlay.classList.remove("opacity-0");
    const contentBox = document.getElementById("popup-content-box");
    if (contentBox) {
      contentBox.classList.remove("scale-95", "translate-y-4");
    }
  });

  // Mark today's popup as shown
  localStorage.setItem(POPUP_STORAGE_KEY, getTodayKey());
}

function setupPopupHandlers() {
  const closeBtn = document.getElementById("close-popup-btn");
  const actionBtn = document.getElementById("popup-action-btn");
  const overlay = document.getElementById("welcome-popup-overlay");

  const closePopup = () => {
    if (overlay) {
      overlay.classList.add("opacity-0");
      overlay.classList.remove("flex");
      overlay.classList.add("hidden");
      const contentBox = document.getElementById("popup-content-box");
      if (contentBox) {
        contentBox.classList.add("scale-95", "translate-y-4");
      }
    }
  };

  closeBtn?.addEventListener("click", closePopup);
  actionBtn?.addEventListener("click", closePopup);

  // Close on outside click (on overlay, not content)
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closePopup();
    }
  });
}

// Initialize popup when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  setupPopupHandlers();
  
  // Only load and show if on main website (not on admin page)
  if (!location.pathname.includes("admin")) {
    // Give Firebase config a moment to load
    setTimeout(loadAndShowPopup, 500);
  }
});

export { loadAndShowPopup, shouldShowPopup };
