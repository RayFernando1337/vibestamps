import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';

export default async function PricingPage() {
  const user = await currentUser();
  const currentPlan = user?.publicMetadata?.plan || 'free';

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for trying out our basic features',
      features: [
        'Basic processing speed',
        'Standard support',
        'Limited file size',
        'Community forum access'
      ],
      buttonText: currentPlan === 'free' ? 'Current Plan' : 'Get Started',
      buttonVariant: currentPlan === 'free' ? 'outline' : 'default',
      isCurrent: currentPlan === 'free',
      planId: 'free'
    },
    {
      name: 'YOLO',
      price: '$9.99',
      description: 'For power users who need the best',
      features: [
        'Priority processing',
        '24/7 Priority support',
        'Larger file sizes',
        'Advanced analytics',
        'Early access to new features'
      ],
      buttonText: currentPlan === 'yolo' ? 'Current Plan' : 'Upgrade Now',
      buttonVariant: currentPlan === 'yolo' ? 'outline' : 'default',
      isCurrent: currentPlan === 'yolo',
      isPopular: true,
      planId: 'yolo'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground">
          Select the perfect plan for your needs. Start with our free plan, no credit card required.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className={`relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md ${
              plan.isPopular ? 'ring-2 ring-primary' : ''
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1">{plan.name}</h2>
              <p className="text-muted-foreground mb-4">{plan.description}</p>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">
                  {plan.name === 'Free' ? '' : '/month'}
                </span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <svg 
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <Link
              href={plan.isCurrent ? '#' : `/api/checkout?plan=${plan.planId}`}
              className={`w-full inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background ${
                plan.buttonVariant === 'outline'
                  ? 'border border-input hover:bg-accent hover:text-accent-foreground'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {plan.buttonText}
            </Link>
          </div>
        ))}
      </div>
      
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Need help choosing? <a href="mailto:support@example.com" className="text-primary hover:underline">Contact our support team</a></p>
      </div>
    </div>
  );
}
