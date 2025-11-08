import React from 'react';
import * as WebBrowser from 'expo-web-browser';

/**
 * A custom hook to warm up the browser for OAuth flows.
 * This pre-loads the browser instance, making the auth flow
 * feel faster and more responsive.
 * Based on the guide at: https://clerk.com/docs/expo/guides/users/reading
 */
export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // Warm up the browser to improve UX
    void WebBrowser.warmUpAsync();

    // Clean up the browser instance when the component unmounts
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};