import { NextRequest, NextResponse } from 'next/server';
import { verifyPhotoToken } from '@/lib/security/tokens';

/**
 * Photo proxy endpoint
 * Proxies requests to Google Places API without exposing the API key to clients
 * 
 * Usage: /api/photo?name=places/xxx/photos/yyy&token=abc123
 */

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const photoName = searchParams.get('name');
    const token = searchParams.get('token');
    
    // Validate required parameters
    if (!photoName || !token) {
        return new NextResponse('Missing required parameters', { status: 400 });
    }
    
    // Validate photo name format (should be places/xxx/photos/yyy)
    if (!photoName.match(/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/)) {
        return new NextResponse('Invalid photo name format', { status: 400 });
    }
    
    // Verify the token to prevent unauthorized access
    if (!verifyPhotoToken(photoName, token)) {
        return new NextResponse('Invalid token', { status: 403 });
    }
    
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
        return new NextResponse('Server configuration error', { status: 500 });
    }
    
    try {
        // Fetch the photo from Google Places API
        const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxHeightPx=600&maxWidthPx=800`;
        
        const response = await fetch(photoUrl, {
            headers: {
                'Accept': 'image/*',
            },
        });
        
        if (!response.ok) {
            console.error(`[Photo Proxy] Failed to fetch photo: ${response.status}`);
            return new NextResponse('Failed to fetch photo', { status: response.status });
        }
        
        // Get the image data
        const imageData = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        
        // Return the image with caching headers
        return new NextResponse(imageData, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, immutable', // Cache for 24 hours
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        console.error('[Photo Proxy] Error:', error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}
