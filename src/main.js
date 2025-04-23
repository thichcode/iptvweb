import './style.css';
import Hls from 'hls.js'; // Import hls.js

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

    playlist.forEach((item, index) => {
        const listItem = document.createElement('div');
        listItem.textContent = item.name || `Stream ${index + 1}`;
        listItem.className = 'playlist-item';
        listItem.addEventListener('click', () => {
            playStream(item.url);
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
});

// Export functions needed for testing
export { parseM3U };
