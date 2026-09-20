"use client";

import { useState } from "react";
import {
  Mail, UserPlus, Users, ShieldCheck,
  Clock, RefreshCw, XCircle, AlertTriangle, UserCog,
} from "lucide-react";

import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import InviteMemberModal from "@/app/components/modals/InviteMemberModal";
import ConfirmModal from "@/app/components/modals/ConfirmModal";
import Pagination from "@/app/components/ui/Pagination";
import { useBusiness } from "@/app/providers/BusinessProvider";
import { useBusinessMembers, useBusinessInvitations } from "@/app/hooks/queries/useBusinessQueries";
import {
  useCancelBusinessInvitation,
  useResendBusinessInvitation,
  useUpdateBusinessMemberRole,
  useRemoveBusinessMember,
} from "@/app/hooks/mutations/useBusinessMutations";
import { useToast } from "@/app/providers/ToastProvider";

const TeamTab = () => {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const { showToast } = useToast();

    const { activeBusinessId, activeBusinessRole, isLoading: businessLoading } = useBusiness();

    //Members pagination
    const [membersPage, setMembersPage] = useState(1);
    const [membersPageSize, setMembersPageSize] = useState(10);

    //Invitations pagination
    const [invitationsPage, setInvitationsPage] = useState(1);
    const [invitationsPageSize, setInvitationsPageSize] = useState(10);

    const {
        data: members,
        isLoading: membersLoading,
        isError,
    } = useBusinessMembers(activeBusinessId, membersPage, membersPageSize);

    const {
        data: invitations,
        isLoading: invitationsLoading,
        isError: invitationsError,
    } = useBusinessInvitations(
        activeBusinessId,
        invitationsPage,
        invitationsPageSize,
    );

    const teamMembers = Array.isArray(members) ? members : members?.results ?? [];
    const membersCount = Array.isArray(members) ? members.length : members?.count ?? 0;

    const pendingInvitations = Array.isArray(invitations) ? invitations : invitations?.results ?? [];
    const invitationsCount = Array.isArray(invitations) ? invitations.length : invitations?.count ?? 0;

    const updateMemberRole = useUpdateBusinessMemberRole();
    const removeMember = useRemoveBusinessMember();
    const cancelInvitation = useCancelBusinessInvitation();
    const resendInvitation = useResendBusinessInvitation();

    // Modal state
    const [roleChangeMember, setRoleChangeMember] = useState<any | null>(null);
    const [pendingRole, setPendingRole] = useState<"manager" | "staff" | null>(null);
    const [roleChangeError, setRoleChangeError] = useState<string | null>(null);

    const [removeMemberTarget, setRemoveMemberTarget] = useState<any | null>(null);
    const [removeError, setRemoveError] = useState<string | null>(null);

    const [cancelInvitationTarget, setCancelInvitationTarget] = useState<any | null>(null);
    const [cancelError, setCancelError] = useState<string | null>(null);

    // Role change handlers
    const handleRoleChangeRequest = (member: any, newRole: "manager" | "staff") => {
        if (newRole === member.role) return;
        setRoleChangeMember(member);
        setPendingRole(newRole);
        setRoleChangeError(null);
    };

    const handleConfirmRoleChange = () => {
        if (!roleChangeMember || !pendingRole || !activeBusinessId) return;

        updateMemberRole.mutate(
            {
                businessId: activeBusinessId,
                membershipId: roleChangeMember.id,
                role: pendingRole,
            },
            {
                onSuccess: () => {
                    showToast(
                        "Role updated",
                        `${roleChangeMember.name}'s role has been changed to ${pendingRole}.`,
                        "success"
                    );
                    closeRoleChangeModal();
                },
                onError: (error: any) => {
                    setRoleChangeError(
                        error?.response?.data?.detail ||
                        "Failed to update the member's role."
                    );
                },
            }
        );
    };

    const closeRoleChangeModal = () => {
        setRoleChangeMember(null);
        setPendingRole(null);
        setRoleChangeError(null);
    };

    const handleRemoveRequest = (member: any) => {
        setRemoveMemberTarget(member);
        setRemoveError(null);
    };

    const handleConfirmRemove = () => {
        if (!removeMemberTarget || !activeBusinessId) return;

        removeMember.mutate(
            {
                businessId: activeBusinessId,
                membershipId: removeMemberTarget.id,
            },
            {
                onSuccess: () => {
                    showToast("Member removed", `${removeMemberTarget.name} has been removed from the business.`, "success");

                    if (teamMembers.length === 1 && membersPage > 1) {
                        setMembersPage((p) => p - 1);
                    }

                    closeRemoveModal();
                },
                onError: (error: any) => {
                    setRemoveError(
                        error?.response?.data?.detail ||
                        "Failed to remove the team member."
                    );
                },
            }
        );
    };

    const closeRemoveModal = () => {
        setRemoveMemberTarget(null);
        setRemoveError(null);
    };

    const handleCancelInvitationRequest = (invitation: any) => {
        setCancelInvitationTarget(invitation);
        setCancelError(null);
    };

    const handleConfirmCancelInvitation = () => {
        if (!cancelInvitationTarget || !activeBusinessId) return;

        cancelInvitation.mutate(
            {
                businessId: activeBusinessId,
                invitationId: cancelInvitationTarget.id,
            },
            {
                onSuccess: () => {
                    showToast("Invitation cancelled", `The invitation to ${cancelInvitationTarget.email} has been cancelled.`, "success");

                    if (pendingInvitations.length === 1 && invitationsPage > 1) {
                        setInvitationsPage((p) => p - 1);
                    }

                    closeCancelInvitationModal();
                },
                onError: (error: any) => {
                    setCancelError(
                        error?.response?.data?.detail ||
                        "Failed to cancel the invitation."
                    );
                },
            }
        );
    };

    const closeCancelInvitationModal = () => {
        setCancelInvitationTarget(null);
        setCancelError(null);
    };

    const handleResendInvitation = (invitation: any) => {
        if (!activeBusinessId) return;

        resendInvitation.mutate(
            {
                businessId: activeBusinessId,
                invitationId: invitation.id,
            },
            {
                onSuccess: () => {
                    showToast("Invitation resent", `A new invitation has been sent to ${invitation.email}.`, "success");
                },
                onError: () => {
                    showToast("Resend failed", "Failed to resend the invitation.", "error");
                },
            }
        );
    };

    if (businessLoading || membersLoading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <LoadingSpinner
                    size="lg"
                    color="blue-600"
                    label="Loading team..."
                    showTimer={true}
                />
            </div>
        );
    }

    if (!activeBusinessId) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Users className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700">No Business Selected</h3>
                <p className="text-sm text-gray-400 mt-1">
                    Select a business from the sidebar to manage its team.
                </p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">
                    Failed to load your business team. Please try again.
                </p>
            </div>
        );
    }

    const isMutating =
        updateMemberRole.isPending ||
        removeMember.isPending ||
        cancelInvitation.isPending ||
        resendInvitation.isPending;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Team</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage the people who have access to this business.
                    </p>
                </div>

                {activeBusinessRole === "owner" && (
                    <button
                        type="button"
                        onClick={() => setIsInviteModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invite Member
                    </button>
                )}
            </div>

            {/* Members */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Members
                        </h3>
                        <span className="text-xs text-gray-400">({membersCount})</span>
                    </div>
                </div>

                {teamMembers.length === 0 ? (
                    <div className="py-16 text-center">
                        <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-600">No team members found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {teamMembers.map((member: any) => (
                            <div
                                key={member.id}
                                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-semibold text-blue-600">
                                            {member.name?.charAt(0)?.toUpperCase() ?? "?"}
                                        </span>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {member.name}
                                        </p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                            {member.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {activeBusinessRole === "owner" && member.role !== "owner" ? (
                                        <>
                                            <select
                                                value={member.role}
                                                disabled={isMutating}
                                                onChange={(e) => {
                                                    const newRole = e.target.value as "manager" | "staff";
                                                    handleRoleChangeRequest(member, newRole);
                                                }}
                                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:border-blue-500 disabled:opacity-50"
                                            >
                                                <option value="staff">Staff</option>
                                                <option value="manager">Manager</option>
                                            </select>

                                            <button
                                                type="button"
                                                disabled={isMutating}
                                                onClick={() => handleRemoveRequest(member)}
                                                className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Remove
                                            </button>
                                        </>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            {member.role}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Members Pagination */}
                {membersCount > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100">
                        <Pagination
                            page={membersPage}
                            pageSize={membersPageSize}
                            totalCount={membersCount}
                            onPageChange={setMembersPage}
                            onPageSizeChange={(size) => {
                                setMembersPageSize(size);
                                setMembersPage(1);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Pending Invitations */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Pending Invitations
                        </h3>
                        <span className="text-xs text-gray-400">({invitationsCount})</span>
                    </div>
                </div>

                {invitationsLoading ? (
                    <div className="px-6 py-10 text-center">
                        <p className="text-sm text-gray-500">Loading invitations...</p>
                    </div>
                ) : invitationsError ? (
                    <div className="px-6 py-10 text-center">
                        <p className="text-sm text-red-600">Failed to load pending invitations.</p>
                    </div>
                ) : pendingInvitations.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-600">No pending invitations</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Invitations you send will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {pendingInvitations.map((invitation: any) => (
                            <div
                                key={invitation.id}
                                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-4 h-4 text-amber-600" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {invitation.email}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500 capitalize">
                                                {invitation.role}
                                            </span>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-xs text-gray-400">
                                                Expires{" "}
                                                {new Date(invitation.expires_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {activeBusinessRole === "owner" && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            type="button"
                                            disabled={isMutating}
                                            onClick={() => handleResendInvitation(invitation)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${resendInvitation.isPending ? "animate-spin" : ""}`} />
                                            {resendInvitation.isPending ? "Resending..." : "Resend"}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={isMutating}
                                            onClick={() => handleCancelInvitationRequest(invitation)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <XCircle className="w-3.5 h-3.5" />
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Invitations Pagination */}
                {invitationsCount > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100">
                        <Pagination
                            page={invitationsPage}
                            pageSize={invitationsPageSize}
                            totalCount={invitationsCount}
                            onPageChange={setInvitationsPage}
                            onPageSizeChange={(size) => {
                                setInvitationsPageSize(size);
                                setInvitationsPage(1);
                            }}
                        />
                    </div>
                )}
            </div>

            {isInviteModalOpen && activeBusinessId && (
                <InviteMemberModal
                    isOpen
                    businessId={activeBusinessId}
                    onClose={() => setIsInviteModalOpen(false)}
                />
            )}

            <ConfirmModal
                isOpen={!!roleChangeMember && !!pendingRole}
                icon={<UserCog size={24} className="text-blue-500" />}
                title="Change Member Role"
                detail={
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to change{" "}
                            <span className="font-semibold text-gray-900">
                                "{roleChangeMember?.name}"
                            </span>{" "}
                            from{" "}
                            <span className="font-semibold text-gray-900 capitalize">
                                {roleChangeMember?.role}
                            </span>{" "}
                            to{" "}
                            <span className="font-semibold text-blue-600 capitalize">
                                {pendingRole}
                            </span>
                            ?
                        </p>
                        {roleChangeError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{roleChangeError}</p>
                            </div>
                        )}
                    </div>
                }
                message={
                    pendingRole === "manager"
                        ? "Managers can manage properties, units, tenants, and staff members."
                        : "Staff members have limited access for day-to-day operations."
                }
                message2="You can change this role again at any time."
                onConfirm={handleConfirmRoleChange}
                onClose={closeRoleChangeModal}
                confirmText="Change Role"
                confirmColor="bg-blue-600 hover:bg-blue-700"
                isLoading={updateMemberRole.isPending}
            />

            <ConfirmModal
                isOpen={!!removeMemberTarget}
                icon={<AlertTriangle size={24} className="text-red-500" />}
                title="Remove Team Member"
                detail={
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to remove{" "}
                            <span className="font-semibold text-gray-900">
                                "{removeMemberTarget?.name}"
                            </span>{" "}
                            from this business?
                        </p>
                        {removeError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{removeError}</p>
                            </div>
                        )}
                    </div>
                }
                message="This member will immediately lose access to all properties and data."
                message2="You can re-invite them later if needed."
                onConfirm={handleConfirmRemove}
                onClose={closeRemoveModal}
                confirmText="Remove Member"
                isLoading={removeMember.isPending}
            />

            <ConfirmModal
                isOpen={!!cancelInvitationTarget}
                icon={<XCircle size={24} className="text-red-500" />}
                title="Cancel Invitation"
                detail={
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to cancel the invitation sent to{" "}
                            <span className="font-semibold text-gray-900">
                                "{cancelInvitationTarget?.email}"
                            </span>
                            ?
                        </p>
                        {cancelError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{cancelError}</p>
                            </div>
                        )}
                    </div>
                }
                message="The invite link will no longer be valid."
                message2="You can send a new invitation at any time."
                onConfirm={handleConfirmCancelInvitation}
                onClose={closeCancelInvitationModal}
                confirmText="Cancel Invitation"
                isLoading={cancelInvitation.isPending}
            />
        </div>
    );
};

export default TeamTab;