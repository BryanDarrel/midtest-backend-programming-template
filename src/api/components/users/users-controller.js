const usersService = require('./users-service');
const { errorResponder, errorTypes } = require('../../../core/errors');

async function getUsers(request, response, next) {
  try {
    const { page_number = 1, page_size = 10, search } = request.query;
    let users;
    let total_pages;
    let has_previous_page;
    let has_next_page;

    if (search) {
      const filteredUsers = await usersService.getUsersByName(
        search,
        page_number,
        page_size
      );
      users = filteredUsers.users;
      count = filteredUsers.count;
      total_pages = filteredUsers.total_pages;
      has_previous_page = filteredUsers.has_previous_page;
      has_next_page = filteredUsers.has_next_page;
    } else {
      const result = await usersService.getFilteredUsers(
        page_number,
        page_size
      );
      count = result.count;
      total_pages = result.total_pages;
      has_previous_page = result.has_previous_page;
      has_next_page = result.has_next_page;
      users = result.users;
    }

    const formattedUsers = formatUsers(users);

    return response.status(200).json({
      page_number: parseInt(page_number),
      page_size: parseInt(page_size),
      count: formattedUsers.length,
      total_pages,
      has_previous_page,
      has_next_page,
      users: formattedUsers,
    });
  } catch (error) {
    return next(error);
  }
}

async function getUser(request, response, next) {
  try {
    const user = await getUserById(request.params.id);
    if (!user) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'User tidak dikenal'
      );
    }
    return response.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

async function createUser(request, response, next) {
  try {
    const userData = request.body;
    validatePassword(userData.password, userData.password_confirm);
    await checkIfEmailIsRegistered(userData.email);
    const newUser = await usersService.createUser(userData);
    return response.status(200).json(newUser);
  } catch (error) {
    return next(error);
  }
}

async function updateUser(request, response, next) {
  try {
    const userData = request.body;
    await checkIfEmailIsRegistered(userData.email);
    const updatedUser = await usersService.updateUser(
      request.params.id,
      userData
    );
    return response.status(200).json(updatedUser);
  } catch (error) {
    return next(error);
  }
}

async function deleteUser(request, response, next) {
  try {
    const deletedUser = await usersService.deleteUser(request.params.id);
    return response.status(200).json(deletedUser);
  } catch (error) {
    return next(error);
  }
}

async function changePassword(request, response, next) {
  try {
    const { id } = request.params;
    const { oldPassword, newPassword, confirmPassword } = request.body;

    validatePassword(newPassword, confirmPassword);
    const user = await getUserById(id);
    if (!user) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'User tidak ditemukan'
      );
    }

    await usersService.changeUserPassword(id, oldPassword, newPassword);
    return response.status(200).json({ message: 'Sandi berhasil diperbarui ' });
  } catch (error) {
    return next(error);
  }
}

async function getUserById(id) {
  const user = await usersService.getUser(id);
  return user;
}

async function checkIfEmailIsRegistered(email) {
  const isRegistered = await usersService.emailIsRegistered(email);
  if (isRegistered) {
    throw errorResponder(
      errorTypes.EMAIL_ALREADY_TAKEN,
      'Email sudah ada yang punya'
    );
  }
}

function validatePassword(newPassword, confirmPassword) {
  if (newPassword !== confirmPassword) {
    throw errorResponder(
      errorTypes.INVALID_PASSWORD,
      'konfirmasi sandi salah!'
    );
  }
}

function formatUsers(users) {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
  }));
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
};
