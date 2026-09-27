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
# Week 1 (Day 5): Unit Testing Projections & Event Stream Synchronization

## 1. Overview
On Day 5, we write automated unit tests to verify that our event handlers correctly project events into the read-model database and ensure event stream synchronization without data loss.

## 2. Unit Testing Event Handlers (Jest Framework Example)
Testing `handleInventoryItemCreated` to ensure the read-model document is created accurately when an event is emitted:

```javascript
// inventory.projection.test.js
const { handleInventoryItemCreated } = require('./projections');

describe('Inventory Projection Handlers', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      inventoryReadModel: {
        insertOne: jest.fn().mockResolvedValue(true)
      }
    };
  });

  test('should project INVENTORY_ITEM_CREATED event into read model correctly', async () => {
    const sampleEvent = {
      eventId: "evt_test_001",
      eventType: "INVENTORY_ITEM_CREATED",
      timestamp: "2026-09-27T08:00:00Z",
      data: {
        sku: "ITEM-WH-005",
        itemName: "Hi-Vis Safety Jacket",
        quantity: 50,
        warehouseLocation: "Sector-2B"
      }
    };

    // Inject mock database into the context
    global.db = mockDb;

    await handleInventoryItemCreated(sampleEvent);

    expect(mockDb.inventoryReadModel.insertOne).toHaveBeenCalledTimes(1);
    expect(mockDb.inventoryReadModel.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        sku: "ITEM-WH-005",
        name: "Hi-Vis Safety Jacket",
        currentStock: 50,
        location: "Sector-2B",
        lastUpdatedEventId: "evt_test_001"
      })
    );
  });
});
async function synchronizeEventStream(eventStore, projectionHandler) {
  console.log("Starting event stream synchronization...");
  
  // Fetch all historical events ordered by timestamp/sequence
  const events = await eventStore.find({}).sort({ sequenceNumber: 1 });

  for (const event of events) {
    try {
      await projectionHandler(event);
    } catch (error) {
      console.error(`Failed to synchronize event ${event.eventId}:`, error.message);
      // Optional: Push to Dead Letter Queue (DLQ)
    }
  }
  
  console.log("Event stream synchronization completed successfully.");
}
## 5. Optimized Batch Event Stream Synchronization
For production systems with large event stores, fetching events in batches prevents memory overflow:

```javascript
async function synchronizeEventStreamBatch(eventStore, projectionHandler, batchSize = 1000) {
  console.log("Starting batch event stream synchronization...");
  
  let lastSequenceNumber = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch events in controlled batches using sequence numbers
    const batch = await eventStore
      .find({ sequenceNumber: { $gt: lastSequenceNumber } })
      .sort({ sequenceNumber: 1 })
      .limit(batchSize);

    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    for (const event of batch) {
      try {
        await projectionHandler(event);
        lastSequenceNumber = event.sequenceNumber;
      } catch (error) {
        console.error(`Failed to process event ${event.eventId}:`, error.message);
        // Handle failure (e.g., skip or push to DLQ based on business logic)
      }
    }
    
    console.log(`Processed batch up to sequence number: ${lastSequenceNumber}`);
  }
  
  console.log("Batch event stream synchronization completed successfully.");
}
## 6. Event Schema Validation Guard
Validating incoming events against predefined schemas before projection processing:

```javascript
const Joi = require('joi');

const eventSchema = Joi.object({
  eventId: Joi.string().required(),
  eventType: Joi.string().required(),
  sequenceNumber: Joi.number().integer().min(1).required(),
  timestamp: Joi.isoDate().required(),
  data: Joi.object().required()
});

function validateEvent(event) {
  const { error } = eventSchema.validate(event);
  if (error) {
    throw new Error(`Invalid event structure: ${error.message}`);
  }
  return true;
}
// Dead Letter Queue (DLQ) Handler for Failed Events
async function moveToDeadLetterQueue(event, errorMessage, dlqCollection) {
  try {
    const dlqRecord = {
      originalEventId: event.eventId,
      eventType: event.eventType,
      payload: event,
      errorReason: errorMessage,
      failedAt: new Date().toISOString()
    };

    await dlqCollection.insertOne(dlqRecord);
    console.warn(`Event ${event.eventId} successfully moved to DLQ due to: ${errorMessage}`);
  } catch (dlqError) {
    console.error(`CRITICAL: Failed to push event to DLQ:`, dlqError.message);
  }
}
for (const event of batch) {
      try {
        await projectionHandler(event);
        lastSequenceNumber = event.sequenceNumber;
      } catch (error) {
        console.error(`Failed to process event ${event.eventId}:`, error.message);
        // Safely route to DLQ instead of crashing the entire stream
        await moveToDeadLetterQueue(event, error.message, db.deadLetterQueue);
      }
    }
    ## 7. Aggregate Snapshotting Strategy
To optimize performance and avoid replaying long event streams from scratch:

```javascript
// Save a snapshot of the aggregate state
async function saveSnapshot(sku, currentState, sequenceNumber, snapshotCollection) {
  await snapshotCollection.updateOne(
    { sku: sku },
    {
      $set: {
        state: currentState,
        lastSequenceNumber: sequenceNumber,
        updatedAt: new Date().toISOString()
      }
    },
    { upsert: true }
  );
  console.log(`Snapshot saved for SKU: ${sku} at sequence ${sequenceNumber}`);
}

