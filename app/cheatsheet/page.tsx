import Cheatsheet from "@/components/cheatsheet";

export const metadata = {
  title: "Cheatsheet FE System Design — asuradraw",
  description: "Kerangka berpikir Requirement → Design → Trade-off, pemetaan requirement ke teknik, dan cara menggambarnya di kanvas.",
  // Reachable only by typing the URL: no link points here, and crawlers skip it.
  robots: { index: false, follow: false },
};

export default function CheatsheetPage() {
  return <Cheatsheet />;
}
