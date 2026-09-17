import type { UserResponse, UserStatus } from "@/api/userApi";
import { TableCell, TableRow } from "../ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useNavigate } from "react-router-dom";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Edit } from "lucide-react";
import UpdateStatusUser from "./UpdateStatusUser";
import { Checkbox } from "../ui/checkbox";

interface Props {
  user: UserResponse;
  index: number;
  onToggleOne: (id: number) => void;
  selectedIds: Set<number>;
}

const STATUS_MAP: Record<
  UserStatus,
  { label: string; variant: "success" | "secondary" | "destructive" }
> = {
  ACTIVE: { label: "Hoạt động", variant: "success" },
  INACTIVE: { label: "Không hoạt động", variant: "destructive" },
};

const ROLE_MAP: Record<string, { label: string; className: string }> = {
  STAFF: {
    label: "Nhân viên",
    className: "text-blue-600 border-blue-200 bg-blue-50",
  },
  ADMIN: {
    label: "Quản trị viên",
    className: "text-purple-600 border-purple-200 bg-purple-50",
  },
};

const UserRow = ({ user, index, selectedIds, onToggleOne }: Props) => {
  const navigate = useNavigate();

  const role = ROLE_MAP[user.role] ?? ROLE_MAP.USER;
  const status = STATUS_MAP[user.status] ?? STATUS_MAP.ACTIVE;
  const initials = (user.fullName ?? user.username).charAt(0).toUpperCase();

  return (
    <TableRow key={user.userId} className="group cursor-pointer ">
      <TableCell>
        <Checkbox
          checked={selectedIds.has(user.userId)}
          onCheckedChange={() => onToggleOne(user.userId)}
          aria-label={`Chọn người dùng ${user.userId}`}
        />
      </TableCell>
      <TableCell className="text-center ">{index + 1}</TableCell>
      <TableCell>
        <span className="font-medium">{user.userCode || "—"}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span>{user.fullName ?? "—"}</span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <span className=" truncate max-w-40 line-clamp-1">{user.email}</span>
      </TableCell>
      <TableCell>
        <span className="">{user.cccd}</span>
      </TableCell>
      <TableCell>
        <span className="">{user.phone}</span>
      </TableCell>
      <TableCell>
        <span className="">{user.gender == "MALE" ? "Nam" : "Nữ"}</span>
      </TableCell>
      <TableCell>
        <span className="">{user.birthday}</span>
      </TableCell>
      <TableCell>
        <span className=" truncate max-w-40 line-clamp-1">
          {[user.streetAddress, user.ward, user.province]
            .map((s) => s?.trim())
            .filter((s): s is string =>
              Boolean(s && s !== "-" && s !== "null" && s !== "undefined"),
            )
            .join(", ") || "-"}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`text-xs ${role.className}`}>
          {role.label}
        </Badge>
      </TableCell>

      <TableCell>
        <Badge variant={status.variant}>{status.label}</Badge>
      </TableCell>

      <TableCell className="text-center flex items-center gap-3">
        <Button
          variant={"secondary"}
          size={"icon"}
          onClick={() => navigate(`/users/${user.userId}`)}
        >
          <Edit />
        </Button>
        <UpdateStatusUser user={user} />
      </TableCell>
    </TableRow>
  );
};

export default UserRow;
