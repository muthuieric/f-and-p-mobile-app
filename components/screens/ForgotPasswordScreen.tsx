import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ForgotPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { control, handleSubmit, watch, setError, formState: { errors } } = useForm({
    defaultValues: {
      email: "",
      code: "",
      password: "",
      confirmPassword: "",
    }
  });

  const email = watch("email");
  const password = watch("password");

  const onSendCode = async (data: any) => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: data.email,
      });
      setStep("code");
      Alert.alert("Check your email", "We sent you a verification code.");
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError("email", { message: err.errors?.[0]?.message || "Failed to send code." });
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (data: any) => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: data.code,
        password: data.password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        Alert.alert("Success", "Password reset successfully!");
        router.replace("/(tabs)");
      } else {
        Alert.alert("Error", "Verification incomplete.");
      }
    } catch (err: any) {
      setError("code", { message: err.errors?.[0]?.message || "Invalid code." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={{ paddingHorizontal: 24 }} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ flexGrow: 1 }}
        >
            <TouchableOpacity 
                onPress={() => router.back()} 
                className="mt-4 mb-6 w-10 h-10 items-center justify-center bg-white border border-slate-200 rounded-full shadow-sm"
            >
                <Ionicons name="arrow-back" size={20} color="#334155" />
            </TouchableOpacity>

            <View className="items-center mb-10">
                <View className="w-16 h-16 bg-blue-100 rounded-2xl items-center justify-center mb-4">
                    <Ionicons name="lock-closed" size={32} color="#2563eb" />
                </View>
                <Text className="text-2xl font-bold text-slate-900 text-center mb-2">
                    {step === "email" ? "Reset Password" : "Create New Password"}
                </Text>
                <Text className="text-slate-500 text-center px-4 leading-5">
                    {step === "email" 
                        ? "Enter the email associated with your driver account."
                        : `We sent a code to ${email}. Enter it below.`}
                </Text>
            </View>

            {step === "email" ? (
            <View>
                <Controller
                control={control}
                name="email"
                rules={{ required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } }}
                render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                    label="Email Address"
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
                <Button title="Send Verification Code" onPress={handleSubmit(onSendCode)} loading={loading} />
            </View>
            ) : (
            <View>
                <Controller
                control={control}
                name="code"
                rules={{ required: "Code is required" }}
                render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                    label="Verification Code"
                    placeholder="123456"
                    keyboardType="number-pad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.code?.message}
                    />
                )}
                />

                <Controller
                control={control}
                name="password"
                rules={{ required: "New password is required", minLength: { value: 8, message: "Min 8 characters" } }}
                render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                    label="New Password"
                    placeholder="Min 8 chars"
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

                <Controller
                control={control}
                name="confirmPassword"
                rules={{ required: "Confirm password", validate: (val) => val === password || "Passwords don't match" }}
                render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                    label="Confirm Password"
                    placeholder="Re-enter password"
                    secureTextEntry={!showConfirmPassword}
                    rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                    />
                )}
                />

                <Button title="Set New Password" onPress={handleSubmit(onResetPassword)} loading={loading} />
                
                <TouchableOpacity onPress={() => setStep("email")} className="mt-6">
                    <Text className="text-slate-500 text-center">Change email address</Text>
                </TouchableOpacity>
            </View>
            )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}