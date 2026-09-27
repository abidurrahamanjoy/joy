async function loadComponent(id, file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error('Network response was not ok');
        const content = await response.text();
        const el = document.getElementById(id);
        if (el) el.innerHTML = content;
    } catch (error) {
        console.error(`Error loading ${file}:`, error);
    }
}

async function loadAllComponents() {
    await Promise.all([
        loadComponent('header-container', 'components/header.html'),
        loadComponent('hero-container', 'components/hero.html'),
        loadComponent('education-container', 'components/education.html'),
        loadComponent('services-container', 'components/services.html'),
        loadComponent('contact-container', 'components/contact.html'),
        loadComponent('footer-container', 'components/footer.html'),
    ]);
    document.dispatchEvent(new Event('componentsLoaded'));
}

window.addEventListener('DOMContentLoaded', loadAllComponents);
