// Core types for the Sync application

// Place from Google Places API
export interface Place {
  id: string;
  name: string;
  rating: number;
  priceLevel: 1 | 2 | 3 | 4;
  categories: string[];
  photoUrl: string;
  address: string;
  distance?: number;
  userRatingsTotal?: number;
  location?: {
    lat: number;
    lng: number;
  };
}

// Individual swipe record
export interface SwipeData {
  placeId: string;
  decision: 'yes' | 'no';
  timestamp: Date;
  categories: string[];
}

// User within a session
export interface SessionUser {
  id: string;
  name: string;
  isHost: boolean;
  socketId: string | null;
  connected: boolean;
  lastSeenIndex: number;
  swipes: Map<string, SwipeData>;
}

// Match result
export interface Match {
  placeId: string;
  place: Place;
  matchedAt: Date;
  matchedBy: string[];
}

// Search configuration for progressive radius expansion
export interface SearchConfig {
  location: { lat: number; lng: number };
  placeTypes?: PlaceType[];
  searchType: 'restaurant' | 'movie';
  currentRadius: number;
  maxRadius: number;
  maxPlaces: number;
}

// Session state
export interface Session {
  id: string;
  hostId: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'waiting' | 'active' | 'completed';
  places: Place[];
  queue: string[];
  categoryVetos: Map<string, Set<string>>; // Still used for preference tracking
  categoryLikes: Map<string, Set<string>>;
  placeVetos: Map<string, Set<string>>; // placeId -> Set of userIds who swiped no
  users: Map<string, SessionUser>;
  matches: Match[];
  searchConfig?: SearchConfig;
}

// Client-side session state (serializable)
export interface ClientSessionState {
  sessionId: string;
  userId: string;
  userName: string;
  isHost: boolean;
  status: 'waiting' | 'active' | 'completed';
  queue: string[];
  places: Place[];
  currentIndex: number;
  swipes: Record<string, 'yes' | 'no'>;
  matches: Match[];
  users: Array<{
    id: string;
    name: string;
    isHost: boolean;
    connected: boolean;
  }>;
}

// Place type options for session creation
export type PlaceType = 
  | 'cafe'
  | 'fast_food'
  | 'fine_dining'
  | 'casual_dining'
  | 'bakery'
  | 'breakfast';

export type PlaceTypeIcon = 
  | 'utensils'
  | 'sparkles'
  | 'hamburger'
  | 'coffee'
  | 'croissant'
  | 'egg-fried';

export interface PlaceTypeOption {
  id: PlaceType;
  label: string;
  icon: PlaceTypeIcon;
  googleTypes?: string[];
  searchQuery?: string;
}

export const PLACE_TYPE_OPTIONS: PlaceTypeOption[] = [
  { id: 'casual_dining', label: 'Casual Dining', icon: 'utensils', googleTypes: ['restaurant'], searchQuery: 'restaurant' },
  { id: 'fine_dining', label: 'Fine Dining', icon: 'sparkles', googleTypes: ['restaurant'], searchQuery: 'fine dining restaurant' },
  { id: 'fast_food', label: 'Fast Food', icon: 'hamburger', googleTypes: ['fast_food_restaurant'], searchQuery: 'fast food restaurant' },
  { id: 'cafe', label: 'Cafe', icon: 'coffee', googleTypes: ['cafe', 'coffee_shop'], searchQuery: 'cafe coffee shop' },
  { id: 'bakery', label: 'Bakery', icon: 'croissant', googleTypes: ['bakery'], searchQuery: 'bakery' },
  { id: 'breakfast', label: 'Breakfast', icon: 'egg-fried', googleTypes: ['breakfast_restaurant', 'brunch_restaurant'], searchQuery: 'breakfast brunch restaurant' },
];

// Socket event payloads
export interface CreateSessionPayload {
  hostName: string;
  location: {
    lat: number;
    lng: number;
  };
  searchType: 'restaurant' | 'movie';
  placeTypes?: PlaceType[];
  searchQuery?: string;
  searchRadius?: number; // in meters
}

// Search radius options for session creation
export const SEARCH_RADIUS_OPTIONS = [
  { id: 1000, label: '1 km', description: 'Walking distance' },
  { id: 3000, label: '3 km', description: 'Short drive' },
  { id: 5000, label: '5 km', description: 'Nearby area' },
  { id: 10000, label: '10 km', description: 'Wider search' },
  { id: 20000, label: '20 km', description: 'Extended area' },
  { id: 50000, label: '>20 km', description: 'No distance limit' },
] as const;

export interface JoinSessionPayload {
  sessionId: string;
  userName: string;
}

export interface ReconnectPayload {
  sessionId: string;
  userId: string;
}

export interface SwipePayload {
  sessionId: string;
  userId: string;
  placeId: string;
  decision: 'yes' | 'no';
}

// Socket event responses
export interface SessionCreatedResponse {
  sessionId: string;
  userId: string;
  state: ClientSessionState;
}

export interface SessionJoinedResponse {
  userId: string;
  state: ClientSessionState;
}

export interface QueueUpdateEvent {
  queue: string[];
  places?: Place[];
  reason: 'veto_reorder' | 'initial' | 'more_places';
}

export interface MatchEvent {
  match: Match;
}

export interface UserJoinedEvent {
  user: {
    id: string;
    name: string;
    isHost: boolean;
    connected: boolean;
  };
}

export interface UserDisconnectedEvent {
  userId: string;
}

export interface UserReconnectedEvent {
  userId: string;
}

export interface SwipeRecordedEvent {
  userId: string;
  placeId: string;
  decision: 'yes' | 'no';
}

export interface SessionEndedEvent {
  reason: 'host_left' | 'expired';
  message: string;
}

export interface ErrorEvent {
  code: string;
  message: string;
}

// Socket event names
export const SOCKET_EVENTS = {
  // Client -> Server
  CREATE_SESSION: 'create-session',
  JOIN_SESSION: 'join-session',
  RECONNECT: 'reconnect-session',
  SWIPE: 'swipe',
  START_SESSION: 'start-session',
  REQUEST_MORE_PLACES: 'request-more-places',

  // Server -> Client
  SESSION_CREATED: 'session-created',
  SESSION_JOINED: 'session-joined',
  SESSION_STARTED: 'session-started',
  RECONNECTED: 'reconnected',
  USER_JOINED: 'user-joined',
  USER_DISCONNECTED: 'user-disconnected',
  USER_RECONNECTED: 'user-reconnected',
  SWIPE_RECORDED: 'swipe-recorded',
  QUEUE_UPDATE: 'queue-update',
  MATCH: 'match',
  SESSION_ENDED: 'session-ended',
  NO_MORE_PLACES: 'no-more-places',
  ERROR: 'error',
} as const;
