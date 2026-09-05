import { User } from './user.model.js';

/**
 * Retrieves the profile of the authenticated user.
 *
 * [ROMAN URDU]:
 * Authenticated user ki profile details (password ke baghair) fetch karta hai.
 *
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 */
export async function getMyProfile(request, response) {
  try {
    const user = await User.findById(request.user.id).select('-password');

    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    return response.status(200).json({ user });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
}

/**
 * Updates editable profile fields for the authenticated user.
 *
 * [ROMAN URDU]:
 * Authenticated user ke profile fields (name, title, bio, timezone, language) update karta hai.
 *
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 */
export async function updateMyProfile(request, response) {
  try {
    const { name, title, bio, timezone, language } = request.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (title !== undefined) updates.title = title;
    if (bio !== undefined) updates.bio = bio;
    if (timezone !== undefined) updates.timezone = timezone;
    if (language !== undefined) updates.language = language;

    const user = await User.findByIdAndUpdate(
      request.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    return response.status(200).json({ message: 'Profile updated', user });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
}

/**
 * Escapes regex special characters in a raw search string to prevent ReDoS and regex injection.
 *
 * [ROMAN URDU]:
 * Raw text se regex special characters ko escape karta hai taake regex injection aur ReDoS attacks se bacha ja sake.
 *
 * @param {string} text - Raw search input string
 * @returns {string} Sanitized string safe for regular expression usage
 */
export function escapeRegex(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Searches users by name or email with sanitized regex to prevent ReDoS vulnerabilities.
 *
 * [ROMAN URDU]:
 * Users ko name ya email se search karta hai. Regex special characters ko sanitize karta hai
 * taake ReDoS aur injection vulnerabilities se platform mehfooz rahe.
 *
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 */
export async function searchUsers(request, response) {
  try {
    const { search = '', limit = 10 } = request.query;

    const trimmed = typeof search === 'string' ? search.trim() : '';
    const sanitizedSearch = escapeRegex(trimmed);

    const query = sanitizedSearch
      ? {
          $or: [
            { name: { $regex: sanitizedSearch, $options: 'i' } },
            { email: { $regex: sanitizedSearch, $options: 'i' } }
          ]
        }
      : {};

    const users = await User.find(query)
      .select('name email')
      .limit(Math.min(Math.max(Number(limit) || 10, 1), 25));

    return response.status(200).json({ users });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to search users', error: error.message });
  }
}