// Load state from the latest snapshot before replaying remaining events
async function loadAggregateWithSnapshot(sku, eventStore, snapshotCollection) {
  const snapshot = await snapshotCollection.findOne({ sku: sku });
  
  let currentState = snapshot ? snapshot.state : null;
  let fromSequence = snapshot ? snapshot.lastSequenceNumber : 0;

  // Fetch only events that occurred *after* the snapshot
  const subsequentEvents = await eventStore.find({
    'data.sku': sku,
    sequenceNumber: { $gt: fromSequence }
  }).sort({ sequenceNumber: 1 });

  return { currentState, subsequentEvents };
}
// Idempotent Event Consumer Guard
async function processEventIdempotently(event, projectionHandler, processedEventsCollection) {
  // Check if the event has already been processed
  const existingRecord = await processedEventsCollection.findOne({ eventId: event.eventId });
  
  if (existingRecord) {
    console.log(`Skipping duplicate event: ${event.eventId} (Already processed at ${existingRecord.processedAt})`);
    return { status: "SKIPPED", reason: "Duplicate Event" };
  }

  try {
    // Execute the main projection handler
    await projectionHandler(event);

    // Record the event as successfully processed
    await processedEventsCollection.insertOne({
      eventId: event.eventId,
      eventType: event.eventType,
      processedAt: new Date().toISOString()
    });

    return { status: "SUCCESS" };
  } catch (error) {
    console.error(`Error processing event ${event.eventId}:`, error.message);
    throw error;
  }
// Day 6: Express Query API Endpoints for Inventory Read Model
const express = require('express');
const router = express.Router();

// 1. Get Inventory Item by SKU (Fast Read-Model Lookup)
router.get('/api/inventory/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    
    // Query directly from the optimized read model collection
    const item = await global.db.inventoryReadModel.findOne({ sku });

    if (!item) {
      return res.status(404).json({ error: `Inventory item with SKU '${sku}' not found.` });
    }

    return res.status(200).json({
      success: true,
      data: item
    });

  } catch (err) {
    console.error("Error fetching inventory item:", err.message);
    return res.status(500).json({ error: "Internal Server Error during query" });
  }
});

// 2. List All Inventory Items with Pagination
router.get('/api/inventory', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const items = await global.db.inventoryReadModel
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalCount = await global.db.inventoryReadModel.countDocuments();

    return res.status(200).json({
      success: true,
      page,
      limit,
      totalCount,
      data: items
    });

  } catch (err) {
    console.error("Error listing inventory items:", err.message);
    return res.status(500).json({ error: "Internal Server Error during query listing" });
  }
});

module.exports = router;
// server.js - Main Application Entry Point
const express = require('express');
const { MongoClient } = require('mongodb');

// Import routers created in Day 6
const commandRouter = require('./routes/commands'); // Path to your command API
const queryRouter = require('./routes/queries');     // Path to your query API

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory_ledger';

// Middleware to parse JSON bodies
app.use(express.json());

