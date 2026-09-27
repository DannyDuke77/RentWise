import { getAccessToken } from "../src/lib/actions";

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not defined"
  );
};

let activeBusinessId: string | null = null;

export function setApiBusinessId(id: string | null) {
  activeBusinessId = id;
}

function createApiError(status: number, data: any) {
  const error = new Error(
    data?.detail ||
    data?.message ||
    `HTTP error! status: ${status}`
  );

  (error as any).response = {
    status,
    data,
  };

  return error;
}

const apiService = {
  get: async (url: string) => {
    try {
      const fullUrl = `${API_URL}${url}`;

      const token = await getAccessToken();

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      if (activeBusinessId) {
        headers["X-Business-ID"] = activeBusinessId;
      }

      console.log("🌐 Fetching from:", fullUrl);
      // console.log("🛡️ Using headers:", headers);

      const response = await fetch(fullUrl, {
        method: "GET",
        headers,
        cache: "no-store",
        next: { revalidate: 600 }
      });

      // console.log("📡 Response status:", response.status);

      if (response.status === 204) {
        console.log("⚠️ No content in response (204)");
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API error response:", errorText);
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      
      // console.log("✅ Data received:", data);
      return data;
    } catch (error) {
      console.error("❌ API call failed:", error);
      throw error;
    }
  },

  post: async function (url: string, data: any): Promise<any> {
    const headers: Record<string, string> = {};

    if (!url.includes("/auth/login")) {
      const token = await getAccessToken();

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    if (activeBusinessId) {
      headers["X-Business-ID"] = activeBusinessId;
    }

    if (!(data instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      data = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${url}`, {
      method: "POST",
      headers,
      body: data,
    });

    const responseText = await response.text();
    const responseData = responseText
      ? JSON.parse(responseText)
      : null;

    if (!response.ok) {
      throw createApiError(
        response.status,
        responseData
      );
    }

    return responseData;
  },

  patch: async function (url: string, data: any): Promise<any> {
    const token = await getAccessToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (activeBusinessId) {
      headers["X-Business-ID"] = activeBusinessId;
    }

    if (!(data instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      data = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${url}`, {
      method: "PATCH",
      headers,
      body: data,
    });

    const responseText = await response.text();
    const responseData = responseText
      ? JSON.parse(responseText)
      : null;

    if (!response.ok) {
      throw createApiError(
        response.status,
        responseData
      );
    }

    return responseData;
  },

  delete: async function (url: string): Promise<any> {
    const token = await getAccessToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (activeBusinessId) {
      headers["X-Business-ID"] = activeBusinessId;
    }

    const response = await fetch(`${API_URL}${url}`, {
      method: "DELETE",
      headers,
    });

    if (response.status === 204) {
      return { success: true };
    }

    const responseText = await response.text();
    const responseData = responseText
      ? JSON.parse(responseText)
      : null;

    if (!response.ok) {
      throw createApiError(
        response.status,
        responseData
      );
    }

    return responseData;
  },

  getBlob: async (url: string): Promise<Blob> => {
    const token = await getAccessToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (activeBusinessId) {
      headers["X-Business-ID"] = activeBusinessId;
    }

    console.log("📥 Downloading:", `${API_URL}${url}`);

    const response = await fetch(`${API_URL}${url}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Blob fetch error:", errorText);

      if (response.status === 401) {
        throw new Error("Unauthorized - Session expired");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  },
};

export default apiService;