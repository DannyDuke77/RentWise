"use client";

import { useBusiness } from "../providers/BusinessProvider";

const MANAGER_ROLES: readonly string[] = ["owner", "manager"];

export const usePermissions = () => {
  const { activeBusinessRole } = useBusiness();

  const isOwnerOrManager = activeBusinessRole != null && MANAGER_ROLES.includes(activeBusinessRole);

  return { isOwnerOrManager };
};