import { Card, CardContent } from "@/components/ui/card";
import { useUserStatictis } from "@/hooks/useUser";

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="px-5 py-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl font-medium ${color ?? "text-foreground"}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function UserStatCards() {
  const { data, isLoading } = useUserStatictis();

  if (!data) {
    return;
  }

  const { activeUsers, adminUsers, bannedUsers, staffUsers, totalUsers } = data;

  return (
    <div className="grid grid-cols-5 gap-3">
      <StatCard label="Tổng tài khoản" value={totalUsers} />
      <StatCard
        label="Đang hoạt động"
        value={activeUsers}
        color="text-green-600"
      />
      <StatCard label="Bị cấm" value={bannedUsers} color="text-destructive" />

      <StatCard label="Nhân viên" value={staffUsers} color="text-blue-600" />
      <StatCard
        label="Quản trị viên"
        value={adminUsers}
        color="text-purple-600"
      />
    </div>
  );
}
