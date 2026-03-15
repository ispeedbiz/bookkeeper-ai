/**
 * Canadian payroll tax calculation utilities.
 * Based on CRA rates for 2024 tax year.
 */

/** CPP contribution rates by year */
const CPP_RATES: Record<number, {
  employeeRate: number;
  employerRate: number;
  maxPensionableEarnings: number;
  basicExemption: number;
  maxContribution: number;
}> = {
  2024: {
    employeeRate: 0.0595,
    employerRate: 0.0595,
    maxPensionableEarnings: 68500,
    basicExemption: 3500,
    maxContribution: 3867.50, // (68500 - 3500) * 0.0595
  },
};

/** EI premium rates by year */
const EI_RATES: Record<number, {
  employeeRate: number;
  employerMultiplier: number;
  maxInsurableEarnings: number;
  maxPremium: number;
}> = {
  2024: {
    employeeRate: 0.0166,
    employerMultiplier: 1.4,
    maxInsurableEarnings: 63200,
    maxPremium: 1049.12, // 63200 * 0.0166
  },
};

/** 2024 Federal tax brackets */
const FEDERAL_BRACKETS_2024 = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55867, max: 111733, rate: 0.205 },
  { min: 111733, max: 154906, rate: 0.26 },
  { min: 154906, max: 220000, rate: 0.29 },
  { min: 220000, max: Infinity, rate: 0.33 },
];

/** 2024 Ontario provincial tax brackets */
const ONTARIO_BRACKETS_2024 = [
  { min: 0, max: 51446, rate: 0.0505 },
  { min: 51446, max: 102894, rate: 0.0915 },
  { min: 102894, max: 150000, rate: 0.1116 },
  { min: 150000, max: 220000, rate: 0.1216 },
  { min: 220000, max: Infinity, rate: 0.1316 },
];

/** Federal basic personal amount for 2024 */
const FEDERAL_BASIC_PERSONAL = 15705;

/** Ontario basic personal amount for 2024 */
const ONTARIO_BASIC_PERSONAL = 11865;

/**
 * Calculate CPP contribution for a pay period.
 * @param grossPay - Gross pay for the current pay period
 * @param yearToDateCPP - Total CPP contributions already made this year
 * @param year - Tax year (defaults to 2024)
 * @returns The CPP employee contribution for this pay period
 */
export function calculateCPP(
  grossPay: number,
  yearToDateCPP: number,
  year: number = 2024
): number {
  const rates = CPP_RATES[year];
  if (!rates) {
    throw new Error(`CPP rates not available for year ${year}`);
  }

  const { employeeRate, maxContribution, basicExemption, maxPensionableEarnings } = rates;

  // If already at max, no more contributions
  if (yearToDateCPP >= maxContribution) {
    return 0;
  }

  // Per-period basic exemption (assume 26 biweekly periods for simplicity)
  const periodExemption = basicExemption / 26;

  // Pensionable earnings for this period
  const pensionableEarnings = Math.max(0, grossPay - periodExemption);

  // Ensure we don't exceed max pensionable earnings implicitly through max contribution
  let contribution = pensionableEarnings * employeeRate;

  // Cap at remaining room
  const remaining = maxContribution - yearToDateCPP;
  contribution = Math.min(contribution, remaining);

  return Math.round(contribution * 100) / 100;
}

/**
 * Calculate EI premium for a pay period.
 * @param grossPay - Gross pay for the current pay period
 * @param yearToDateEI - Total EI premiums already paid this year
 * @param year - Tax year (defaults to 2024)
 * @returns The EI employee premium for this pay period
 */
export function calculateEI(
  grossPay: number,
  yearToDateEI: number,
  year: number = 2024
): number {
  const rates = EI_RATES[year];
  if (!rates) {
    throw new Error(`EI rates not available for year ${year}`);
  }

  const { employeeRate, maxPremium } = rates;

  // If already at max, no more premiums
  if (yearToDateEI >= maxPremium) {
    return 0;
  }

  let premium = grossPay * employeeRate;

  // Cap at remaining room
  const remaining = maxPremium - yearToDateEI;
  premium = Math.min(premium, remaining);

  return Math.round(premium * 100) / 100;
}

