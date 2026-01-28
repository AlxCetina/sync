import { Place, PlaceType, PLACE_TYPE_OPTIONS } from '@/types';
import { generatePhotoToken } from '@/lib/security/tokens';

// Debug mode - set DEBUG_MODE=true in .env to use mock data instead of API calls
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

// Google Places API (New) Base URL
const BASE_URL = 'https://places.googleapis.com/v1/places';

// Mock places for debug mode
const MOCK_PLACES: Place[] = [
    {
        id: 'mock-1',
        name: 'The Cozy Corner Cafe',
        rating: 4.5,
        priceLevel: 2,
        categories: ['Cafe', 'Coffee Shop', 'Breakfast'],
        photoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
        address: '123 Main Street',
        userRatingsTotal: 342,
        location: { lat: 14.5995, lng: 120.9842 },
    },
    {
        id: 'mock-2',
        name: 'Golden Dragon Restaurant',
        rating: 4.3,
        priceLevel: 2,
        categories: ['Restaurant', 'Chinese', 'Asian'],
        photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        address: '456 Oak Avenue',
        userRatingsTotal: 521,
        location: { lat: 14.5985, lng: 120.9852 },
    },
    {
        id: 'mock-3',
        name: 'Burger Bliss',
        rating: 4.2,
        priceLevel: 1,
        categories: ['Fast Food', 'Burgers', 'American'],
        photoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        address: '789 Pine Road',
        userRatingsTotal: 892,
        location: { lat: 14.6005, lng: 120.9832 },
    },
    {
        id: 'mock-4',
        name: 'La Bella Italia',
        rating: 4.7,
        priceLevel: 3,
        categories: ['Restaurant', 'Italian', 'Fine Dining'],
        photoUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
        address: '321 Elm Street',
        userRatingsTotal: 276,
        location: { lat: 14.5975, lng: 120.9862 },
    },
    {
        id: 'mock-5',
        name: 'Sunrise Bakery',
        rating: 4.6,
        priceLevel: 2,
        categories: ['Bakery', 'Cafe', 'Pastries'],
        photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
        address: '654 Cedar Lane',
        userRatingsTotal: 189,
        location: { lat: 14.6015, lng: 120.9822 },
    },
    {
        id: 'mock-6',
        name: 'Morning Glory Brunch',
        rating: 4.4,
        priceLevel: 2,
        categories: ['Breakfast', 'Brunch', 'American'],
        photoUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800',
        address: '987 Maple Drive',
        userRatingsTotal: 423,
        location: { lat: 14.5965, lng: 120.9872 },
    },
    {
        id: 'mock-7',
        name: 'Speedy Tacos',
        rating: 4.1,
        priceLevel: 1,
        categories: ['Fast Food', 'Mexican', 'Tacos'],
        photoUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
        address: '147 Birch Boulevard',
        userRatingsTotal: 654,
        location: { lat: 14.6025, lng: 120.9812 },
    },
    {
        id: 'mock-8',
        name: 'The Daily Grind',
        rating: 4.5,
        priceLevel: 2,
        categories: ['Cafe', 'Coffee Shop'],
        photoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
        address: '258 Harbor View',
        userRatingsTotal: 312,
        location: { lat: 14.5955, lng: 120.9882 },
    },
    {
        id: 'mock-9',
        name: 'Sakura Sushi House',
        rating: 4.8,
        priceLevel: 3,
        categories: ['Restaurant', 'Japanese', 'Sushi'],
        photoUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
        address: '369 Willow Way',
        userRatingsTotal: 445,
        location: { lat: 14.6035, lng: 120.9802 },
    },
    {
        id: 'mock-10',
        name: 'Pizza Paradise',
        rating: 4.3,
        priceLevel: 2,
        categories: ['Restaurant', 'Pizza', 'Italian'],
        photoUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
        address: '741 Cherry Court',
        userRatingsTotal: 687,
        location: { lat: 14.5945, lng: 120.9892 },
    },
    {
        id: 'mock-11',
        name: 'Fresh & Fast Salads',
        rating: 4.2,
        priceLevel: 2,
        categories: ['Fast Food', 'Healthy', 'Salads'],
        photoUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
        address: '852 Bamboo Lane',
        userRatingsTotal: 234,
        location: { lat: 14.6045, lng: 120.9792 },
    },
    {
        id: 'mock-12',
        name: 'The Breakfast Club',
        rating: 4.6,
        priceLevel: 2,
        categories: ['Breakfast', 'Brunch', 'Cafe'],
        photoUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
        address: '963 Lotus Street',
        userRatingsTotal: 398,
        location: { lat: 14.5935, lng: 120.9902 },
    },
    {
        id: 'mock-13',
        name: 'Crispy Chicken Express',
        rating: 4.0,
        priceLevel: 1,
        categories: ['Fast Food', 'Chicken', 'American'],
        photoUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800',
        address: '111 Coffee Lane',
        userRatingsTotal: 723,
        location: { lat: 14.6055, lng: 120.9782 },
    },
    {
        id: 'mock-14',
        name: 'Le Petit Bistro',
        rating: 4.7,
        priceLevel: 4,
        categories: ['Restaurant', 'French', 'Fine Dining'],
        photoUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800',
        address: '222 Morning Ave',
        userRatingsTotal: 156,
        location: { lat: 14.5925, lng: 120.9912 },
    },
    {
        id: 'mock-15',
        name: 'Artisan Bread Co.',
        rating: 4.8,
        priceLevel: 2,
        categories: ['Bakery', 'Bread', 'Pastries'],
        photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
        address: '333 Ale Street',
        userRatingsTotal: 267,
        location: { lat: 14.6065, lng: 120.9772 },
    },
    {
        id: 'mock-16',
        name: 'Thai Orchid Kitchen',
        rating: 4.4,
        priceLevel: 2,
        categories: ['Restaurant', 'Thai', 'Asian'],
        photoUrl: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800',
        address: '444 Pastry Road',
        userRatingsTotal: 412,
        location: { lat: 14.5915, lng: 120.9922 },
    },
    {
        id: 'mock-17',
        name: 'Espresso Express',
        rating: 4.3,
        priceLevel: 1,
        categories: ['Cafe', 'Coffee Shop', 'Quick Bites'],
        photoUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
        address: '555 Sunrise Blvd',
        userRatingsTotal: 534,
        location: { lat: 14.6075, lng: 120.9762 },
    },
    {
        id: 'mock-18',
        name: 'Noodle House',
        rating: 4.2,
        priceLevel: 1,
        categories: ['Restaurant', 'Noodles', 'Asian'],
        photoUrl: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=800',
        address: '666 Quick Lane',
        userRatingsTotal: 389,
        location: { lat: 14.5905, lng: 120.9932 },
    },
    {
        id: 'mock-19',
        name: 'Pancake Palace',
        rating: 4.5,
        priceLevel: 2,
        categories: ['Breakfast', 'Brunch', 'American'],
        photoUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
        address: '777 Elegance Ave',
        userRatingsTotal: 478,
        location: { lat: 14.6085, lng: 120.9752 },
    },
    {
        id: 'mock-20',
        name: 'Mediterranean Delights',
        rating: 4.6,
        priceLevel: 3,
        categories: ['Restaurant', 'Mediterranean', 'Healthy'],
        photoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
        address: '888 Gourmet Plaza',
        userRatingsTotal: 298,
        location: { lat: 14.5895, lng: 120.9942 },
    },
    {
        id: 'mock-21',
        name: 'Wings & Things',
        rating: 4.1,
        priceLevel: 1,
        categories: ['Fast Food', 'Wings', 'American'],
        photoUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800',
        address: '999 Sports Drive',
        userRatingsTotal: 612,
        location: { lat: 14.6095, lng: 120.9742 },
    },
    {
        id: 'mock-22',
        name: 'Sweet Tooth Bakery',
        rating: 4.7,
        priceLevel: 2,
        categories: ['Bakery', 'Desserts', 'Cakes'],
        photoUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
        address: '100 Sugar Lane',
        userRatingsTotal: 356,
        location: { lat: 14.5885, lng: 120.9952 },
    },
    {
        id: 'mock-23',
        name: 'Grill Masters BBQ',
        rating: 4.4,
        priceLevel: 2,
        categories: ['Restaurant', 'BBQ', 'American'],
        photoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
        address: '200 Smoke Avenue',
        userRatingsTotal: 523,
        location: { lat: 14.6105, lng: 120.9732 },
    },
    {
        id: 'mock-24',
        name: 'Dim Sum House',
        rating: 4.5,
        priceLevel: 2,
        categories: ['Restaurant', 'Chinese', 'Dim Sum'],
        photoUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800',
        address: '300 Dynasty Road',
        userRatingsTotal: 445,
        location: { lat: 14.5875, lng: 120.9962 },
    },
    {
        id: 'mock-25',
        name: 'Veggie Delight',
        rating: 4.3,
        priceLevel: 2,
        categories: ['Restaurant', 'Vegetarian', 'Healthy'],
        photoUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
        address: '400 Green Street',
        userRatingsTotal: 267,
        location: { lat: 14.6115, lng: 120.9722 },
    },
];

