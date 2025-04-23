import AsyncStorage from '@react-native-async-storage/async-storage';

// Store data to AsyncStorage
export const storeData = async (key, value) => {
  try {
    if (typeof value === 'object') {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } else {
      await AsyncStorage.setItem(key, value);
    }
    return true;
  } catch (error) {
    console.error('Error storing data:', error);
    return false;
  }
};

// Get data from AsyncStorage
export const getData = async (key, isObject = false) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return isObject ? JSON.parse(value) : value;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving data:', error);
    return null;
  }
};

// Remove data from AsyncStorage
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing data:', error);
    return false;
  }
};

// Clear all data from AsyncStorage
export const clearStorage = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};

// Check if a key exists in AsyncStorage
export const hasKey = async (key) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys.includes(key);
  } catch (error) {
    console.error('Error checking for key:', error);
    return false;
  }
};

// Store token
export const storeToken = async (token) => {
  return await storeData('token', token);
};

// Get token
export const getToken = async () => {
  return await getData('token');
};

// Remove token
export const removeToken = async () => {
  return await removeData('token');
};

// Store user data
export const storeUser = async (userData) => {
  return await storeData('user', userData);
};

// Get user data
export const getUser = async () => {
  return await getData('user', true);
};

// Remove user data
export const removeUser = async () => {
  return await removeData('user');
};

export default {
  storeData,
  getData,
  removeData,
  clearStorage,
  hasKey,
  storeToken,
  getToken,
  removeToken,
  storeUser,
  getUser,
  removeUser,
};
