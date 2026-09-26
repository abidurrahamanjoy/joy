// Function to load independent HTML files
async function loadComponent(id, file) {
    try {
        const response = await fetch(file);
        const content = await response.text();
        document.getElementById(id).innerHTML = content;
    } catch (error) {
        console.error('Error loading component:', error);
    }
}

// Loading all sections independently
window.onload = () => {
    loadComponent('header-container', 'components/header.html');
    loadComponent('hero-container', 'components/hero.html');
    loadComponent('contact-container', 'components/contact.html');
    loadComponent('footer-container', 'components/footer.html');
};
