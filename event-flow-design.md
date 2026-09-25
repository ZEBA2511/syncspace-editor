# Audit Trail: Event-Sourced Inventory & Logistics
## Week 1: Event Flow & Network Structure Design

### 3. Event Flow Sequence
1. **Client Request:** An HTTP POST request is triggered from the frontend (React dashboard) to the specific Command route.
2. **Command Validation:** The backend service validates the incoming command data to ensure business rules and constraints are met.
3. **Event Generation:** Based on the validated command, a new immutable Event is generated, complete with a timestamp and version number.
4. **Event Store Persistence:** The generated event is securely appended to the Event Store collection in MongoDB.
5. **State Reconstruction (Replay):** Whenever the current state is required, the list of historical events is fetched, and projection logic is executed to calculate the active state dynamically.

### 4. System Components & Network Topology
* **React Dashboard (Client Layer):** Acts as the user interface where warehouse operators trigger inventory actions (e.g., stock check, shipment dispatch).
* **API Gateway / Backend Service:** Handles incoming HTTP POST requests, validates payloads against business rules, and acts as the gatekeeper for event generation.
* **Event Store (Persistence Layer):** An append-only log database (such as MongoDB) designed to store historical events chronologically.
* **State Projection Engine:** Replays historical events on-the-fly to reconstruct the current active state of any inventory item without modifying historical logs.