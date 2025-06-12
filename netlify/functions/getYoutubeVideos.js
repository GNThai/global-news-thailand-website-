const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const { YOUTUBE_API_KEY } = process.env;
    const { channelId, count } = event.queryStringParameters;

    const videoCount = count || 10;

    if (!YOUTUBE_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'YouTube API key is not configured.' })
        };
    }

    if (!channelId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Channel ID is required.' })
        };
    }

    try {
        const channelApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
        const channelResponse = await fetch(channelApiUrl);
        if (!channelResponse.ok) {
            const errorData = await channelResponse.json();
            console.error('YouTube Channel API Error:', errorData);
            return {
                statusCode: channelResponse.status,
                body: JSON.stringify({ error: 'Failed to fetch channel details.', details: errorData })
            };
        }
        const channelData = await channelResponse.json();

        const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (!uploadsPlaylistId) {
            console.error('Could not find uploads playlist ID:', channelData);
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Could not find uploads playlist for the channel.' })
            };
        }

        const playlistApiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${videoCount}&key=${YOUTUBE_API_KEY}`;
        const playlistResponse = await fetch(playlistApiUrl);
        if (!playlistResponse.ok) {
            const errorData = await playlistResponse.json();
            console.error('YouTube Playlist API Error:', errorData);
            return {
                statusCode: playlistResponse.status,
                body: JSON.stringify({ error: 'Failed to fetch playlist items.', details: errorData })
            };
        }
        const playlistData = await playlistResponse.json();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*' // Allow requests from any origin
            },
            body: JSON.stringify(playlistData)
        };

    } catch (error) {
        console.error('Serverless function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error.', details: error.message })
        };
    }
}; 