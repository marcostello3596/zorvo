import type { ReactNode } from "react";

import { Svg } from "@/components/Svg";

/** Marco común de alta, ingreso y verificación. */
export function AuthShell({ titulo, bajada, children }: { titulo: ReactNode; bajada?: ReactNode; children: ReactNode }) {
  return (
    <main className="view view--app view--auth" id="contenido">
      <div className="app">
        <section className="reg">
          <Svg name="mascot" className="reg__mascot" />
          <p className="label">Club de la Z</p>
          <h1 className="h-display h-display--app">{titulo}</h1>
          {bajada ? <p className="reg__lede">{bajada}</p> : null}
          {children}
        </section>
      </div>
    </main>
  );
}
