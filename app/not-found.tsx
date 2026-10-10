import LazyNotFoundView from "@/components/ui/LazyNotFoundView";
import { privatePageMetadata } from "@/lib/shared/site";

export const metadata = privatePageMetadata("Page Not Found");

export default function NotFound() {
  return <LazyNotFoundView />;
}
