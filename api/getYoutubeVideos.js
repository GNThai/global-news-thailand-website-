const fetch = require('node-fetch');

module.exports = async (request, response) => {
    const { YOUTUBE_API_KEY } = process.env;
    const { channelId, count } = request.query;
    const videoCount = count || 10;

    if (!YOUTUBE_API_KEY) {
        return response.status(500).json({ error: 'YouTube API key is not configured.' });
    }

    if (!channelId) {
        return response.status(400).json({ error: 'Channel ID is required.' });
    }

    try {
        const channelApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
        const channelApiResponse = await fetch(channelApiUrl);
        if (!channelApiResponse.ok) {
            const errorData = await channelApiResponse.json();
            console.error('YouTube Channel API Error:', errorData);
            return response.status(channelApiResponse.status).json({ error: 'Failed to fetch channel details from YouTube.', details: errorData });
        }
        const channelData = await channelApiResponse.json();

        const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (!uploadsPlaylistId) {
            console.error('Could not find uploads playlist ID from channel data:', channelData);
            return response.status(404).json({ error: 'Could not find uploads playlist for the channel.' });
        }

        const playlistApiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${videoCount}&key=${YOUTUBE_API_KEY}`;
        const playlistApiResponse = await fetch(playlistApiUrl);
        if (!playlistApiResponse.ok) {
            const errorData = await playlistApiResponse.json();
            console.error('YouTube Playlist API Error:', errorData);
            return response.status(playlistApiResponse.status).json({ error: 'Failed to fetch playlist items from YouTube.', details: errorData });
        }
        const playlistData = await playlistApiResponse.json();

        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
        return response.status(200).json(playlistData);

    } catch (error) {
        console.error('Serverless function error:', error);
        return response.status(500).json({ error: 'Internal server error in function.', details: error.message });
    }
}; 