/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 */

// CHANGED: Switched from Green to Blue-600 (#2563eb) and Blue-500 (#3b82f6)
const tintColorLight = "#2563eb"; 
const tintColorDark = "#3b82f6";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#FFFFFF",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: tintColorLight, // Uses the new Blue
    tabBarBackground: "#FFFFFF",
    tabBarBorder: "#F3F4F6",
    
    // Updated Logistics App Colors
    primary: "#2563eb",      // Blue-600
    primaryDark: "#1d4ed8",  // Blue-700 (for active states)
    secondary: "#3b82f6",    // Blue-500
    inactive: "#9CA3AF",
    success: "#10B981",      // Green still good for success states
    warning: "#F59E0B",
    error: "#EF4444",
    cardBackground: "#F9FAFB",
    border: "#E5E7EB",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#6B7280",
    tabIconSelected: tintColorDark, // Uses Lighter Blue for Dark Mode
    tabBarBackground: "#1F2937",
    tabBarBorder: "#374151",
    
    // Updated Logistics App Colors
    primary: "#3b82f6",      // Blue-500
    primaryDark: "#2563eb",  // Blue-600
    secondary: "#60a5fa",    // Blue-400
    inactive: "#6B7280",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    cardBackground: "#374151",
    border: "#4B5563",
  },
};