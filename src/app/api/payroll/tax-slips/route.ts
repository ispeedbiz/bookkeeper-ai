import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ── Canadian Tax Constants (2024 rates) ──────────────────────────────────────

const TAX_CONSTANTS = {
  // CPP
  cpp_rate: 0.0595,
  cpp_max_pensionable_earnings: 68500,
  cpp_basic_exemption: 3500,
  cpp_max_contribution: 3867.5, // (68500 - 3500) * 0.0595

  // CPP2 (second ceiling, introduced 2024)
  cpp2_rate: 0.04,
  cpp2_max_pensionable_earnings: 73200,
  cpp2_max_contribution: 188.0, // (73200 - 68500) * 0.04

  // EI
  ei_rate: 0.0166,
  ei_max_insurable_earnings: 63200,
  ei_max_premium: 1049.12, // 63200 * 0.0166

  // Federal tax brackets (2024)
  federal_brackets: [
    { min: 0, max: 55867, rate: 0.15 },
    { min: 55867, max: 111733, rate: 0.205 },
    { min: 111733, max: 154906, rate: 0.26 },
    { min: 154906, max: 220000, rate: 0.29 },
    { min: 220000, max: Infinity, rate: 0.33 },
  ],
  federal_basic_personal_amount: 15705,

  // Ontario provincial brackets (default province for estimates)
  provincial_brackets: [
    { min: 0, max: 51446, rate: 0.0505 },
    { min: 51446, max: 102894, rate: 0.0915 },
    { min: 102894, max: 150000, rate: 0.1116 },
    { min: 150000, max: 220000, rate: 0.1216 },
    { min: 220000, max: Infinity, rate: 0.1316 },
  ],
  provincial_basic_personal_amount: 11865,
};

// ── Tax Calculation Helpers ──────────────────────────────────────────────────

function calculateCPP(pensionableEarnings: number): number {
  const earnings = Math.min(
    pensionableEarnings,
    TAX_CONSTANTS.cpp_max_pensionable_earnings
  );
  const contributory = Math.max(0, earnings - TAX_CONSTANTS.cpp_basic_exemption);
  return Math.min(
    contributory * TAX_CONSTANTS.cpp_rate,
    TAX_CONSTANTS.cpp_max_contribution
  );
}

function calculateCPP2(pensionableEarnings: number): number {
  if (pensionableEarnings <= TAX_CONSTANTS.cpp_max_pensionable_earnings) {
    return 0;
  }
  const earnings = Math.min(
    pensionableEarnings,
    TAX_CONSTANTS.cpp2_max_pensionable_earnings
  );
  const contributory = earnings - TAX_CONSTANTS.cpp_max_pensionable_earnings;
  return Math.min(
    contributory * TAX_CONSTANTS.cpp2_rate,
    TAX_CONSTANTS.cpp2_max_contribution
  );
}

function calculateEI(insurableEarnings: number): number {
  const earnings = Math.min(
    insurableEarnings,
    TAX_CONSTANTS.ei_max_insurable_earnings
  );
  return Math.min(earnings * TAX_CONSTANTS.ei_rate, TAX_CONSTANTS.ei_max_premium);
}

function calculateBracketTax(
  income: number,
  brackets: { min: number; max: number; rate: number }[],
  personalAmount: number
): number {
  const taxableIncome = Math.max(0, income - personalAmount);
  let tax = 0;

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket =
      Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }

  return Math.max(0, tax);
}

function calculateFederalTax(income: number): number {
  return calculateBracketTax(
    income,
    TAX_CONSTANTS.federal_brackets,
    TAX_CONSTANTS.federal_basic_personal_amount
  );
}

function calculateProvincialTax(income: number): number {
  return calculateBracketTax(
    income,
    TAX_CONSTANTS.provincial_brackets,
    TAX_CONSTANTS.provincial_basic_personal_amount
  );
}

function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

// ── T4 Data Generator ────────────────────────────────────────────────────────

