import { useRouter } from "expo-router";
import SignUpScreen from "@/components/screens/SignUpScreen";

export default function SignUpPage() {
  const router = useRouter();

  return <SignUpScreen onSignIn={() => router.push("/sign-in")} />;
}
