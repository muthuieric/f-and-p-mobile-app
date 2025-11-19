import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerClassName?: string;
}

export default forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerClassName = "",
    ...props
  },
  ref
) {
  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="text-slate-700 text-sm font-semibold mb-2">
          {label}
        </Text>
      )}
      <View className="relative">
        <View
          className={`flex-row items-center bg-white border-2 rounded-xl px-4 py-3.5 ${
            error ? "border-red-500" : "border-slate-200"
          }`}
        >
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={20}
              color={error ? "#ef4444" : "#64748b"} // red-500 or slate-500
              style={{ marginRight: 12 }}
            />
          )}
          <TextInput
            ref={ref}
            className="flex-1 text-slate-900 text-base font-medium"
            placeholderTextColor="#94a3b8" // slate-400
            {...props}
          />
          {rightIcon && (
            <TouchableOpacity onPress={onRightIconPress} className="ml-3">
              <Ionicons
                name={rightIcon}
                size={20}
                color={error ? "#ef4444" : "#64748b"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {error && (
        <View className="flex-row items-center mt-1.5 ml-1">
            <Ionicons name="alert-circle" size={14} color="#ef4444" />
            <Text className="text-red-500 text-xs font-medium ml-1">{error}</Text>
        </View>
      )}
    </View>
  );
});