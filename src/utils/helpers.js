// This file contains utility functions that can be used throughout the application.

const generateTrackingId = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000);
  return `GT-${randomNum}`;
};

const validateTrackingData = (data) => {
  const { sender, receiver } = data;
  if (!sender || !receiver) {
    return false;
  }
  return true;
};

module.exports = {
  generateTrackingId,
  validateTrackingData,
};