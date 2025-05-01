import './style.css';
import Hls from 'hls.js'; // Import hls.js

// Danh sách kênh M3U mặc định
const defaultM3ULinks = {
    "Vietnamese TV": "https://iptv-org.github.io/iptv/countries/vn.m3u",
    "International TV": "https://iptv-org.github.io/iptv/index.m3u"
};

// State variables for TV control
let isTVMode = false;
let currentFocusedElement = null;
let playlistItems = [];
let currentChannelIndex = -1;

// Function to parse M3U content, extracting URL and name
function parseM3U(content) {
    const lines = content.split(/\r?\n/);
    const playlist = [];
    let currentItem = {};

    lines.forEach((line) => {
        line = line.trim();
        if (line.startsWith('#EXTINF:')) {
            // Extract channel name after the comma
            const nameMatch = line.match(/,(.*)$/);
            currentItem.name = nameMatch ? nameMatch[1] : 'Unknown Channel';
        } else if (line && !line.startsWith('#')) {
            currentItem.url = line;
            if (currentItem.url) { // Ensure we have a URL before adding
                playlist.push(currentItem);
                currentItem = {}; // Reset for the next item
            }
        }
    });

    return playlist;
}

// Function to display the playlist
function displayPlaylist(playlist) {
    const playlistContainer = document.getElementById('playlistContainer');
    if (!playlistContainer) return; // Guard clause
    playlistContainer.innerHTML = '';

    if (playlist.length === 0) {
        playlistContainer.textContent = 'No streams found in the playlist.';
        return;
    }

    // Save the playlist for keyboard navigation
    playlistItems = playlist;

    playlist.forEach((item, index) => {
        const listItem = document.createElement('div');
        listItem.textContent = item.name || `Stream ${index + 1}`;
        listItem.className = 'playlist-item';
        listItem.dataset.index = index; // Store index for keyboard navigation
        
        listItem.addEventListener('click', () => {
            playStream(item.url);
            currentChannelIndex = index; // Update current channel index
            // Hide the overlay after selecting a channel on mobile
            document.getElementById('channelOverlay')?.classList.add('hidden');
        });

        // Add tabindex for keyboard navigation
        listItem.setAttribute('tabindex', '0');
        
        listItem.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                playStream(item.url);
                currentChannelIndex = index;
                document.getElementById('channelOverlay')?.classList.add('hidden');
            }
        });
        
        playlistContainer.appendChild(listItem);
    });
}

let hlsInstance = null; // Keep track of the hls.js instance

// Function to play a stream
function playStream(url) {
    const videoPlayer = document.getElementById('videoPlayer');
    if (!videoPlayer) return; // Guard clause

    // Destroy previous Hls instance if it exists
    if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
    }

    // Check if the URL is likely an HLS stream and if HLS is supported
    if (url.endsWith('.m3u8') && Hls.isSupported()) {
        console.log('Playing HLS stream with hls.js');
        hlsInstance = new Hls();
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(videoPlayer);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, function() {
            videoPlayer.play().catch(error => {
                console.error("Error playing HLS video:", error);
            });
        });
        hlsInstance.on(Hls.Events.ERROR, function(event, data) {
            if (data.fatal) {
                console.error('HLS Fatal Error:', data);
                // Handle fatal errors, maybe try to recover or display a message
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.error('HLS network error');
                        // Maybe try to recover
                        // hlsInstance.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.error('HLS media error');
                        // Maybe try to recover
                        // hlsInstance.recoverMediaError();
                        break;
                    default:
                        // Cannot recover, destroy instance
                        hlsInstance.destroy();
                        hlsInstance = null;
                        break;
                }
            } else {
                console.warn('HLS Non-Fatal Error:', data);
            }
        });
    } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
         // Some browsers (like Safari) might support HLS natively
         console.log('Playing HLS stream natively');
         videoPlayer.src = url;
         videoPlayer.play().catch(error => {
             console.error("Error playing native HLS video:", error);
         });
    } else {
        // For other stream types or if HLS is not supported
        console.log('Playing stream directly');
        videoPlayer.src = url;
        videoPlayer.play().catch(error => {
            console.error("Error playing video directly:", error);
        });
    }
}

// Function to load M3U from a file
function loadM3UFromFile(file) {
    const reader = new FileReader();
    const playlistContainer = document.getElementById('playlistContainer');

    reader.onloadstart = () => {
        if (playlistContainer) playlistContainer.textContent = 'Loading playlist...';
    };

    reader.onload = (event) => {
        try {
            const content = event.target.result;
            const playlist = parseM3U(content);
            displayPlaylist(playlist);
        } catch (error) {
            console.error('Error parsing M3U file:', error);
            if (playlistContainer) playlistContainer.textContent = 'Error loading playlist from file.';
        }
    };

    reader.onerror = () => {
        console.error('Error reading file.');
        if (playlistContainer) playlistContainer.textContent = 'Error reading file.';
    };

    reader.readAsText(file);
}

