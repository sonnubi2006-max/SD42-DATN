import { NativeSelect, NativeSelectOption } from "./ui/native-select";

export interface ItemsSearchable {
  id: number;
  name: string;
}

interface Props {
  title: string;
  items: ItemsSearchable[];
  value: number | null;
  search: string;
  onChangeSelect: (v: number | null) => void;
}

export function SearchableSelect({
  title,
  items,
  value,
  onChangeSelect,
}: Props) {
  const handleOnChange = (e: string) => {
    onChangeSelect(e == title ? null : +e);
  };

  return (
    <NativeSelect
      className="h-9 w-max"
      value={value == null ? title : value}
      onChange={(e) => handleOnChange(e.target.value)}
    >
      <NativeSelectOption value={title}>{title}</NativeSelectOption>
      {items.map((item) => (
        <NativeSelectOption key={item.id} value={item.id}>
          {item.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
