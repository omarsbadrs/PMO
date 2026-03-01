// Serialisable data shapes passed from the dashboard Server Component
// to the ProjectCharts Client Component.

export interface CostData {
  totalBudget: number
  totalActuals: number
  totalCommitments: number
  openChanges: number
  currency: string
}

export interface PlanningData {
  totalActivities: number
  avgProgress: number
  openMilestones: number
  activitiesByStatus: { status: string; count: number }[]
}

export interface SafetyData {
  totalIncidents: number
  openObservations: number
  incidentsBySeverity: { severity: string; count: number }[]
}

export interface QualityData {
  openNcr: number
  openPunch: number
  totalInspections: number
  qualityItems: { name: string; open: number; closed: number }[]
}
