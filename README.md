# xyenrae-links

Halaman tautan untuk bio: satu URL menuju semua project yang bisa dicoba
publik. Gelap, bergerak, dibuka dari dalam TikTok.

https://links.xyenrae.dev

## Menambah tautan

Semua isi ada di `src/data/links.ts`.

```ts
export const links: LinkItem[] = [
  {
    href: "https://demo-project.xyenrae.dev/",
    label: "Demo situs",
    hint: "Satu kalimat: apa yang bisa dicoba di sana.",
    meta: "demo-project.xyenrae.dev", // host asli, bukan hiasan
    live: true, // titik hijau
  },
];
```

Menambah project = menambah satu entri. Nomor `01`, `02` dihitung sendiri.
Baris pertama harus muat di layar 360×640, jadi tulis `hint` pendek: dua baris
maksimal.

Sengaja **tidak ada screenshot project**: halaman ini pintu masuk untuk semua
project, jadi tidak boleh terikat pada satu project tertentu. Yang dipamerkan
adalah halaman ini sendiri.

## Prinsip yang menjaga halaman ini

- **Nol kontrol.** Tidak ada slider, toggle, atau tab. Setiap gerak adalah
  fungsi dari posisi gulir dan sentuhan, jadi tidak ada state yang bisa rusak.
- **Konten tidak pernah dibuat oleh JavaScript.** `motion.ts` hanya membungkus.
  Kelas `motion` ditambahkan inline di `<head>`; kalau script itu tidak jalan,
  halaman tampil lengkap dan kedua tautan tetap bisa diklik.
- **`motion` dan `booted` adalah dua kelas berbeda.** `motion` = "browser ini
  boleh beranimasi". `booted` = "intro sudah pernah dilihat". Sempat digabung
  jadi satu kelas, dan akibatnya kunjungan kedua kehilangan seluruh animasi.
- **Tidak ada blur.** Cahaya berasal dari `radial-gradient`, bukan
  `filter: blur()`. Yang kedua memang penyebab jank scroll di HP kelas menengah.
- **Gulir hanya menggerakkan `transform`.** Satu-satunya properti layout yang
  dianimasi adalah `font-weight` di bagian spesimen, dan hanya pada satu elemen
  pendek: menganimasi variabel font per frame memaksa browser me-reshape teks.
- **Lenis tidak menyentuh sentuhan.** `syncTouch: false`, karena dokumentasi
  Lenis sendiri menyebutnya tidak stabil di iOS < 16, dan mengambil alih
  sentuhan adalah cara tercepat membuat halaman terasa rusak di in-app browser.
- **Font self-hosted, tanpa `data:` URI.** `assetsInlineLimit: 0` di
  `astro.config.mjs` memaksa setiap aset jadi file. Sebelumnya subset kecil
  di-inline Vite dan diblokir CSP `font-src 'self'`.

## Berkas

```
src/pages/index.astro   markup, copy, dan inline head script
src/styles/page.css     token, layout, boot, state
src/scripts/motion.ts   GSAP + Lenis + canvas, satu modul
src/data/links.ts       isi halaman
public/og.png           kartu gelap 1200x630
public/icon.svg         monogram
public/robots.txt       allow semua + sitemap
public/sitemap.xml      satu URL
vercel.json             header keamanan dan cache
```

## Mengubah gerak

Semua ada di `src/scripts/motion.ts`, lima blok berurutan: `guard` → `smooth` →
`boot` → `sections` → `canvas`. Setiap blok punya satu pekerjaan.

Kalau menambah animasi baru, aturannya:

1. Elemen harus sudah berada di posisi akhirnya di CSS.
2. Animasi hanya boleh mengubah `transform`, `opacity`, atau `color`.
3. Bungkus dalam `@media (prefers-reduced-motion: no-preference)` atau cek
   `reduce.matches` di JS.
4. Uji di 320px. Hero memakai `overflow: clip` karena medan cahaya lebih lebar
   dari kolom; tanpa itu halaman bisa digeser menyamping.

## Deploy

```bash
pnpm build
vercel deploy --prod
```

Project `xyenrae-links`, domain `links.xyenrae.dev` (satu CNAME ke
`cname.vercel-dns.com`, jangan wildcard). CNAME dipasang di zona Cloudflare
`xyenrae.dev` oleh pemilik zona.

## Angka yang sudah diukur

- Kunjungan pertama: **127,5 KB** (HTML 2,0 + CSS 3,1 + JS 52,5 + Bricolage
  40,4 + Instrument 29,4). Dihitung dengan `weigh.mjs`.
- Scroll penuh: **60,1 fps**, p95 16,8 ms, nol frame di atas 20 ms.
- Lighthouse: Accessibility **100**, SEO **100**.
- Kontras di latar `#08090A`: teks 17,95 · muted 6,13 · cyan 9+ .
- Tap target: baris 97–116 px, CTA 78 px.
- Nol `blur()` dan nol `backdrop-filter` di CSS hasil build.

Angka-angka ini bisa berubah kalau markup atau aset disentuh; ukur ulang, jangan
diasumsikan.
