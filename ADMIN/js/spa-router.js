/**
 * Simple SPA Router for Admin Panel
 * Intercepts navigations to make switching screens instant
 */
(function () {
    // List of screens that support instant navigation
    const adminScreens = [
        'dashboard.html',
        'orders.html',
        'menu.html',
        'categories.html',
        'settings.html'
    ];

    async function navigateTo(url, saveToHistory = true) {
        const pageName = url.split('/').pop().split('?')[0];
        if (!adminScreens.includes(pageName)) {
            window.location.href = url;
            return;
        }

        try {
            // Show a tiny progress bar if you want, but fast is better
            const response = await fetch(url);
            const html = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // 1. Swap the main content
            const newContent = doc.querySelector('.main-wrapper');
            const currentWrapper = document.querySelector('.main-wrapper');

            if (newContent && currentWrapper) {
                currentWrapper.innerHTML = newContent.innerHTML;
            }

            // 2. Update the page title
            document.title = doc.title;

            // 3. Update active sidebar link
            document.querySelectorAll('.nav-link').forEach(link => {
                const linkHref = link.getAttribute('href');
                if (linkHref === pageName) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            // 4. Re-run screen-specific scripts
            // We find all scripts in the new doc that aren't already loaded
            const scripts = doc.querySelectorAll('script');
            for (const script of scripts) {
                if (script.src) {
                    // Skip core libraries that are already loaded
                    if (script.src.includes('lucide') ||
                        script.src.includes('supabase') ||
                        script.src.includes('config.js') ||
                        script.src.includes('spa-router.js')) {
                        continue;
                    }

                    // Force reload the manager script
                    const newScript = document.createElement('script');
                    newScript.src = script.src.split('?')[0] + '?t=' + Date.now();
                    document.body.appendChild(newScript);
                } else {
                    // Inline scripts (like lucide.createIcons())
                    const newScript = document.createElement('script');
                    newScript.textContent = script.textContent;
                    document.body.appendChild(newScript);
                }
            }

            // 5. Update browser history
            if (saveToHistory) {
                history.pushState({ url }, '', url);
            }

            // 6. Scroll to top
            window.scrollTo(0, 0);

        } catch (error) {
            console.error('SPA Navigation Error:', error);
            window.location.href = url; // Fallback to normal navigation
        }
    }

    // Intercept all clicks
    document.addEventListener('click', e => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        // Only handle links in the adminScreens list
        if (adminScreens.some(s => href.startsWith(s)) || adminScreens.some(s => href === s)) {
            e.preventDefault();
            navigateTo(link.href);
        }
    });

    // Handle back/forward buttons
    window.addEventListener('popstate', e => {
        if (e.state && e.state.url) {
            navigateTo(e.state.url, false);
        } else {
            // If no state, we might be at the initial page
            location.reload();
        }
    });

    console.log('🚀 Admin SPA Router Active');
})();
