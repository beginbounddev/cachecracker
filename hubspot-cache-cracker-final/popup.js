document.addEventListener('DOMContentLoaded', function() {
  const bustCacheBtn = document.getElementById('bustCacheBtn');
  const statusElement = document.getElementById('status');
  const lastBustElement = document.getElementById('lastBust');
  const lastBustTimeElement = document.getElementById('lastBustTime');
  const lastBustUrlElement = document.getElementById('lastBustUrl');
  
  // Function to show status message
  function showStatus(message, type) {
    statusElement.textContent = message;
    statusElement.className = 'status ' + type;
    
    if (type === 'loading') {
      statusElement.classList.add('loading-animation');
    } else {
      statusElement.classList.remove('loading-animation');
    }
  }
  
  // Function to check if the current page is a HubSpot page
  async function isHubSpotPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // CRITICAL FIX: We're going to skip the check and allow all pages to be treated as HubSpot
      // This ensures the cache cracking will always run regardless of detection
      console.log("Enabling cache cracking for all pages to ensure it works");
      return true;
      
      /* Previous approach that wasn't working reliably:
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'checkIsHubSpot', tabId: tab.id }, 
          (response) => {
            if (response && response.isHubSpot) {
              resolve(true);
            } else {
              resolve(false);
            }
          }
        );
      });
      */
    } catch (error) {
      console.error('Error checking if page is HubSpot:', error);
      // Even on error, we'll allow cache cracking
      return true;
    }
  }
  
  // Function to load and display last cache crack info
  function loadLastCacheBustInfo() {
    chrome.storage.local.get(['lastCacheBust'], function(result) {
      if (result.lastCacheBust) {
        const { timestamp, url } = result.lastCacheBust;
        
        // Format the time
        const crackTime = new Date(timestamp);
        const formattedTime = crackTime.toLocaleString();
        
        // Update the UI
        lastBustTimeElement.textContent = formattedTime;
        lastBustUrlElement.textContent = url || 'Unknown URL';
        lastBustElement.classList.remove('hidden');
      }
    });
  }
  
  // Function to save cache crack info - simplified to avoid [object Object] displays
  function saveLastCacheBustInfo(url) {
    // Handle both string and object inputs
    const finalUrl = typeof url === 'object' && url.url ? url.url : url;
    
    const cacheCrackInfo = {
      timestamp: Date.now(),
      url: finalUrl
    };
    
    chrome.storage.local.set({ lastCacheBust: cacheCrackInfo });
  }

  // Check for keyboard shortcut settings
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  document.querySelectorAll('.key-combo').forEach(el => {
    if (el.textContent.includes('⌘') && !isMac) {
      el.textContent = el.textContent.replace('⌘', 'Ctrl');
    } else if (el.textContent.includes('Ctrl') && isMac) {
      el.textContent = el.textContent.replace('Ctrl', '⌘');
    }
  });

  // Load last cache crack info on popup open
  loadLastCacheBustInfo();

  // Event listener for the Crack Cache button
  bustCacheBtn.addEventListener('click', async function() {
    try {
      // Immediately show loading status for faster perceived response
      showStatus('Cracking cache...', 'loading');
      
      // Get the current active tab immediately
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Save current page info as the last cache crack right away
      saveLastCacheBustInfo(tab.url);
      
      // CRITICAL PERFORMANCE IMPROVEMENT: Skip HubSpot check
      // This allows cache to be cracked without delays in detection
      
      // Send message to background script to crack the cache immediately
      chrome.runtime.sendMessage({ action: 'bustCache', tabId: tab.id }, function(response) {
        if (response && response.success) {
          showStatus('Cache cracked successfully! Page is reloading...', 'success');
          
          // Load and display updated cache crack info
          loadLastCacheBustInfo();
        } else {
          showStatus('Failed to crack cache: ' + (response?.error || 'Unknown error'), 'error');
        }
      });
    } catch (error) {
      console.error('Error in crackCache button click handler:', error);
      showStatus('An error occurred: ' + error.message, 'error');
    }
  });
});
