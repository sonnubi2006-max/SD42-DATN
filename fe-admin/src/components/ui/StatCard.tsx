import { Card, CardContent } from "@/components/ui/card";

export interface StatCardProps {
  label: string;
  value: number | string;
  color?: string;
}

export const StatCard = ({ label, value, color }: StatCardProps) => {
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
};
