# HubSpot Cache Cracker

A Chrome extension for HubSpot CMS developers that helps see updates on live web pages more quickly by cracking browser cache with one click.

**Created by Jesse D. Pennington and Simon Gugala at [Begin Bound LLC](https://www.beginbound.com)**

*For custom development, migration, or API support on HubSpot, visit [beginbound.com](https://www.beginbound.com)*

## Features

- **One-Click Cache Cracking**: Quickly refresh the page without browser cache
- **Multiple Cache-Cracking Methods**: Uses several techniques to ensure a complete cache refresh:
  - Adds a cache-busting query parameter to the URL
  - Injects cache-prevention headers into the page
  - Clears browser cache for the specific site
  - Attempts to refresh HubSpot-specific caches
- **HubSpot Detection**: Automatically detects HubSpot CMS pages
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+B` (or `⌘+Shift+B` on Mac): Open the extension popup
  - `Alt+Shift+B`: Crack cache directly without opening the popup
- **History Tracking**: See when you last cracked cache for a particular page

## Installation

### From Chrome Web Store (Recommended)
1. Visit the Chrome Web Store page for this extension
2. Click "Add to Chrome" to install

### Manual Installation (Developer Mode)
1. Download or clone this repository to your computer
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top-right corner
4. Click "Load unpacked" and select the folder containing these files
5. The extension will appear in your browser toolbar

## Usage

1. Navigate to any HubSpot CMS page where you're making updates
2. Click the HubSpot Cache Cracker icon in your Chrome toolbar
3. Click the "Crack Cache" button to refresh the page without cache
4. Alternatively, use the keyboard shortcut `Alt+Shift+B` to crack cache without opening the popup

## For Developers

The extension works by:

1. Checking if the current page is a HubSpot CMS page
2. Adding a unique cache-busting query parameter to the URL
3. Injecting meta tags to prevent caching
4. Clearing the browser cache for the specific domain
5. Attempting to trigger HubSpot-specific cache refresh mechanisms

## Support

For issues, suggestions, or contributions, please submit an issue or pull request to the repository.

For professional HubSpot support, consulting, or custom development:
- Visit [Begin Bound LLC](https://www.beginbound.com)
- Email: contact@beginbound.com

## Creators

This extension was created by Jesse D. Pennington and Simon Gugala at Begin Bound LLC, an agency specializing in HubSpot CMS development, migrations, and API integrations.

## License

MIT License