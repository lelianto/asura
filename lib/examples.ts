// Shown in the "COBA UCAPKAN" panel. Every entry is also asserted by the test
// suite to parse into at least one command, so the panel can never advertise a
// sentence the parser would silently ignore.
export const examples: Record<"id" | "en", string[]> = {
  id: [
    "tambahkan API Gateway",
    "User terhubung ke CDN",
    "CDN mengakses Web terbuat dari Next js",
    "dari Mobile App ke BFF lalu ke Redis",
    "BFF bercabang ke Redis dan GraphQL",
    "ganti BFF jadi Backend API",
    "hapus koneksi User ke CDN",
    "hapus Redis",
  ],
  en: [
    "add API Gateway",
    "User connects to CDN",
    "CDN accesses Web built with Next js",
    "from Mobile App to BFF then to Redis",
    "BFF branches to Redis and GraphQL",
    "rename BFF to Backend API",
    "delete connection User to CDN",
    "delete Redis",
  ],
};
