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
            background: linear-gradient(135deg, #0D2240 0%, #1a3a6b 100%);
            border: 2px solid rgba(196, 160, 82, 0.4);
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(13, 34, 64, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s, box-shadow 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 24px rgba(13, 34, 64, 0.55)';"
             onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 16px rgba(13, 34, 64, 0.45)';">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C4A052" stroke-width="2">
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
            box-shadow: 0 12px 48px rgba(13, 34, 64, 0.22);
            overflow: hidden;
            flex-direction: column;
            border: 1px solid rgba(196, 160, 82, 0.2);
          ">
            <!-- Header -->
            <div style="
              background: linear-gradient(135deg, #0D2240 0%, #162E52 100%);
              color: white;
              padding: 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid rgba(196, 160, 82, 0.25);
            ">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="
                  width: 40px;
                  height: 40px;
                  background: rgba(196, 160, 82, 0.18);
                  border: 1px solid rgba(196, 160, 82, 0.35);
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                ">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4A052" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  </svg>
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 15px; color: #ffffff; letter-spacing: 0.01em;">IPM Property Management Expert</div>
                  <div style="font-size: 11px; color: rgba(196, 160, 82, 0.9); margin-top: 1px;">Vacation rentals · Owner earnings · Marketing</div>
                </div>
              </div>
              <button id="ipm-chat-close" style="
                background: transparent;
                border: none;
                color: rgba(255,255,255,0.7);
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: color 0.15s;
              " onmouseover="this.style.color='#ffffff';" onmouseout="this.style.color='rgba(255,255,255,0.7)';">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            background: #C4A052;
            color: #0D2240;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            font-size: 11px;
            font-weight: 700;
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
