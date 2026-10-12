import { Svg } from "@/components/Svg";
import { Badge, Band, WalletButton, ZGrid, Zst, vars } from "@/components/landing/bits";
import { LandingClient } from "@/components/landing/LandingClient";

const BANDA = ["Cool brew coffee", "Cultura del buen café", "Calidad al paso", "Grab & go"];

export default function Home() {
  return (
    <>
      <Loader />
      <main className="view view--landing" id="view-landing">
        {/* HERO */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="wrap">
            <div className="hero__meta">
              <span className="label">Café al paso</span>
              <span className="label">Club de la Z</span>
            </div>

            <h1 className="hero__logo" id="hero-title">
              <span className="sr-only">ZORVO</span>
              <span className="hero__gl" id="hero-gl">
                <Svg name="logo" className="hero__svg" />
              </span>
            </h1>

            <div className="hero__sub">
              <Svg name="slogan" className="hero__slogan" label="Cool brew coffee" />
              <Svg name="est" className="hero__est" label="Establecido en 2026" />
            </div>

            <div className="hero__body">
              <div className="hero__copy">
                <p className="hero__lede">
                  El café de todos los días, ahora suma. Cada café que pedís es una{" "}
                  <Svg name="zsolid" className="zinline" label="Z" />. Juntás diez y el próximo va por nuestra cuenta.
                </p>
                <div className="hero__ctas">
                  <WalletButton />
                  <a className="link-arrow" href="/club" data-curtain="">
                    Ver mi tarjeta <span aria-hidden="true">→</span>
                  </a>
                </div>
                <p className="hero__fine label">Gratis · Sin apps · Android muy pronto</p>
              </div>

              <Zst hero t="31%" rr="-14px" s="66px" rot="16deg" speed={0.6} />
              <div className="hero__stage" data-hero-stage="">
                <div className="hero__walker" data-walker="">
                  <Svg name="steam" className="hero__steam" />
                  <Svg name="walker" />
                </div>
                <Badge id="badge-hero" className="hero__badge" />
                <Svg name="sparkle" className="doodle doodle--sparkle hero__sp1" />
                <Svg name="sparkle" className="doodle doodle--sparkle hero__sp2" />
                <svg className="hero__ground" viewBox="0 0 400 20" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 12C80 8 150 15 230 10s130 2 168-1" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* MARQUESINAS */}
        <div className="marquee" aria-hidden="true">
          <Zst t="-6%" l="64%" s="86px" rot="-12deg" speed={0.35} />
          <div className="band band--k"><Band items={[...BANDA].reverse()} dir={-1} /></div>
          <div className="band band--y"><Band items={BANDA} dir={1} /></div>
        </div>

        {/* MANIFIESTO */}
        <section className="manifesto" aria-labelledby="manifesto-title">
          <Zst t="3%" rr="-26px" s="104px" rot="22deg" speed={0.7} />
          <Zst t="84%" rr="7%" s="54px" rot="-20deg" speed={0.4} />
          <div className="wrap">
            <p className="label section-label">La historia</p>
            <h2 className="manifesto__big" id="manifesto-title" data-split="">
              La ciudad no frena. La gente va. Viene. Corre. Llega tarde. Sale antes.
            </h2>
            <div className="manifesto__row">
              <p className="manifesto__small">
                Y en medio de todo eso existen esos pequeños momentos que hacen que el día se sienta distinto. Un café antes de
                arrancar. Una pausa entre una cosa y la otra. Un minuto para vos antes de seguir.{" "}
                <strong>ZORVO nace para estar ahí.</strong>
              </p>
              <Svg name="leaner" className="manifesto__leaner" data-leaner="" />
            </div>
            <blockquote className="quote">
              <p>
                Aunque el momento sea corto, merece ser bueno.{" "}
                <mark className="quote__mark">
                  Muy bueno.
                  <Svg name="underline" className="quote__ul" />
                </mark>
              </p>
            </blockquote>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="steps" aria-labelledby="steps-title">
          <Zst t="44px" rr="-18px" s="78px" rot="-8deg" speed={0.5} />
          <div className="wrap">
            <p className="label section-label">El club de la Z</p>
            <h2 className="h-display" id="steps-title">
              Tres pasos.
              <br />
              Cero vueltas.
            </h2>
            <ol className="steps__list">
              <li className="step step--paper" style={vars({ i: 0 })}>
                <span className="step__num" aria-hidden="true">1</span>
                <Svg name="phone" className="step__art step__art--phone" />
                <div className="step__txt">
                  <h3>Sumá tu tarjeta</h3>
                  <p>Dejás tu nombre y la guardás en Apple Wallet. No hay que descargar nada.</p>
                </div>
              </li>
              <li className="step step--ink" style={vars({ i: 1 })}>
                <span className="step__num" aria-hidden="true">2</span>
                <Svg name="qr" className="step__art step__art--qr" />
                <div className="step__txt">
                  <h3>Mostrá tu QR</h3>
                  <p>Al pedir, el barista lo escanea. Dos segundos y listo.</p>
                </div>
              </li>
              <li className="step step--yellow" style={vars({ i: 2 })}>
                <span className="step__num" aria-hidden="true">3</span>
                <span className="step__art step__art--z">
                  <ZGrid n={5} className="step__zgrid" />
                </span>
                <div className="step__txt">
                  <h3>Juntá diez Z</h3>
                  <p>Cada café marca una Z. A la décima, el café va por nuestra cuenta.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* DEMO */}
        <section className="demo" aria-labelledby="demo-title">
          <Zst t="5%" rr="5%" s="60px" rot="18deg" speed={0.45} />
          <div className="wrap">
            <p className="label section-label">Probala</p>
            <h2 className="h-display" id="demo-title">
              Así se siente
              <br />
              sumar una Z.
            </h2>
            <div className="demo__stage" data-demo="">
              <div className="demo__card" data-demo-card="" data-cursor="Inclinala" />
              <div className="demo__controls">
                <button className="btn btn--ink demo__btn" type="button" data-demo-btn="">
                  <Svg name="cup" className="demo__btn-cup" />
                  <span data-demo-btn-label="">Pedir un café</span>
                </button>
                <p className="demo__count">
                  <span className="label">Tus Z</span> <b data-demo-count="">3</b>
                  <span>/10</span>
                </p>
                <span className="demo__note">
                  tocá acá
                  <Svg name="arrow" className="demo__arrow" />
                </span>
              </div>
            </div>
            <p className="demo__fine label">Es una demo. Tus Z de verdad se suman en el local.</p>
          </div>
        </section>

        {/* WALLET */}
        <section className="wallet" aria-labelledby="wallet-title">
          <Zst t="54%" l="-22px" s="96px" rot="-16deg" speed={0.6} />
          <Zst b="-34px" rr="9%" s="70px" rot="10deg" speed={0.25} />
          <div className="wrap wallet__grid">
            <div className="wallet__copy">
              <p className="label section-label">Apple Wallet</p>
              <h2 className="h-display" id="wallet-title">Tu tarjeta vive en tu iPhone.</h2>
              <p className="wallet__lede">
                Sin apps y sin papelitos que se pierden. El pase se actualiza solo cada vez que sumás una Z y te avisa cuando
                tenés un café de regalo.
              </p>
              <div className="wallet__ctas">
                <WalletButton />
                <span className="label wallet__soon">Android llega pronto</span>
              </div>
            </div>
            <div className="phone" data-phone="">
              <div className="phone__screen">
                <span className="phone__island" aria-hidden="true" />
                <p className="phone__time" aria-hidden="true">08:42</p>
                <div className="phone__stack" aria-hidden="true"><span /><span /></div>
                <div className="phone__pass" data-phone-pass="" />
                <div className="phone__notif" data-phone-notif="">
                  <Svg name="zsolid" className="phone__notif-icon" />
                  <span>
                    <b>ZORVO</b>Sumaste una Z. Te faltan 3 para tu café de regalo.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer__top">
            <Badge id="badge-footer" dark className="footer__badge" />
            <p className="footer__claim">Los momentos más breves merecen estar bien hechos.</p>
          </div>
          <Svg name="logo" className="footer__logo" label="ZORVO" />
          <div className="footer__row">
            <Svg name="slogan" className="footer__slogan" />
            <Svg name="mascot" className="footer__mascot" />
          </div>
          <nav className="footer__nav" aria-label="Pie de página">
            <a href="/club" data-curtain="">Mi tarjeta</a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener">Instagram</a>
            <a href="https://maps.google.com/?q=ZORVO+coffee" target="_blank" rel="noopener">Cómo llegar</a>
            <a href="/join" data-curtain="">Sumarme al club</a>
          </nav>
          <p className="footer__legal label">© 2026 ZORVO · Cool brew coffee · Est. 2026</p>
        </footer>
      </main>
      <LandingClient />
    </>
  );
}

function Loader() {
  return (
    <div className="loader" id="loader" aria-hidden="true">
      <div className="loader__inner">
        <ZGrid n={10} className="loader__grid" />
        <div className="loader__row">
          <span className="loader__count" data-loader-count="">00</span>
          <span className="label">
            /10
            <br />
            Preparando tu café
          </span>
        </div>
      </div>
    </div>
  );
}
