import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  calculateCPP,
  calculateEI,
  calculateFederalTax,
  calculateProvincialTax,
  calculateCRARemittance,
} from "@/lib/payroll/canadian-tax";

/**
 * GET /api/payroll/remittance?entityId=...&payPeriodStart=...&payPeriodEnd=...
 * Calculates CRA remittance for a given entity and pay period.
 * Returns total CPP (employee+employer), total EI (employee+employer),
 * total income tax, and grand total.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");
    const payPeriodStart = searchParams.get("payPeriodStart");
    const payPeriodEnd = searchParams.get("payPeriodEnd");

    if (!entityId || !payPeriodStart || !payPeriodEnd) {
      return NextResponse.json(
        { error: "entityId, payPeriodStart, and payPeriodEnd are required" },
        { status: 400 }
      );
    }

    // Validate date formats
    const startDate = new Date(payPeriodStart);
    const endDate = new Date(payPeriodEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use ISO 8601 (YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "payPeriodStart must be before payPeriodEnd" },
        { status: 400 }
      );
    }

    // Verify entity belongs to user
    const { data: entity } = await supabase
      .from("entities")
      .select("id")
      .eq("id", entityId)
      .eq("user_id", user.id)
      .single();

    if (!entity) {
      return NextResponse.json(
        { error: "Entity not found or unauthorized" },
        { status: 404 }
      );
    }

    // Fetch active employees for the entity
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, name, pay_rate, pay_type, pay_frequency")
      .eq("entity_id", entityId)
      .eq("status", "active");

    if (empError) {
      console.error("Employees fetch error:", empError);
      return NextResponse.json(
        { error: "Failed to fetch employees" },
        { status: 500 }
      );
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json({
        payPeriod: { start: payPeriodStart, end: payPeriodEnd },
        employeeCount: 0,
        remittance: {
          totalEmployeeCPP: 0,
          totalEmployerCPP: 0,
          totalCPP: 0,
          totalEmployeeEI: 0,
          totalEmployerEI: 0,
          totalEI: 0,
          totalIncomeTax: 0,
          grandTotal: 0,
        },
        employees: [],
      });
    }

    // Calculate deductions for each employee
    const employeeDeductions = employees.map((emp) => {
      const grossPay = calculateGrossPay(emp.pay_rate, emp.pay_type, emp.pay_frequency);

      // Annualize for tax calculation (assume biweekly = 26 periods)
      const periods = getPeriodsPerYear(emp.pay_frequency);
      const annualIncome = grossPay * periods;

      // For simplicity, assume YTD is 0 (a production system would query payroll history)
      const cpp = calculateCPP(grossPay, 0);
      const ei = calculateEI(grossPay, 0);
      const federalTax = calculateFederalTax(annualIncome) / periods;
      const provincialTax = calculateProvincialTax(annualIncome) / periods;
      const totalTax = Math.round((federalTax + provincialTax) * 100) / 100;

      return {
        employeeId: emp.id,
        name: emp.name,
        grossPay,
        cpp,
        ei,
        tax: totalTax,
        federalTax: Math.round(federalTax * 100) / 100,
        provincialTax: Math.round(provincialTax * 100) / 100,
      };
    });

    // Calculate total CRA remittance
    const remittance = calculateCRARemittance(
      employeeDeductions.map((e) => ({
        grossPay: e.grossPay,
        cpp: e.cpp,
        ei: e.ei,
        tax: e.tax,
      }))
    );

    return NextResponse.json({
      payPeriod: { start: payPeriodStart, end: payPeriodEnd },
      employeeCount: employees.length,
      remittance,
      employees: employeeDeductions,
    });
  } catch (error) {
    console.error("Remittance calculation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Calculate gross pay for a single pay period based on rate, type, and frequency.
 */
function calculateGrossPay(
  payRate: number,
  payType: string,
  payFrequency: string
): number {
  if (payType === "hourly") {
    // Assume standard 40 hours/week
    const hoursPerPeriod = payFrequency === "weekly" ? 40
      : payFrequency === "biweekly" ? 80
      : payFrequency === "semimonthly" ? 86.67
      : 173.33; // monthly
    return Math.round(payRate * hoursPerPeriod * 100) / 100;
  }

  // Salary: divide annual rate by number of periods
  const periods = getPeriodsPerYear(payFrequency);
  return Math.round((payRate / periods) * 100) / 100;
}

/**
 * Get the number of pay periods per year for a given frequency.
 */
function getPeriodsPerYear(payFrequency: string): number {
  switch (payFrequency) {
    case "weekly": return 52;
    case "biweekly": return 26;
    case "semimonthly": return 24;
    case "monthly": return 12;
    default: return 26; // default to biweekly
  }
}
