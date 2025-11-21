import { useAuth } from "@clerk/clerk-expo";
import { Config } from "@/constants/Config";
import { Shipment } from "@/types";

export const useShipmentApi = () => {
  const { getToken, signOut } = useAuth();

  // Internal helper to handle headers and tokens automatically
  const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = await getToken();
      
      // SAFETY CHECK: If no token, DO NOT THROW. 
      // Just return a dummy response. The RootLayout will handle the redirect.
      if (!token) {
        console.log("⚠️ [API] No token found, skipping fetch to prevent crash.");
        return { 
            ok: false, 
            status: 401, 
            json: async () => ({}) 
        } as Response;
      }

      const res = await fetch(`${Config.API_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          ...options.headers,
        },
      });

      // Handle 401 (Unauthorized) from backend by logging out locally
      if (res.status === 401) {
        console.log("❌ [API] Session expired, signing out.");
        await signOut();
        return { 
            ok: false, 
            status: 401, 
            json: async () => ({}) 
        } as Response;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Error: ${res.status}`);
      }

      return res;
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  };

  return {
    // GET /api/drivers
    getDriverTasks: async () => {
      const res = await authenticatedFetch("/drivers");
      
      // Safety: If 401 or error, return empty list instead of crashing
      if (!res.ok) return { tasks: [], driverId: null };
      
      const tasks = await res.json();
      const driverId = res.headers.get("X-Driver-ID");
      return { tasks: tasks as Shipment[], driverId };
    },

    // GET /api/shipments/:id
    getShipmentDetails: async (id: string) => {
      const res = await authenticatedFetch(`/shipments/${id}`);
      if (!res.ok) throw new Error("Could not fetch details");
      return (await res.json()) as Shipment;
    },

    // PUT /api/shipments/:id (Update Status)
    updateStatus: async (id: string, status: string) => {
      const res = await authenticatedFetch(`/shipments/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      return await res.json();
    },

    // POST /api/shipments/:id/signature
    uploadSignature: async (id: string, trackingNumber: string, signatureBase64: string) => {
      // Clean the base64 string if it has the prefix
      const cleanSignature = signatureBase64.replace("data:image/png;base64,", "");
      
      const res = await authenticatedFetch(`/shipments/${id}/signature`, {
        method: "POST",
        body: JSON.stringify({
          signature: `data:image/png;base64,${cleanSignature}`,
          trackingNumber,
        }),
      });
      return await res.json();
    }
  };
};