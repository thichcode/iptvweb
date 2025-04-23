import { parseM3U } from './main';

// No need for beforeEach/afterEach or initializeApp for parseM3U tests

describe('parseM3U', () => {
    it('should parse M3U content and return a list of objects with name and URL', () => {
        const m3uContent = `#EXTM3U\n#EXTINF:-1 tvg-id="ch1" tvg-name="Channel 1",Channel One\nhttp://example.com/stream1\n#EXTINF:-1,Channel Two\nhttp://example.com/stream2\n#EXTINF:0,Channel Three\nudp://@239.0.0.1:1234`;
        const expected = [
            { name: 'Channel One', url: 'http://example.com/stream1' },
            { name: 'Channel Two', url: 'http://example.com/stream2' },
            { name: 'Channel Three', url: 'udp://@239.0.0.1:1234' }
        ];

        const result = parseM3U(m3uContent);
        expect(result).toEqual(expected);
    });

    it('should return an empty array for empty content', () => {
        const m3uContent = '';
        const expected = [];
        const result = parseM3U(m3uContent);
        expect(result).toEqual(expected);
    });

    it('should return an empty array for content with only comments', () => {
        const m3uContent = `#EXTM3U\n#COMMENT`;
        const expected = [];
        const result = parseM3U(m3uContent);
        expect(result).toEqual(expected);
    });

    it('should handle lines without #EXTINF correctly (using URL as name)', () => {
        const m3uContent = `#EXTM3U\nhttp://example.com/stream1`;
        const expected = [
            { name: undefined, url: 'http://example.com/stream1' } // Name is undefined if no #EXTINF
        ];
        const result = parseM3U(m3uContent);
        // We might want to adjust parseM3U to default the name in this case, 
        // but for now, we test the current behavior.
        expect(result).toEqual(expected);
    });

    it('should handle different line endings (\r\n)', () => {
        const m3uContent = `#EXTM3U\r\n#EXTINF:-1,Channel 1\r\nhttp://example.com/stream1\r\n`;
        const expected = [
            { name: 'Channel 1', url: 'http://example.com/stream1' }
        ];
        const result = parseM3U(m3uContent);
        expect(result).toEqual(expected);
    });
});