interface T4Data {
  tax_year: number;
  employee_name: string;
  employee_sin_last4: string | null;
  employer_entity_id: string;
  box_14_employment_income: number;
  box_16_cpp_contributions: number;
  box_16a_cpp2_contributions: number;
  box_18_ei_premiums: number;
  box_22_income_tax_deducted: number;
  box_24_ei_insurable_earnings: number;
  box_26_cpp_pensionable_earnings: number;
  box_44_union_dues: number;
  box_46_charitable_donations: number;
  box_52_pension_adjustment: number;
  total_deductions: number;
  net_income: number;
  federal_tax: number;
  provincial_tax: number;
  summary: {
    gross_earnings: number;
    cpp_employee: number;
    cpp2_employee: number;
    ei_employee: number;
    federal_tax: number;
    provincial_tax: number;
    total_tax_deducted: number;
    other_deductions: number;
    net_pay: number;
  };
}

/**
 * POST /api/payroll/tax-slips — Generate T4 slip data
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      employee_id,
      tax_year,
      employment_income,
      union_dues = 0,
      charitable_donations = 0,
      pension_adjustment = 0,
      other_deductions = 0,
    } = body;

    if (!employee_id || !tax_year || employment_income === undefined) {
      return NextResponse.json(
        {
          error:
            "employee_id, tax_year, and employment_income are required",
        },
        { status: 400 }
      );
    }

    const income = parseFloat(employment_income);
    if (isNaN(income) || income < 0) {
      return NextResponse.json(
        { error: "employment_income must be a positive number" },
        { status: 400 }
      );
    }

    // Verify employee belongs to user
    const { data: employee } = await supabase
      .from("employees")
      .select("id, name, sin_last4, entity_id")
      .eq("id", employee_id)
      .eq("user_id", user.id)
      .single();

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found or unauthorized" },
        { status: 404 }
      );
    }

    // Calculate all tax components
    const cppContribution = roundCurrency(calculateCPP(income));
    const cpp2Contribution = roundCurrency(calculateCPP2(income));
    const eiPremium = roundCurrency(calculateEI(income));
    const federalTax = roundCurrency(calculateFederalTax(income));
    const provincialTax = roundCurrency(calculateProvincialTax(income));
    const totalTaxDeducted = roundCurrency(federalTax + provincialTax);
    const totalDeductions = roundCurrency(
      cppContribution +
        cpp2Contribution +
        eiPremium +
        totalTaxDeducted +
        parseFloat(union_dues || 0) +
        parseFloat(other_deductions || 0)
    );
    const netIncome = roundCurrency(income - totalDeductions);

    const t4Data: T4Data = {
      tax_year: parseInt(tax_year),
      employee_name: employee.name,
      employee_sin_last4: employee.sin_last4,
      employer_entity_id: employee.entity_id,

      // Standard T4 boxes
      box_14_employment_income: roundCurrency(income),
      box_16_cpp_contributions: cppContribution,
      box_16a_cpp2_contributions: cpp2Contribution,
      box_18_ei_premiums: eiPremium,
      box_22_income_tax_deducted: totalTaxDeducted,
      box_24_ei_insurable_earnings: roundCurrency(
        Math.min(income, TAX_CONSTANTS.ei_max_insurable_earnings)
      ),
      box_26_cpp_pensionable_earnings: roundCurrency(
        Math.min(income, TAX_CONSTANTS.cpp_max_pensionable_earnings)
      ),
      box_44_union_dues: roundCurrency(parseFloat(union_dues || 0)),
      box_46_charitable_donations: roundCurrency(
        parseFloat(charitable_donations || 0)
      ),
      box_52_pension_adjustment: roundCurrency(
        parseFloat(pension_adjustment || 0)
      ),

      total_deductions: totalDeductions,
      net_income: netIncome,
      federal_tax: federalTax,
      provincial_tax: provincialTax,

      summary: {
        gross_earnings: roundCurrency(income),
        cpp_employee: cppContribution,
        cpp2_employee: cpp2Contribution,
        ei_employee: eiPremium,
        federal_tax: federalTax,
        provincial_tax: provincialTax,
        total_tax_deducted: totalTaxDeducted,
        other_deductions: roundCurrency(
          parseFloat(union_dues || 0) + parseFloat(other_deductions || 0)
        ),
        net_pay: netIncome,
      },
    };

    return NextResponse.json({ t4: t4Data });
  } catch (error) {
    console.error("Tax slips POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
