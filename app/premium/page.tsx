import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';

export default async function PremiumPage() {
  const user = await currentUser();
  const hasYoloAccess = user?.publicMetadata?.plan === 'yolo';
  const hasFreeAccess = user?.publicMetadata?.plan === 'free';

  if (!hasYoloAccess && !hasFreeAccess) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
        <h1 className="text-3xl font-bold mb-4">Premium Access Required</h1>
        <p className="text-lg text-muted-foreground mb-8">
          You need to be signed in with a valid plan to access this content.
        </p>
        <Link 
          href="/pricing"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          View Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">{hasYoloAccess ? 'YOLO Plan' : 'Free Plan'} Features</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Feature 1 - Available for both plans */}
        <div className="rounded-lg border p-6">
          <div className="flex items-center mb-4">
            <div className="bg-primary/10 p-2 rounded-full mr-3">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Basic Processing</h2>
          </div>
          <p className="text-muted-foreground">
            Process your files with our standard processing speed.
          </p>
        </div>

        {/* Feature 2 - Available for both plans */}
        <div className="rounded-lg border p-6">
          <div className="flex items-center mb-4">
            <div className="bg-primary/10 p-2 rounded-full mr-3">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Secure Storage</h2>
          </div>
          <p className="text-muted-foreground">
            Your files are stored securely with industry-standard encryption.
          </p>
        </div>

        {/* YOLO Plan Only Features */}
        {hasYoloAccess && (
          <>
            <div className="rounded-lg border p-6 bg-primary/5 border-primary/20">
              <div className="flex items-center mb-4">
                <div className="bg-primary/20 p-2 rounded-full mr-3">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">YOLO Priority Processing</h2>
              </div>
              <p className="text-muted-foreground">
                Get your files processed at the highest priority with our YOLO plan.
              </p>
            </div>

            <div className="rounded-lg border p-6 bg-primary/5 border-primary/20">
              <div className="flex items-center mb-4">
                <div className="bg-primary/20 p-2 rounded-full mr-3">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">24/7 Priority Support</h2>
              </div>
              <p className="text-muted-foreground">
                Get priority support with faster response times and dedicated assistance.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Upgrade prompt for Free users */}
      {hasFreeAccess && (
        <div className="mt-12 p-6 bg-muted rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-2">Want to unlock YOLO features?</h2>
          <p className="text-muted-foreground mb-6">Upgrade to YOLO plan for priority processing and premium support.</p>
          <Link 
            href="/pricing"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
          >
            Upgrade to YOLO Plan
          </Link>
        </div>
      )}
    </div>
  );
}