/**
 * Calculate federal income tax on annualized income using graduated brackets.
 * @param annualIncome - The annualized taxable income
 * @returns The federal tax amount
 */
export function calculateFederalTax(annualIncome: number): number {
  if (annualIncome <= FEDERAL_BASIC_PERSONAL) {
    return 0;
  }

  const taxableIncome = annualIncome - FEDERAL_BASIC_PERSONAL;
  let tax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of FEDERAL_BRACKETS_2024) {
    const bracketWidth = bracket.max === Infinity
      ? remainingIncome
      : Math.min(remainingIncome, bracket.max - bracket.min);

    if (bracketWidth <= 0) break;

    tax += bracketWidth * bracket.rate;
    remainingIncome -= bracketWidth;
  }

  return Math.round(tax * 100) / 100;
}

/**
 * Calculate provincial income tax on annualized income.
 * @param annualIncome - The annualized taxable income
 * @param province - Province code (defaults to "ON" for Ontario)
 * @returns The provincial tax amount
 */
export function calculateProvincialTax(
  annualIncome: number,
  province: string = "ON"
): number {
  // Currently only Ontario is implemented
  if (province !== "ON") {
    throw new Error(`Provincial tax rates not available for ${province}. Only ON (Ontario) is currently supported.`);
  }

  const basicPersonal = ONTARIO_BASIC_PERSONAL;
  const brackets = ONTARIO_BRACKETS_2024;

  if (annualIncome <= basicPersonal) {
    return 0;
  }

  const taxableIncome = annualIncome - basicPersonal;
  let tax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of brackets) {
    const bracketWidth = bracket.max === Infinity
      ? remainingIncome
      : Math.min(remainingIncome, bracket.max - bracket.min);

    if (bracketWidth <= 0) break;

    tax += bracketWidth * bracket.rate;
    remainingIncome -= bracketWidth;
  }

  return Math.round(tax * 100) / 100;
}

/** Employee payroll deduction summary */
interface EmployeeDeductions {
  grossPay: number;
  cpp: number;
  ei: number;
  tax: number;
}

/** CRA remittance breakdown */
interface CRARemittance {
  totalEmployeeCPP: number;
  totalEmployerCPP: number;
  totalCPP: number;
  totalEmployeeEI: number;
  totalEmployerEI: number;
  totalEI: number;
  totalIncomeTax: number;
  grandTotal: number;
}

/**
 * Calculate total CRA remittance for a set of employees.
 * Includes employer matching for CPP (1:1) and EI (1.4x).
 * @param employees - Array of employee deduction summaries
 * @returns Full CRA remittance breakdown
 */
export function calculateCRARemittance(employees: EmployeeDeductions[]): CRARemittance {
  const eiRates = EI_RATES[2024];

  let totalEmployeeCPP = 0;
  let totalEmployeeEI = 0;
  let totalIncomeTax = 0;

  for (const emp of employees) {
    totalEmployeeCPP += emp.cpp;
    totalEmployeeEI += emp.ei;
    totalIncomeTax += emp.tax;
  }

  // Employer matches CPP 1:1
  const totalEmployerCPP = totalEmployeeCPP;
  const totalCPP = totalEmployeeCPP + totalEmployerCPP;

  // Employer pays 1.4x of employee EI
  const totalEmployerEI = Math.round(totalEmployeeEI * eiRates.employerMultiplier * 100) / 100;
  const totalEI = Math.round((totalEmployeeEI + totalEmployerEI) * 100) / 100;

  const grandTotal = Math.round((totalCPP + totalEI + totalIncomeTax) * 100) / 100;

  return {
    totalEmployeeCPP: Math.round(totalEmployeeCPP * 100) / 100,
    totalEmployerCPP: Math.round(totalEmployerCPP * 100) / 100,
    totalCPP: Math.round(totalCPP * 100) / 100,
    totalEmployeeEI: Math.round(totalEmployeeEI * 100) / 100,
    totalEmployerEI,
    totalEI,
    totalIncomeTax: Math.round(totalIncomeTax * 100) / 100,
    grandTotal,
  };
}
