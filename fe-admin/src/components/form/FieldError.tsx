export function FieldError({ errors }: { errors: any[] }) {
  if (!errors || !errors.length) return null;
  const errorMsg = typeof errors[0] === "string" ? errors[0] : errors[0]?.message;
  return <p className="text-destructive text-xs">{errorMsg}</p>;
}
