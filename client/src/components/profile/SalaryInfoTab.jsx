import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil } from 'lucide-react'

export function SalaryInfoTab({ salaryConfig, wageAmount, salaryComputed, setSalaryField, setComponentValue }) {
  return (
    <div className="mt-4 grid gap-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm">Salary Info</CardTitle>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit Salary Info">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-4">
              <div className="grid gap-1">
                <Label className="text-sm text-muted-foreground">Wage Type</Label>
                <div className="text-sm font-medium">Fixed wage</div>
              </div>

              <div className="flex items-end gap-3 text-sm">
                <div className="w-28 text-muted-foreground">Month Wage</div>
                <Input
                  inputMode="numeric"
                  className="h-8 flex-1 rounded-none border-0 border-b bg-transparent px-0 text-center font-medium focus-visible:ring-0"
                  value={salaryConfig.wageAmount}
                  onChange={e => setSalaryField('wageAmount', e.target.value)}
                />
                <div className="w-16 text-muted-foreground">/ Month</div>
              </div>

              <div className="flex items-end gap-3 text-sm">
                <div className="w-28 text-muted-foreground">Yearly wage</div>
                <div className="h-8 flex-1 border-b pb-1 text-center font-medium">{Math.round(wageAmount * 12)}</div>
                <div className="w-16 text-muted-foreground">/ Yearly</div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-end gap-3 text-sm">
                <div className="flex-1">
                  <div className="text-muted-foreground">No of working days</div>
                  <div className="text-muted-foreground">in a week:</div>
                </div>
                <Input
                  inputMode="numeric"
                  className="h-8 w-40 rounded-none border-0 border-b bg-transparent px-0 text-center font-medium focus-visible:ring-0"
                  value={salaryConfig.workingDaysPerWeek}
                  onChange={e => setSalaryField('workingDaysPerWeek', e.target.value)}
                />
              </div>
              <div className="flex items-end gap-3 text-sm">
                <div className="flex-1">
                  <div className="text-muted-foreground">Break Time:</div>
                </div>
                <Input
                  inputMode="decimal"
                  className="h-8 w-40 rounded-none border-0 border-b bg-transparent px-0 text-center font-medium focus-visible:ring-0"
                  value={salaryConfig.breakTimeHours}
                  onChange={e => setSalaryField('breakTimeHours', e.target.value)}
                />
              </div>
              <div className="flex items-end gap-3 text-sm">
                <div className="flex-1 text-muted-foreground">Hrs/day</div>
                <Input
                  inputMode="decimal"
                  className="h-8 w-40 rounded-none border-0 border-b bg-transparent px-0 text-center font-medium focus-visible:ring-0"
                  value={salaryConfig.hoursPerDay}
                  onChange={e => setSalaryField('hoursPerDay', e.target.value)}
                />
                <div className="w-16 text-muted-foreground">/Hrs</div>
              </div>
            </div>
          </div>

          {salaryComputed.exceedsWage && (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              The total of all components exceeds the defined wage. Adjust component values.
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="text-sm font-medium">Salary components</div>
              <div className="mt-3 space-y-4 text-sm">
                <div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">Basic Salary</div>
                    <div className="flex w-56 items-end gap-2">
                      <div className="flex-1 border-b pb-1 text-right">{salaryComputed.basic.toFixed(2)}</div>
                      <div className="text-muted-foreground">₹ / month</div>
                    </div>
                    <Input
                      inputMode="decimal"
                      className="h-8 w-16 rounded-none border-0 border-b bg-transparent px-0 text-right focus-visible:ring-0"
                      value={salaryConfig.components.basic.value}
                      onChange={e => setComponentValue('basic', e.target.value)}
                    />
                    <div className="text-muted-foreground">%</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Define Basic salary from company cost compute it based on monthly wages
                  </div>
                </div>

                <div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">House Rent Allowance</div>
                    <div className="flex w-56 items-end gap-2">
                      <div className="flex-1 border-b pb-1 text-right">{salaryComputed.hra.toFixed(2)}</div>
                      <div className="text-muted-foreground">₹ / month</div>
                    </div>
                    <Input
                      inputMode="decimal"
                      className="h-8 w-16 rounded-none border-0 border-b bg-transparent px-0 text-right focus-visible:ring-0"
                      value={salaryConfig.components.hra.value}
                      onChange={e => setComponentValue('hra', e.target.value)}
                    />
                    <div className="text-muted-foreground">%</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">HRA provided to employees 50% of the basic salary</div>
                </div>

                <div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">Standard Allowance</div>
                    <div className="flex w-56 items-end gap-2">
                      <Input
                        inputMode="decimal"
                        className="h-8 flex-1 rounded-none border-0 border-b bg-transparent px-0 text-right focus-visible:ring-0"
                        value={salaryConfig.components.standardAllowance.value}
                        onChange={e => setComponentValue('standardAllowance', e.target.value)}
                      />
                      <div className="text-muted-foreground">₹ / month</div>
                    </div>
                    <div className="w-16 text-right text-muted-foreground">Fixed</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    A standard allowance is a predetermined, fixed amount provided to employee as part of their salary
                  </div>
                </div>

                <div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">Performance Bonus</div>
                    <div className="flex w-56 items-end gap-2">
                      <div className="flex-1 border-b pb-1 text-right">{salaryComputed.performanceBonus.toFixed(2)}</div>
                      <div className="text-muted-foreground">₹ / month</div>
                    </div>
                    <Input
                      inputMode="decimal"
                      className="h-8 w-16 rounded-none border-0 border-b bg-transparent px-0 text-right focus-visible:ring-0"
                      value={salaryConfig.components.performanceBonus.value}
                      onChange={e => setComponentValue('performanceBonus', e.target.value)}
                    />
                    <div className="text-muted-foreground">%</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary
                  </div>
                </div>

                <div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">Leave Travel Allowance</div>
                    <div className="flex w-56 items-end gap-2">
                      <div className="flex-1 border-b pb-1 text-right">{salaryComputed.leaveTravelAllowance.toFixed(2)}</div>
                      <div className="text-muted-foreground">₹ / month</div>
                    </div>
                    <Input
                      inputMode="decimal"
                      className="h-8 w-16 rounded-none border-0 border-b bg-transparent px-0 text-right focus-visible:ring-0"
                      value={salaryConfig.components.leaveTravelAllowance.value}
                      onChange={e => setComponentValue('leaveTravelAllowance', e.target.value)}
                    />
                    <div className="text-muted-foreground">%</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    LTA is paid by the company to employees to cover their travel expenses, and calculated as a % of the basic salary
                  </div>
                </div>

                <div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">Fixed Allowance</div>
                    <div className="flex w-56 items-end gap-2">
                      <div className="flex-1 border-b pb-1 text-right">{salaryComputed.fixedAllowance.toFixed(2)}</div>
                      <div className="text-muted-foreground">₹ / month</div>
                    </div>
                    <div className="w-16 text-right text-muted-foreground">Auto</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Fixed allowance portion of wages is determined after calculating all salary components
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium">Configuration</div>
                <div className="mt-3 grid gap-4 text-sm">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 text-muted-foreground">PF rate</div>
                    <Input
                      inputMode="decimal"
                      className="h-8 w-28 rounded-none border-0 border-b bg-transparent px-0 text-right font-medium focus-visible:ring-0"
                      value={salaryConfig.pfRate}
                      onChange={e => setSalaryField('pfRate', e.target.value)}
                    />
                    <div className="text-muted-foreground">%</div>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1 text-muted-foreground">Professional Tax</div>
                    <Input
                      inputMode="decimal"
                      className="h-8 w-28 rounded-none border-0 border-b bg-transparent px-0 text-right font-medium focus-visible:ring-0"
                      value={salaryConfig.professionalTax}
                      onChange={e => setSalaryField('professionalTax', e.target.value)}
                    />
                    <div className="text-muted-foreground">₹</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Provident Fund (PF) Contribution</div>
                <div className="mt-3 space-y-4 text-sm">
                  <div>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">Employee</div>
                      <div className="flex w-56 items-end gap-2">
                        <div className="flex-1 border-b pb-1 text-right">{salaryComputed.pfEmployee.toFixed(2)}</div>
                        <div className="text-muted-foreground">₹ / month</div>
                      </div>
                      <div className="w-14 border-b pb-1 text-right">{Number(salaryConfig.pfRate || 0).toFixed(2)}</div>
                      <div className="text-muted-foreground">%</div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">PF is calculated based on the basic salary</div>
                  </div>

                  <div>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">Employer</div>
                      <div className="flex w-56 items-end gap-2">
                        <div className="flex-1 border-b pb-1 text-right">{salaryComputed.pfEmployer.toFixed(2)}</div>
                        <div className="text-muted-foreground">₹ / month</div>
                      </div>
                      <div className="w-14 border-b pb-1 text-right">{Number(salaryConfig.pfRate || 0).toFixed(2)}</div>
                      <div className="text-muted-foreground">%</div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">PF is calculated based on the basic salary</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Tax Deductions</div>
                <div className="mt-3 space-y-4 text-sm">
                  <div>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">Professional Tax</div>
                      <div className="flex w-56 items-end gap-2">
                        <div className="flex-1 border-b pb-1 text-right">{salaryComputed.professionalTax.toFixed(2)}</div>
                        <div className="text-muted-foreground">₹ / month</div>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Professional Tax deducted from the gross salary</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
