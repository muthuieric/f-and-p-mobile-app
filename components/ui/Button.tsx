import React from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "small" | "medium" | "large";
}

export default function Button({
  title,
  loading = false,
  variant = "primary",
  size = "large",
  disabled,
  ...props
}: ButtonProps) {
  const getButtonStyles = () => {
    const baseStyles = "rounded-xl items-center justify-center";

    // Size styles
    const sizeStyles = {
      small: "px-4 py-2",
      medium: "px-6 py-3",
      large: "px-6 py-4",
    };

    // Variant styles
    const variantStyles = {
      // CHANGED: bg-black -> bg-blue-600
      primary: disabled || loading ? "bg-blue-400" : "bg-blue-600",
      secondary: "bg-gray-100 border border-gray-200",
      outline:
        disabled || loading
          ? "bg-white border-2 border-gray-200"
          : "bg-white border-2 border-blue-600", // CHANGED: border-black -> border-blue-600
      danger: "bg-red-500",
    };

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`;
  };

  const getTextStyles = () => {
    const baseStyles = "font-semibold";

    const sizeStyles = {
      small: "text-sm",
      medium: "text-base",
      large: "text-base",
    };

    const variantStyles = {
      primary: "text-white",
      secondary: "text-gray-700",
      outline: disabled || loading ? "text-gray-400" : "text-blue-600", // CHANGED: text-black -> text-blue-600
      danger: "text-white",
    };

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`;
  };

  return (
    <TouchableOpacity
      className={getButtonStyles()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? "#ffffff" : "#2563eb"}
        />
      ) : (
        <Text className={getTextStyles()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}