// Function to load M3U from a URL
async function loadM3UFromURL(url) {
    const playlistContainer = document.getElementById('playlistContainer');
    if (playlistContainer) playlistContainer.textContent = 'Loading playlist from URL...';

    try {
        // Basic URL validation
        new URL(url);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();
        const playlist = parseM3U(content);
        displayPlaylist(playlist);
    } catch (error) {
        console.error('Error loading M3U from URL:', error);
        if (playlistContainer) playlistContainer.textContent = `Error loading playlist: ${error.message}`;
    }
}

// Function to create buttons for default M3U links
function createDefaultM3UButtons() {
    const presetChannelsDiv = document.querySelector('.preset-channels');
    if (!presetChannelsDiv) return;
    
    // Clear any existing buttons
    presetChannelsDiv.innerHTML = '';
    
    // Add the default M3U links
    Object.entries(defaultM3ULinks).forEach(([name, url]) => {
        const button = document.createElement('button');
        button.textContent = name;
        button.className = 'preset-btn mobile-btn';
        button.setAttribute('tabindex', '0'); // Make it focusable
        
        button.addEventListener('click', () => {
            loadM3UFromURL(url);
            document.getElementById('channelOverlay')?.classList.remove('hidden');
        });
        presetChannelsDiv.appendChild(button);
    });
}

// Setup mobile UI interactions
function setupMobileUI() {
    // Toggle channel overlay
    const showChannelsBtn = document.getElementById('showChannelsBtn');
    const closeChannelsBtn = document.getElementById('closeChannelsBtn');
    const channelOverlay = document.getElementById('channelOverlay');
    
    if (showChannelsBtn && channelOverlay) {
        showChannelsBtn.addEventListener('click', () => {
            channelOverlay.classList.remove('hidden');
        });
    }
    
    if (closeChannelsBtn && channelOverlay) {
        closeChannelsBtn.addEventListener('click', () => {
            channelOverlay.classList.add('hidden');
        });
    }
    
    // Toggle advanced options
    const toggleAdvancedBtn = document.getElementById('toggleAdvancedBtn');
    const advancedOptions = document.getElementById('advancedOptions');
    
    if (toggleAdvancedBtn && advancedOptions) {
        toggleAdvancedBtn.addEventListener('click', () => {
            advancedOptions.classList.toggle('hidden');
        });
    }
    
    // Load default channels button
    const loadPresetBtn = document.getElementById('loadPresetBtn');
    if (loadPresetBtn) {
        loadPresetBtn.addEventListener('click', () => {
            // Assuming Vietnamese TV is the default choice
            loadM3UFromURL(defaultM3ULinks["Vietnamese TV"]);
            document.getElementById('channelOverlay')?.classList.remove('hidden');
        });
    }

    // Setup TV mode toggle button
    const toggleTVModeBtn = document.getElementById('toggleTVModeBtn');
    if (toggleTVModeBtn) {
        toggleTVModeBtn.addEventListener('click', toggleTVMode);
    }
}

// Function to toggle TV mode
function toggleTVMode() {
    const appElement = document.getElementById('app');
    if (!appElement) return;
    
    isTVMode = !isTVMode;
    
    if (isTVMode) {
        appElement.classList.add('tv-mode');
        // Focus on the video player initially
        document.getElementById('videoPlayer')?.focus();
    } else {
        appElement.classList.remove('tv-mode');
    }
}

// Function to navigate channel up or down
function changeChannel(direction) {
    if (playlistItems.length === 0) return;
    
    // Calculate next index with wrap around
    if (currentChannelIndex === -1) {
        currentChannelIndex = 0; // Start from beginning if no channel selected
    } else {
        currentChannelIndex = (currentChannelIndex + direction + playlistItems.length) % playlistItems.length;
    }
    
    // Play the new channel
    const item = playlistItems[currentChannelIndex];
    if (item && item.url) {
        playStream(item.url);
        
        // Update visual focus in channel list if visible
        updatePlaylistFocus();
    }
}

