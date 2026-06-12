export interface PresetTemplate {
  id: string;
  title: string;
  description: string;
  userStory: string;
}

export const PRESETS: PresetTemplate[] = [
  {
    id: 'search-filters',
    title: 'E-Commerce Product Search & Filters',
    description: 'A standard user search workflow with filters. Tends to have clean logic and straightforward automation path.',
    userStory: 'As a customer, I want to search products and filter by price range and rating, so that I can find relevant items quickly.',
  },
  {
    id: 'payment-gateway',
    title: 'High-Volume Payment Gateway Integration',
    description: 'Payment system integration including credit cards, apple pay, and 3D Secure validation. Higher risk due to transactional consistency.',
    userStory: 'As a customer, I want to pay for my order using a credit card or digital wallet securely and receive an instant confirmation.',
  },
  {
    id: 'mfa-security',
    title: 'Multi-Factor Authentication (MFA) Security Upgrade',
    description: 'Critical authentication module security updates. Higher level of risk. Failed automation runs indicate critical vulnerabilities.',
    userStory: 'As a user, I want to enable SMS or Authenticator App MFA for my account to prevent unauthorized access.',
  }
];
