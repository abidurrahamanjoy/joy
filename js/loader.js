// Function to load independent HTML files
async function loadComponent(id, file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error('Network response was not ok');
        const content = await response.text();
        document.getElementById(id).innerHTML = content;
    } catch (error) {
        console.error(`Error loading ${file}:`, error);
    }
}

// Load all sections when the page is ready
window.addEventListener('DOMContentLoaded', () => {
    loadComponent('header-container', 'components/header.html');
    loadComponent('hero-container', 'components/hero.html');
    loadComponent('education-container', 'components/education.html');
    loadComponent('services-container', 'components/services.html');
    loadComponent('contact-container', 'components/contact.html');
    loadComponent('footer-container', 'components/footer.html');
});
