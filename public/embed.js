(function() {
  'use strict';

  // Configuration
  const WIDGET_CONFIG = {
    baseUrl: window.DentalMentorConfig?.baseUrl || 'http://localhost:3000',
    containerId: window.DentalMentorConfig?.containerId || 'dental-mentor-widget',
    width: window.DentalMentorConfig?.width || '100%',
    height: window.DentalMentorConfig?.height || '800px',
  };

  // Create styles
  const styles = `
    .dental-mentor-widget-embed {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }

    .dental-mentor-widget-wrapper {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
  `;

  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Find or create container
  function initWidget() {
    let container = document.getElementById(WIDGET_CONFIG.containerId);
    
    if (!container) {
      console.error(`Container with id "${WIDGET_CONFIG.containerId}" not found. Please add a div with this id to your page.`);
      return;
    }

    // Set container dimensions if specified
    if (WIDGET_CONFIG.width) {
      container.style.width = WIDGET_CONFIG.width;
    }
    if (WIDGET_CONFIG.height) {
      container.style.height = WIDGET_CONFIG.height;
    }

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'dental-mentor-widget-wrapper';

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'dental-mentor-widget-embed';
    iframe.src = `${WIDGET_CONFIG.baseUrl}/widget`;
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.setAttribute('title', 'Dental Mentor AI Chat');

    // Assemble widget
    wrapper.appendChild(iframe);
    container.appendChild(wrapper);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
