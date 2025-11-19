// IconSymbol component using Ionicons from Expo Vector Icons
// CHANGED: Switched from MaterialIcons to Ionicons for consistency with the rest of the app

import Ionicons from "@expo/vector-icons/Ionicons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

// Mapping SF Symbols to Ionicons
type IconMapping = Record<string, ComponentProps<typeof Ionicons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation icons
  "house.fill": "home",
  "paperplane.fill": "send",
  magnifyingglass: "search",
  "tag.fill": "pricetag",
  "cart.fill": "cart",
  "person.fill": "person",
  "explore.fill": "compass",

  // UI and utility icons
  "square.grid.2x2": "grid",
  "heart.fill": "heart",
  heart: "heart-outline",
  plus: "add",
  minus: "remove",
  "star.fill": "star",
  star: "star-outline",
  "chevron.right": "chevron-forward",
  "chevron.left": "chevron-back",
  "chevron.left.forwardslash.chevron.right": "code-slash",

  // Common app icons
  "location.fill": "location",
  location: "location-outline",
  "clock.fill": "time",
  "bell.fill": "notifications",
  bell: "notifications-outline",
  "gearshape.fill": "settings",
  "line.horizontal.3": "menu",
  xmark: "close",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  "arrow.up": "arrow-up",
  "arrow.down": "arrow-down",

  // Action icons
  "eye.fill": "eye",
  "eye.slash.fill": "eye-off",
  checkmark: "checkmark",
  "exclamationmark.circle.fill": "alert-circle",
  "info.circle.fill": "information-circle",
  "trash.fill": "trash",
  pencil: "pencil",
  "camera.fill": "camera",
  "photo.fill": "image",

  // Logistics / Delivery Specific (Added for Fast & Parcel)
  "shippingbox.fill": "cube",
  "cube.fill": "cube",
  "truck.fill": "bus", // Ionicons doesn't have a great truck, bus/car is closest generic
  "signature": "create",

} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name];

  if (!iconName) {
    return (
      <Ionicons
        color={color}
        size={size}
        name="help-circle-outline"
        style={style}
      />
    );
  }

  return (
    <Ionicons
      color={color}
      size={size}
      name={iconName}
      style={style}
    />
  );
}

export type IconName = IconSymbolName;