import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your dashboard. You are now signed in!
        </p>
      </div>
    </div>
  );
}
