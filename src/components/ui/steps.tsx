import React from 'react'
import { LucideIcon } from 'lucide-react'

interface Step {
  title: string
  description: string
  icon: LucideIcon
}

interface StepsProps {
  steps: Step[]
  currentStep: number
}

export function Steps({ steps, currentStep }: StepsProps) {
  return (
    <div className="flex w-full">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = currentStep === index + 1
        const isCompleted = currentStep > index + 1

        return (
          <React.Fragment key={step.title}>
            <div className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isCompleted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-sm text-muted-foreground">
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex flex-1 items-center">
                <div
                  className={`h-[2px] w-full ${
                    currentStep > index + 1 ? 'bg-primary' : 'bg-border'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export type { Step }