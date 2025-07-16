import {Dimensions, Platform} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Base dimensions (iPhone 13/14 as reference - more modern baseline)
const baseWidth = 390;
const baseHeight = 844;

// iOS device detection
export const isIOS = () => Platform.OS === 'ios';

// Enhanced device type detection
export const getDeviceType = () => {
  const aspectRatio = screenHeight / screenWidth;
  const diagonal = Math.sqrt(
    screenWidth * screenWidth + screenHeight * screenHeight,
  );

  if (screenWidth >= 768) {
    if (screenWidth >= 1024) {
      return 'ipadLarge'; // iPad Pro
    }
    return 'ipad'; // iPad regular/mini
  }

  if (isIOS()) {
    // iPhone detection based on screen dimensions
    if (screenWidth >= 428) return 'iphoneLarge'; // iPhone 14 Pro Max, 15 Plus
    if (screenWidth >= 414) return 'iphoneMedium'; // iPhone 11, 12, 13, 14
    if (screenWidth >= 390) return 'iphoneRegular'; // iPhone 12 mini, 13 mini, 14, 15
    if (screenWidth >= 375) return 'iphoneSmall'; // iPhone 6/7/8, X/XS/11 Pro
    return 'iphoneTiny'; // iPhone SE
  }

  // Android tablet/phone detection
  if (screenWidth >= 600 && aspectRatio < 1.8) {
    return 'androidTablet';
  }

  return 'androidPhone';
};

// Check if device is tablet
export const isTablet = () => {
  const deviceType = getDeviceType();
  return deviceType.includes('ipad') || deviceType === 'androidTablet';
};

// Scale function for responsive sizing with device-specific adjustments
export const scale = (size: number): number => {
  const deviceType = getDeviceType();
  const scaleWidth = screenWidth / baseWidth;
  const scaleHeight = screenHeight / baseHeight;
  const minScale = Math.min(scaleWidth, scaleHeight);

  switch (deviceType) {
    case 'ipadLarge':
      // iPad Pro - limit scaling to prevent UI from becoming too large
      return size * Math.min(minScale, 1.6);
    case 'ipad':
      // Regular iPad - moderate scaling
      return size * Math.min(minScale, 1.4);
    case 'iphoneLarge':
      // Large iPhones - slight scaling boost
      return size * Math.min(minScale, 1.2);
    case 'iphoneTiny':
      // iPhone SE - ensure UI doesn't become too small
      return size * Math.max(minScale, 0.85);
    case 'androidTablet':
      // Android tablets
      return size * Math.min(minScale, 1.5);
    default:
      // Regular phones
      return size * minScale;
  }
};

// Responsive font scaling with iOS-specific adjustments
export const scaleFontSize = (size: number): number => {
  const deviceType = getDeviceType();
  const scaleWidth = screenWidth / baseWidth;

  switch (deviceType) {
    case 'ipadLarge':
      // iPad Pro - conservative font scaling
      return size * Math.min(scaleWidth, 1.4);
    case 'ipad':
      // Regular iPad - moderate font scaling
      return size * Math.min(scaleWidth, 1.3);
    case 'iphoneLarge':
      // Large iPhones - balanced scaling
      return size * Math.min(scaleWidth, 1.15);
    case 'iphoneTiny':
      // iPhone SE - ensure readability
      return size * Math.max(scaleWidth, 0.9);
    case 'androidTablet':
      // Android tablets
      return size * Math.min(scaleWidth, 1.3);
    default:
      // Regular phones - standard scaling
      return size * Math.min(scaleWidth, 1.1);
  }
};

// Responsive horizontal scaling
export const scaleHorizontal = (size: number): number => {
  return (screenWidth / baseWidth) * size;
};

// Responsive vertical scaling
export const scaleVertical = (size: number): number => {
  return (screenHeight / baseHeight) * size;
};

// Get responsive padding based on screen size
export const getResponsivePadding = (): {
  horizontal: number;
  vertical: number;
  small: number;
  medium: number;
  large: number;
} => {
  if (isTablet()) {
    return {
      horizontal: scale(40),
      vertical: scale(60),
      small: scale(16),
      medium: scale(24),
      large: scale(40),
    };
  }

  return {
    horizontal: scale(24),
    vertical: scale(40),
    small: scale(12),
    medium: scale(16),
    large: scale(24),
  };
};

// Get responsive icon sizes
export const getIconSizes = () => {
  return {
    small: scale(18),
    medium: scale(24),
    large: scale(32),
    xlarge: scale(40),
  };
};

// Get responsive button sizes
export const getButtonSizes = () => {
  return {
    small: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
    },
    medium: {
      width: scale(48),
      height: scale(48),
      borderRadius: scale(24),
    },
    large: {
      width: scale(56),
      height: scale(56),
      borderRadius: scale(28),
    },
    xlarge: {
      width: scale(72),
      height: scale(72),
      borderRadius: scale(36),
    },
  };
};

export const responsive = {
  width: screenWidth,
  height: screenHeight,
  scale,
  scaleFontSize,
  scaleHorizontal,
  scaleVertical,
  isTablet: isTablet(),
  isIOS: isIOS(),
  deviceType: getDeviceType(),
  padding: getResponsivePadding(),
  iconSizes: getIconSizes(),
  buttonSizes: getButtonSizes(),
};
