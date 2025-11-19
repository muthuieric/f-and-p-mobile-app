import { useAuth } from "@clerk/clerk-expo";
import { Config } from "@/constants/Config";
import { Shipment } from "@/types";

export const useShipmentApi = () => {
  const { getToken } = useAuth();

  // Internal helper to handle headers and tokens automatically
  const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error("Authentication session expired. Please login again.");
      }

      const res = await fetch(`${Config.API_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Error: ${res.status}`);
      }

      // Return the response object so caller can get headers if needed (like X-Driver-ID)
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
      const tasks = await res.json();
      const driverId = res.headers.get("X-Driver-ID");
      return { tasks: tasks as Shipment[], driverId };
    },

    // GET /api/shipments/:id
    getShipmentDetails: async (id: string) => {
      const res = await authenticatedFetch(`/shipments/${id}`);
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