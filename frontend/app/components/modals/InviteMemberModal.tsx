"use client";

import { useState, useEffect, useRef } from "react";
import { Mail, UserPlus, AlertCircle, Lightbulb, Shield, ChevronDown } from "lucide-react";

import Modal from "../ui/Modal";
import { useInviteBusinessMember } from "@/app/hooks/mutations/useBusinessMutations";
import { useToast } from "@/app/providers/ToastProvider";

interface InviteMemberModalProps {
  businessId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ROLES = [
  { value: "staff", label: "Staff" },
  { value: "manager", label: "Manager" },
] as const;

const InviteMemberModal = ({
  businessId,
  isOpen,
  onClose,
}: InviteMemberModalProps) => {
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "staff">("staff");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const isSubmitting = useRef(false);

  const inviteMember = useInviteBusinessMember();

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setRole("staff");
      setErrors({});
    }
  }, [isOpen]);

  const submitInvite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;

    setErrors({});

    if (email.trim() === "") {
      showToast(
        "Email required",
        "Enter the email address of the person you want to invite.",
        "error"
      );
      setErrors({ email: ["Email address is required"] });
      return;
    }

    isSubmitting.current = true;

    try {
      await inviteMember.mutateAsync({
        businessId,
        email: email.trim(),
        role,
      });

      showToast(
        "Invitation sent",
        `An invitation has been sent to ${email.trim()}.`,
        "success"
      );

      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.email?.[0] ||
        "Failed to send the invitation.";

      showToast("Invitation failed", message, "error");

      setErrors(
        error?.response?.data || {
          general: ["An unexpected error occurred. Please try again."],
        }
      );
    } finally {
      isSubmitting.current = false;
    }
  };

  const content = (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Invite Team Member
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Send an invitation to someone to join your team.
        </p>
      </div>

      {/* Form */}
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{errors.general[0]}</p>
              </div>
            </div>
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              placeholder="agent@example.com"
              className={`w-full pl-9 pr-3 py-2.5 border ${
                errors.email ? "border-red-300" : "border-gray-300"
              } rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
            />
          </div>
          {errors.email && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{errors.email[0]}</p>
            </div>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Role <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as "manager" | "staff");
                clearError("role");
              }}
              className={`
                w-full pl-10 pr-10 py-2.5 border-2 rounded-lg text-sm text-gray-900 bg-white transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-400 appearance-none cursor-pointer
                ${errors.role ? "border-red-300 focus:ring-red-100 focus:border-red-500" : "border-gray-300"}
              `}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value} className="py-1">
                  {r.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform group-hover:rotate-180" />
          </div>
          {errors.role && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{errors.role[0]}</p>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={inviteMember.isPending}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            onClick={submitInvite}
            disabled={inviteMember.isPending}
            className="flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {inviteMember.isPending ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Send Invitation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <Modal
      label="Invite Team Member"
      isOpen={isOpen}
      close={onClose}
      content={content}
      maxWidth="max-w-md"
    />
  );
};

export default InviteMemberModal;