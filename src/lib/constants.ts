export const COMPANY = {
  name: "BookkeeperAI",
  tagline: "Your AI Bookkeeper That Never Sleeps",
  description:
    "AI-powered bookkeeping & payroll outsourcing platform connecting CPAs and businesses with expert offshore accountants. Clean books delivered in 3 business days.",
  phone: "+1 (437) 256-1007",
  email: "support@bookkeeperai.ca",
  website: "bookkeeperai.ca",
  address: "Mississauga, Canada | Satellite, Ahmedabad, Gujarat, INDIA",
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
    experience: "22+ Years",
  },
  {
    title: "Reconciliations",
    description: "Bank, intercompany, and GL reconciliation with AI matching",
    icon: "CheckCircle",
    experience: "22+ Years",
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

export const PAYROLL_PRICING = [
  {
    name: "Payroll Starter",
    price: "CAD $99",
    period: "/mo",
    employees: "Up to 10 employees",
    features: [
      "Bi-weekly payroll processing",
      "T4 / W-2 preparation",
      "Direct deposit setup",
      "Pay stub generation",
      "Basic payroll reports",
    ],
    highlighted: false,
  },
  {
    name: "Payroll Pro",
    price: "CAD $199",
    period: "/mo",
    employees: "11-50 employees",
    features: [
      "Weekly or bi-weekly payroll",
      "T4 / W-2 & ROE filing",
      "Benefits & deductions management",
      "Multi-province / multi-state",
      "Year-end reconciliation",
      "Dedicated payroll specialist",
    ],
    highlighted: true,
  },
  {
    name: "Payroll Enterprise",
    price: "CAD $399",
    period: "/mo",
    employees: "50+ employees",
    features: [
      "Unlimited pay runs",
      "Full compliance management",
      "Custom payroll integrations",
      "Multi-entity payroll",
      "Priority support & SLA",
      "Quarterly payroll audits",
      "Workers\' comp tracking",
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
    name: "Jagdish",
    role: "Co-Founder & CEO",
    location: "Mississauga, Canada",
    credentials: "Chartered Accountant (CA) · 22+ Years Experience",
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
