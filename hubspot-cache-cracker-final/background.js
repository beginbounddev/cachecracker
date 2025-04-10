// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'bustCache') {
    bustCache(message.tabId)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error('Error in crackCache:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
  
  if (message.action === 'checkIsHubSpot') {
    if (message.tabId) {
      chrome.tabs.get(message.tabId).then(tab => {
        isHubSpotTab(tab).then(isHubSpot => {
          sendResponse({ isHubSpot: isHubSpot });
        }).catch(error => {
          console.error('Error checking if tab is HubSpot:', error);
          sendResponse({ isHubSpot: false, error: error.message });
        });
      }).catch(error => {
        console.error('Error getting tab:', error);
        sendResponse({ isHubSpot: false, error: error.message });
      });
    } else {
      sendResponse({ isHubSpot: false, error: 'No tabId provided' });
    }
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'bust_cache_directly') { // keeping the command name for compatibility
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // CRITICAL FIX: We're processing all pages without HubSpot detection
      // Show a notification that cache cracking is in progress
      chrome.action.setBadgeText({ text: '...' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF7A59' });
      
      // Crack the cache directly
      const result = await bustCache(tab.id);
      
      // Show success or failure badge
      if (result.success) {
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#2ecc71' });
      } else {
        chrome.action.setBadgeText({ text: '✗' });
        chrome.action.setBadgeBackgroundColor({ color: '#e74c3c' });
      }
      
      // Clear the badge after 3 seconds
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error handling keyboard shortcut:', error);
      // Show error badge
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#e74c3c' });
      
      // Clear the badge after 3 seconds
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
      }, 3000);
    }
  }
});

// Function to save cache crack info
function saveLastCacheBustInfo(data) {
  // If data is already an object with timestamp and url
  if (typeof data === 'object' && data.timestamp && data.url) {
    chrome.storage.local.set({ lastCacheBust: {
      timestamp: data.timestamp,
      url: data.url
    }});
  } 
  // If just a URL string was passed
  else if (typeof data === 'string') {
    chrome.storage.local.set({ lastCacheBust: {
      timestamp: Date.now(),
      url: data
    }});
  }
}

// Helper function to check if a tab is a HubSpot page
async function isHubSpotTab(tab) {
  try {
    const url = new URL(tab.url);
    const hostname = url.hostname.toLowerCase();
    
    // Standard HubSpot hostname detection (most reliable)
    if (hostname.includes('hubspot.com') || 
        hostname.includes('hubspotpagebuilder.com') || 
        hostname.includes('hs-sites.com')) {
      console.log('HubSpot domain detected');
      return true;
    }
    
    // For all other domains, check for HubSpot indicators in the page content
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // Check for HubSpot-specific elements and patterns
          
          // 1. Check for HubSpot-specific URLs
          const hasHubfsUrls = Array.from(document.querySelectorAll('link, script, img, a'))
            .some(el => el.src && el.src.includes('/hubfs/') || el.href && el.href.includes('/hubfs/'));
          
          // 2. Check for HubSpot-specific classes
          const hasHsClasses = !!(
            document.querySelector('.hs-menu-item') ||
            document.querySelector('.hs_cos_wrapper') ||
            document.querySelector('.hs-menu-depth-1') ||
            document.querySelector('.hs-item-has-children') ||
            document.querySelector('[class*="hs-"]')
          );
          
          // 3. Check for HubSpot-specific script elements
          const hasHsScripts = !!(
            document.querySelector('#hs-script-loader') ||
            document.querySelector('script[src*="hub_generated"]') ||
            document.querySelector('script[src*="hubspot"]')
          );
          
          // 4. Check for HubSpot global objects
          const hasHsGlobals = !!(
            window.hubspot ||
            window._hsq ||
            window.hbspt ||
            window._hstc ||
            window._hssc
          );
          
          // 5. Check for HubSpot meta tags
          const hasHsMeta = !!(
            document.querySelector('meta[name="generator"][content*="HubSpot"]') ||
            document.querySelector('meta[name*="hs"]')
          );
          
          // 6. Check for HubSpot cookies
          const hasHsCookies = document.cookie.includes('hubspot') || 
                               document.cookie.includes('__hs');
          
          // 7. Check HTML content for HubSpot signatures
          const htmlContent = document.documentElement.innerHTML.toLowerCase();
          const hasHsSignature = 
            htmlContent.includes('hubspot') ||
            htmlContent.includes('hs_cos') ||
            htmlContent.includes('data-hs-') ||
            htmlContent.includes('/hs/');
            
          // Log detection results for debugging
          console.log('HubSpot detection results:', {
            hasHubfsUrls,
            hasHsClasses, 
            hasHsScripts,
            hasHsGlobals,
            hasHsMeta,
            hasHsCookies,
            hasHsSignature
          });
          
          // Return true if any of the checks pass
          return hasHubfsUrls || hasHsClasses || hasHsScripts || 
                 hasHsGlobals || hasHsMeta || hasHsCookies || hasHsSignature;
        }
      });
      
      if (result && result.result === true) {
        console.log('HubSpot content detected via page analysis');
        return true;
      }
    } catch (e) {
      console.error('Error executing content script detection:', e);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if tab is HubSpot:', error);
    return false;
  }
}

