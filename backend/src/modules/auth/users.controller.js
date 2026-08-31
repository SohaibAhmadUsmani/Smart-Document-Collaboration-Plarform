import { User } from './user.model.js';

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

export async function updateMyProfile(request, response) {
  try {
    const { name } = request.body;

    const updates = {};
    if (name !== undefined) updates.name = name;

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

export async function searchUsers(request, response) {
  try {
    const { search = '', limit = 10 } = request.query;

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const users = await User.find(query)
      .select('name email')
      .limit(Math.min(Number(limit), 25));

    return response.status(200).json({ users });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to search users', error: error.message });
  }
}