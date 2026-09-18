/**
 * Generic sequential code generator for HEEYAKU entity records.
 * Generates unique sequential codes with format: PREFIX-1001, PREFIX-1002, ...
 */
export async function generateSequentialCode(
  findLatestCode: () => Promise<string | null | undefined>,
  countTotal: () => Promise<number>,
  prefix: string,
  startNumber = 1001
): Promise<string> {
  const latestCode = await findLatestCode();
  const prefixWithDash = `${prefix}-`;

  if (!latestCode || !latestCode.startsWith(prefixWithDash)) {
    return `${prefixWithDash}${startNumber}`;
  }

  const numericPart = parseInt(latestCode.replace(prefixWithDash, ''), 10);
  if (isNaN(numericPart)) {
    const count = await countTotal();
    return `${prefixWithDash}${1000 + count + 1}`;
  }

  return `${prefixWithDash}${numericPart + 1}`;
}
