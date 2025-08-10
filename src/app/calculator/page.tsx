'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Form validation schema
const calculatorSchema = z.object({
  numberOfWorkers: z.number().min(1, 'Must have at least 1 worker').max(10000, 'Too many workers'),
  currentWeekHoursPerWorker: z.number().min(1, 'Current week hours per worker must be at least 1').max(168, 'Cannot exceed 168 hours per week'),
  targetWeekHoursPerWorker: z.number().min(1, 'Target week hours per worker must be at least 1').max(168, 'Cannot exceed 168 hours per week'),
  maxExtraHoursPerWorker: z.number().min(0, 'Max extra hours per worker cannot be negative').max(50, 'Max extra hours per worker too high'),
  hourlyRate: z.number().min(0.01, 'Hourly rate must be positive').max(1000, 'Hourly rate too high'),
});

type CalculatorFormData = z.infer<typeof calculatorSchema>;

interface Proposal {
  option: string;
  description: string;
  totalWeeklyHours: number;
  uncoveredHours: number;
  costImpact: number;
  costPercentageChange: number;
  efficiency: string;
  details: string;
}

export default function CalculatorPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      numberOfWorkers: 10,
      currentWeekHoursPerWorker: 40,
      targetWeekHoursPerWorker: 50,
      maxExtraHoursPerWorker: 5,
      hourlyRate: 25,
    },
  });

  const numberOfWorkers = watch('numberOfWorkers');
  const currentWeekHoursPerWorker = watch('currentWeekHoursPerWorker');
  const targetWeekHoursPerWorker = watch('targetWeekHoursPerWorker');
  const maxExtraHoursPerWorker = watch('maxExtraHoursPerWorker');
  const hourlyRate = watch('hourlyRate');
  
  // Calculate totals
  const totalCurrentWeekHours = numberOfWorkers * currentWeekHoursPerWorker;
  const totalTargetWeekHours = numberOfWorkers * targetWeekHoursPerWorker;
  const currentWeeklyCost = totalCurrentWeekHours * hourlyRate;
  const hourDifferencePerWorker = targetWeekHoursPerWorker - currentWeekHoursPerWorker;
  const totalHourDifference = numberOfWorkers * hourDifferencePerWorker;
  const maxTotalExtraHours = numberOfWorkers * maxExtraHoursPerWorker;

  const calculateProposals = (data: CalculatorFormData) => {
    setIsCalculating(true);
    
    // Calculate current metrics per worker and totals
    const totalCurrentWeekHours = data.numberOfWorkers * data.currentWeekHoursPerWorker;
    const totalTargetWeekHours = data.numberOfWorkers * data.targetWeekHoursPerWorker;
    const currentWeeklyCost = totalCurrentWeekHours * data.hourlyRate;
    const hourDifferencePerWorker = data.targetWeekHoursPerWorker - data.currentWeekHoursPerWorker;
    const maxTotalExtraHours = data.numberOfWorkers * data.maxExtraHoursPerWorker;
    
    const newProposals: Proposal[] = [];

    if (hourDifferencePerWorker > 0) {
      // Case 1: Need to INCREASE hours per worker (original functionality)
      const uncoveredHoursPerWorker = hourDifferencePerWorker;
      const totalUncoveredHours = data.numberOfWorkers * uncoveredHoursPerWorker;

      // Option 1: Add extra hours per worker (overtime)
      if (data.maxExtraHoursPerWorker >= uncoveredHoursPerWorker) {
        const extraHoursPerWorker = uncoveredHoursPerWorker;
        const totalExtraHours = extraHoursPerWorker * data.numberOfWorkers;
        const newTotalHours = totalCurrentWeekHours + totalExtraHours;
        const extraCost = totalExtraHours * data.hourlyRate * 1.5; // Overtime rate
        
        newProposals.push({
          option: 'Add Extra Hours per Worker',
          description: `Add ${extraHoursPerWorker} extra hours per worker per week (overtime at 1.5x)`,
          totalWeeklyHours: newTotalHours,
          uncoveredHours: 0,
          costImpact: extraCost,
          costPercentageChange: (extraCost / currentWeeklyCost) * 100,
          efficiency: 'Fully covered',
          details: `${data.numberOfWorkers} workers × ${extraHoursPerWorker} extra hours = ${totalExtraHours} total extra hours × $${(data.hourlyRate * 1.5).toFixed(2)} = $${extraCost.toLocaleString()}`,
        });
      }

      // Option 2: Use maximum extra hours per worker
      if (data.maxExtraHoursPerWorker > 0 && data.maxExtraHoursPerWorker < uncoveredHoursPerWorker) {
        const extraHoursPerWorker = data.maxExtraHoursPerWorker;
        const totalExtraHours = extraHoursPerWorker * data.numberOfWorkers;
        const newTotalHours = totalCurrentWeekHours + totalExtraHours;
        const remainingUncoveredPerWorker = uncoveredHoursPerWorker - extraHoursPerWorker;
        const totalRemainingUncovered = remainingUncoveredPerWorker * data.numberOfWorkers;
        const extraCost = totalExtraHours * data.hourlyRate * 1.5;
        
        newProposals.push({
          option: 'Use Maximum Extra Hours per Worker',
          description: `Add ${data.maxExtraHoursPerWorker} extra hours per worker (maximum allowed)`,
          totalWeeklyHours: newTotalHours,
          uncoveredHours: totalRemainingUncovered,
          costImpact: extraCost,
          costPercentageChange: (extraCost / currentWeeklyCost) * 100,
          efficiency: 'Partially covered',
          details: `${data.numberOfWorkers} workers × ${data.maxExtraHoursPerWorker} max extra hours = ${totalExtraHours} total extra hours × $${(data.hourlyRate * 1.5).toFixed(2)} = $${extraCost.toLocaleString()}. Still need ${remainingUncoveredPerWorker} hours per worker (${totalRemainingUncovered} total).`,
        });
      }

      // Option 3: Hire additional workforce
      const newWorkersCost = totalUncoveredHours * data.hourlyRate;
      
      newProposals.push({
        option: 'Hire Additional Workforce',
        description: `Hire additional workforce to cover ${uncoveredHoursPerWorker} hours per worker (${totalUncoveredHours} total hours)`,
        totalWeeklyHours: totalTargetWeekHours,
        uncoveredHours: 0,
        costImpact: newWorkersCost,
        costPercentageChange: (newWorkersCost / currentWeeklyCost) * 100,
        efficiency: 'Fully covered',
        details: `${totalUncoveredHours} additional hours × $${data.hourlyRate.toFixed(2)} (regular rate) = $${newWorkersCost.toLocaleString()} additional cost`,
      });

      // Option 4: Hybrid approach (max extra hours + new workforce)
      if (data.maxExtraHoursPerWorker > 0 && data.maxExtraHoursPerWorker < uncoveredHoursPerWorker) {
        const extraHoursPerWorker = data.maxExtraHoursPerWorker;
        const totalExtraHours = extraHoursPerWorker * data.numberOfWorkers;
        const remainingUncoveredPerWorker = uncoveredHoursPerWorker - extraHoursPerWorker;
        const totalRemainingHours = remainingUncoveredPerWorker * data.numberOfWorkers;
        
        const extraHoursCost = totalExtraHours * data.hourlyRate * 1.5;
        const newWorkersCost = totalRemainingHours * data.hourlyRate;
        const totalCost = extraHoursCost + newWorkersCost;
        
        newProposals.push({
          option: 'Hybrid Approach',
          description: `Add ${data.maxExtraHoursPerWorker} extra hours per worker + hire workforce for ${remainingUncoveredPerWorker} hours per worker`,
          totalWeeklyHours: totalTargetWeekHours,
          uncoveredHours: 0,
          costImpact: totalCost,
          costPercentageChange: (totalCost / currentWeeklyCost) * 100,
          efficiency: 'Fully covered',
          details: `${totalExtraHours} extra hours at $${(data.hourlyRate * 1.5).toFixed(2)} + ${totalRemainingHours} new workforce hours at $${data.hourlyRate.toFixed(2)} = $${totalCost.toLocaleString()}`,
        });
      }

    } else if (hourDifferencePerWorker < 0) {
      // Case 2: Need to REDUCE hours per worker while maintaining total hours
      const hoursReductionPerWorker = Math.abs(hourDifferencePerWorker);
      const totalHoursToReplace = data.numberOfWorkers * hoursReductionPerWorker;
      
      // Option 1: Hire additional workers to maintain total hours
      const additionalWorkersNeeded = Math.ceil(totalHoursToReplace / data.targetWeekHoursPerWorker);
      const actualAdditionalHours = additionalWorkersNeeded * data.targetWeekHoursPerWorker;
      const newWorkersCost = actualAdditionalHours * data.hourlyRate;
      const excessHours = actualAdditionalHours - totalHoursToReplace;
      
      newProposals.push({
        option: 'Hire Additional Workers',
        description: `Hire ${additionalWorkersNeeded} additional worker${additionalWorkersNeeded > 1 ? 's' : ''} to maintain ${totalCurrentWeekHours} total hours while reducing individual hours to ${data.targetWeekHoursPerWorker}`,
        totalWeeklyHours: totalCurrentWeekHours + excessHours,
        uncoveredHours: 0,
        costImpact: newWorkersCost,
        costPercentageChange: (newWorkersCost / currentWeeklyCost) * 100,
        efficiency: 'Fully covered',
        details: `Need to replace ${totalHoursToReplace} hours. Hiring ${additionalWorkersNeeded} workers × ${data.targetWeekHoursPerWorker} hours = ${actualAdditionalHours} hours. Cost: $${newWorkersCost.toLocaleString()}`,
      });

      // Option 2: Distribute extra hours among some workers
      if (data.maxExtraHoursPerWorker > 0) {
        const workersWithExtraHours = Math.ceil(totalHoursToReplace / data.maxExtraHoursPerWorker);
        const actualExtraHoursTotal = Math.min(totalHoursToReplace, workersWithExtraHours * data.maxExtraHoursPerWorker);
        const remainingHoursNeeded = totalHoursToReplace - actualExtraHoursTotal;
        
        if (remainingHoursNeeded <= 0) {
          // Can cover entirely with extra hours
          const extraCost = actualExtraHoursTotal * data.hourlyRate * 1.5;
          
          newProposals.push({
            option: 'Redistribute Hours with Overtime',
            description: `Reduce ${data.numberOfWorkers} workers to ${data.targetWeekHoursPerWorker} hours, add overtime to ${workersWithExtraHours} workers`,
            totalWeeklyHours: totalCurrentWeekHours,
            uncoveredHours: 0,
            costImpact: extraCost,
            costPercentageChange: (extraCost / currentWeeklyCost) * 100,
            efficiency: 'Fully covered',
            details: `${workersWithExtraHours} workers work up to ${data.maxExtraHoursPerWorker} extra hours each (${actualExtraHoursTotal} total extra hours) × $${(data.hourlyRate * 1.5).toFixed(2)} = $${extraCost.toLocaleString()}`,
          });
        } else {
          // Need combination of extra hours and new workers
          const additionalWorkersForRemainder = Math.ceil(remainingHoursNeeded / data.targetWeekHoursPerWorker);
          const extraCost = actualExtraHoursTotal * data.hourlyRate * 1.5;
          const newWorkersCostForRemainder = additionalWorkersForRemainder * data.targetWeekHoursPerWorker * data.hourlyRate;
          const totalCombinedCost = extraCost + newWorkersCostForRemainder;
          
          newProposals.push({
            option: 'Hybrid: Overtime + Additional Workers',
            description: `Reduce hours per worker to ${data.targetWeekHoursPerWorker}, add overtime to ${workersWithExtraHours} workers, hire ${additionalWorkersForRemainder} additional worker${additionalWorkersForRemainder > 1 ? 's' : ''}`,
            totalWeeklyHours: totalCurrentWeekHours + (additionalWorkersForRemainder * data.targetWeekHoursPerWorker - remainingHoursNeeded),
            uncoveredHours: 0,
            costImpact: totalCombinedCost,
            costPercentageChange: (totalCombinedCost / currentWeeklyCost) * 100,
            efficiency: 'Fully covered',
            details: `${actualExtraHoursTotal} overtime hours at $${(data.hourlyRate * 1.5).toFixed(2)} + ${additionalWorkersForRemainder} new workers. Total cost: $${totalCombinedCost.toLocaleString()}`,
          });
        }
      }

    } else {
      // Case 3: Hours per worker are already at target
      newProposals.push({
        option: 'Current Capacity Matches Target',
        description: 'Your current weekly hours per worker already match the target',
        totalWeeklyHours: totalCurrentWeekHours,
        uncoveredHours: 0,
        costImpact: 0,
        costPercentageChange: 0,
        efficiency: 'Fully covered',
        details: `Current: ${data.currentWeekHoursPerWorker} hours per worker = Target: ${data.targetWeekHoursPerWorker} hours per worker`,
      });
    }

    // Sort proposals by cost impact
    newProposals.sort((a, b) => a.costImpact - b.costImpact);

    setProposals(newProposals);
    setIsCalculating(false);
  };

  const onSubmit = handleSubmit(calculateProposals);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Labor Hour Coverage Calculator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Calculate how many hours are not covered by your current workforce and get proposals to cover the deficit with extra hours or new workers.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Current Configuration</h2>
            
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Number of Workers */}
              <div>
                <label htmlFor="numberOfWorkers" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Workers
                </label>
                <input
                  id="numberOfWorkers"
                  type="number"
                  step="1"
                  min="1"
                  {...register('numberOfWorkers', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.numberOfWorkers && (
                  <p className="mt-1 text-sm text-red-600">{errors.numberOfWorkers.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Total number of workers in your current workforce
                </p>
              </div>

              {/* Current Week Hours per Worker */}
              <div>
                <label htmlFor="currentWeekHoursPerWorker" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Week Hours per Worker
                </label>
                <input
                  id="currentWeekHoursPerWorker"
                  type="number"
                  step="1"
                  min="1"
                  max="168"
                  {...register('currentWeekHoursPerWorker', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.currentWeekHoursPerWorker && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentWeekHoursPerWorker.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Hours each worker currently works per week
                </p>
              </div>

              {/* Target Week Hours per Worker */}
              <div>
                <label htmlFor="targetWeekHoursPerWorker" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Week Hours per Worker
                </label>
                <input
                  id="targetWeekHoursPerWorker"
                  type="number"
                  step="1"
                  min="1"
                  max="168"
                  {...register('targetWeekHoursPerWorker', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.targetWeekHoursPerWorker && (
                  <p className="mt-1 text-sm text-red-600">{errors.targetWeekHoursPerWorker.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Hours each worker needs to work per week to meet requirements
                </p>
              </div>

              {/* Max Extra Hours per Worker */}
              <div>
                <label htmlFor="maxExtraHoursPerWorker" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Extra Hours per Worker (per week)
                </label>
                <input
                  id="maxExtraHoursPerWorker"
                  type="number"
                  step="1"
                  min="0"
                  {...register('maxExtraHoursPerWorker', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.maxExtraHoursPerWorker && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxExtraHoursPerWorker.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Maximum additional overtime hours each worker can work per week
                </p>
              </div>

              {/* Hourly Rate */}
              <div>
                <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate ($)
                </label>
                <input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('hourlyRate', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.hourlyRate && (
                  <p className="mt-1 text-sm text-red-600">{errors.hourlyRate.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isCalculating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCalculating ? 'Calculating...' : 'Calculate Proposals'}
              </button>
            </form>

            {/* Current Metrics */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Current Metrics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Number of Workers:</span>
                  <span className="ml-2 font-semibold">{numberOfWorkers || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Current Hours per Worker:</span>
                  <span className="ml-2 font-semibold">{currentWeekHoursPerWorker || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Target Hours per Worker:</span>
                  <span className="ml-2 font-semibold">{targetWeekHoursPerWorker || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Hour Difference per Worker:</span>
                  <span className={`ml-2 font-semibold ${hourDifferencePerWorker > 0 ? 'text-red-600' : hourDifferencePerWorker < 0 ? 'text-blue-600' : 'text-green-600'}`}>
                    {hourDifferencePerWorker > 0 ? `+${hourDifferencePerWorker}` : hourDifferencePerWorker || 0}
                  </span>
                  <span className="ml-1 text-xs text-gray-500">
                    {hourDifferencePerWorker > 0 ? '(need more)' : hourDifferencePerWorker < 0 ? '(reducing)' : '(match)'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Current Hours:</span>
                  <span className="ml-2 font-semibold">{totalCurrentWeekHours || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Target Hours:</span>
                  <span className="ml-2 font-semibold">{totalTargetWeekHours || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Hour Difference:</span>
                  <span className={`ml-2 font-semibold ${totalHourDifference > 0 ? 'text-red-600' : totalHourDifference < 0 ? 'text-blue-600' : 'text-green-600'}`}>
                    {totalHourDifference > 0 ? `+${totalHourDifference}` : totalHourDifference || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Max Extra Hours per Worker:</span>
                  <span className="ml-2 font-semibold">{maxExtraHoursPerWorker || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Extra Hours Available:</span>
                  <span className="ml-2 font-semibold">{maxTotalExtraHours || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Current Weekly Cost:</span>
                  <span className="ml-2 font-semibold">${(currentWeeklyCost || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Hourly Rate:</span>
                  <span className="ml-2 font-semibold">${(hourlyRate || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Coverage Proposals</h2>
            
            {proposals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">Enter your configuration and click "Calculate Proposals" to see coverage options.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      proposal.efficiency === 'Fully covered'
                        ? 'border-green-200 bg-green-50'
                        : proposal.efficiency === 'Partially covered'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{proposal.option}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          proposal.efficiency === 'Fully covered'
                            ? 'bg-green-100 text-green-800'
                            : proposal.efficiency === 'Partially covered'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {proposal.efficiency}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{proposal.description}</p>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Total Weekly Hours:</span>
                        <span className="ml-2 font-semibold">{proposal.totalWeeklyHours}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Remaining Uncovered:</span>
                        <span className={`ml-2 font-semibold ${proposal.uncoveredHours > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {proposal.uncoveredHours}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mb-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                      {proposal.details}
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Additional Cost:</span>
                        <div className="text-right">
                          <div className={`font-semibold ${proposal.costImpact === 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {proposal.costImpact === 0 ? 'No additional cost' : `$${proposal.costImpact.toLocaleString()}`}
                          </div>
                          {proposal.costImpact > 0 && (
                            <div className="text-sm text-red-600">
                              (+{proposal.costPercentageChange.toFixed(1)}%)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

