# Audit Trail: Event-Sourced Inventory & Logistics Ledger
## Week 1: Event Flow & Network Structure Design

### 1. Overview
Yeh document system ke andar commands ke aane, unke validation, aur events me convert hokar Event Store me save hone ke flow ko define karta hai.

### 2. Core Concepts
* **Command:** Yeh ek intent hai (jaise `CREATE_CONTAINER` ya `UPDATE_LOCATION`). Yeh present state ko change karne ke liye request bhejta hai.
* **Event:** Yeh ek immutable fact hai jo ho chuka hai (jaise `CONTAINER_CREATED`). Isko change ya delete nahi kiya ja sakta.
* **Projections / Replay:** Events ki history ko step-by-step padh kar current state ko mathematically reconstruct karna.

### 3. Event Flow Sequence
1. **Client Request:** Frontend (React dashboard) se ek Command route par POST request aati hai.
2. **Command Validation:** Backend command ko validate karta hai ki data sahi hai ya nahi.
3. **Event Generation:** Valid command ke basis par ek naya Event generate hota hai with timestamp aur version.
4. **Event Store Persistence:** Event ko MongoDB ke Event Store collection me append kar diya jata hai.
5. **State Reconstruction (Replay):** Jab bhi state ki zarurat hoti hai, events ki list ko fetch karke projection logic ke through current state calculate ki jati hai.
6.