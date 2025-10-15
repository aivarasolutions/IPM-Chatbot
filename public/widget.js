(function() {
  'use strict';

  const IPMChatbot = {
    config: {
      apiUrl: '',
      theme: 'light',
      language: 'en',
      position: 'bottom-right'
    },

    init: function(options) {
      this.config = { ...this.config, ...options };
      this.createWidget();
      this.attachEventListeners();
    },

    createWidget: function() {
      const widgetHTML = `
        <div id="ipm-chatbot-container" style="
          position: fixed;
          ${this.config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
          ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <!-- Chat Bubble Button -->
          <button id="ipm-chat-bubble" style="
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(30, 64, 175, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s, box-shadow 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(30, 64, 175, 0.5)';" 
             onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(30, 64, 175, 0.4)';">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>

          <!-- Chat Window (Hidden by default) -->
          <div id="ipm-chat-window" style="
            display: none;
            position: absolute;
            ${this.config.position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
            ${this.config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
            width: 380px;
            height: 600px;
            max-height: calc(100vh - 120px);
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            overflow: hidden;
            flex-direction: column;
          ">
            <!-- Header -->
            <div style="
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white;
              padding: 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            ">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="
                  width: 40px;
                  height: 40px;
                  background: rgba(255, 255, 255, 0.2);
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  </svg>
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 16px;">IPM Property Expert</div>
                  <div style="font-size: 12px; opacity: 0.9;">Ask about properties in Mexico & USA</div>
                </div>
              </div>
              <button id="ipm-chat-close" style="
                background: transparent;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <!-- Chat Content (iframe) -->
            <iframe 
              id="ipm-chat-iframe"
              src="${this.config.apiUrl.replace('/api', '')}?embedded=true&theme=${this.config.theme}&lang=${this.config.language}"
              style="
                flex: 1;
                border: none;
                width: 100%;
                height: 100%;
              "
              allow="clipboard-write"
            ></iframe>
          </div>

          <!-- Notification Badge (Optional) -->
          <div id="ipm-notification-badge" style="
            display: none;
            position: absolute;
            top: -5px;
            right: -5px;
            background: #ef4444;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            font-size: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
          ">1</div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', widgetHTML);
    },

    attachEventListeners: function() {
      const bubble = document.getElementById('ipm-chat-bubble');
      const chatWindow = document.getElementById('ipm-chat-window');
      const closeBtn = document.getElementById('ipm-chat-close');
      const badge = document.getElementById('ipm-notification-badge');

      bubble.addEventListener('click', () => {
        const isVisible = chatWindow.style.display === 'flex';
        chatWindow.style.display = isVisible ? 'none' : 'flex';
        
        if (!isVisible && badge) {
          badge.style.display = 'none';
        }
      });

      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chatWindow.style.display = 'none';
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatWindow.style.display === 'flex') {
          chatWindow.style.display = 'none';
        }
      });
    },

    showNotification: function() {
      const badge = document.getElementById('ipm-notification-badge');
      if (badge) {
        badge.style.display = 'flex';
      }
    },

    hideNotification: function() {
      const badge = document.getElementById('ipm-notification-badge');
      if (badge) {
        badge.style.display = 'none';
      }
    }
  };

  // Expose to global scope
  window.IPMChatbot = IPMChatbot;

  // Auto-init if config is provided
  if (window.IPMChatbotConfig) {
    IPMChatbot.init(window.IPMChatbotConfig);
  }
})();
