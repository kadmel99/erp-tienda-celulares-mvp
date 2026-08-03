import { UserMenu } from "./user-menu";

type Props = {
  left: React.ReactNode;
  userName: string;
  roleLabel: string;
};

export function Header({ left, userName, roleLabel }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-panel)] px-6">
      {left}
      <UserMenu userName={userName} roleLabel={roleLabel} />
    </header>
  );
}
