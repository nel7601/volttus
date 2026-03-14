/**
 * Alectra Utilities API client
 *
 * Discovered endpoints from MyAlectra portal (https://myalectra.alectrautilities.com/portal/)
 * Backend API: https://alectra-svc.smartcmobile.link
 *
 * Auth: JWT via POST /UsermanagementAPI/api/1/Login/auth
 * Current bill: POST /BillingAPI/api/1/bill/Current
 * Dashboard: GET /apiservices/api/1/account/GetDashBoardBill
 */

const ALECTRA_API_BASE = "https://alectra-svc.smartcmobile.link"

interface AlectraLoginResponse {
  status: string
  data: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
}

interface AlectraBillResponse {
  status: string
  data: {
    invoiceId: string
    accountNumber: string
    billPeriodStartDate: string
    billPeriodEndDate: string
    currentCharges: number
    previousBalance: number
    totalPayment: number
    totalAmountDue: number
    remainingBalance: number
    dueDate: string
  }
}

interface AlectraDashboardResponse {
  status: string
  data: {
    projectedBill: number
    lastBill: number
    lastYear: number
  }
}

export interface AlectraBillResult {
  success: true
  currentCharges: number
  totalAmountDue: number
  billPeriodStart: string
  billPeriodEnd: string
  invoiceId: string
  projectedBill: number | null
}

export interface AlectraError {
  success: false
  error: string
}

export type AlectraPollResult = AlectraBillResult | AlectraError

/**
 * Login to Alectra API and return JWT token
 */
async function login(
  username: string,
  password: string
): Promise<string> {
  const res = await fetch(`${ALECTRA_API_BASE}/UsermanagementAPI/api/1/Login/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ userName: username, password }),
  })

  if (!res.ok) {
    throw new Error(`Alectra login failed: HTTP ${res.status}`)
  }

  const body = (await res.json()) as AlectraLoginResponse
  if (!body.data?.accessToken) {
    throw new Error("Alectra login: no access token in response")
  }

  return body.data.accessToken
}

/**
 * Fetch the current bill for an account
 */
async function fetchCurrentBill(
  token: string,
  accountNumber: string
): Promise<AlectraBillResponse["data"]> {
  const res = await fetch(`${ALECTRA_API_BASE}/BillingAPI/api/1/bill/Current`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ accountNumber }),
  })

  if (!res.ok) {
    throw new Error(`Alectra current bill failed: HTTP ${res.status}`)
  }

  const body = (await res.json()) as AlectraBillResponse
  if (!body.data) {
    throw new Error("Alectra current bill: no data in response")
  }

  return body.data
}

/**
 * Fetch dashboard bill data (projected, last, last year)
 */
async function fetchDashboardBill(
  token: string,
  accountNumber: string
): Promise<AlectraDashboardResponse["data"] | null> {
  try {
    const res = await fetch(
      `${ALECTRA_API_BASE}/apiservices/api/1/account/GetDashBoardBill?AccountNumber=${accountNumber}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    )

    if (!res.ok) return null

    const body = (await res.json()) as AlectraDashboardResponse
    return body.data ?? null
  } catch {
    return null
  }
}

/**
 * Poll Alectra for the current bill.
 * Returns bill data or an error.
 */
export async function pollAlectraBill(
  username: string,
  password: string,
  accountNumber: string
): Promise<AlectraPollResult> {
  try {
    const token = await login(username, password)
    const bill = await fetchCurrentBill(token, accountNumber)
    const dashboard = await fetchDashboardBill(token, accountNumber)

    return {
      success: true,
      currentCharges: bill.currentCharges,
      totalAmountDue: bill.totalAmountDue,
      billPeriodStart: bill.billPeriodStartDate,
      billPeriodEnd: bill.billPeriodEndDate,
      invoiceId: bill.invoiceId,
      projectedBill: dashboard?.projectedBill ?? null,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
