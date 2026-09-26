# Week 1 (Day 3): Command & Event Schema Design

## 1. Command Structure (Input Payload)
Commands represent the intent to perform an action in the system. They are written in the imperative mood (e.g., `CreateInventoryItem`).

```json
{
  "commandId": "cmd_987654",
  "commandType": "CREATE_INVENTORY_ITEM",
  "timestamp": "2026-09-26T20:00:00Z",
  "payload": {
    "sku": "ITEM-WH-001",
    "itemName": "Industrial Safety Helmet",
    "initialQuantity": 150,
    "warehouseLocation": "Sector-4B"
  },
  "metadata": {
    "userId": "operator_zeba",
    "sourceClient": "React-Dashboard"
  }
}
# Week 1 (Day 3): Command & Event Schema Design

## 1. Command Structure (Input Payload)
Commands represent the intent to perform an action in the system. They are written in the imperative mood (e.g., `CreateInventoryItem`).

```json
{
  "commandId": "cmd_885522",
  "commandType": "CREATE_INVENTORY_ITEM",
  "timestamp": "2026-09-26T21:15:00Z",
  "payload": {
    "sku": "ITEM-WH-002",
    "itemName": "High-Visibility Safety Jacket",
    "initialQuantity": 300,
    "warehouseLocation": "Sector-2A"
  },
  "metadata": {
    "userId": "operator_zeba",
    "sourceClient": "React-Dashboard"
  }
}

{
  "eventId": "evt_994411",
  "eventType": "INVENTORY_ITEM_CREATED",
  "version": 1,
  "timestamp": "2026-09-26T21:15:02Z",
  "data": {
    "sku": "ITEM-WH-002",
    "itemName": "High-Visibility Safety Jacket",
    "quantity": 300,
    "warehouseLocation": "Sector-2A"
  },
  "causality": {
    "triggeredByCommand": "cmd_885522"
  }
}
## 3. Additional Example: Heavy Duty Pallet Jack

### Command Payload (`CREATE_INVENTORY_ITEM`)
```json
{
  "commandId": "cmd_774433",
  "commandType": "CREATE_INVENTORY_ITEM",
  "timestamp": "2026-09-26T21:30:00Z",
  "payload": {
    "sku": "ITEM-WH-003",
    "itemName": "Heavy Duty Pallet Jack",
    "initialQuantity": 25,
    "warehouseLocation": "Sector-1C"
  },
  "metadata": {
    "userId": "operator_zeba",
    "sourceClient": "React-Dashboard"
  }
}