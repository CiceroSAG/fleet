# 🚛 Faned Fleet Management Platform: The Ultimate Operational Manual

This manual provides an exhaustive, step-by-step guide for every feature within the **Faned Fleet** application. 

---

## 🏗️ 1. Fleet & Asset Management

### **1.1 Fleet Inventory**
*   **What it is:** The central database for all your vehicles and machinery.
*   **Location:** `Sidebar` -> `Fleet`.
*   **How to Add:** Click `+ Add Equipment`. Fill in Asset Tag, Category (Truck, Excavator, etc.), Manufacturer, Model, Serial Number, and Year.
*   **How to Manage:** Use the `Status` filter to see Active vs. In-Maintenance units. Click any **Asset Tag** to open the deep-dive details.

### **1.2 Equipment Details & QR Centers**
*   **Location:** Click an Asset Tag in the Fleet list.
*   **Actions:**
    *   **History:** View all fuel, maintenance, and repair logs for this specific unit.
    *   **Operator Assignment:** Use the "Primary Operator" dropdown to link a driver.
    *   **QR Activation:** Click the `QrCode` icon 🏷️ (top right of the list) to generate a tag. Print this and stick it on the physical machine for field scanning.

### **1.3 Workshop & Bay Control**
*   **What it is:** Digital management of your physical maintenance bays.
*   **Location:** `Sidebar` -> `Workshop`.
*   **Setup:** Click `+ Add New Bay`. Name it based on your floor plan.
*   **Staging:** Go to a vehicle's **Equipment Details** and select a bay from the dropdown. The vehicle is now "Occupied" in the workshop.

---

## 🔧 2. Maintenance & Technical Services

### **2.1 Maintenance Scheduling (Planning)**
*   **What it is:** Proactive planning of upcoming services.
*   **Location:** `Sidebar` -> `Maintenance` -> `Scheduling`.
*   **Action:** Click `+ New Task`. Select the Equipment, Interval (Hours/KM), Type (Preventive/Corrective), and assign a **Technician**.

### **2.2 Maintenance Logs (History)**
*   **What it is:** The record of every service performed.
*   **Location:** `Sidebar` -> `Maintenance` -> `Maintenance Logs`.
*   **Action:** Click `+ Log Maintenance`. Record cost, date, and technician notes. *Note: Admins must approve these logs.*

### **2.3 Repair Management**
*   **What it is:** Managing break-fix operations.
*   **Location:** `Sidebar` -> `Repairs`.
*   **Action:** Click `+ Log Repair`. Define the fault (e.g., "Burst Hose"), set priority, and track the status from "Pending" to "Fixed".

### **2.4 Field Service Reports (FSR)**
*   **What it is:** Professional PDF reports for client work or internal audits.
*   **Location:** `Sidebar` -> `Field Service` -> `FSR`.
*   **Action:** Click `+ New Report`. Complete the field audit checklist. Click the **Download** icon 📥 after saving to get a branded PDF.

---

## 📦 3. Inventory & Supply Chain

### **3.1 Spare Parts Inventory**
*   **What it is:** Tracking stock levels of critical components.
*   **Location:** `Sidebar` -> `Inventory`.
*   **Action:** Add parts with `Name`, `Part Number`, and `Unit Price`. 
*   **Alerts:** The dashboard will highlight "Low Stock" items based on your `Min Stock` settings.

---

## ⛽ 4. Operations & Daily Compliance

### **4.1 Fuel Logs & Efficiency**
*   **Location:** `Sidebar` -> `Operations` -> `Fuel Logs`.
*   **Action:** Record Fuel Quantity, Total Cost, and Odometer.
*   **Result:** This data feeds the Dashboard charts to show fuel-burn trends.

### **4.2 Daily Inspections (DVIR)**
*   **Location:** `Sidebar` -> `Field Service` -> `Inspections`.
*   **Action:** Click `+ New Inspection`. Complete the safety walk-around.
*   **Safety Loop:** Any failed item (red cross) triggers a Repair Request to the Manager.

### **4.3 Incident Reporting**
*   **Location:** `Sidebar` -> `Incidents`.
*   **Action:** Record site accidents or damage. Attach photos and descriptions for HR/Safety reviews.

---

## 📊 5. Intelligence & Dashboard

### **5.1 AI Predictive Insights**
*   **Location:** Top of `Dashboard`.
*   **What it does:** Analyze your repair and fuel data to predict a breakdown *before* it happens. Click any AI insight card to take action.

### **5.2 Fuel Management (Strategy)**
*   **Location:** `Sidebar` -> `Intelligence` -> `Fuel Management`.
*   **Action:** Review high-level consumption patterns and cost per kilometer across the entire fleet to identify waste.

### **5.3 Real-Time Tracking & Map**
*   **Location:** `Sidebar` -> `Intelligence` -> `Real-Time Tracking`.
*   **What it does:** View the live GPS location of your connected fleet.

### **5.4 Utilization & Driver Behavior**
*   **Location:** `Sidebar` -> `Intelligence` -> `Utilization` or `Driver Behavior`.
*   **What it does:** Analyze idle time vs. active time and score drivers based on safety metrics (harsh braking, over-speeding).

### **5.5 Compliance & Audit**
*   **Location:** `Sidebar` -> `Intelligence` -> `Compliance`.
*   **Action:** Monitor your regulatory status, insurance renewals, and license expirations for the entire fleet.

### **5.6 Business Intelligence Reports**
*   **Location:** `Sidebar` -> `Intelligence` -> `Reports`.
*   **Action:** Generate custom CSV/PDF reports for the Board of Directors or Operations Meetings.

---

## ⚙️ 6. Administration & User Setup

### **6.1 User Management & Roles**
*   **Location:** `Sidebar` -> `Settings` -> `User Management`.
*   **Roles:**
    *   **Admin:** Full access.
    *   **Manager:** Operations and Scheduling.
    *   **Technician:** Repairs and FSRs.
    *   **Operator:** Fuel and Inspections.

### **6.2 Technician Directory**
*   **Location:** `Sidebar` -> `Settings` -> `Technicians`.
*   **Action:** Register your mechanical staff here so they can be assigned to Maintenance and Repair tasks.

### **6.3 System Settings**
*   **Location:** `Sidebar` -> `Settings`.
*   **Actions:** Update Company Name, upload a Logo for PDF reports, set Currency, and toggle feature flags (e.g., turn off GPS if not used).

---

## 📱 7. Mobile Field Operations

### **7.1 The Easy-Access Button (+)**
*   Click the big orange button at the bottom center of the mobile screen.
*   **Scan Asset:** Scan a truck tag to get immediate info.
*   **Quick Log:** Submit Fuel or Repairs without digging through menus.

### **7.2 Offline Mode**
*   The header will show `OFFLINE` if signal is lost. Keep working! Your data will sync automatically when you return to base Wi-Fi.

### **7.3 Troubleshooting Camera Access**
*   **Permission Prompt:** If the camera doesn't open, ensure you are using a modern browser (Safari on iOS, Chrome on Android).
*   **Browser Settings:** Go to your browser settings -> Site Settings -> Camera and ensure access is allowed for this domain.
*   **In-App Browsers:** If you are opening the app from inside WhatsApp or Facebook, the internal browsers often block camera access. Open the app in **Chrome** or **Safari** directly.

---
**Technical Version:** 2.3.0  
**Ready for Deployment**
