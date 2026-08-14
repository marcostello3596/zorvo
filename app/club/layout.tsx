import { ClubNav } from "@/components/club/ClubNav";

/**
 * Zorvo Club — layout móvil. Contenedor 480px SIEMPRE, incluso en desktop:
 * esto se usa parado en una fila, no sentado en un escritorio.
 */
export default function ClubLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <div className="mx-auto flex w-full max-w-[30rem] flex-1 flex-col">
        {children}
      </div>
      <ClubNav />
    </div>
  );
}
