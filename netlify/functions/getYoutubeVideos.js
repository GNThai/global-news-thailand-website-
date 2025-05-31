const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const { YOUTUBE_API_KEY } = process.env; // Access API key from environment variable
    const channelId = event.queryStringParameters.channelId;
    const count = event.queryStringParameters.count || 10; // Default to 10 if no count is passed

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
        // Step 1: Get the uploads playlist ID from the channel ID
        const channelApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
        const channelResponse = await fetch(channelApiUrl);
        if (!channelResponse.ok) {
            const errorData = await channelResponse.json();
            console.error('YouTube Channel API Error:', errorData);
            return {
                statusCode: channelResponse.status,
                body: JSON.stringify({ error: 'Failed to fetch channel details from YouTube.', details: errorData })
            };
        }
        const channelData = await channelResponse.json();

        if (!channelData.items || channelData.items.length === 0 || !channelData.items[0].contentDetails.relatedPlaylists.uploads) {
            console.error('Could not find uploads playlist ID from channel data:', channelData);
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Could not find uploads playlist for the channel.' })
            };
        }
        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

        // Step 2: Get videos from the uploads playlist
        const playlistApiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${count}&key=${YOUTUBE_API_KEY}`;
        const playlistResponse = await fetch(playlistApiUrl);
        if (!playlistResponse.ok) {
            const errorData = await playlistResponse.json();
            console.error('YouTube Playlist API Error:', errorData);
            return {
                statusCode: playlistResponse.status,
                body: JSON.stringify({ error: 'Failed to fetch playlist items from YouTube.', details: errorData })
            };
        }
        const playlistData = await playlistResponse.json();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Adjust for production to your specific domain
            },
            body: JSON.stringify(playlistData) // playlistData should contain { items: [...] }
        };

    } catch (error) {
        console.error('Serverless function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error in function.', details: error.message })
        };
    }
}; 