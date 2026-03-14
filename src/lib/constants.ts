export const COMPANY = {
  name: "BookkeeperAI",
  tagline: "Your AI Bookkeeper That Never Sleeps",
  description:
    "AI-powered bookkeeping outsourcing platform connecting CPAs and businesses with expert offshore accountants. Clean books delivered in 3 business days.",
  phone: {
    india: "+91 95 575 99 575",
    us: "+1 (347) 479 1767",
  },
  email: "accounts@sms360s.com",
  website: "sms360s.com",
  address: "Satellite, Ahmedabad, Gujarat, INDIA",
  founded: 2012,
} as const;

export const NAV_LINKS = [
  { label: "Services", href: "/#services" },
  { label: "Pricing", href: "/pricing" },
  { label: "For CPAs", href: "/#for-cpas" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const SERVICES = [
  {
    title: "Bookkeeping",
    description: "Monthly & yearly bookkeeping across all major platforms",
    icon: "BookOpen",
    experience: "19 Years",
  },
  {
    title: "Reconciliations",
    description: "Bank, intercompany, and GL reconciliation with AI matching",
    icon: "CheckCircle",
    experience: "19 Years",
  },
  {
    title: "Payroll Processing",
    description: "Canada & US payroll with tax calculations and filing",
    icon: "DollarSign",
    experience: "12 Years",
  },
  {
    title: "Remote Management",
    description: "Your offshore office that works while you sleep",
    icon: "Globe",
    experience: "14 Years",
  },
  {
    title: "AI Analytics",
    description: "Anomaly detection, predictive cash flow, smart categorization",
    icon: "Brain",
    experience: "AI-Powered",
  },
  {
    title: "Tax Support",
    description: "Filing prep, optimization, advance planning for CA & US",
    icon: "FileText",
    experience: "9 Years",
  },
  {
    title: "Compliance & Risk",
    description: "Continuous monitoring, early risk identification, proactive actions",
    icon: "Shield",
    experience: "14 Years",
  },
  {
    title: "Supply Chain",
    description: "Domestic and international shipment and vendor tracking",
    icon: "Truck",
    experience: "14 Years",
  },
] as const;

export const CPA_PRICING = [
  {
    name: "Starter",
    price: "CAD $249",
    period: "/mo",
    entities: "Up to 10",
    features: [
      "Basic bookkeeping",
      "Monthly reconciliation",
      "Document portal",
      "Standard support",
      "Email notifications",
    ],
    bestFor: "Solo practitioners",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "CAD $179",
    period: "/entity/mo",
    entities: "11-50",
    features: [
      "Full bookkeeping + payroll",
      "AI categorization",
      "Priority support",
      "Client portal",
      "Multi-entity management",
      "Financial reports",
    ],
    bestFor: "Growing CPA firms",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "CAD $119",
    period: "/entity/mo",
    entities: "50+",
    features: [
      "Everything in Growth",
      "Dedicated team",
      "Custom workflows",
      "API access",
      "White-label branding",
      "Advanced analytics",
      "Quarterly business reviews",
    ],
    bestFor: "Large CPA firms & networks",
    highlighted: false,
  },
] as const;

export const DIRECT_PRICING = [
  {
    name: "Essential",
    price: "CAD $449",
    period: "/mo",
    entities: "1 entity",
    features: [
      "Single entity bookkeeping",
      "Bank reconciliation",
      "Monthly P&L",
      "Document portal",
      "Email support",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "CAD $699",
    period: "/mo",
    entities: "Up to 3 entities",
    features: [
      "Multi-entity support",
      "Payroll processing",
      "Tax prep support",
      "AI financial insights",
      "Priority chat support",
    ],
    highlighted: true,
  },
  {
    name: "Premium",
    price: "CAD $999",
    period: "/mo",
    entities: "Unlimited",
    features: [
      "Unlimited entities",
      "CFO-level reporting",
      "Custom dashboards",
      "1:1 accountant access",
      "Quarterly business reviews",
      "API access",
    ],
    highlighted: false,
  },
] as const;

export const STATS = [
  { value: "$11.59B", label: "Global Bookkeeping Market" },
  { value: "9.37%", label: "Market CAGR Growth" },
  { value: "82%", label: "CPAs Increasing Outsourcing" },
  { value: "3-Day", label: "SLA Guarantee" },
] as const;

export const TEAM = [
  {
    name: "Jagdish Lade",
    role: "Co-Founder & CEO",
    location: "Canada",
    credentials: "Chartered Accountant (CA)",
    focus: [
      "AI & Automation Expert",
      "Platform Architect",
      "Business Development",
    ],
  },
  {
    name: "Hardik Mehta",
    role: "Operations Partner (SMS360S)",
    location: "Ahmedabad, India",
    credentials: "14+ Years Offshore Bookkeeping",
    focus: [
      "Founder, SMS360S Solutions",
      "Team Lead & Quality Assurance",
      "Execution Excellence",
    ],
  },
] as const;
