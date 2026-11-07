import { ScanCommand, type ScanCommandInput, type ScanCommandOutput } from "@aws-sdk/lib-dynamodb"

export interface ScanSender {
  send(command: ScanCommand): Promise<Pick<ScanCommandOutput, "Items" | "LastEvaluatedKey">>
}

// A single Scan reads at most 1 MB of the table *before* the filter is applied,
// so a filtered scan can return a partial (even empty) page while matching
// records sit further on. Every caller that needs the full result must follow
// LastEvaluatedKey to the end.
const MAX_PAGES = 1000

export async function scanAll<T>(
  db: ScanSender,
  params: Omit<ScanCommandInput, "ExclusiveStartKey">
): Promise<T[]> {
  const items: T[] = []
  let startKey: Record<string, unknown> | undefined
  let pages = 0
  do {
    const result = await db.send(
      new ScanCommand({ ...params, ...(startKey ? { ExclusiveStartKey: startKey } : {}) })
    )
    items.push(...((result.Items ?? []) as T[]))
    startKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
    pages += 1
    if (pages >= MAX_PAGES && startKey) {
      throw new Error(`scanAll: stopped after ${MAX_PAGES} pages on ${params.TableName}`)
    }
  } while (startKey)
  if (pages > 20) {
    console.warn(`scanAll: ${params.TableName} needed ${pages} pages; consider an index`)
  }
  return items
}
