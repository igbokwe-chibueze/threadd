type DemoBannerProps = Readonly<{
  placement: "top" | "bottom";
}>;

export function DemoBanner({ placement }: DemoBannerProps) {
  return (
    <aside
      aria-label={`Portfolio demo notice at the ${placement}`}
      className={`fixed inset-x-0 ${placement === "top" ? "top-0 border-b" : "bottom-0 border-t"} z-50 flex h-5 items-center justify-center border-black/15 bg-[#d7ff3f] px-3 text-center text-[0.48rem] leading-none font-semibold tracking-[0.16em] text-[#171713] uppercase`}
    >
      Demo store · Test payments · Data resets every 6 hours
    </aside>
  );
}
