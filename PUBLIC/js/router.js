// ================================
// FOODHUB - Router
// Screen navigation logic
// ================================

class Router {
    constructor() {
        this.currentScreen = null;
        this.appDiv = document.getElementById('app');
        this.history = [];
        this.screenData = {};
    }

    // Navigate to a screen
    async goTo(screenName, data = {}) {
        try {
            showLoader();

            // Store screen data
            this.screenData[screenName] = data;

            // Load screen HTML
            const screenHTML = await this.loadScreen(screenName);

            if (!screenHTML) {
                throw new Error(`Screen ${screenName} not found`);
            }

            // Update app div
            this.appDiv.innerHTML = screenHTML;

            // Execute scripts in the injected HTML to support self-contained screens
            const scripts = Array.from(this.appDiv.querySelectorAll('script'));
            for (const oldScript of scripts) {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));

                // Remove old script from DOM
                oldScript.parentNode.removeChild(oldScript);

                // Append to body to execute
                document.body.appendChild(newScript);

                // Remove after execution if it's inline
                if (!newScript.src) {
                    newScript.remove();
                }
            }

            // Add to history
            if (this.currentScreen && this.currentScreen !== screenName) {
                this.history.push(this.currentScreen);
            }

            // Update current screen
            this.currentScreen = screenName;

            // Initialize screen (for legacy support or specific init)
            await this.initializeScreen(screenName, data);

            // Update URL (optional)
            this.updateURL(screenName);

            hideLoader();
        } catch (error) {
            hideLoader();
            console.error('[Router Error]', error);
            showToast('Failed to load screen', 'error');
        }
    }

    // Load screen HTML
    async loadScreen(screenName) {
        if (!screenName) return null;
        try {
            const response = await fetch(`src/screens/${screenName}.html`);

            if (!response.ok) {
                throw new Error(`Failed to load ${screenName}`);
            }

            const html = await response.text();
            return html;
        } catch (error) {
            logError(error, `loadScreen: ${screenName}`);
            return null;
        }
    }

    // Initialize screen with event listeners (legacy or specialized init)
    async initializeScreen(screenName, data) {
        // Most logic is now within the screen HTML files themselves
    }

    // Go back to previous screen
    back() {
        if (this.history.length > 0) {
            const previousScreen = this.history.pop();
            this.goTo(previousScreen, this.screenData[previousScreen] || {});
        } else {
            console.warn('No history to go back to');
            // Optional: if no history, go to home
            if (this.currentScreen !== 'home') {
                this.goTo('home');
            }
        }
    }

    // Update URL without reload
    updateURL(screenName) {
        const url = new URL(window.location);
        url.searchParams.set('screen', screenName);
        window.history.pushState({ screen: screenName }, '', url);
    }
}

// Create router instance
window.router = new Router();
