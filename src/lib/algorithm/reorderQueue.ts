/**
 * Checks if a place should be removed from the queue.
 * A place is only removed when ALL users have swiped "no" on that specific place.
 * 
 * @param placeVetos - Map of placeId to Set of userIds who swiped no
 * @param placeId - The place ID to check
 * @param totalUsers - Number of users in the session
 * @returns true if the place should be removed (all users vetoed it)
 */
export function shouldRemovePlace(
    placeVetos: Map<string, Set<string>>,
    placeId: string,
    totalUsers: number
): boolean {
    if (totalUsers === 0) return false;
    
    const vetoers = placeVetos.get(placeId);
    if (!vetoers) return false;
    
    // Remove only when ALL users have swiped "no" on this specific place
    return vetoers.size >= totalUsers;
}

/**
 * Records a place veto when a user swipes "no".
 * Modifies the placeVetos map in place.
 * 
 * @param placeVetos - Map of placeId to Set of userIds who swiped no
 * @param userId - The user who swiped no
 * @param placeId - The place that was vetoed
 * @returns true if this is a new veto (user hadn't already vetoed this place)
 */
export function recordPlaceVeto(
    placeVetos: Map<string, Set<string>>,
    userId: string,
    placeId: string
): boolean {
    if (!placeVetos.has(placeId)) {
        placeVetos.set(placeId, new Set());
    }

    const vetoSet = placeVetos.get(placeId)!;
    const previousSize = vetoSet.size;
    vetoSet.add(userId);

    return vetoSet.size > previousSize;
}

/**
 * Updates category vetos when a user swipes "no" on a place.
 * Used for preference tracking only, not for elimination.
 * Modifies the categoryVetos map in place.
 */
export function trackCategoryVeto(
    categoryVetos: Map<string, Set<string>>,
    userId: string,
    categories: string[]
): void {
    for (const category of categories) {
        if (!categoryVetos.has(category)) {
            categoryVetos.set(category, new Set());
        }
        categoryVetos.get(category)!.add(userId);
    }
}
