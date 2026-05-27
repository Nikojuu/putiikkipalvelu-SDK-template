import { Metadata } from "next";
import { getStoreConfig, getSEOValue, SEO_FALLBACKS } from "@/lib/storeConfig";
import { SEO_ENABLED } from "@/app/utils/constants";
import Subtitle from "@/components/subtitle";
import { WithdrawalForm } from "@/components/Withdrawal/WithdrawalForm";
import { storefront } from "@/lib/storefront";
import type { WithdrawalResolveTokenResponse } from "@putiikkipalvelu/storefront-sdk";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await getStoreConfig();

    const title = `${config.store.name} | Peruutusilmoitus`;
    const description =
      "Tee lakisääteinen peruutusilmoitus tilauksestasi.";
    const domain = getSEOValue(config.seo.domain, SEO_FALLBACKS.domain);

    return {
      title,
      description,
      robots: "noindex, follow",
      alternates: {
        canonical: `${domain}/peruutus`,
      },
      openGraph: {
        title,
        description,
        url: `${domain}/peruutus`,
        locale: "fi_FI",
        type: "website",
        siteName: config.store.name,
      },
    };
  } catch (error) {
    console.error("Error generating withdrawal page metadata:", error);

    return {
      title: "Peruutusilmoitus",
      description: "Tee lakisääteinen peruutusilmoitus tilauksestasi.",
      robots: "noindex, nofollow",
    };
  }
}

type SearchParams = Promise<{ orderNumber?: string; token?: string }>;

type TokenResolution =
  | { kind: "none" }
  | { kind: "ok"; data: WithdrawalResolveTokenResponse }
  | { kind: "expired" }
  | { kind: "invalid" };

async function resolveTokenSafely(token: string): Promise<TokenResolution> {
  try {
    const data = await storefront.withdrawal.resolveToken(token);
    return { kind: "ok", data };
  } catch (err) {
    const code = (err as { code?: string } | null)?.code ?? "";
    if (code === "EXPIRED") return { kind: "expired" };
    return { kind: "invalid" };
  }
}

const PeruutusRoute = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  void SEO_ENABLED;
  const params = await searchParams;
  const storeConfig = await getStoreConfig();
  const withdrawalEnabled = storeConfig.features?.withdrawalEnabled ?? true;
  const supportEmail = storeConfig.store.email;

  // Function-disabled fallback — stale email links or bookmarks shouldn't 404.
  if (!withdrawalEnabled) {
    return (
      <section className="pt-8 md:pt-16 pb-16 bg-warm-white">
        <Subtitle
          subtitle="Peruutusilmoitus"
          description="Peruutustoiminto ei ole käytettävissä."
          as="h1"
        />
        <div className="container mx-auto px-4 max-w-xl">
          <div className="rounded-md border border-rose-gold/30 bg-warm-white p-6 text-sm font-secondary text-charcoal/80">
            <p>
              Jos sinulla on tilaukseesi liittyvää kysyttävää, ota yhteyttä
              asiakaspalveluun
              {supportEmail ? (
                <>
                  :{" "}
                  <a
                    href={`mailto:${supportEmail}`}
                    className="underline text-charcoal hover:text-deep-burgundy"
                  >
                    {supportEmail}
                  </a>
                  .
                </>
              ) : (
                "."
              )}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const resolution: TokenResolution = params.token
    ? await resolveTokenSafely(params.token)
    : { kind: "none" };

  const prefill =
    resolution.kind === "ok"
      ? {
          name: resolution.data.customerName,
          email: resolution.data.customerEmail,
          orderNumber: resolution.data.orderNumber,
          lineItems: resolution.data.items ?? [],
        }
      : undefined;

  const tokenBanner =
    resolution.kind === "expired"
      ? "Linkki on vanhentunut. Voit silti tehdä peruutusilmoituksen täyttämällä lomakkeen alta."
      : resolution.kind === "invalid"
        ? "Linkin tarkistus epäonnistui. Voit silti tehdä peruutusilmoituksen täyttämällä lomakkeen alta."
        : null;

  return (
    <section className="pt-8 md:pt-16 pb-16 bg-warm-white">
      <Subtitle
        subtitle="Peruutusilmoitus"
        description="Tee peruutusilmoitus tilauksestasi. Lähetämme vahvistuksen sähköpostiisi. Tarkemmat peruutusehdot löydät palautusehdot-sivulta."
        as="h1"
      />

      <div className="container mx-auto px-4 max-w-xl">
        {tokenBanner ? (
          <div className="mb-4 border border-rose-gold/40 bg-cream/40 p-4 text-sm font-secondary text-charcoal/80">
            {tokenBanner}
          </div>
        ) : null}
        <WithdrawalForm
          defaultOrderNumber={prefill?.orderNumber ?? params.orderNumber}
          prefill={prefill}
        />
      </div>
    </section>
  );
};

export default PeruutusRoute;
