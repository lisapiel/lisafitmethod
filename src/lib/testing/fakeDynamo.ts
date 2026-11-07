import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"

type Item = Record<string, unknown>

// In-memory stand-in for the one DynamoDB table, for tests only. Scans return
// at most `pageSize` *examined* items per page, the way the real 1 MB limit
// applies before the filter, so filtered pages can come back empty with more
// pages still to read.
export class FakeTable {
  items = new Map<string, Item>()
  scanCalls = 0
  constructor(public pageSize = 3) {}

  put(item: Item) {
    this.items.set(String(item.userId), item)
  }

  private matches(item: Item, filter: string | undefined, values: Item): boolean {
    if (!filter) return true
    return filter.split(/\s+AND\s+/).every((clause) => {
      const bw = clause.match(/^begins_with\((\w+),\s*(:\w+)\)$/)
      if (bw) return String(item[bw[1]] ?? "").startsWith(String(values[bw[2]]))
      const eq = clause.match(/^(\w+)\s*=\s*(:\w+)$/)
      if (eq) return item[eq[1]] === values[eq[2]]
      throw new Error(`FakeTable: unsupported filter clause ${clause}`)
    })
  }

  async send(command: unknown): Promise<Record<string, unknown>> {
    if (command instanceof ScanCommand) {
      this.scanCalls += 1
      const input = command.input
      const keys = [...this.items.keys()].sort()
      const startAfter = input.ExclusiveStartKey?.userId as string | undefined
      const from = startAfter ? keys.indexOf(startAfter) + 1 : 0
      const page = keys.slice(from, from + this.pageSize)
      const values = (input.ExpressionAttributeValues ?? {}) as Item
      const Items = page
        .map((k) => this.items.get(k) as Item)
        .filter((it) => this.matches(it, input.FilterExpression, values))
      const more = from + this.pageSize < keys.length
      return { Items, ...(more ? { LastEvaluatedKey: { userId: page[page.length - 1] } } : {}) }
    }
    if (command instanceof PutCommand) {
      const item = command.input.Item as Item
      if (command.input.ConditionExpression === "attribute_not_exists(userId)" && this.items.has(String(item.userId))) {
        const err = new Error("The conditional request failed")
        err.name = "ConditionalCheckFailedException"
        throw err
      }
      this.put(item)
      return {}
    }
    if (command instanceof GetCommand) {
      return { Item: this.items.get(String(command.input.Key?.userId)) }
    }
    throw new Error(`FakeTable: unsupported command ${(command as object).constructor.name}`)
  }
}
