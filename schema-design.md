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
{
  "eventId": "evt_556677",
  "eventType": "INVENTORY_ITEM_CREATED",
  "version": 1,
  "timestamp": "2026-09-26T21:30:02Z",
  "data": {
    "sku": "ITEM-WH-003",
    "itemName": "Heavy Duty Pallet Jack",
    "quantity": 25,
    "warehouseLocation": "Sector-1C"
  },
  "causality": {
    "triggeredByCommand": "cmd_774433"
  }
}
# Week 1 (Day 4): Projection Logic & Event Handlers

## 1. Overview
Projections consume immutable events from the event store to build optimized read models for fast querying.

## 2. Event Handler Implementation (Node.js / JavaScript Example)
```javascript
async function handleInventoryItemCreated(event) {
  if (event.eventType !== "INVENTORY_ITEM_CREATED") return;

  const { sku, itemName, quantity, warehouseLocation } = event.data;
  
  const readModelRecord = {
    sku: sku,
    name: itemName,
    currentStock: quantity,
    location: warehouseLocation,
    updatedAt: event.timestamp
  };

  await db.inventoryReadModel.insertOne(readModelRecord);
}
## 4. Handling Stock Updates (`INVENTORY_QUANTITY_UPDATED`)
To handle stock increments or decrements without overriding the entire record, we apply an atomic update to the read-model database:

```javascript
async function handleInventoryQuantityUpdated(event) {
  if (event.eventType !== "INVENTORY_QUANTITY_UPDATED") {
    return;
  }

  const { sku, quantityChange } = event.data;

  // Atomic update using $inc operator in MongoDB
  await db.inventoryReadModel.updateOne(
    { sku: sku },
    { 
      $inc: { currentStock: quantityChange },$set: { 
        lastUpdatedEventId: event.eventId,
        updatedAt: event.timestamp 
      }
    }
  );
  
  console.log(`Stock updated successfully for SKU: ${sku}`);
}
## 5. Idempotency & Concurrency Control
To prevent duplicate processing or out-of-order event handling in projections, we track the last processed event ID:

```javascript
async function processEventSafely(event) {
  const existingRecord = await db.inventoryReadModel.findOne({ sku: event.data.sku });
  
  // Check for duplicate or older event (Idempotency check)
  if (existingRecord && existingRecord.lastUpdatedEventId === event.eventId) {
    console.log(`Event ${event.eventId} already processed. Skipping.`);
    return;
  }

  // Proceed with handler logic...
}
## 6. Read-Model Query API Example
Exposing the projected data through a lightweight Express.js endpoint for the frontend dashboard:

```javascript
// Express.js route to get inventory details instantly from the Read Model
app.get('/api/inventory/:sku', async (req, res) => {
  try {
    const item = await db.inventoryReadModel.findOne({ sku: req.params.sku });
    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
# Week 1 (Day 4): Projection Logic & Event Handlers

## 1. Overview
Projections consume immutable events from the event store to build optimized read models for fast querying and low-latency UI rendering.

## 2. Event Handler Implementation (`INVENTORY_ITEM_CREATED`)
```javascript
async function handleInventoryItemCreated(event) {
  if (event.eventType !== "INVENTORY_ITEM_CREATED") {
    return;
  }

  const { sku, itemName, quantity, warehouseLocation } = event.data;

  const readModelRecord = {
    sku: sku,
    name: itemName,
    currentStock: quantity,
    location: warehouseLocation,
    lastUpdatedEventId: event.eventId,
    updatedAt: event.timestamp
  };

  await db.inventoryReadModel.insertOne(readModelRecord);
  console.log(`Projection updated successfully for SKU: ${sku}`);
}
async function handleInventoryQuantityUpdated(event) {
  if (event.eventType !== "INVENTORY_QUANTITY_UPDATED") {
    return;
  }

  const { sku, quantityChange } = event.data;

  await db.inventoryReadModel.updateOne(
    { sku: sku },
    { 
      $inc: { currentStock: quantityChange },$set: { 
        lastUpdatedEventId: event.eventId,
        updatedAt: event.timestamp 
      }
    }
  );
  
  console.log(`Stock updated successfully for SKU: ${sku}`);
}
async function processEventSafely(event) {
  const existingRecord = await db.inventoryReadModel.findOne({ sku: event.data.sku });
  
  if (existingRecord && existingRecord.lastUpdatedEventId === event.eventId) {
    console.log(`Event ${event.eventId} already processed. Skipping.`);
    return;
  }
}
app.get('/api/inventory/:sku', async (req, res) => {
  try {
    const item = await db.inventoryReadModel.findOne({ sku: req.params.sku });
    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});