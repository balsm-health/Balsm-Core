# Balsm Healthcare Platform — Glossary & Abbreviations

> Definitions of all abbreviations and acronyms used across the Balsm roadmap documents.

---

## 1. Healthcare Standards & Terminology

| Abbreviation | Full Name | Description |
|---|---|---|
| ACR | American College of Radiology | A professional organization that publishes reporting guidelines and appropriateness criteria for radiology |
| CAP | College of American Pathologists | A professional organization that publishes synoptic reporting protocols and cancer checklists for pathology |
| CPT | Current Procedural Terminology | A standardized code set used to describe medical, surgical, and diagnostic procedures for billing |
| DICOM | Digital Imaging and Communications in Medicine | The international standard for transmitting, storing, and sharing medical images |
| FHIR | Fast Healthcare Interoperability Resources | A modern HL7 standard for exchanging healthcare data using RESTful APIs |
| HCPCS | Healthcare Common Procedure Coding System | A standardized coding system used to identify healthcare products, supplies, and services not covered by CPT |
| HL7 | Health Level 7 | A set of international standards for the transfer of clinical and administrative health data between systems |
| ICD-10 | International Classification of Diseases, 10th Revision | A global coding system used to classify diseases, symptoms, and medical conditions |
| LOINC | Logical Observation Identifiers Names and Codes | A universal coding system for identifying laboratory and clinical observations |
| RadLex | Radiology Lexicon | A standardized terminology for radiology reporting maintained by the RSNA to ensure consistent imaging descriptions |
| RxNorm | Standardized Nomenclature for Clinical Drugs | A standardized naming system for medications enabling interoperability between pharmacy systems |
| SNOMED CT | Systematized Nomenclature of Medicine — Clinical Terms | A comprehensive clinical terminology system used for encoding clinical information |
| WHO ATC | WHO Anatomical Therapeutic Chemical Classification | A drug classification system maintained by WHO that organizes medications by therapeutic, pharmacological, and chemical properties |

---

## 2. Healthcare Operations & Clinical

| Abbreviation | Full Name | Description |
|---|---|---|
| ADT | Admission, Discharge, Transfer | Standard healthcare workflow events tracking a patient's movement through a facility |
| CME | Continuing Medical Education | Ongoing education required for healthcare professionals to maintain their licenses and certifications |
| CMS | Centers for Medicare & Medicaid Services | A US federal agency that administers Medicare, Medicaid, and publishes healthcare documentation and billing guidelines |
| CPOE | Computerized Physician Order Entry | A system that allows physicians to enter medical orders (medications, labs, imaging) electronically |
| DAP | Data, Assessment, Plan | A structured clinical note format used as an alternative to SOAP for documenting patient encounters |
| CT | Computed Tomography | A medical imaging technique that uses X-rays to create detailed cross-sectional images of the body |
| EHR | Electronic Health Record | A comprehensive digital record of a patient's health history shared across healthcare providers |
| EMR | Electronic Medical Record | A digital version of a patient's chart within a single healthcare organization |
| ePCR | Electronic Patient Care Reporting | Digital documentation of patient assessments, treatments, and outcomes in emergency care |
| HIS | Hospital Information System | An integrated information system for managing the clinical, administrative, and financial operations of a hospital |
| LIS | Laboratory Information System | A system for managing lab workflows including orders, specimen tracking, and result reporting |
| MRI | Magnetic Resonance Imaging | A medical imaging technique using magnetic fields and radio waves to produce detailed images of organs and tissues |
| NICU | Neonatal Intensive Care Unit | A specialized hospital unit providing critical care for newborn infants |
| PACS | Picture Archiving and Communication System | A system for storing, retrieving, and distributing medical images digitally |
| PHI | Protected Health Information | Any individually identifiable health information that is regulated under HIPAA |
| SOAP | Subjective, Objective, Assessment, Plan | A structured format for documenting clinical encounters in patient notes |

---

## 3. Security, Privacy & Compliance

| Abbreviation | Full Name | Description |
|---|---|---|
| AES | Advanced Encryption Standard | Symmetric encryption algorithm widely used to protect data at rest and in transit |
| BAA | Business Associate Agreement | A legal contract required under HIPAA between a covered entity and a vendor that handles PHI |
| CORS | Cross-Origin Resource Sharing | A browser security mechanism that controls which domains can make requests to an API |
| GDPR | General Data Protection Regulation | EU regulation governing the collection, storage, and processing of personal data of EU residents |
| HIPAA | Health Insurance Portability and Accountability Act | US law that sets standards for protecting sensitive patient health information |
| JWT | JSON Web Token | A compact, self-contained token format used for securely transmitting authentication and authorization claims |
| KMS | Key Management Service | A service for creating, storing, rotating, and managing cryptographic keys |
| MFA | Multi-Factor Authentication | A security method requiring two or more verification factors to access an account |
| mTLS | Mutual Transport Layer Security | A TLS extension where both client and server authenticate each other using certificates |
| OAuth | Open Authorization | An open standard protocol for token-based authorization between services |
| PBAC | Permission-Based Access Control | An authorization model where granular permissions are assigned directly to users, with permission groups as convenience templates for bulk assignment |
| SSO | Single Sign-On | An authentication scheme allowing users to log in once and access multiple systems |
| TLS | Transport Layer Security | A cryptographic protocol that provides secure communication over a network |

