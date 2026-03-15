"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  saveAlectraAccount,
  deleteAlectraAccount,
} from "@/actions/alectra-accounts"

interface AlectraAccountData {
  id: string
  username: string
  accountNumber: string
  meterNumber: string | null
  status: string
  lastPollAt: string | null
  lastPollResult: string | null
}

interface TestResult {
  success: boolean
  isNewBill?: boolean
  message?: string
  error?: string
  bill?: {
    currentCharges: number
    totalAmountDue: number
    billPeriodStart: string
    billPeriodEnd: string
    projectedBill: number | null
  }
}

export function UtilityCard({
  propertyId,
  alectraAccount,
  lastBillFetchedAt,
  monthlyInvoiceAmount,
}: {
  propertyId: string
  alectraAccount: AlectraAccountData | null
  lastBillFetchedAt: string | null
  monthlyInvoiceAmount: number | null
}) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const isConnected = !!alectraAccount

  async function handleSave(formData: FormData) {
    await saveAlectraAccount(formData)
    setIsEditing(false)
    router.refresh()
  }

  async function handleDisconnect() {
    if (!alectraAccount) return
    await deleteAlectraAccount(alectraAccount.id)
    setIsEditing(false)
    setTestResult(null)
    router.refresh()
  }

  async function handleTest() {
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/alectra/test-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      })
      const data = (await res.json()) as TestResult
      setTestResult(data)
      if (data.success) {
        router.refresh()
      }
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Utility Connection</CardTitle>
          {isConnected && !isEditing && (
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                Alectra
              </Badge>
              <Badge
                variant="outline"
                className={
                  alectraAccount.status === "active"
                    ? "border-emerald-500/30 text-emerald-700 bg-emerald-50"
                    : "border-red-500/30 text-red-700 bg-red-50"
                }
              >
                {alectraAccount.status}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connected state */}
        {isConnected && !isEditing && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Username:</span>{" "}
                  {alectraAccount.username}
                </p>
                <p>
                  <span className="text-muted-foreground">Account #:</span>{" "}
                  {alectraAccount.accountNumber}
                </p>
                {alectraAccount.meterNumber && (
                  <p>
                    <span className="text-muted-foreground">Meter #:</span>{" "}
                    {alectraAccount.meterNumber}
                  </p>
                )}
              </div>
              <div className="space-y-2 text-sm">
                {monthlyInvoiceAmount != null && (
                  <p>
                    <span className="text-muted-foreground">Last Invoice:</span>{" "}
                    <span className="font-semibold">
                      ${monthlyInvoiceAmount.toFixed(2)}
                    </span>
                  </p>
                )}
                {lastBillFetchedAt && (
                  <p>
                    <span className="text-muted-foreground">Last Fetched:</span>{" "}
                    {new Date(lastBillFetchedAt).toLocaleDateString()}
                  </p>
                )}
                {alectraAccount.lastPollAt && (
                  <p>
                    <span className="text-muted-foreground">Last Poll:</span>{" "}
                    {new Date(alectraAccount.lastPollAt).toLocaleString()}
                    {alectraAccount.lastPollResult && (
                      <Badge
                        variant="outline"
                        className={`ml-2 text-xs ${
                          alectraAccount.lastPollResult === "success"
                            ? "border-emerald-500/30 text-emerald-700"
                            : "border-red-500/30 text-red-700"
                        }`}
                      >
                        {alectraAccount.lastPollResult}
                      </Badge>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={isTesting}
              >
                {isTesting ? "Testing…" : "Test Connection"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>

            {/* Test result */}
            {testResult && (
              <div
                className={`rounded-lg border p-3 text-sm ${
                  testResult.success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {testResult.success ? (
                  <div className="space-y-1">
                    <p className="font-medium">{testResult.message}</p>
                    {testResult.bill && (
                      <div className="text-xs space-y-0.5">
                        <p>
                          Current Charges: $
                          {testResult.bill.currentCharges.toFixed(2)}
                        </p>
                        <p>
                          Total Due: $
                          {testResult.bill.totalAmountDue.toFixed(2)}
                        </p>
                        <p>
                          Period: {testResult.bill.billPeriodStart} →{" "}
                          {testResult.bill.billPeriodEnd}
                        </p>
                        {testResult.bill.projectedBill != null && (
                          <p>
                            Projected: $
                            {testResult.bill.projectedBill.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p>{testResult.error}</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Create / Edit form */}
        {(!isConnected || isEditing) && (
          <form action={handleSave} className="space-y-4">
            <input type="hidden" name="propertyId" value={propertyId} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Username</Label>
                <Input
                  name="username"
                  defaultValue={isEditing ? alectraAccount?.username : ""}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input name="password" type="password" required />
              </div>
              <div className="space-y-1">
                <Label>Account Number</Label>
                <Input
                  name="accountNumber"
                  defaultValue={isEditing ? alectraAccount?.accountNumber : ""}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Meter Number (optional)</Label>
                <Input
                  name="meterNumber"
                  defaultValue={
                    isEditing ? alectraAccount?.meterNumber ?? "" : ""
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm">
                {isEditing ? "Update" : "Save"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}

        {/* Empty state */}
        {!isConnected && (
          <p className="text-xs text-muted-foreground">
            Enter your Alectra Utilities credentials. After saving, use
            &quot;Test Connection&quot; to verify.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
