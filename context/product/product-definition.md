# Product Definition: RentOS

- **Version:** 1.0
- **Status:** Proposed

---

## 1. The Big Picture (The "Why")

### 1.1. Project Vision & Purpose

To eliminate the time-consuming, repetitive tasks that burden Polish landlords managing multiple rental properties—transforming hours of manual listing creation, tenant communication, and property inspections into a seamless, AI-powered workflow that takes under 2 minutes per property.

### 1.2. Target Audience

Polish landlords who actively manage 3 or more rental properties and list them across multiple platforms, including both monthly rentals (otodom.pl, olx.pl) and daily/short-term rentals (Airbnb, Booking.com). These landlords are tech-savvy enough to embrace AI tools but frustrated by the current manual, time-intensive processes.

### 1.3. User Personas

- **Persona 1: "Kasia the Hybrid Landlord"**
  - **Role:** Owns 5 apartments in Warsaw—2 rented monthly via otodom.pl, 3 rented daily via Airbnb.
  - **Goal:** Wants to quickly create professional listings across all platforms without spending hours rewriting descriptions and answering the same tenant questions repeatedly.
  - **Frustration:** Spends 2-3 hours per apartment creating listings for each platform, manually documenting inventory before move-ins, and answering repetitive questions like "Does the apartment have a washing machine?" across multiple channels.

- **Persona 2: "Tomasz the Scaling Operator"**
  - **Role:** Recently expanded from 3 to 8 rental properties and feels overwhelmed by the administrative overhead.
  - **Goal:** Wants an AI assistant to handle routine tenant inquiries so he can focus on acquiring new properties and strategic decisions.
  - **Frustration:** Loses potential tenants because he can't respond to inquiries fast enough, and dreads the manual move-out inspection process where he has to compare current apartment conditions against initial photos.

### 1.4. Success Metrics

- **Reduce listing creation time by 90%:** From 2-3 hours per property down to under 2 minutes from raw photos to published listings.
- **Reduce repetitive tenant inquiry response time by 80%:** AI agent handles 80% of common questions automatically with human-in-the-loop escalation for complex queries.
- **Automate damage detection accuracy:** AI correctly identifies 85%+ of inventory items and detects visible damage/missing items with 90%+ accuracy during move-out inspections.
- **User onboarding success:** 80% of landlords successfully upload photos, generate listings, and activate their AI concierge for at least one property within their first session.

---

## 2. The Product Experience (The "What")

### 2.1. Core Features

- **AI-Powered Apartment Inventory Generation:** Upload photos of an apartment, and AI automatically creates a detailed inventory of all furniture, appliances, and amenities present.
- **Multi-Platform Listing Generator:** AI generates optimized listing descriptions, titles, and details tailored for each platform (otodom.pl, olx.pl, Airbnb, Booking.com) based on the apartment inventory.
- **AI Tenant Inquiry Concierge:** An intelligent chatbot that answers prospective tenant questions using knowledge from the apartment inventory, with automatic escalation to the landlord when uncertain.
- **Visual Move-Out Damage Detection:** When a tenant moves out, landlord uploads new photos and AI compares them against the original inventory to identify missing items or visible damage.
- **Human-in-the-Loop Control:** All AI responses and damage detection results are reviewed by the landlord before final decisions, ensuring accuracy and building trust.

### 2.2. User Journey

A landlord (Kasia) logs into RentOS after acquiring a new apartment. She uploads 10-15 photos of the empty/furnished apartment using her phone. Within seconds, the AI processes the photos and generates a comprehensive inventory listing every visible item (sofa, coffee table, washing machine, etc.).

Kasia reviews the inventory, makes a few minor corrections, then clicks "Generate Listings." The AI creates customized listing descriptions for otodom.pl, olx.pl, Airbnb, and Booking.com—each optimized for that platform's style and requirements. She copies and pastes these into each platform (no API integration in MVP).

Once the apartment is listed, prospective tenants start sending inquiries. Instead of answering each one manually, Kasia activates the AI concierge, which automatically responds to questions like "Is there parking?" or "Does it have a dishwasher?" by referencing the apartment's inventory. If a question is unclear or requires landlord judgment (e.g., "Can I bring my dog?"), the AI flags it for Kasia to answer personally.

Three months later, when the tenant moves out, Kasia uploads new photos of the apartment. The AI compares them to the original inventory and flags that the coffee table is missing and there's a stain on the sofa. Kasia reviews the flagged issues and uses this information to address security deposit deductions with the tenant.

---

## 3. Project Boundaries

### 3.1. What's In-Scope for this Version

- **Photo upload and AI inventory generation:** Core computer vision functionality to identify furniture, appliances, and amenities from apartment photos.
- **Multi-platform listing text generation:** AI-generated listing descriptions, titles, and feature lists optimized for otodom.pl, olx.pl, Airbnb, and Booking.com.
- **AI tenant inquiry chatbot:** Intelligent Q&A agent with knowledge base derived from apartment inventory, including human-in-the-loop escalation for uncertain queries.
- **Move-out damage detection:** Photo comparison feature to identify missing or damaged items when tenant moves out.
- **Manual listing publishing:** Landlords copy/paste generated listings into platforms (no direct API integration).
- **Basic landlord dashboard:** View all properties, their inventories, generated listings, and chatbot conversation logs.

### 3.2. What's Out-of-Scope (Non-Goals)

- **Direct API integrations with rental platforms:** No automated publishing to otodom.pl, olx.pl, Airbnb, or Booking.com—landlords manually copy/paste listings.
- **Payment processing:** No rent collection, security deposit management, or financial transactions.
- **Legal document generation:** No lease agreements, contracts, or official documentation.
- **Tenant-facing mobile app:** No dedicated app for tenants to communicate or pay rent—AI concierge can be integrated into existing messaging channels.
- **Property maintenance management:** No tracking of repairs, service requests, or vendor management.
- **Booking calendar management:** No synchronization of availability across platforms or automated reservation handling.
