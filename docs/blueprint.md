App Name: iPOS - Intelligent Point of Sale (Ultra-Clean Version)

🚀 Core Features (Functional Architecture)

Advanced Sales Interface (POS): A high-performance, multi-cart interface allowing rapid item entry, real-time stock validation, and flexible discount application (fixed or percentage). Supports various payment states (Paid, Partial, Unpaid).
Product & Inventory Management: Full CRUD operations for products including barcode support, category organization, and unit management (Kg, Piece, Box, etc.). Tracks inventory logs for every movement (Sale, Return, Intake, Adjustment).
Customer Debt & Credit Management: Detailed customer profiles with automated debt tracking (outstandingBalance), credit limits, and professional printable account statements.
Supplier & Stock Intake System: Manage supplier relationships, track purchase prices, and process bulk stock intakes with automated inventory updates and cost calculation.
Specialized Bread System: A unique module for managing recurring daily bread orders, allowing automated conversion of standing orders into sales with a single click.
Sales Analytics Dashboard: Real-time visualization of revenue, net profit, expense tracking, and top-performing products/customers using Recharts.
Smart Stock Alerts: Rule-based notification system triggered when product quantities fall below the user-defined minStockLevel.

🛠️ Technical Architecture (Offline-First)

Frontend Framework: Next.js 14 (App Router) for a modern, SEO-friendly, and fast React-based structure.
Primary Database: IndexedDB (via Dexie.js) - 100% local, secure, and browser-resident database ensuring full functionality without internet access.
Cloud Synchronization: Integrated Supabase adapter for optional real-time cloud backup and multi-device synchronization.
State Management: Zustand with local storage persistence for managing carts, application state, and user preferences.
UI & Styling: Shadcn UI components combined with Tailwind CSS for a professional, responsive, and accessible interface.

🎨 Style & Design Guidelines

Theme: Premium Dark Mode by default, utilizing a sophisticated slate and zinc color palette to reduce eye strain and provide a modern "Pro" feel.
Primary Colors:
Background: Deep Slate (#020617) for the main workspace.
Cards/Containers: Slate-900 (#0f172a) for depth and hierarchy.
Accents: Indigo/Blue for primary actions and highlights.
Typography: 'Inter' (sans-serif) as the primary typeface for its exceptional legibility and neutral, objective character.
Responsive Layout: Mobile-first grid system ensuring seamless operation on tablets (standard POS hardware) and desktops.
Micro-interactions: Subtle Framer Motion transitions and Sonner notifications to provide immediate user feedback without distracting from the workflow.
Iconography: Clean, minimalist SVG icons (Lucide-React) for intuitive navigation and feature identification.

