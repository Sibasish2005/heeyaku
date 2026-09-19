/**
 * Generic sequential code generator for HEEYAKU entity records.
 * Generates unique sequential codes with format: PREFIX-00001, PREFIX-00002, ...
 * @param padLength - Minimum digits to pad with zeros (e.g., 5 → 00001)
 */
export async function generateSequentialCode(
  findLatestCode: () => Promise<string | null | undefined>,
  countTotal: () => Promise<number>,
  prefix: string,
  startNumber = 1,
  padLength = 0
): Promise<string> {
  const latestCode = await findLatestCode();
  const prefixWithDash = `${prefix}-`;

  const pad = (n: number) => padLength > 0 ? String(n).padStart(padLength, '0') : String(n);

  if (!latestCode || !latestCode.startsWith(prefixWithDash)) {
    return `${prefixWithDash}${pad(startNumber)}`;
  }

  const numericPart = parseInt(latestCode.replace(prefixWithDash, ''), 10);
  if (isNaN(numericPart)) {
    const count = await countTotal();
    return `${prefixWithDash}${pad(count + 1)}`;
  }

  return `${prefixWithDash}${pad(numericPart + 1)}`;
}

