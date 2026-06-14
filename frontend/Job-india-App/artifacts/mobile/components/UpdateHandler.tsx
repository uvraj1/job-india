import React, { useEffect } from 'react';
import { Platform } from 'react-native';

export const UpdateHandler = () => {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const checkUpdates = async () => {
      try {
        const Updates = require('expo-updates');
        if (!Updates.isEnabled) return;

        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (_e) {
      }
    };

    checkUpdates();
  }, []);

  return null;
};