// Global Database Connection Setup
async function startServer() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log("Connected successfully to MongoDB database.");

    // Attach database instance globally or pass via middleware
    global.db = {
      eventStore: client.db().collection('eventStore'),
      inventoryReadModel: client.db().collection('inventoryReadModel'),
      deadLetterQueue: client.db().collection('deadLetterQueue'),
      processedEvents: client.db().collection('processedEvents'),
      snapshots: client.db().collection('snapshots')
    };

    // Mount API Routes
    app.use(commandRouter);
    app.use(queryRouter);

    // Health Check Route
    app.get('/health', (req, res) => {
      res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
    });

    // Start Express Server
    app.listen(PORT, () => {
      console.log(`Inventory & Logistics Ledger API server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
git add .
git commit -m "feat: add docker and docker-compose configuration for seamless containerized deployment"
git push origin main
// Day 6: Projection Handlers (Updates Read Model based on Event Type)
async function projectEventToReadModel(event) {
  const { eventType, data } = event;
  const { sku } = data;

  switch (eventType) {
    case 'INVENTORY_ITEM_CREATED':
      await db.inventoryReadModel.updateOne(
        { sku },
        {
          $set: {
            sku: sku,
            name: data.name,
            quantity: data.initialQuantity || 0,
            warehouseLocation: data.warehouseLocation,
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
          }
        },
        { upsert: true }
      );
      break;

    case 'INVENTORY_RESTOCKED':
      await db.inventoryReadModel.updateOne(
        { sku },
        { 
          $inc: { quantity: data.quantityAdded },$set: { updatedAt: new Date().toISOString() }
        }
      );
      break;

    case 'INVENTORY_DISPATCHED':
      await db.inventoryReadModel.updateOne(
        { sku },
        { 
          $inc: { quantity: -data.quantityDispatched },$set: { updatedAt: new Date().toISOString() }
        }
      );
      break;

    default:
      console.log(`Unhandled event type for projection: ${eventType}`);
  }
}
// Inside your /api/commands route, right after db.eventStore.insertOne(newEvent):
await projectEventToReadModel(newEvent);
// services/commandHandler.js - Core Command Processing Logic

async function handleInventoryCommand(commandData, db) {
  const { commandType, sku, payload } = commandData;

  // 1. Map Command Type to Domain Event Type
  let eventType;
  switch (commandType) {
    case 'CREATE_ITEM':
      eventType = 'INVENTORY_ITEM_CREATED';
      break;
    case 'RESTOCK_ITEM':
      eventType = 'INVENTORY_RESTOCKED';
      break;
    case 'DISPATCH_ITEM':
      eventType = 'INVENTORY_DISPATCHED';
      break;
    default:
      throw new Error(`Unsupported command type: ${commandType}`);
  }

  // 2. Fetch last sequence number to maintain strict ordering
  const lastEvent = await db.eventStore.findOne({}, { sort: { sequenceNumber: -1 } });
  const sequenceNumber = lastEvent ? lastEvent.sequenceNumber + 1 : 1;

  // 3. Create the immutable Event object
  const event = {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    sequenceNumber,
    timestamp: new Date().toISOString(),
    data: { sku, ...payload }
  };

  // 4. Append Event to Event Store
  await db.eventStore.insertOne(event);

  // 5. Update Read Model Projection instantly
  await projectEventToReadModel(event, db);

  return event;
}

// Inline Projection Helper for Real-time Read Model Sync
async function projectEventToReadModel(event, db) {
  const { eventType, data } = event;
  const { sku } = data;

  if (eventType === 'INVENTORY_ITEM_CREATED') {
    await db.inventoryReadModel.updateOne(
      { sku },
      {
        $set: {
          sku,
          name: data.name,
          quantity: data.initialQuantity || 0,
          warehouseLocation: data.warehouseLocation,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );
  } else if (eventType === 'INVENTORY_RESTOCKED') {
    await db.inventoryReadModel.updateOne(
      { sku },
      { 
        $inc: { quantity: data.quantityAdded },$set: { updatedAt: new Date().toISOString() }
      }
    );
  } else if (eventType === 'INVENTORY_DISPATCHED') {
    await db.inventoryReadModel.updateOne(
      { sku },
      { 
        $inc: { quantity: -data.quantityDispatched },$set: { updatedAt: new Date().toISOString() }
      }
    );
  }
}

module.exports = { handleInventoryCommand };
const { handleInventoryCommand } = require('./services/commandHandler');

app.post('/api/commands', async (req, res) => {
  try {
    const { error, value } = inventoryCommandSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const processedEvent = await handleInventoryCommand(value, global.db);

    return res.status(201).json({
      success: true,
      message: "Command processed successfully.",
      event: processedEvent
    });
  } catch (err) {
    console.error("Command error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});
const { handleInventoryCommand } = require('./services/commandHandler');

app.post('/api/commands', async (req, res) => {
  try {
    const { error, value } = inventoryCommandSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const processedEvent = await handleInventoryCommand(value, global.db);

    return res.status(201).json({
      success: true,
      message: "Command processed successfully.",
      event: processedEvent
    });
  } catch (err) {
    console.error("Command error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});