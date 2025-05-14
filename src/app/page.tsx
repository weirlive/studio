
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Aperture } from "lucide-react";

export default function HomePage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center">
        <Card className="w-full max-w-xl text-center shadow-xl">
          <CardHeader>
            <CardTitle className="text-4xl font-bold">Welcome!</CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              This is the PANW Network Object Creator application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>
              Navigate to the "Apps" section to start creating your Palo Alto Networks
              address objects and configurations.
            </p>
            <Link href="/apps">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Aperture className="mr-2 h-5 w-5" />
                Go to Network Object Creator
              </Button>
            </Link>
             <div className="mt-8">
              <p className="text-sm text-muted-foreground">
                Tip: You can quickly access the tool via the "Apps" link in the header.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
