import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primary, 
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarStyle: {
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
        },
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 5
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="[id]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="scanner" options={{ href: null, headerShown: false, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="signature" options={{ href: null, headerShown: false, tabBarStyle: { display: "none" } }} />
    </Tabs>
  );
}