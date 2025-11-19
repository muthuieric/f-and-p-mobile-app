import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
  Platform,
  KeyboardAvoidingView
} from "react-native";
// Use the correct SafeAreaView to avoid warnings
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"; // Smoother keyboard handling
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface ProfileFormData {
  firstName: string;
  lastName: string;
}

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    },
  });

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            // Router redirect is handled by app/_layout.tsx
          } catch (error) {
            console.error("Sign out error:", error);
          }
        },
      },
    ]);
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      await user.update({
        firstName: data.firstName,
        lastName: data.lastName,
      });
      setEditMode(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      console.error("Update profile error:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (!user) return "";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase();
  };

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-slate-500">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <KeyboardAwareScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Background */}
        <View className="bg-blue-600 h-48 absolute top-0 left-0 right-0" />

        {/* Profile Card */}
        <View className="px-6 pt-12 mb-6">
            <View className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-200 items-center -mt-4">
                <View className="relative -mt-16 mb-4">
                    {user?.imageUrl ? (
                        <Image
                        source={{ uri: user.imageUrl }}
                        className="w-28 h-28 rounded-full border-4 border-white"
                        />
                    ) : (
                        <View className="w-28 h-28 rounded-full bg-slate-800 items-center justify-center border-4 border-white">
                        <Text className="text-white text-3xl font-bold">
                            {getInitials()}
                        </Text>
                        </View>
                    )}
                    <View className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-2 border-white" />
                </View>
                
                <Text className="text-2xl font-bold text-slate-900">
                    {user?.fullName || "Driver"}
                </Text>
                <Text className="text-slate-500 text-base mb-4">
                    {user?.primaryEmailAddress?.emailAddress}
                </Text>

                {/* Driver Badge */}
                <View className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                    <Ionicons name="shield-checkmark" size={16} color="#2563eb" />
                    <Text className="text-blue-700 font-semibold ml-1.5 text-xs uppercase tracking-wide">
                        Verified Driver
                    </Text>
                </View>
            </View>
        </View>

        {/* Profile Form */}
        <View className="px-6">
            <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm shadow-slate-200">
            <View className="flex-row items-center justify-between mb-6">
                <Text className="text-lg font-bold text-slate-900">
                Personal Information
                </Text>
                <TouchableOpacity
                onPress={() => {
                    if (editMode) {
                    setEditMode(false);
                    reset({
                        firstName: user?.firstName || "",
                        lastName: user?.lastName || "",
                    });
                    } else {
                    setEditMode(true);
                    }
                }}
                className="p-2 bg-slate-50 rounded-full"
                >
                <Ionicons
                    name={editMode ? "close" : "create-outline"}
                    size={20}
                    color="#2563eb"
                />
                </TouchableOpacity>
            </View>

            {editMode ? (
                <View>
                <View className="flex-row space-x-3 mb-2">
                    <View className="flex-1 mr-2">
                    <Controller
                        control={control}
                        name="firstName"
                        rules={{ required: "First name is required" }}
                        render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                            label="First Name"
                            placeholder="Enter first name"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            error={errors.firstName?.message}
                        />
                        )}
                    />
                    </View>
                    <View className="flex-1 ml-2">
                    <Controller
                        control={control}
                        name="lastName"
                        rules={{ required: "Last name is required" }}
                        render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                            label="Last Name"
                            placeholder="Enter last name"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            error={errors.lastName?.message}
                        />
                        )}
                    />
                    </View>
                </View>

                <Button
                    title="Save Changes"
                    onPress={handleSubmit(onSubmit)}
                    loading={loading}
                />
                </View>
            ) : (
                <View className="space-y-5">
                    <View className="flex-row items-center py-2 border-b border-slate-100">
                        <View className="w-8 items-center"><Ionicons name="person-outline" size={20} color="#64748b" /></View>
                        <View className="ml-3 flex-1">
                            <Text className="text-slate-400 text-xs uppercase">Full Name</Text>
                            <Text className="text-slate-900 text-base font-medium mt-0.5">{user?.fullName}</Text>
                        </View>
                    </View>
                    <View className="flex-row items-center py-2 border-b border-slate-100">
                        <View className="w-8 items-center"><Ionicons name="mail-outline" size={20} color="#64748b" /></View>
                        <View className="ml-3 flex-1">
                            <Text className="text-slate-400 text-xs uppercase">Email Address</Text>
                            <Text className="text-slate-900 text-base font-medium mt-0.5">{user?.primaryEmailAddress?.emailAddress}</Text>
                        </View>
                    </View>
                    <View className="flex-row items-center py-2">
                        <View className="w-8 items-center"><Ionicons name="calendar-outline" size={20} color="#64748b" /></View>
                        <View className="ml-3 flex-1">
                            <Text className="text-slate-400 text-xs uppercase">Joined Team</Text>
                            <Text className="text-slate-900 text-base font-medium mt-0.5">
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
            </View>

            {/* Settings Actions */}
            <View className="bg-white rounded-2xl p-2 mb-6 shadow-sm shadow-slate-200">
                <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-slate-50">
                    <View className="flex-row items-center">
                        <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-3">
                            <Ionicons name="notifications" size={18} color="#2563eb" />
                        </View>
                        <Text className="text-slate-700 font-semibold text-base">Notifications</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-slate-50">
                    <View className="flex-row items-center">
                        <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-3">
                            <Ionicons name="shield" size={18} color="#2563eb" />
                        </View>
                        <Text className="text-slate-700 font-semibold text-base">Privacy & Security</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center justify-between p-4">
                    <View className="flex-row items-center">
                        <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-3">
                            <Ionicons name="headset" size={18} color="#2563eb" />
                        </View>
                        <Text className="text-slate-700 font-semibold text-base">Help & Support</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </TouchableOpacity>
            </View>

            {/* Sign Out */}
            <View className="mb-8">
                <Button title="Sign Out" variant="outline" onPress={handleSignOut} />
                <Text className="text-center text-slate-400 text-xs mt-4">
                    Version 1.0.2 • Fast & Parcel Inc.
                </Text>
            </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}