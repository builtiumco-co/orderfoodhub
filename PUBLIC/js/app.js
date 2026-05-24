// ================================
// FOODHUB - App Initialization
// Main entry point
// ================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        logInfo('FoodHub app starting...');

        // Set up global event listeners
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.screen) {
                router.goTo(event.state.screen);
            }
        });

        window.addEventListener('online', () => {
            showToast('Back online!', 'success');
        });

        window.addEventListener('offline', () => {
            showToast('No internet connection', 'warning');
        });

        // Default routing
        const urlScreen = getQueryParam('screen');

        if (urlScreen) {
            await router.goTo(urlScreen);
        } else {
            await router.goTo('home');
        }

        logInfo('FoodHub app initialized successfully');
    } catch (error) {
        logError(error, 'App initialization');
        showToast('Failed to initialize app', 'error');
    }
});
