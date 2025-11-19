import { Ionicons } from "@expo/vector-icons";
import { useSignIn, useSSO } from "@clerk/clerk-expo";
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
  KeyboardAvoidingView,
  Platform,
  Image
} from "react-native";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SocialButton from "@/components/ui/SocialButton";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

interface SignInFormData {
  email: string;
  password: string;
}

interface SignInScreenProps {
  onSignUp?: () => void;
}

export default function SignInScreen({ onSignUp }: SignInScreenProps) {
  useWarmUpBrowser();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignInFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
      } else {
        console.error("Sign in status:", signInAttempt.status);
      }
    } catch (err: any) {
      console.error("Sign in error:", JSON.stringify(err, null, 2));
      setError("root", {
        message: err.errors?.[0]?.message || "Invalid email or password",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = useCallback(
    async (strategy: "oauth_google" | "oauth_github" | "oauth_apple") => {
      setSocialLoading(true);
      try {
        const redirectUrl = AuthSession.makeRedirectUri({
          path: '/oauth-native-callback',
        });

        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
          redirectUrl,
        });

        if (createdSessionId) {
          setActive!({ session: createdSessionId });
        }
      } catch (err: any) {
        console.error("Social sign in error:", JSON.stringify(err, null, 2));
        if (err.code !== 'ERR_REQUEST_CANCELED') {
           setError("root", {
             message: "Social sign in failed. Please try again.",
           });
        }
      } finally {
        setSocialLoading(false);
      }
    },
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView className="px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          
          {/* UPDATED LOGO & BRANDING */}
          <View className="items-center pt-20 pb-10">
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
          </View>

          {/* Form */}
          <View className="mb-6">
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
                  label="Work Email"
                  placeholder="driver@gmail.com"
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
              rules={{ required: "Password is required" }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
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

            <TouchableOpacity 
              onPress={() => router.push("/(auth)/forgot-password")}
              className="mb-6"
            >
              <Text className="text-blue-600 text-right font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {errors.root && (
              <View className="bg-red-50 p-3 rounded-lg mb-4 border border-red-100">
                <Text className="text-red-600 text-sm text-center font-medium">
                  {errors.root.message}
                </Text>
              </View>
            )}

            <Button
              title="Login to Your Account"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
            />
          </View>

          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-slate-200" />
            <Text className="px-4 text-slate-400 font-medium">OR</Text>
            <View className="flex-1 h-px bg-slate-200" />
          </View>

          <View className="mb-8">
            <SocialButton
              provider="google"
              onPress={() => handleSocialSignIn("oauth_google")}
              loading={socialLoading}
            />
          </View>

          <View className="flex-row justify-center mb-10">
            <Text className="text-slate-500">New Driver? </Text>
            <TouchableOpacity onPress={onSignUp}>
              <Text className="text-blue-600 font-bold">Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}