/**
 * Get mock places for debug mode, filtered by place types
 */
function getMockPlaces(placeTypes?: PlaceType[]): Place[] {
    if (!placeTypes || placeTypes.length === 0) {
        return MOCK_PLACES;
    }

    // Map place types to category keywords
    const categoryKeywords: Record<PlaceType, string[]> = {
        cafe: ['cafe', 'coffee'],
        fast_food: ['fast food', 'quick'],
        fine_dining: ['fine dining'],
        casual_dining: ['restaurant'],
        bakery: ['bakery', 'bread', 'pastries'],
        breakfast: ['breakfast', 'brunch'],
    };

    const keywords = placeTypes.flatMap(pt => categoryKeywords[pt] || []);

    return MOCK_PLACES.filter(place => {
        const placeCategories = place.categories.map(c => c.toLowerCase());
        return keywords.some(keyword =>
            placeCategories.some(cat => cat.includes(keyword.toLowerCase()))
        );
    });
}

interface GooglePlace {
    name: string; // Resource name: places/PLACE_ID
    id: string;
    displayName?: { text: string };
    rating?: number;
    priceLevel?: 'PRICE_LEVEL_UNSPECIFIED' | 'PRICE_LEVEL_FREE' | 'PRICE_LEVEL_INEXPENSIVE' | 'PRICE_LEVEL_MODERATE' | 'PRICE_LEVEL_EXPENSIVE' | 'PRICE_LEVEL_VERY_EXPENSIVE';
    types?: string[];
    photos?: Array<{
        name: string; // Resource name: places/PLACE_ID/photos/PHOTO_ID
        widthPx: number;
        heightPx: number;
    }>;
    formattedAddress?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    userRatingCount?: number;
}

