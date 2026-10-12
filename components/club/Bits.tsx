"use client";

import { Svg } from "@/components/Svg";
import { useClub } from "@/components/club/ClubProvider";

export function BotonQr() {
  const { openQr } = useClub();
  return (
    <button className="btn btn--ink btn--block" type="button" onClick={openQr}>
      <Svg name="qr" className="btn__ico" />
      Mostrar mi QR
    </button>
  );
}

export function BotonWallet() {
  const { openWallet } = useClub();
  return (
    <button className="btn-wallet btn-wallet--block" type="button" onClick={openWallet}>
      <Svg name="wallet" className="btn-wallet__icon" />
      <span className="btn-wallet__txt">
        <small>Agregar a</small>Apple Wallet
      </span>
    </button>
  );
}

export function BotonPremio({ n }: { n: number }) {
  const { openQr } = useClub();
  return (
    <button className="premio-banner" type="button" onClick={openQr}>
      <Svg name="mascot" className="premio-banner__mascot" />
      <span className="premio-banner__txt">
        <span className="label">{n === 1 ? "Tenés un premio" : `Tenés ${n} premios`}</span>
        <b>{n === 1 ? "Café de regalo" : `${n} cafés de regalo`}</b>
        <span>Pedilo y mostrá tu QR: el barista lo canjea.</span>
      </span>
      <span className="premio-banner__go" aria-hidden="true">→</span>
    </button>
  );
}
