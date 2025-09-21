export default function Masonry({ children }: { children: React.ReactNode }) {
  return <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">{children}</div>;
}