// Function to crack the cache for a given tab
async function bustCache(tabId) {
  try {
    // SPEED OPTIMIZATION: Start everything at once using Promise.all
    
    // Get the current tab's URL
    const tab = await chrome.tabs.get(tabId);
    const currentUrl = new URL(tab.url);
    
    // Store the original URL for saving in history
    const originalUrl = currentUrl.toString();
    
    // Generate a unique timestamp for cache cracking
    const timestamp = Date.now();
    const cacheCrackValue = `crack${timestamp}`;
    
    // Add the cache-cracking parameter with on-brand terminology
    currentUrl.searchParams.set('cache-crack', cacheCrackValue);
    console.log('Cache cracking URL:', currentUrl.toString());
    
    // PERFORMANCE OPTIMIZATION: Do these operations in parallel
    // - Clear browser cache (not waiting for it)
    const clearCachePromise = chrome.browsingData.removeCache({ 
      "origins": [currentUrl.origin] 
    }).catch(e => {
      console.error('Error clearing browser cache:', e);
      // Non-critical error, continue
    });
    
    // - Save the cache crack info (not waiting for it)
    const saveInfoPromise = new Promise(resolve => {
      saveLastCacheBustInfo({
        url: originalUrl,
        timestamp: timestamp
      });
      resolve();
    });
    
    // - Show notification (not waiting for it)
    const notificationPromise = new Promise(resolve => {
      try {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon128.png',
          title: 'Cache Successfully Cracked!',
          message: 'Page reloaded with cache-crack parameter',
          priority: 2
        });
      } catch (e) {
        console.error('Error showing notification:', e);
      }
      resolve();
    });
    
    // CRITICAL STEP: Navigate to new URL immediately (don't wait for other operations)
    await chrome.tabs.update(tabId, { url: currentUrl.toString() });
    console.log('Tab updated with new URL containing cache-crack parameter');
    
    // Complete the non-critical operations in the background
    Promise.all([clearCachePromise, saveInfoPromise, notificationPromise])
      .catch(e => console.error('Error in background operations:', e));
    
    return { success: true, cacheCrackValue };
  } catch (error) {
    console.error('Error cracking cache:', error);
    return { success: false, error: error.message };
  }
}

// Function to be injected into the page to clear cache headers
function clearCacheHeaders() {
  // Add meta tags to prevent caching
  const metaTags = [
    { httpEquiv: 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
    { httpEquiv: 'Pragma', content: 'no-cache' },
    { httpEquiv: 'Expires', content: '0' }
  ];
  
  metaTags.forEach(metaTag => {
    // Check if the meta tag already exists
    let meta = document.querySelector(`meta[http-equiv="${metaTag.httpEquiv}"]`);
    
    if (!meta) {
      // Create a new meta tag if it doesn't exist
      meta = document.createElement('meta');
      meta.setAttribute('http-equiv', metaTag.httpEquiv);
      meta.setAttribute('content', metaTag.content);
      document.head.appendChild(meta);
    } else {
      // Update existing meta tag
      meta.setAttribute('content', metaTag.content);
    }
  });
  
  // =========== HUBSPOT-SPECIFIC CACHING TECHNIQUES ===========
  // These are known techniques for specific HubSpot features
  
  // Technique 1: HubSpot Universal Navigation Refresh
  if (window.HubSpotUniversalNavigation) {
    try {
      window.HubSpotUniversalNavigation.refresh();
      console.log('HubSpot Universal Navigation refreshed');
    } catch (e) {
      console.log('Could not refresh HubSpot navigation:', e);
    }
  }
  
  // Technique 2: DataLayer events
  if (window.dataLayer) {
    try {
      window.dataLayer.push({
        'event': 'cacheCracker',
        'timestamp': Date.now()
      });
      console.log('DataLayer cache event pushed');
    } catch (e) {
      console.log('Could not push to dataLayer:', e);
    }
  }
  
  // Technique 3: HubSpot analytics reset
  if (window._hsq) {
    try {
      window._hsq.push(['setPath', window.location.pathname + window.location.search]);
      window._hsq.push(['trackPageView']);
      console.log('HubSpot analytics tracking reset');
    } catch (e) {
      console.log('Could not reset HubSpot analytics:', e);
    }
  }
  
  // Technique 4: HubSpot forms reset
  if (window.hbspt && window.hbspt.forms) {
    try {
      const forms = document.querySelectorAll('div.hbspt-form');
      forms.forEach(form => {
        // Force form container to reload by removing and re-adding to DOM
        const parent = form.parentNode;
        const formId = form.getAttribute('data-form-id');
        if (parent && formId) {
          const tempEl = document.createElement('div');
          tempEl.setAttribute('data-form-id', formId);
          tempEl.className = 'hbspt-form-container';
          parent.replaceChild(tempEl, form);
        }
      });
      console.log('HubSpot forms reset attempted');
    } catch (e) {
      console.log('Could not reset HubSpot forms:', e);
    }
  }
  
  // Technique 5: Attempt to refresh static content
  try {
    // Find all HubSpot static content containers
    const staticContentEls = document.querySelectorAll(
      '.hs_cos_wrapper_type_rich_text, ' +
      '.hs_cos_wrapper_type_module, ' +
      '.hs_cos_wrapper_type_custom_widget'
    );
    
    // Apply a subtle change to force browser repaint
    staticContentEls.forEach(el => {
      // Save original display mode
      const originalDisplay = window.getComputedStyle(el).display;
      // Force repaint by toggle display and immediate revert
      el.style.display = 'none';
      setTimeout(() => { el.style.display = originalDisplay; }, 0);
    });
    
    console.log(`Refreshed ${staticContentEls.length} HubSpot static content elements`);
  } catch (e) {
    console.log('Error refreshing static content:', e);
  }
  
  // Technique 6: Force redraw of all elements (fallback)
  try {
    const html = document.documentElement;
    const currentScrollPos = window.scrollY;
    html.style.display = 'none';
    // This forces the browser to recalculate and redraw all elements
    void html.offsetHeight; // Trigger reflow
    html.style.display = '';
    window.scrollTo(0, currentScrollPos);
    console.log('Forced full page redraw');
  } catch (e) {
    console.log('Could not force redraw:', e);
  }
  
  console.log('Advanced HubSpot cache clearing steps completed');
}
