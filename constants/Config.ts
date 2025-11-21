import { Platform } from "react-native";

// 1. Your Local IP (For development) - Update this if your IP changes
const DEV_API_URL = "https://f-and-p-backend.onrender.com";
// const DEV_API_URL = "http://192.168.0.16:4000"; 

// 2. Your Production URL (For Vercel/AWS/Heroku)
const PROD_API_URL = "https://f-and-p-backend.onrender.com";

// 3. Auto-select based on environment (Dev vs Prod)
const BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export const Config = {
  SERVER_URL: BASE_URL,
  API_URL: `${BASE_URL}/api`,
};