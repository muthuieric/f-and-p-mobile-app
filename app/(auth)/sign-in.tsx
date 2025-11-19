import { useRouter } from "expo-router";
import SignInScreen from "@/components/screens/SignInScreen";

export default function SignInPage() {
  const router = useRouter();

  return <SignInScreen onSignUp={() => router.push("/sign-up")} />;
}
