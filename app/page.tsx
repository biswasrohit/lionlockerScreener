import { SiteHeader } from "@/components/layout/SiteHeader";
import { StudyClient } from "@/components/study/StudyClient";

export default function Home() {
  return (
    <div className="shell">
      <SiteHeader />
      <StudyClient />
    </div>
  );
}
