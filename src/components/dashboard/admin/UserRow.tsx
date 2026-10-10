"use client";

import type { AdminUserView } from "@/types/domain";

interface UserRowProps {
  user: AdminUserView;
  roleLabel: string;
  actionLabel: string;
  actionClass: string;
  onAction: (user: AdminUserView) => void;
}

const FALLBACK_PHOTO = "https://placehold.co/40x40/cccccc/000000?text=No+Img";
const cellClass = "py-3 px-4 text-sm text-textColor";

export default function UserRow({
  user,
  roleLabel,
  actionLabel,
  actionClass,
  onAction,
}: UserRowProps) {
  return (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      <td className={cellClass}>{user.id}</td>
      <td className={cellClass}>
        <img
          src={user.photo || FALLBACK_PHOTO}
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_PHOTO;
          }}
        />
      </td>
      <td className={cellClass}>{user.name}</td>
      <td className={cellClass}>{user.email}</td>
      <td className={`${cellClass} capitalize`}>{user.gender}</td>
      <td className={`${cellClass} capitalize`}>{roleLabel}</td>
      <td className="py-3 px-4 text-sm">
        <button
          type="button"
          onClick={() => onAction(user)}
          className={actionClass}
        >
          {actionLabel}
        </button>
      </td>
    </tr>
  );
}
