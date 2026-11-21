/**
 * Everything the page shows.
 *
 * This is an INDEX of projects, not a landing page for one of them. Every
 * string that describes the page must stay true when the second project
 * arrives, so nothing here names a single product except a project's own entry.
 *
 * Adding a project means adding one entry: the numbering, the ticker, the
 * status line and the sitemap of names all derive from this array.
 */
export type LinkItem = {
  href: string;
  /** Project name, as a visitor would say it. Drives the row title and ticker. */
  name: string;
  /** One line: what is inside, not what the page claims about itself. */
  hint: string;
  /** The real host. A visitor deciding whether to tap should see where it goes. */
  meta: string;
  /** A deployment that can be opened and clicked right now. */
  live?: boolean;
};

export const site = {
  name: "xyenrae",
  url: "https://links.xyenrae.dev",
  /** E.164 without the plus, which is what `wa.me` expects. */
  whatsapp: "6285162923241",
  whatsappLabel: "+62 851-6292-3241",
} as const;

export const links: LinkItem[] = [
  {
    href: "https://demo-gas2rent.xyenrae.dev/",
    name: "gas2rent",
    hint: "Situs rental mobil: katalog, harga, dan pemesanan lewat WhatsApp.",
    meta: "demo-gas2rent.xyenrae.dev",
    live: true,
  },
];

export const waHref = `https://wa.me/${site.whatsapp}`;

/**
 * Derived, never hand-written: a ticker listing "panel admin" instead of project
 * names was one of the reasons the page read like a service ad.
 */
export const tickerWords = [...links.map((l) => l.name), "bisa dicoba", "tanpa daftar"];

/** The page's own thesis, not the contents of one project. */
export const specimen = ["SEMUA", "BISA", "KAMU", "COBA"];

export const liveCount = links.filter((l) => l.live).length;

/** "1 project · semua hidup" grows into "3 project · 2 hidup" by itself. */
export const statusLine =
  links.length === 0
    ? "belum ada project"
    : `${links.length} project · ${liveCount === links.length ? "semua hidup" : `${liveCount} hidup`}`;
