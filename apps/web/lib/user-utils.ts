/**
 * User utility functions for formatting and displaying user information
 */

export interface UserData {
  id: string;
  email?: string;
  name?: string;
}

/**
 * Format a user identifier (email, ID, etc.) into a display name
 * This function provides intelligent formatting for various user ID formats
 */
export function formatUserDisplayName(
  userId: string, 
  currentUser?: UserData | null,
  userCache?: Map<string, UserData>
): string {
  // If this is the current user, use their session data
  if (currentUser && (userId === currentUser.email || userId === currentUser.id)) {
    return currentUser.name || currentUser.email || userId;
  }
  
  // Check user cache for known users (could be populated from API)
  if (userCache?.has(userId)) {
    const user = userCache.get(userId);
    return user?.name || user?.email || userId;
  }
  
  // Extract readable name from email format
  if (userId.includes('@')) {
    return formatNameFromEmail(userId);
  }
  
  // Handle UUID or long ID formats
  if (userId.length > 20 && !userId.includes('@') && !userId.includes(' ')) {
    return 'User ' + userId.substring(0, 8) + '...';
  }
  
  // Return as-is if already looks like a name
  if (userId.includes(' ') || userId.length < 50) {
    return userId;
  }
  
  // Fallback
  return userId;
}

/**
 * Extract a display name from an email address
 */
export function formatNameFromEmail(email: string): string {
  if (!email.includes('@')) return email;
  
  const emailPart = email.split('@')[0];
  
  // Handle firstname.lastname format
  if (emailPart.includes('.')) {
    const parts = emailPart.split('.');
    return parts
      .map(part => capitalizeWord(part))
      .join(' ');
  }
  
  // Handle firstname_lastname format
  if (emailPart.includes('_')) {
    const parts = emailPart.split('_');
    return parts
      .map(part => capitalizeWord(part))
      .join(' ');
  }
  
  // Handle firstname-lastname format
  if (emailPart.includes('-')) {
    const parts = emailPart.split('-');
    return parts
      .map(part => capitalizeWord(part))
      .join(' ');
  }
  
  // Single word or other format
  return capitalizeWord(emailPart);
}

/**
 * Capitalize a word properly
 */
function capitalizeWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Get user initials for avatar display
 */
export function getUserInitials(userId: string, currentUser?: UserData | null): string {
  const displayName = formatUserDisplayName(userId, currentUser);
  
  // Split by spaces and take first letter of each word
  const words = displayName.split(' ').filter(word => word.length > 0);
  
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return 'U';
}

/**
 * Create a user cache that could be populated from an API
 * This allows for better user display when you have a user management system
 */
export function createUserCache(users: UserData[] = []): Map<string, UserData> {
  const cache = new Map<string, UserData>();
  
  users.forEach(user => {
    // Add entries for both ID and email
    cache.set(user.id, user);
    if (user.email) {
      cache.set(user.email, user);
    }
  });
  
  return cache;
}

/**
 * Mock function to simulate fetching user data
 * In a real app, this would call your user management API
 */
export async function fetchUserData(userId: string): Promise<UserData | null> {
  // This could be replaced with actual API calls
  // For now, return null to use email formatting
  return null;
} 