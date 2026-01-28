
import 'dotenv/config';
import { fetchPlaces } from './src/lib/places/placesApi';

async function testPlaces() {
    console.log('Testing Google Places API...');

    // Default location (New York City)
    const location = { lat: 40.7128, lng: -74.0060 };

    console.log('\n--- Testing Restaurant Search (Nearby) ---');
    try {
        const restaurants = await fetchPlaces(location, 'restaurant');
        console.log(`Found ${restaurants.length} restaurants`);
        if (restaurants.length > 0) {
            console.log('Sample restaurant:', JSON.stringify(restaurants[0], null, 2));
        }
    } catch (error) {
        console.error('Restaurant search failed:', error);
    }

    console.log('\n--- Testing Movie Theater Search (Nearby) ---');
    try {
        const theaters = await fetchPlaces(location, 'movie');
        console.log(`Found ${theaters.length} theaters`);
        if (theaters.length > 0) {
            console.log('Sample theater:', JSON.stringify(theaters[0], null, 2));
        }
    } catch (error) {
        console.error('Theater search failed:', error);
    }

    console.log('\n--- Testing Search with Query "Pizza" ---');
    try {
        const results = await fetchPlaces(location, 'restaurant', 'Pizza');
        console.log(`Found ${results.length} results for "Pizza"`);
        if (results.length > 0) {
            console.log('Sample result:', JSON.stringify(results[0], null, 2));
        }
    } catch (error) {
        console.error('Query search failed:', error);
    }
}

testPlaces();