interface GooglePlacesResponse {
    places?: GooglePlace[];
}

/**
 * Build Google Places types and search query from selected place types
 */
function buildSearchParams(placeTypes?: PlaceType[]): { googleTypes: string[]; searchQueries: string[] } {
    if (!placeTypes || placeTypes.length === 0) {
        // Default: search all food types
        return {
            googleTypes: ['restaurant', 'cafe', 'fast_food_restaurant', 'meal_takeaway', 'bakery'],
            searchQueries: []
        };
    }

    const googleTypes: string[] = [];
    const searchQueries: string[] = [];

    for (const placeType of placeTypes) {
        const option = PLACE_TYPE_OPTIONS.find(o => o.id === placeType);
        if (option) {
            if (option.googleTypes) {
                googleTypes.push(...option.googleTypes);
            }
            if (option.searchQuery) {
                searchQueries.push(option.searchQuery);
            }
        }
    }

    // Remove duplicates
    return {
        googleTypes: [...new Set(googleTypes)],
        searchQueries: [...new Set(searchQueries)]
    };
}

// Search radius constants
export const INITIAL_RADIUS = 3000; // 3km
export const MAX_RADIUS = 50000; // 50km (maximum user-selectable radius)
export const RADIUS_INCREMENT = 2000; // 2km increase per expansion
export const MAX_PLACES = 100;
export const MIN_PLACES = 20; // Minimum places to fetch before returning