---

## 4. Software Architecture & Engineering

| Abbreviation | Full Name | Description |
|---|---|---|
| ACID | Atomicity, Consistency, Isolation, Durability | Set of database transaction properties that guarantee data validity even during errors or failures |
| ADR | Architecture Decision Record | A document capturing an important architectural decision along with its context and consequences |
| API | Application Programming Interface | A defined set of rules and protocols that allows software systems to communicate with each other |
| CI/CD | Continuous Integration / Continuous Deployment | Automated practices for building, testing, and deploying code changes frequently and reliably |
| CLI | Command-Line Interface | A text-based interface for interacting with software by typing commands |
| CRUD | Create, Read, Update, Delete | The four basic operations for managing persistent data |
| DDD | Domain-Driven Design | A software design approach that models code around the business domain and its rules |
| ETL | Extract, Transform, Load | A process for moving data from source systems, converting it to the target format, and loading it into the destination |
| HTTP | HyperText Transfer Protocol | The foundational protocol used for transferring data on the web |
| REST | Representational State Transfer | An architectural style for designing networked APIs using standard HTTP methods |
| URI | Uniform Resource Identifier | A string that identifies a resource on the web by location or name |

---

## 5. Data Formats

| Abbreviation | Full Name | Description |
|---|---|---|
| CSV | Comma-Separated Values | A plain-text file format for storing tabular data with values separated by commas |
| JSON | JavaScript Object Notation | A lightweight, human-readable data format commonly used for API communication |
| PDF | Portable Document Format | A file format for presenting documents consistently across platforms and devices |
| QR | Quick Response (code) | A two-dimensional barcode that can be scanned to quickly access encoded information |
| XML | Extensible Markup Language | A markup language for encoding structured data in a human-readable and machine-readable format |

---

## 6. Infrastructure & Operations

| Abbreviation | Full Name | Description |
|---|---|---|
| RPO | Recovery Point Objective | The maximum acceptable amount of data loss measured in time after a disaster |
| RTO | Recovery Time Objective | The maximum acceptable downtime before a system must be restored after a disaster |
| SaaS | Software as a Service | A software delivery model where applications are hosted and accessed over the internet |
| SFTP | SSH File Transfer Protocol | A secure file transfer protocol that provides encrypted file access and transfer over SSH |
| SLA | Service Level Agreement | A contract defining the expected level of service, including uptime and response time targets |
| UAT | User Acceptance Testing | Testing performed by end users to validate that a system meets business requirements before go-live |

---

## 7. Balsm Platform Systems

| Abbreviation | Full Name | Description |
|---|---|---|
| EMS | Entity Management System | Balsm's module for managing healthcare organizations, branches, departments, and facilities |
| EMPI | Enterprise Master Patient Index | A system that maintains a single, consistent identifier for each patient across multiple systems |
| LMS | Labs Management System | Balsm's module for managing laboratory operations, orders, and results |
| PMS | Pharmacy Management System | Balsm's module for managing pharmacy operations, dispensation, and inventory |
| RMS | Radiology Management System | Balsm's module for managing radiology workflows, imaging orders, and reports |
| Profile QR | Patient Profile QR Token | The patient's permanent scannable identity token (`/t/{jti}`), spec emergency-token v2.0. **Formerly "Emergency QR"** — module, package, and route names (`EmergencyQr`, `emergency_card`, `/emergency-qr/*`) retain the historical name for wire and code compatibility; new writing says *profile QR* |
| Family Link | Family Account Link | A caregiver connection between two patient accounts, established by scanning the other person's profile QR and approved by them in their own app. Lifecycle: `pending` → `linked` (`FamilyLinkStatus`). Owned by Identity & Access (Caregiver / Guardianship), P002 |

---

## 8. General

| Abbreviation | Full Name | Description |
|---|---|---|
| AI | Artificial Intelligence | Technology that enables systems to perform tasks that typically require human intelligence |
| MVP | Minimum Viable Product | The smallest version of a product with enough features to be usable and gather feedback |
| NPS | Net Promoter Score | A metric measuring customer satisfaction and loyalty based on likelihood to recommend |
| WCAG | Web Content Accessibility Guidelines | International standards for making web content accessible to people with disabilities |
