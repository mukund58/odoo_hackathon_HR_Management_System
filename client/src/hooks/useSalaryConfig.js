import { useEffect, useMemo, useState } from 'react'

const DEFAULT_SALARY_CONFIG = {
  wageType: 'fixed',
  wageAmount: 50000,
  workingDaysPerWeek: 5,
  breakTimeHours: 1,
  hoursPerDay: 8,
  pfRate: 12,
  professionalTax: 200,
  components: {
    basic: { type: 'percentOfWage', value: 50 },
    hra: { type: 'percentOfBasic', value: 50 },
    standardAllowance: { type: 'fixed', value: 4167 },
    performanceBonus: { type: 'percentOfWage', value: 8.33 },
    leaveTravelAllowance: { type: 'percentOfWage', value: 8.33 },
  },
}

export function useSalaryConfig(employeeId) {
  const salaryStorageKey = useMemo(() => `si_salary_${employeeId}`, [employeeId])

  const [salaryConfig, setSalaryConfig] = useState(() => {
    try {
      const raw = localStorage.getItem(salaryStorageKey)
      if (raw) return JSON.parse(raw)
    } catch {}
    return DEFAULT_SALARY_CONFIG
  })

  useEffect(() => {
    try {
      localStorage.setItem(salaryStorageKey, JSON.stringify(salaryConfig))
    } catch {}
  }, [salaryConfig, salaryStorageKey])

  const wageAmount = useMemo(() => {
    const n = Number(salaryConfig?.wageAmount)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }, [salaryConfig?.wageAmount])

  const salaryComputed = useMemo(() => {
    const cfg = salaryConfig || {}
    const comp = cfg.components || {}

    const basicPercent = Number(comp?.basic?.value)
    const hraPercent = Number(comp?.hra?.value)
    const perfPercent = Number(comp?.performanceBonus?.value)
    const ltaPercent = Number(comp?.leaveTravelAllowance?.value)
    const standardFixed = Number(comp?.standardAllowance?.value)

    const basic = Math.round((wageAmount * (Number.isFinite(basicPercent) ? basicPercent : 0)) / 100)
    const hra = Math.round((basic * (Number.isFinite(hraPercent) ? hraPercent : 0)) / 100)
    const performanceBonus = Math.round((wageAmount * (Number.isFinite(perfPercent) ? perfPercent : 0)) / 100)
    const leaveTravelAllowance = Math.round((wageAmount * (Number.isFinite(ltaPercent) ? ltaPercent : 0)) / 100)
    const standardAllowance = Number.isFinite(standardFixed) ? Math.round(standardFixed) : 0

    const subtotal = basic + hra + performanceBonus + leaveTravelAllowance + standardAllowance
    const remainder = wageAmount - subtotal
    const fixedAllowance = Math.max(0, Math.round(remainder))
    const exceedsWage = remainder < 0

    const pfRate = Number(cfg?.pfRate)
    const pf = Math.round((basic * (Number.isFinite(pfRate) ? pfRate : 0)) / 100)
    const professionalTax = Math.round(Number(cfg?.professionalTax) || 0)

    return {
      basic,
      hra,
      standardAllowance,
      performanceBonus,
      leaveTravelAllowance,
      fixedAllowance,
      exceedsWage,
      subtotalWithoutFixed: subtotal,
      total: subtotal + fixedAllowance,
      pfEmployee: pf,
      pfEmployer: pf,
      professionalTax,
    }
  }, [salaryConfig, wageAmount])

  function setSalaryField(field, value) {
    setSalaryConfig(prev => ({ ...(prev || {}), [field]: value }))
  }

  function setComponentValue(key, value) {
    setSalaryConfig(prev => ({
      ...(prev || {}),
      components: {
        ...((prev && prev.components) || {}),
        [key]: {
          ...(((prev && prev.components) || {})[key] || {}),
          value,
        },
      },
    }))
  }

  return {
    salaryConfig,
    setSalaryConfig,
    salaryStorageKey,
    wageAmount,
    salaryComputed,
    setSalaryField,
    setComponentValue,
  }
}
