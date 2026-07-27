/* eslint-env browser */
// Simple Dark Mode Implementation
class DarkMode {
  constructor() {
    this.init();
  }

  init() {
    // Check for saved theme preference or default to 'light'
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
  }

  setTheme(theme) {
    const html = document.documentElement;

    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);
    this.currentTheme = theme;
  }

  toggle() {
    const html = document.documentElement;
    const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }

  getCurrentTheme() {
    return this.currentTheme || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }
}

// Global instance
window.darkMode = new DarkMode();

// Simple toggle function for buttons
function toggleDarkMode() {
  return window.darkMode.toggle();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DarkMode, toggleDarkMode };
}