// Update visual focus in playlist
function updatePlaylistFocus() {
    const playlistContainer = document.getElementById('playlistContainer');
    if (!playlistContainer) return;
    
    // Remove focus from all items
    const items = playlistContainer.querySelectorAll('.playlist-item');
    items.forEach(item => {
        item.classList.remove('focused');
    });
    
    // Add focus to current item
    if (currentChannelIndex >= 0 && currentChannelIndex < items.length) {
        items[currentChannelIndex].classList.add('focused');
        
        // Scroll the item into view if needed
        items[currentChannelIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

// Setup keyboard controls for TV navigation
function setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
        // Only enable special TV controls in TV mode
        if (!isTVMode) return;
        
        const videoPlayer = document.getElementById('videoPlayer');
        const channelOverlay = document.getElementById('channelOverlay');
        const isOverlayVisible = !channelOverlay?.classList.contains('hidden');
        
        switch (event.key) {
            case 'ArrowUp':
                if (isOverlayVisible) {
                    // Navigate channel list in overlay
                    event.preventDefault();
                    navigateChannelList(-1);
                } else {
                    // Change channel up
                    event.preventDefault();
                    changeChannel(-1);
                }
                break;
                
            case 'ArrowDown':
                if (isOverlayVisible) {
                    // Navigate channel list in overlay
                    event.preventDefault();
                    navigateChannelList(1);
                } else {
                    // Change channel down
                    event.preventDefault();
                    changeChannel(1);
                }
                break;
                
            case 'c':
            case 'C':
                // Toggle channel list
                event.preventDefault();
                toggleChannelOverlay();
                break;
                
            case ' ':
                // Toggle play/pause
                if (videoPlayer) {
                    event.preventDefault();
                    if (videoPlayer.paused) {
                        videoPlayer.play();
                    } else {
                        videoPlayer.pause();
                    }
                }
                break;
                
            case 'f':
            case 'F':
                // Toggle fullscreen
                if (videoPlayer) {
                    event.preventDefault();
                    toggleFullscreen(videoPlayer);
                }
                break;
        }
    });
}

// Toggle fullscreen
function toggleFullscreen(element) {
    if (!document.fullscreenElement) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) { /* Safari */
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { /* IE11 */
            element.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    }
}

// Function to navigate the channel list in the overlay
function navigateChannelList(direction) {
    const playlistContainer = document.getElementById('playlistContainer');
    if (!playlistContainer) return;
    
    const items = Array.from(playlistContainer.querySelectorAll('.playlist-item'));
    if (items.length === 0) return;
    
    // Find the currently focused item or use the current channel index
    let currentIndex = items.findIndex(item => item.classList.contains('focused'));
    if (currentIndex === -1) {
        currentIndex = currentChannelIndex !== -1 ? currentChannelIndex : 0;
    }
    
    // Calculate the next index with wrap around
    const nextIndex = (currentIndex + direction + items.length) % items.length;
    
    // Update focus
    items.forEach(item => item.classList.remove('focused'));
    items[nextIndex].classList.add('focused');
    items[nextIndex].focus();
    
    // Update current channel index
    currentChannelIndex = nextIndex;
}

// Toggle channel overlay
function toggleChannelOverlay() {
    const channelOverlay = document.getElementById('channelOverlay');
    if (!channelOverlay) return;
    
    channelOverlay.classList.toggle('hidden');
    
    // If opening the overlay, focus on the current channel
    if (!channelOverlay.classList.contains('hidden')) {
        updatePlaylistFocus();
    }
}

// Initialization logic runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const appElement = document.getElementById('app');
    if (!appElement) {
        console.error("#app element not found!");
        return;
    }

    // Add event listeners for file input and URL input
    const fileInput = document.getElementById('m3uFileInput');
    const urlInput = document.getElementById('m3uUrlInput');
    const loadUrlButton = document.getElementById('loadUrlButton');

    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                loadM3UFromFile(file);
            }
        });
    }

    if (loadUrlButton && urlInput) {
        loadUrlButton.addEventListener('click', () => {
            const url = urlInput.value.trim();
            if (url) {
                loadM3UFromURL(url);
            } else {
                alert('Please enter a valid URL.');
            }
        });
        // Allow loading by pressing Enter in the URL input
        urlInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                loadUrlButton.click();
            }
        });
    }
    
    // Setup mobile UI
    setupMobileUI();
    
    // Setup keyboard controls for TV mode
    setupKeyboardControls();
    
    // Create default M3U buttons
    createDefaultM3UButtons();
    
    // Load a default playlist
    loadM3UFromURL(defaultM3ULinks["Vietnamese TV"]);
    
    // Auto-detect TV mode based on screen size
    if (window.innerWidth >= 1400) {
        toggleTVMode();
    }
});

// Export functions needed for testing
export { parseM3U };
