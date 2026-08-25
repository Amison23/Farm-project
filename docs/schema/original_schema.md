# Original Schema Definition

## 1. `animal` Table

| Field Name | Description / Values |
| :--- | :--- |
| **Sheep ID** | Primary identifier for the animal |
| **Birth Year** | Year of birth |
| **Family Line (FF)** | Family lineage / pedigree line |
| **Sire ID** | ID of the male parent (Father) |
| **Dam ID** | ID of the female parent (Mother) |
| **Sex** | Gender of the animal |
| **Breed** | Breed designation (e.g. Dorper, Merino) |
| **Date of Birth** | Exact birth date |
| **Status** | `Active` \| `Sold` \| `Culled` |
| **Notes** | Additional observations or comments |

---

## 2. `vet_records` Table

| Field Name | Description / Values |
| :--- | :--- |
| **Date** | Date of treatment / examination |
| **Sheep ID** | Reference to the treated animal |
| **Product Name** | Medication or vaccine administered |
| **Batch Number** | Manufacturing batch / lot number |
| **Quantity Administered** | Dosage / amount given |
| **Route of Administration** | Method (e.g. Oral, Injection) |
| **Reason for Treatment** | Diagnosis or preventative reason |
| **Administered By** | Person administering treatment |
| **Withdrawal Period (Days)** | Meat / milk withdrawal period in days |
| **Veterinarian Name** | Name of attending veterinarian |
| **Outcome/Response** | Animal response / treatment outcome |
| **Notes** | Additional clinical notes |

---

## 3. `feed` Table

| Field Name | Description / Values |
| :--- | :--- |
| **Date** | Feeding log date |
| **Sheep ID** | Reference to the animal |
| **Base** | Main forage / feed base |
| **Nutrient Supplement** | Added dietary supplements |
| **Quantity of Feed per head** | Amount of feed per animal |
| **Notes** | Feeding notes or observations |
| **Outcome/Response** | Performance / yield response |