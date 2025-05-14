
import { AppLayout } from "@/components/layout/app-layout";
import { NetworkObjectForm } from "@/components/network-object-form";

export default function AppsPage() {
  return (
    <AppLayout>
      <div className="w-full">
        <NetworkObjectForm />
      </div>
    </AppLayout>
  );
}
