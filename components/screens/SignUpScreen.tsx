import { Ionicons } from "@expo/vector-icons";
import { useSignUp, useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SocialButton from "@/components/ui/SocialButton";

// Browser optimization hook
export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface SignUpScreenProps {
  onSignIn?: () => void;
}

export default function SignUpScreen({ onSignIn }: SignUpScreenProps) {
  useWarmUpBrowser();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignUpFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      await signUp.create({
        firstName: data.firstName,
        lastName: data.lastName,
        emailAddress: data.email,
        password: data.password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      console.error("Sign up error:", JSON.stringify(err, null, 2));
      setError("root", {
        message: err.errors?.[0]?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      console.error("Verification error:", JSON.stringify(err, null, 2));
      setError("root", {
        message: err.errors?.[0]?.message || "Invalid verification code",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = useCallback(
    async (strategy: "oauth_google" | "oauth_github" | "oauth_apple") => {
      setSocialLoading(true);
      try {
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
          redirectUrl: AuthSession.makeRedirectUri(),
        });

        if (createdSessionId) {
          setActive!({ session: createdSessionId });
          router.replace("/(tabs)");
        }
      } catch (err: any) {
        console.error("Social sign up error:", JSON.stringify(err, null, 2));
        setError("root", {
          message: "Social sign up failed. Please try again.",
        });
      } finally {
        setSocialLoading(false);
      }
    },
    []
  );

  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
          <View className="items-center pt-16 pb-8">
            <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-6">
              <Ionicons name="mail-outline" size={40} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Check Your Email
            </Text>
            <Text className="text-gray-600 text-center mb-8">
              We've sent a verification code to your email address.
            </Text>
          </View>

          <Input
            label="Verification Code"
            placeholder="Enter 6-digit code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          {errors.root && (
            <Text className="text-red-500 text-sm mb-4 text-center">
              {errors.root.message}
            </Text>
          )}

          <Button
            title="Verify Email"
            onPress={onVerifyPress}
            loading={loading}
          />

          <TouchableOpacity
            onPress={() => setPendingVerification(false)}
            className="mt-4"
          >
            <Text className="text-blue-600 text-center font-medium">
              Back to Sign Up
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View className="items-center pt-16 pb-8">
            <View className="w-20 h-20 bg-blue-600 rounded-3xl items-center justify-center mb-6 shadow-blue-200 shadow-lg">
              {/* Changed icon to 'cube' for logistics/packages */}
              <Ionicons name="cube" size={32} color="white" />
            </View>
            <Text className="text-3xl font-bold text-slate-900 text-center mb-2">
              F & P
            </Text>
            <Text className="text-slate-500 text-center text-base">
              Driver Companion App
            </Text>
                 
          <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
            Create Your Account
          </Text>
          <Text className="text-gray-600 text-center">
            Join us and start your journey today!
          </Text>
        </View>

        {/* Social Buttons */}
        <View className="mb-6">
          {/* <SocialButton
            provider="apple"
            onPress={() => handleSocialSignUp("oauth_apple")}
            loading={socialLoading}
          /> */}
          <SocialButton
            provider="google"
            onPress={() => handleSocialSignUp("oauth_google")}
            loading={socialLoading}
          />
          {/* <SocialButton
            provider="github"
            onPress={() => handleSocialSignUp("oauth_github")}
            loading={socialLoading}
          /> */}
        </View>

        {/* Divider */}
        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="px-4 text-gray-500">Or register with email</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        {/* Form */}
        <View className="mb-6">
          <View className="flex-row space-x-3 mb-4">
            <View className="flex-1">
              <Controller
                control={control}
                name="firstName"
                rules={{ required: "First name is required" }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="First Name"
                    placeholder="John"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.firstName?.message}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="lastName"
                rules={{ required: "Last name is required" }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Last Name"
                    placeholder="Doe"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.lastName?.message}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              pattern: {
                value: /^\S+@\S+$/i,
                message: "Invalid email address",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="john@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="••••••••••••"
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                onRightIconPress={() => setShowPassword(!showPassword)}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          {errors.root && (
            <Text className="text-red-500 text-sm mb-4 text-center">
              {errors.root.message}
            </Text>
          )}

          <Button
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />
        </View>

        {/* Sign In Link */}
        <View className="flex-row justify-center mb-8">
          <Text className="text-gray-600">Already have an account? </Text>
          <TouchableOpacity onPress={onSignIn}>
            <Text className="text-blue-600 font-medium">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
