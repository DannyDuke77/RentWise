'use client';

import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { MoreVertical, Eye, Edit, Trash2, DownloadIcon } from "lucide-react";
import { Payment } from "@/app/src/types/Types";

interface PaymentActionsMenuProps {
    payment: Payment;
    onGenerateReceipt: (payment: Payment) => void;
    onEdit: (payment: Payment) => void;
    onDelete: (payment: Payment) => void;
    showView?: boolean;
    showEdit?: boolean;
    showDelete?: boolean;
}

const PaymentActionsMenu = ({
    payment,
    onGenerateReceipt,
    onEdit,
    onDelete,
    showView = true,
    showEdit = true,
    showDelete = true,
}: PaymentActionsMenuProps) => {
  const isStk = payment.source === "stk";

    return (
        <Menu as="div">
            <MenuButton className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-4 h-4" />
            </MenuButton>

            <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-in"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
            >
                <MenuItems className="absolute right-32 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <MenuItem>
                    {({ active }) => (
                    <button
                        onClick={() => onGenerateReceipt(payment)}
                        className={`${active ? "bg-gray-50" : ""} flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700`}
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Download Receipt
                    </button>
                    )}
                </MenuItem>

                {showEdit && !isStk && (
                    <MenuItem>
                    {({ active }) => (
                        <button
                        onClick={() => onEdit(payment)}
                        className={`${active ? "bg-gray-50" : ""} flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700`}
                        >
                        <Edit className="w-4 h-4" />
                        Edit Payment
                        </button>
                    )}
                    </MenuItem>
                )}

                {showDelete && !isStk && (
                    <MenuItem>
                    {({ active }) => (
                        <button
                        onClick={() => onDelete(payment)}
                        className={`${active ? "bg-red-50" : ""} flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600`}
                        >
                        <Trash2 className="w-4 h-4" />
                        Delete Payment
                        </button>
                    )}
                    </MenuItem>
                )}
                </MenuItems>
            </Transition>
        </Menu>
    );
};

export default PaymentActionsMenu;