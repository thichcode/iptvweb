# Simple Web IPTV Player

A basic web-based IPTV player built with vanilla JavaScript and Vite. Allows loading M3U playlists from local files or remote URLs and playing the streams.

## Features

*   Load M3U / M3U8 playlists from local files.
*   Load M3U / M3U8 playlists from remote URLs.
*   Parses playlist to display channel names.
*   Clickable playlist items to switch streams.
*   Uses `hls.js` for HLS stream playback compatibility.
*   Basic responsive design.

## Tech Stack

*   HTML5
*   CSS3
*   Vanilla JavaScript (ES Modules)
*   [Vite](https://vitejs.dev/) for frontend tooling (dev server, build)
*   [hls.js](https://github.com/video-dev/hls.js/) for HLS playback
*   [Jest](https://jestjs.io/) for testing (currently only `parseM3U`)

## Project Setup

1.  **Clone the repository (or download the code):**
    ```bash
    git clone <your-repository-url>
    cd iptvweb
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Usage

1.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start a local server, typically at `http://localhost:5173`. Open this URL in your browser.

2.  **Load a playlist:**
    *   **From File:** Click the "Choose File" button and select a `.m3u` or `.m3u8` file from your computer.
    *   **From URL:** Enter the full URL of an M3U/M3U8 playlist in the text input field and click "Load URL" or press Enter.

3.  **Play a stream:**
    *   Once the playlist is loaded, the channels/streams will appear in the list on the right.
    *   Click on a channel name to start playing the stream in the video player.

## Building for Production

```bash
npm run build
```
This command bundles the application into the `dist` directory, which can then be deployed to any static hosting service.

## Deployment

This project is configured for easy deployment on platforms like Vercel or Netlify.

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Import the repository into your Vercel/Netlify account.
3.  Configure the build command: `npm run build`
4.  Configure the output directory: `dist`
5.  Deploy!
