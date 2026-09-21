import apiService from "@/app/services/apiService";

export type PortalAccess = {
    tenant: boolean;
    landlord: boolean;
    admin: boolean;
};

export async function getPortalAccess(): Promise<PortalAccess> {
    const response = await apiService.get("/api/auth/me/");
    return response.portal_access;
}