// This script runs directly in the context of HubSpot pages

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkIsHubSpot') {
    // Check if this is actually a HubSpot page by looking for HubSpot-specific elements or scripts
    const isHubSpot = detectHubSpotPage();
    sendResponse({ isHubSpot });
  }
  
  // Return true to indicate we'll respond asynchronously if needed
  return true;
});

// Function to detect if this is a HubSpot CMS page
function detectHubSpotPage() {
  // Method 1: Check URL domain - HubSpot standard patterns
  const hostname = window.location.hostname.toLowerCase();
  const url = window.location.href.toLowerCase();
  if (hostname.includes('hubspot.com') || 
      hostname.includes('hubspotpagebuilder.com') || 
      hostname.includes('hs-sites.com') ||
      hostname.endsWith('.hubspotpagebuilder.com') ||
      hostname.endsWith('.hs-sites.com')) {
    return true;
  }
  
  // Method 1.1: Check for HubSpot URL path patterns - more reliable than domain matching
  if (url.includes('/hubfs/') || url.includes('/hs-fs/')) {
    console.log('HubSpot detected: URL contains /hubfs/ or /hs-fs/');
    return true;
  }
  
  // Method 2: Check for HubSpot-specific globals and variables
  if (window.hubspot || 
      window.HubSpotUniversalNavigation || 
      window.hsVars || 
      window.hsjs ||
      window._hsq ||
      window.__hsUserToken ||
      window.hsAnalytics ||
      window.hbspt) {
    return true;
  }
  
  // Method 3: Check for HubSpot-specific meta tags and link elements
  const hubspotMeta = document.querySelector('meta[name="generator"][content*="HubSpot"]');
  if (hubspotMeta) {
    return true;
  }
  
  // Check for HubSpot CSS
  const hubspotCSS = document.querySelector('link[href*="hubspot"]');
  if (hubspotCSS) {
    return true;
  }
  
  // Method 4: Check for HubSpot-specific scripts - comprehensive check
  const scripts = document.querySelectorAll('script');
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src || '';
    const content = scripts[i].textContent || '';
    if (src.toLowerCase().includes('hubspot') || 
        src.toLowerCase().includes('hs-analytics') ||
        src.toLowerCase().includes('hs-script') ||
        src.toLowerCase().includes('/hs/') ||
        content.includes('_hsq') || 
        content.includes('hubspot') ||
        content.includes('hs-analytics') ||
        content.includes('hbspt.forms')) {
      return true;
    }
  }
  
  // Method 5: Check for HubSpot classes, IDs, and data attributes
  const hubspotElements = document.querySelectorAll(
    '[class*="hs-"], [id*="hs-"], [class*="hubspot"], [id*="hubspot"], ' +
    '[data-hs-*], [data-hubspot-*], [data-hs-form-id], [data-form-id], ' + 
    '.hbspt-form, #hs-form, .hs-form, .hs-cta-wrapper, ' +
    '[class*="hubspot-"], .hs_cos_wrapper'
  );
  if (hubspotElements.length > 0) {
    return true;
  }
  
  // Method 6: Check for HubSpot cookies
  const hasCookie = document.cookie.split(';').some(item => 
    item.trim().startsWith('hubspotutk=') || 
    item.trim().startsWith('__hs') || 
    item.includes('hubspot')
  );
  if (hasCookie) {
    return true;
  }
  
  // Method 7: Check for HubSpot-specific HTML comments
  const htmlContent = document.documentElement.innerHTML;
  if (htmlContent.includes('<!-- HubSpot') || 
      htmlContent.includes('<!--HubSpot') || 
      htmlContent.includes('hs-cta-') || 
      htmlContent.includes('hbspt.') ||
      htmlContent.includes('data-hs-form')) {
    return true;  
  }
  
  // Extensive HubSpot class detection - these classes are very specific to HubSpot sites
  const hsSpecificClasses = [
    '.hs-menu-item',
    '.hs_cos_wrapper',
    '.hs-menu-depth-1',
    '.hs-item-has-children',
    '.hs-form',
    '.hs-button',
    '.hs-cta-wrapper',
    '.hs-cta-button'
  ];
  
  for (let selector of hsSpecificClasses) {
    if (document.querySelector(selector)) {
      console.log(`HubSpot detected: Found ${selector} element`);
      return true;
    }
  }
  
  // If we've gotten here, we couldn't definitively identify this as a HubSpot page
  return false;
}

// As soon as the page loads, we can initialize any necessary functionality
(function() {
  console.log('HubSpot Cache Cracker extension loaded');
  
  // Listen for specific HubSpot events that might indicate the page has loaded or updated
  document.addEventListener('hsAfterInitialLoad', function() {
    console.log('HubSpot page has initially loaded');
  });
  
  document.addEventListener('hsAfterRender', function() {
    console.log('HubSpot content has been rendered');
  });
})();
