import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"

type Item = Record<string, unknown>

// A subset of DynamoDB's reserved words, enough to catch the common mistakes.
const RESERVED_WORDS = new Set("ABORT ABSOLUTE ACTION ADD AFTER AGENT ALL ALLOCATE ALTER AND ANY ARCHIVE ARE ARRAY AS ASC AT ATTRIBUTE ATTRIBUTES AUTHORIZATION AVG BEFORE BEGIN BINARY BLOB BOOLEAN BOTH BY CALL CASE CAST CHAR CHECK CLOSE COLUMN COMMENT COMMIT CONDITION CONNECTION COUNT CREATE CURRENT CURSOR DATA DATABASE DATE DAY DEFAULT DELETE DESC DOMAIN DROP EACH ELSE END EXISTS FILTER FIRST FROM GROUP HASH HOUR INDEX ITEM ITEMS KEY KEYS LAST LIMIT LIST LOCAL MAP MONTH NAME NAMES NULL NUMBER OBJECT ORDER OWNER PATH PERCENT PRIMARY RANGE REGION ROLE ROWS SCHEMA SECTION SESSION SET SIZE SOURCE STATE STATUS STRING SYSTEM TABLE TEMPORARY TIME TIMESTAMP TO TOKEN TOTAL TTL TYPE UNIQUE UPDATE USER USERS VALUE VALUES VIEW YEAR ZONE".split(" "))

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

  // Conditions on a single item: attribute_exists / attribute_not_exists and
  // "attr = :value", joined with AND. A missing item fails anything but
  // attribute_not_exists. "#name" placeholders resolve through
  // ExpressionAttributeNames, and a bare DynamoDB reserved word is rejected the
  // way the real service rejects it.
  private conditionHolds(item: Item | undefined, condition: string, values: Item, names: Record<string, string>): boolean {
    const resolve = (raw: string) => {
      if (raw.startsWith("#")) {
        const real = names[raw]
        if (!real) throw new Error(`FakeTable: no ExpressionAttributeNames entry for ${raw}`)
        return real
      }
      if (RESERVED_WORDS.has(raw.toUpperCase())) {
        const err = new Error(`Invalid ConditionExpression: Attribute name is a reserved keyword; reserved keyword: ${raw}`)
        err.name = "ValidationException"
        throw err
      }
      return raw
    }
    return condition.split(/\s+AND\s+/).every((clause) => {
      const ex = clause.match(/^attribute_(not_)?exists\((#?\w+)\)$/)
      if (ex) {
        const attr = resolve(ex[2])
        const present = !!item && item[attr] !== undefined
        return ex[1] ? !present : present
      }
      const eq = clause.match(/^(#?\w+)\s*=\s*(:\w+)$/)
      if (eq) {
        const attr = resolve(eq[1])
        return !!item && item[attr] === values[eq[2]]
      }
      throw new Error(`FakeTable: unsupported condition clause ${clause}`)
    })
  }

  private checkCondition(key: string, condition: string | undefined, values: Item | undefined, names?: Record<string, string>) {
    if (!condition) return
    if (!this.conditionHolds(this.items.get(key), condition, values ?? {}, names ?? {})) {
      const err = new Error("The conditional request failed")
      err.name = "ConditionalCheckFailedException"
      throw err
    }
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
      this.checkCondition(String(item.userId), command.input.ConditionExpression, command.input.ExpressionAttributeValues as Item | undefined, command.input.ExpressionAttributeNames)
      this.put(item)
      return {}
    }
    if (command instanceof DeleteCommand) {
      const key = String(command.input.Key?.userId)
      this.checkCondition(key, command.input.ConditionExpression, command.input.ExpressionAttributeValues as Item | undefined, command.input.ExpressionAttributeNames)
      this.items.delete(key)
      return {}
    }
    if (command instanceof GetCommand) {
      return { Item: this.items.get(String(command.input.Key?.userId)) }
    }
    throw new Error(`FakeTable: unsupported command ${(command as object).constructor.name}`)
  }
}
