export type AllocationRatio = {
  key: string;
  ratioTenths: number;
};

export type CalculatedAllocation = AllocationRatio & {
  proposedPoints: number;
  issuedPoints: number;
  warrantyPoints: number;
};

export function calculatePointAllocations(finalPointPool: number, allocations: AllocationRatio[]): CalculatedAllocation[] {
  if (!Number.isInteger(finalPointPool) || finalPointPool <= 0) throw new Error("项目最终积分必须为正整数");
  if (allocations.length === 0) throw new Error("请至少添加一名积分分配人员");
  if (allocations.some((allocation) => !Number.isInteger(allocation.ratioTenths) || allocation.ratioTenths <= 0)) {
    throw new Error("积分分配比例必须为正数，且最多保留一位小数");
  }
  if (allocations.reduce((sum, allocation) => sum + allocation.ratioTenths, 0) !== 1000) {
    throw new Error("个人积分分配比例合计必须等于 100%");
  }

  const calculated = allocations.map((allocation) => {
    const exactPoints = finalPointPool * allocation.ratioTenths / 1000;
    const proposedPoints = Math.floor(exactPoints);
    return { ...allocation, proposedPoints, remainder: exactPoints - proposedPoints };
  });
  let remainingPoints = finalPointPool - calculated.reduce((sum, allocation) => sum + allocation.proposedPoints, 0);
  for (const allocation of [...calculated].sort((a, b) => b.remainder - a.remainder)) {
    if (remainingPoints <= 0) break;
    allocation.proposedPoints += 1;
    remainingPoints -= 1;
  }

  const targetInitial = Math.round(finalPointPool * 0.7);
  const issuedPoints = calculated.map((allocation) => Math.floor(allocation.proposedPoints * 0.7));
  issuedPoints[issuedPoints.length - 1] += targetInitial - issuedPoints.reduce((sum, points) => sum + points, 0);

  return calculated.map((allocation, index) => ({
    key: allocation.key,
    ratioTenths: allocation.ratioTenths,
    proposedPoints: allocation.proposedPoints,
    issuedPoints: issuedPoints[index],
    warrantyPoints: allocation.proposedPoints - issuedPoints[index],
  }));
}

export function inferRatioTenths(
  finalPointPool: number,
  allocations: Array<{ key: string; proposedPoints: number; ratioTenths?: number }>,
): Record<string, number> {
  if (allocations.length === 0) return {};
  const storedRatiosAreValid = allocations.every((allocation) => Number.isInteger(allocation.ratioTenths) && allocation.ratioTenths! > 0)
    && allocations.reduce((sum, allocation) => sum + allocation.ratioTenths!, 0) === 1000;
  if (storedRatiosAreValid) return Object.fromEntries(allocations.map((allocation) => [allocation.key, allocation.ratioTenths!]));
  if (finalPointPool <= 0) return {};

  const inferred = allocations.map((allocation) => {
    const exactTenths = allocation.proposedPoints * 1000 / finalPointPool;
    const ratioTenths = Math.floor(exactTenths);
    return { ...allocation, ratioTenths, remainder: exactTenths - ratioTenths };
  });
  let remainingTenths = 1000 - inferred.reduce((sum, allocation) => sum + allocation.ratioTenths, 0);
  for (const allocation of [...inferred].sort((a, b) => b.remainder - a.remainder)) {
    if (remainingTenths <= 0) break;
    allocation.ratioTenths += 1;
    remainingTenths -= 1;
  }
  return Object.fromEntries(inferred.map((allocation) => [allocation.key, allocation.ratioTenths]));
}
