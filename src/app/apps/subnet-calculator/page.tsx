
import { AppLayout } from "@/components/layout/app-layout";
import { SubnetCalculatorForm } from "@/components/subnet-calculator-form";

export default function SubnetCalculatorPage() {
  return (
    <AppLayout>
      <div className="w-full">
        <SubnetCalculatorForm />
      </div>
    </AppLayout>
  );
}
