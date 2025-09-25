import { Navigation } from "@/components/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          {children}
        </div>
      </div>
    </main>
  );
}
