async function loadComponent(id, file) {
    // cache: "no-store" + a timestamp query param stop phones/browsers from
    // serving an old cached copy of a component after it's been updated.
    const url = `${file}?v=${Date.now()}`;
    try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error('Network response was not ok');
        const content = await response.text();
        const el = document.getElementById(id);
        if (el) el.innerHTML = content;
    } catch (error) {
        console.error(`Error loading ${file}:`, error);
        // One retry after a short delay in case of a flaky mobile connection.
        try {
            const retryResponse = await fetch(url, { cache: "no-store" });
            if (retryResponse.ok) {
                const content = await retryResponse.text();
                const el = document.getElementById(id);
                if (el) el.innerHTML = content;
            }
        } catch (retryError) {
            console.error(`Retry failed for ${file}:`, retryError);
        }
    }
}

async function loadAllComponents() {
    await Promise.all([
        loadComponent('header-container', 'components/header.html'),
        loadComponent('hero-container', 'components/hero.html'),
        loadComponent('about-container', 'components/about.html'),
        loadComponent('education-container', 'components/education.html'),
        loadComponent('services-container', 'components/services.html'),
        loadComponent('portfolio-container', 'components/portfolio.html'),
        loadComponent('certificate-container', 'components/certificate.html'),
        loadComponent('contact-container', 'components/contact.html'),
        loadComponent('footer-container', 'components/footer.html'),
    ]);
    document.dispatchEvent(new Event('componentsLoaded'));
}

window.addEventListener('DOMContentLoaded', loadAllComponents);
