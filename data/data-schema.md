```mermaid
erDiagram
    USER {
        string id PK
        string email UK
        string phone UK
        string role
        boolean onboarding_complete
    }
    PATIENT_PROFILE {
        string id PK
        string user_id FK,UK
    }
    REFRESH_TOKEN {
        string id PK
        string user_id FK
        string token_hash UK
        datetime expires_at
        datetime revoked_at
    }
    VERIFICATION_TOKEN {
        string id PK
        string user_id FK
        string token_hash UK
        string purpose
    }
    PHARMACY {
        string id PK
        string owner_user_id FK
        string name
        string verification_status
    }
    PHARMACIST {
        string id PK
        string pharmacy_id FK
        string user_id FK,UK
        string license_number UK
        string license_issued_by
        string license_document_url
        string verification_status
        boolean is_active
    }
    PHARMACY_LICENSE {
        string id PK
        string pharmacy_id FK
        string license_number UK
    }
    VERIFICATION_RECORD {
        string id PK
        string pharmacy_id FK "nullable"
        string pharmacist_id FK "nullable"
        string reviewer_id FK
        string decision
    }
    AUDIT_LOG {
        string id PK
        string actor_id FK
        string entity_type
        string entity_id
        string action
    }
    PRODUCT {
        string id PK
        string pharmacy_id FK
        string sku UK
        int stock_count
        decimal unit_price
    }
    ORDER {
        string id PK
        string patient_user_id FK
        string pharmacy_id FK
        string status
        decimal total
    }
    ORDER_ITEM {
        string id PK
        string order_id FK
        string product_id FK
        int quantity
    }
    REFILL_REQUEST {
        string id PK
        string patient_user_id FK
        string pharmacy_id FK
        string status
    }

    USER ||--o| PATIENT_PROFILE : has
    USER ||--o{ REFRESH_TOKEN : owns
    USER ||--o{ VERIFICATION_TOKEN : owns
    USER ||--o{ PHARMACY : owns
    USER ||--o| PHARMACIST : represents
    USER ||--o{ AUDIT_LOG : performs
    PHARMACY ||--o{ PHARMACIST : employs
    PHARMACY ||--o{ PHARMACY_LICENSE : submits
    PHARMACY ||--o{ VERIFICATION_RECORD : receives
    PHARMACIST ||--o{ VERIFICATION_RECORD : receives
    USER ||--o{ VERIFICATION_RECORD : reviews
    PHARMACY ||--o{ PRODUCT : lists
    USER ||--o{ ORDER : places
    PHARMACY ||--o{ ORDER : receives
    ORDER ||--o{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : snapshots
    USER ||--o{ REFILL_REQUEST : requests
    PHARMACY ||--o{ REFILL_REQUEST : fulfils
```

Vendor onboarding creates the `USER`, `PHARMACY`, `PHARMACY_LICENSE`, and supervising
`PHARMACIST` records together. The pharmacy and pharmacist credentials receive one
administrative decision, and the pharmacy is only exposed in the marketplace after
approval. Additional pharmacist staff linkage remains a separate internal workflow.

Medication, adherence, chat, and notification tables are intentionally deferred to
their implementation phases so migrations remain aligned with working application code.
