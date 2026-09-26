ERDiagram

    %% 1. IDENTITY & ACTORS
    USER {
        int user_id PK
        string email
        string password_hash
    }
    PATIENT {
        int patient_id PK
        int user_id FK
    }
    PHARMACY {
        int pharmacy_id PK
        int owner_user_id FK
        string name
        string verification_status
    }
    PHARMACIST {
        int pharmacist_id PK
        int user_id FK
        int pharmacy_id FK
    }

    %% 2. PATIENT HEALTH & ADHERENCE
    MEDICATION_RECORD {
        int medication_id PK
        int patient_id FK
        string drug_name
        string dosage
        date start_date
    }
    MEDICATION_SCHEDULE {
        int schedule_id PK
        int medication_id FK
        string frequency
    }
    ADHERENCE_EVENT {
        int event_id PK
        int schedule_id FK
        string status "Taken, Skipped, Snoozed"
    }

    %% 3. MARKETPLACE & FULFILLMENT
    PRODUCT {
        int product_id PK
        string generic_name
    }
    INVENTORY_ITEM {
        int inventory_id PK
        int pharmacy_id FK
        int product_id FK
        int stock_level
    }
    ORDER {
        int order_id PK
        int patient_id FK
        int pharmacy_id FK
        string status
    }
    ORDER_ITEM {
        int order_item_id PK
        int order_id FK
        int inventory_id FK
        int quantity
    }

    %% RELATIONSHIPS
    USER ||--|| PATIENT : "is a"
    USER ||--o{ PHARMACY : "owns"
    USER ||--|| PHARMACIST : "is a"
    PHARMACY ||--o{ PHARMACIST : "employs"
    
    PATIENT ||--o{ MEDICATION_RECORD : "manages"
    MEDICATION_RECORD ||--o{ MEDICATION_SCHEDULE : "has rules"
    MEDICATION_SCHEDULE ||--o{ ADHERENCE_EVENT : "logs"
    
    PHARMACY ||--o{ INVENTORY_ITEM : "stocks"
    PRODUCT ||--o{ INVENTORY_ITEM : "listed as"
    
    PATIENT ||--o{ ORDER : "places"
    PHARMACY ||--o{ ORDER : "receives"
    ORDER ||--o{ ORDER_ITEM : "contains"
    INVENTORY_ITEM ||--o{ ORDER_ITEM : "fulfills"