// User preference data for personalized search
export interface UserPreferences {
    likedCategories: string[];
    dislikedCategories: string[];
    preferredSearchQueries: string[];
}

/**
 * Helper function to search for places at a specific radius
 */
async function searchWithRadius(
    location: { lat: number; lng: number },
    searchType: 'restaurant' | 'movie',
    googleTypes: string[],
    searchQueries: string[],
    radius: number,
    headers: Record<string, string>,
    searchQuery?: string
): Promise<GooglePlace[]> {
    const places: GooglePlace[] = [];

    // If we have Google types (like fast_food, cafe, bar), do a nearby search
    if (googleTypes.length > 0) {
        const includedTypes = searchType === 'movie' 
            ? ['movie_theater']
            : googleTypes;

        const body = {
            includedTypes,
            maxResultCount: 20,
            locationRestriction: {
                circle: {
                    center: { latitude: location.lat, longitude: location.lng },
                    radius
                }
            },
            rankPreference: 'DISTANCE'
        };

        try {
            console.log(`[Places] Nearby search with types: ${includedTypes.join(', ')}`);
            const response = await fetch(`${BASE_URL}:searchNearby`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            if (response.ok) {
                const data: GooglePlacesResponse = await response.json();
                console.log(`[Places] Nearby search returned ${data.places?.length || 0} results`);
                if (data.places) {
                    places.push(...data.places);
                }
            } else {
                const errorText = await response.text();
                console.error(`[Places] Nearby search failed: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('[Places] Nearby search error:', error);
        }
    }

    // If we have search queries (for specific cuisines), do text searches
    if (searchQueries.length > 0) {
        for (const query of searchQueries) {
            const body = {
                textQuery: searchQuery ? `${searchQuery} ${query}` : query,
                locationBias: {
                    circle: {
                        center: { latitude: location.lat, longitude: location.lng },
                        radius
                    }
                },
                maxResultCount: 20
            };

            try {
                console.log(`[Places] Text search for: "${body.textQuery}"`);
                const response = await fetch(`${BASE_URL}:searchText`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                });

                if (response.ok) {
                    const data: GooglePlacesResponse = await response.json();
                    console.log(`[Places] Text search returned ${data.places?.length || 0} results`);
                    if (data.places) {
                        places.push(...data.places);
                    }
                } else {
                    const errorText = await response.text();
                    console.error(`[Places] Text search failed: ${response.status} - ${errorText}`);
                }
            } catch (error) {
                console.error('[Places] Text search error:', error);
            }
        }
    }

    // Fallback: if user provided a custom search query and no place types
    if (searchQuery && googleTypes.length === 0 && searchQueries.length === 0) {
        const body = {
            textQuery: searchQuery,
            locationBias: {
                circle: {
                    center: { latitude: location.lat, longitude: location.lng },
                    radius
                }
            },
            maxResultCount: 20
        };

        try {
            const response = await fetch(`${BASE_URL}:searchText`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            if (response.ok) {
                const data: GooglePlacesResponse = await response.json();
                if (data.places) {
                    places.push(...data.places);
                }
            }
        } catch (error) {
            console.error('[Places] Custom text search error:', error);
        }
    }

    return places;
}

/**
 * Fetches places from Google Places API (New)
 * Automatically expands search radius until MIN_PLACES (20) are found or MAX_RADIUS is reached
 * Docs: https://developers.google.com/maps/documentation/places/web-service/op-overview
 */
export async function fetchPlaces(
    location: { lat: number; lng: number },
    searchType: 'restaurant' | 'movie',
    searchQuery?: string,
    placeTypes?: PlaceType[],
    radius: number = INITIAL_RADIUS,
    excludePlaceIds: string[] = [],
    preferences?: UserPreferences
): Promise<Place[]> {
    // Debug mode - return mock data without API calls
    if (DEBUG_MODE) {
        console.log('[Places] DEBUG MODE - Using mock data');
        const mockPlaces = getMockPlaces(placeTypes);
        // Filter out excluded places
        const filtered = mockPlaces.filter(p => !excludePlaceIds.includes(p.id));
        // Simulate some delay for realism
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`[Places] DEBUG MODE - Returning ${filtered.length} mock places`);
        return filtered;
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || '';

    // Return empty array if no API key
    if (!apiKey || apiKey.includes('your_google_places_api_key')) {
        console.warn('[Places] No valid Google Places API key configured');
        return [];
    }

    try {
        let { googleTypes, searchQueries } = buildSearchParams(placeTypes);
        
        // Add preferred search queries from user preferences
        if (preferences?.preferredSearchQueries && preferences.preferredSearchQueries.length > 0) {
            // Prioritize user-preferred queries
            searchQueries = [...preferences.preferredSearchQueries, ...searchQueries];
            // Remove duplicates
            searchQueries = [...new Set(searchQueries)];
        }
        
        const fieldMask = [
            'places.id',
            'places.name',
            'places.displayName',
            'places.rating',
            'places.priceLevel',
            'places.types',
            'places.photos',
            'places.formattedAddress',
            'places.location',
            'places.userRatingCount'
        ].join(',');

        const headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': fieldMask,
        };

        let allPlaces: GooglePlace[] = [];
        let currentRadius = radius;
        
        // Keep expanding radius until we have enough places or hit max radius
        while (allPlaces.length < MIN_PLACES && currentRadius <= MAX_RADIUS) {
            console.log(`[Places] Searching with radius: ${currentRadius}m (current results: ${allPlaces.length})`);
            
            const newPlaces = await searchWithRadius(
                location,
                searchType,
                googleTypes,
                searchQueries,
                currentRadius,
                headers,
                searchQuery
            );
            
            // Merge new places (avoiding duplicates)
            const existingIds = new Set(allPlaces.map(p => p.id));
            for (const place of newPlaces) {
                if (!existingIds.has(place.id)) {
                    allPlaces.push(place);
                    existingIds.add(place.id);
                }
            }
            
            // If we still don't have enough, expand radius
            if (allPlaces.length < MIN_PLACES && currentRadius < MAX_RADIUS) {
                currentRadius = Math.min(currentRadius + RADIUS_INCREMENT, MAX_RADIUS);
            } else {
                break;
            }
        }
        
        console.log(`[Places] Final search completed with radius: ${currentRadius}m, found ${allPlaces.length} places`);

        if (allPlaces.length === 0) {
            console.log('[Places] No places found from Google Places API');
            return [];
        }

        // Remove duplicates by place ID and exclude already-fetched places
        const excludeSet = new Set(excludePlaceIds);
        const uniquePlaces = allPlaces.filter((place, index, self) =>
            index === self.findIndex(p => p.id === place.id) && !excludeSet.has(place.id)
        );

        // Filter out places that aren't primarily food establishments
        const excludedTypes = [
            'gym', 'fitness_center', 'sports_complex', 'stadium', 'arena',
            'hospital', 'doctor', 'dentist', 'pharmacy', 'health',
            'school', 'university', 'library',
            'church', 'mosque', 'synagogue', 'temple',
            'gas_station', 'car_wash', 'car_repair',
            'atm', 'bank', 'insurance_agency',
            'lodging', 'hotel', 'motel',
            'shopping_mall', 'department_store', 'supermarket', 'grocery_or_supermarket'
        ];

        // Add user-disliked categories to exclusion list
        const dislikedCategories = preferences?.dislikedCategories || [];

        const filteredPlaces = uniquePlaces.filter(place => {
            const types = place.types || [];
            const typesLower = types.map(t => t.toLowerCase());
            
            // Check if any excluded type is in the place's types
            const hasExcludedType = typesLower.some(t =>
                excludedTypes.some(excluded => t.includes(excluded))
            );
            
            // Check if place matches a disliked category
            const hasDislikedCategory = dislikedCategories.some(disliked =>
                typesLower.some(t => t.includes(disliked))
            );
            
            // Must have at least a restaurant, food, cafe, or bar type
            const hasFoodType = typesLower.some(t =>
                ['restaurant', 'food', 'cafe', 'bakery', 'meal', 'bar', 'pub'].some(food =>
                    t.includes(food)
                )
            );
            
            return !hasExcludedType && !hasDislikedCategory && hasFoodType;
        });

        // Sort places to prioritize liked categories
        const likedCategories = preferences?.likedCategories || [];
        const sortedPlaces = filteredPlaces.sort((a, b) => {
            const aTypes = (a.types || []).map(t => t.toLowerCase());
            const bTypes = (b.types || []).map(t => t.toLowerCase());
            
            // Count how many liked categories each place has
            const aLikeScore = likedCategories.filter(liked => 
                aTypes.some(t => t.includes(liked))
            ).length;
            const bLikeScore = likedCategories.filter(liked => 
                bTypes.some(t => t.includes(liked))
            ).length;
            
            // Higher like score = comes first
            return bLikeScore - aLikeScore;
        });

        return sortedPlaces.map(transformGooglePlace);
    } catch (error) {
        console.error('[Places] Fetch error:', error);
        return [];
    }
}

/**
 * Transform Google place to our Place type
 */
function transformGooglePlace(place: GooglePlace): Place {
    // Get photo URL or use placeholder
    let photoUrl = getPlaceholderImage(place.types || []);

    // Construct photo URL using secure proxy endpoint
    // This prevents exposing the API key to clients
    if (place.photos && place.photos.length > 0) {
        const photoName = place.photos[0].name;
        // Generate a signed token for this photo to prevent unauthorized access
        const token = generatePhotoToken(photoName);
        photoUrl = `/api/photo?name=${encodeURIComponent(photoName)}&token=${token}`;
    }

    // Convert price
    let priceLevel: 1 | 2 | 3 | 4 = 2;
    switch (place.priceLevel) {
        case 'PRICE_LEVEL_INEXPENSIVE': priceLevel = 1; break;
        case 'PRICE_LEVEL_MODERATE': priceLevel = 2; break;
        case 'PRICE_LEVEL_EXPENSIVE': priceLevel = 3; break;
        case 'PRICE_LEVEL_VERY_EXPENSIVE': priceLevel = 4; break;
    }

    return {
        id: place.id, // Using the ID (e.g. "ChIJ...")
        name: place.displayName?.text || 'Unknown Place',
        rating: place.rating || 0,
        priceLevel,
        categories: (place.types || [])
            .map(formatCategory)
            .filter(c => !['Point Of Interest', 'Establishment'].includes(c))
            .slice(0, 3), // Limit to top 3
        photoUrl,
        address: place.formattedAddress || '',
        userRatingsTotal: place.userRatingCount,
        location: place.location ? {
            lat: place.location.latitude,
            lng: place.location.longitude,
        } : undefined,
    };
}

function formatCategory(type: string): string {
    return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Get a placeholder image for places without photos
 */
function getPlaceholderImage(categories: string[]): string {
    const categoryStr = categories.join(' ').toLowerCase();

    if (categoryStr.includes('movie') || categoryStr.includes('cinema') || categoryStr.includes('theater')) {
        return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800';
    }
    if (categoryStr.includes('sushi') || categoryStr.includes('japanese')) {
        return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800';
    }
    if (categoryStr.includes('pizza') || categoryStr.includes('italian')) {
        return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800';
    }
    if (categoryStr.includes('burger') || categoryStr.includes('american')) {
        return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800';
    }
    if (categoryStr.includes('mexican') || categoryStr.includes('taco')) {
        return 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800';
    }
    if (categoryStr.includes('chinese')) {
        return 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800';
    }
    if (categoryStr.includes('indian')) {
        return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800';
    }

    // Default restaurant image
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
}
