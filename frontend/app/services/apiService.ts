import { getAccessToken } from "../lib/actions";

const DEBUG = process.env.NODE_ENV !== 'production';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not defined"
  );
};

const apiService = {
  get: async (url: string) => {
    try {
      const fullUrl = `${API_URL}${url}`;

      // Get access token (works server-side too)
      const token = await getAccessToken();

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      if (DEBUG) console.log("🌐 Fetching from:", fullUrl);
      if (DEBUG) console.log("🛡️ Using headers:", headers);

      const response = await fetch(fullUrl, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      if (DEBUG) console.log("📡 Response status:", response.status);

      if (response.status === 204) {
        if (DEBUG) console.log("⚠️ No content in response (204)");
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        if (DEBUG) console.error("❌ API error response:", errorText);
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      
      if (DEBUG) console.log("✅ Data received:", data);
      return data;
    } catch (error) {
      if (DEBUG) console.error("❌ API call failed:", error);
      throw error;
    }
  },

  post: async function (url: string, data: any): Promise<any> {
    const headers: Record<string, string> = {};

    // Only attach token if NOT logging in
    if (!url.includes('/auth/login')) {
        const token = await getAccessToken();

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
            if (DEBUG) console.log('TOKEN FOUND');
        } else {
            if (DEBUG) console.log('NO TOKEN');
        }
    }

    if (!(data instanceof FormData)) {
        headers["Content-Type"] = "application/json";
        data = JSON.stringify(data);
    }

    if (DEBUG) console.log("🌐 Sending to:", `${API_URL}${url}`);

    const response = await fetch(`${API_URL}${url}`, {
        method: "POST",
        headers,
        body: data,
    });

    return response.json();
  },

  patch: async function (url: string, data: any): Promise<any> {
    const token = await getAccessToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // If data is not FormData, treat it as JSON
    if (!(data instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      data = JSON.stringify(data);
    }

    if (DEBUG) console.log("🌐 Patching to:", `${API_URL}${url}`);

    const response = await fetch(`${API_URL}${url}`, {
      method: "PATCH",
      headers,
      body: data,
    });

    return response.json();
  },

  delete: async function (url: string): Promise<any> {
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      if (DEBUG) console.log("🗑️ Deleting:", `${API_URL}${url}`);

      const response = await fetch(`${API_URL}${url}`, {
        method: "DELETE",
        headers,
      });

      if (response.status === 204) {
        return true;
      }

      if (!response.ok) {
        const errorText = await response.text();
        if (DEBUG) console.error("❌ DELETE error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      if (DEBUG) console.error("❌ DELETE failed:", error);
      throw error;
    }
  },

  getBlob: async (url: string): Promise<Blob> => {
    // FIX: Use the same action as GET/POST for consistency
    const token = await getAccessToken();

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized - Session expired");
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.blob();
  },
};

export default apiService;