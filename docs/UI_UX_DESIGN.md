# UI/UX Design Specification

## Design Philosophy

**Enterprise-level UX, simple enough to build in 8 hours**

- Clean, modern interface inspired by Material Design and Ant Design
- Consistent spacing and typography
- Intuitive navigation with clear visual hierarchy
- Responsive design for desktop and tablet
- Accessible color contrasts (WCAG AA compliant)

## Color Palette

```css
Primary Colors:
- Primary: #3B82F6 (Blue 500) - Main actions, links
- Primary Dark: #2563EB (Blue 600) - Hover states
- Primary Light: #60A5FA (Blue 400) - Subtle highlights

Secondary Colors:
- Success: #10B981 (Green 500) - Validated, positive actions
- Warning: #F59E0B (Amber 500) - Pending, low stock
- Error: #EF4444 (Red 500) - Errors, delete actions
- Info: #3B82F6 (Blue 500) - Information messages

Neutral Colors:
- Background: #F9FAFB (Gray 50)
- Surface: #FFFFFF (White)
- Border: #E5E7EB (Gray 200)
- Text Primary: #111827 (Gray 900)
- Text Secondary: #6B7280 (Gray 500)
- Text Muted: #9CA3AF (Gray 400)
```

## Typography

```css
Font Family: Inter, system-ui, sans-serif

Headings:
- H1: 32px, Bold (700), Line-height: 1.2
- H2: 24px, Semibold (600), Line-height: 1.3
- H3: 20px, Semibold (600), Line-height: 1.4
- H4: 18px, Medium (500), Line-height: 1.5

Body:
- Large: 16px, Regular (400), Line-height: 1.5
- Base: 14px, Regular (400), Line-height: 1.5
- Small: 12px, Regular (400), Line-height: 1.5

Buttons:
- Large: 16px, Medium (500)
- Base: 14px, Medium (500)
- Small: 12px, Medium (500)
```

## Component Structure

### Layout Components

#### 1. **App Shell**
```
┌─────────────────────────────────────────┐
│  Header (Logo, User Menu, Notifications)│
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │  Main Content Area           │
│ (Nav)    │  (Dynamic based on route)    │
│          │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

#### 2. **Sidebar Navigation**
- Dashboard (icon: LayoutDashboard)
- Products (icon: Package)
- Receipts (icon: Inbox)
- Deliveries (icon: Truck)
- Transfers (icon: ArrowLeftRight)
- Adjustments (icon: Calculator)
- Ledger (icon: BookOpen)
- Settings (icon: Settings)
- Profile (icon: User)

### Page Wireframes

#### **1. Login Page (OTP)**
```
┌─────────────────────────────────────┐
│                                     │
│         [StockMaster Logo]          │
│                                     │
│    ┌─────────────────────────┐    │
│    │  Phone Number           │    │
│    │  [Input Field]          │    │
│    │                         │    │
│    │  [Send OTP Button]      │    │
│    └─────────────────────────┘    │
│                                     │
│    ┌─────────────────────────┐    │
│    │  OTP Code               │    │
│    │  [Input Field]          │    │
│    │                         │    │
│    │  [Verify & Login]       │    │
│    └─────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

#### **2. Dashboard**
```
┌─────────────────────────────────────────────────────────┐
│  Dashboard                    [Date Filter] [Export]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ Total    │  │ Low Stock│  │ Pending  │  │ Pending ││
│  │ Stock    │  │ Items    │  │ Receipts │  │Deliveries││
│  │  1,234   │  │    12    │  │    5     │  │    3    ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Recent Transactions                    [View All →]    │
├─────────────────────────────────────────────────────────┤
│  Type    │ Document # │ Date      │ Status   │ Actions │
│  Receipt │ REC-001    │ 2024-01-15│ Validated│ [View]  │
│  Delivery│ DEL-002    │ 2024-01-15│ Pending  │ [View]  │
│  Transfer │ TRF-003    │ 2024-01-14│ Validated│ [View]  │
└─────────────────────────────────────────────────────────┘
```

#### **3. Products List**
```
┌─────────────────────────────────────────────────────────┐
│  Products          [Search SKU...]  [+ New Product]     │
├─────────────────────────────────────────────────────────┤
│  Filters: [All Categories ▼] [All Warehouses ▼]        │
├─────────────────────────────────────────────────────────┤
│  SKU      │ Name        │ Category │ Stock │ Actions   │
│  SKU-001  │ Product A   │ Category1│  100  │ [Edit]    │
│  SKU-002  │ Product B   │ Category2│   5   │ [Edit]    │
│  SKU-003  │ Product C   │ Category1│  250  │ [Edit]    │
└─────────────────────────────────────────────────────────┘
```

#### **4. Receipts List**
```
┌─────────────────────────────────────────────────────────┐
│  Receipts          [Search...]  [+ New Receipt]         │
├─────────────────────────────────────────────────────────┤
│  Filters: [All Status ▼] [All Warehouses ▼] [Date Range]│
├─────────────────────────────────────────────────────────┤
│  #       │ Date      │ Warehouse │ Items │ Status      │
│  REC-001 │ 2024-01-15│ WH-001    │   5   │ [Validate]  │
│  REC-002 │ 2024-01-14│ WH-002    │   3   │ Validated   │
└─────────────────────────────────────────────────────────┘
```

#### **5. Receipt Detail/Form Modal**
```
┌─────────────────────────────────────────┐
│  New Receipt                      [×]   │
├─────────────────────────────────────────┤
│  Warehouse: [Select Warehouse ▼]        │
│  Date: [2024-01-15]                     │
│  Notes: [Text area]                     │
│                                         │
│  Items:                                 │
│  ┌───────────────────────────────────┐ │
│  │ Product │ Qty │ Unit Price │ Total│ │
│  │ [Select]│ [5] │ [100.00]   │ 500  │ │
│  │ [+ Add Item]                     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Total: $500.00                         │
│                                         │
│  [Cancel]  [Save Draft]  [Validate]     │
└─────────────────────────────────────────┘
```

#### **6. Delivery Orders List**
```
┌─────────────────────────────────────────────────────────┐
│  Delivery Orders    [Search...]  [+ New Delivery]       │
├─────────────────────────────────────────────────────────┤
│  Filters: [All Status ▼] [All Warehouses ▼] [Date Range]│
├─────────────────────────────────────────────────────────┤
│  #       │ Date      │ Warehouse │ Items │ Status      │
│  DEL-001 │ 2024-01-15│ WH-001    │   3   │ [Validate]  │
│  DEL-002 │ 2024-01-14│ WH-002    │   2   │ Validated   │
└─────────────────────────────────────────────────────────┘
```

#### **7. Internal Transfers List**
```
┌─────────────────────────────────────────────────────────┐
│  Internal Transfers  [Search...]  [+ New Transfer]      │
├─────────────────────────────────────────────────────────┤
│  Filters: [All Status ▼] [All Warehouses ▼] [Date Range]│
├─────────────────────────────────────────────────────────┤
│  #       │ Date      │ From→To    │ Items │ Status      │
│  TRF-001 │ 2024-01-15│ WH-001→WH-2│   2   │ [Validate]  │
│  TRF-002 │ 2024-01-14│ WH-002→WH-1│   1   │ Validated   │
└─────────────────────────────────────────────────────────┘
```

#### **7. Adjustments List**
```
┌─────────────────────────────────────────────────────────┐
│  Adjustments        [Search...]  [+ New Adjustment]     │
├─────────────────────────────────────────────────────────┤
│  Filters: [All Warehouses ▼] [Date Range]               │
├─────────────────────────────────────────────────────────┤
│  #       │ Date      │ Warehouse │ Items │ Reason      │
│  ADJ-001 │ 2024-01-15│ WH-001    │   2   │ Stocktake   │
│  ADJ-002 │ 2024-01-14│ WH-002    │   1   │ Damage      │
└─────────────────────────────────────────────────────────┘
```

#### **8. Ledger (Move History)**
```
┌─────────────────────────────────────────────────────────┐
│  Move History (Ledger)                                  │
├─────────────────────────────────────────────────────────┤
│  Filters: [Product ▼] [Warehouse ▼] [Date Range]        │
├─────────────────────────────────────────────────────────┤
│  Date      │ Product │ Type    │ Qty │ Location │ User │
│ 2024-01-15 │ SKU-001 │ Receipt │ +50 │ WH-001   │ John │
│ 2024-01-15 │ SKU-002 │ Delivery│ -10 │ WH-001   │ Jane │
│ 2024-01-14 │ SKU-001 │ Transfer│ -20 │ WH-001   │ John │
│ 2024-01-14 │ SKU-001 │ Transfer│ +20 │ WH-002   │ John │
└─────────────────────────────────────────────────────────┘
```

#### **9. Settings (Warehouses & Locations)**
```
┌─────────────────────────────────────────────────────────┐
│  Settings                                                │
├─────────────────────────────────────────────────────────┤
│  Warehouses                                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Name      │ Code  │ Address        │ Actions     │  │
│  │ Warehouse1│ WH-001│ 123 Main St   │ [Edit][Del]  │  │
│  │ Warehouse2│ WH-002│ 456 Oak Ave   │ [Edit][Del]  │  │
│  │ [+ Add Warehouse]                                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Locations (for selected warehouse)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Name      │ Code  │ Type          │ Actions     │  │
│  │ Zone A    │ Z-A   │ Storage       │ [Edit][Del] │  │
│  │ Zone B    │ Z-B   │ Storage       │ [Edit][Del] │  │
│  │ [+ Add Location]                                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### **10. Profile**
```
┌─────────────────────────────────────────────────────────┐
│  Profile                                                 │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Avatar]                                         │  │
│  │  Name: [John Doe]                                 │  │
│  │  Phone: [+1234567890]                             │  │
│  │  Role: [Inventory Manager]                        │  │
│  │                                                    │  │
│  │  [Update Profile]                                  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## User Flows

### Flow 1: Receiving Goods
1. User clicks "Receipts" → "New Receipt"
2. Selects warehouse and date
3. Adds products with quantities
4. Saves as draft (optional)
5. Clicks "Validate"
6. System automatically:
   - Updates stock levels
   - Creates ledger entries
   - Updates dashboard KPIs
7. Receipt status changes to "Validated"

### Flow 2: Delivering Goods
1. User clicks "Deliveries" → "New Delivery"
2. Selects warehouse and date
3. Adds products with quantities
4. System validates stock availability
5. User clicks "Validate"
6. System automatically:
   - Decreases stock levels
   - Creates ledger entries
   - Updates dashboard KPIs
7. Delivery status changes to "Validated"

### Flow 3: Internal Transfer
1. User clicks "Transfers" → "New Transfer"
2. Selects source and destination warehouses
3. Adds products with quantities
4. System validates source stock availability
5. User clicks "Validate"
6. System automatically:
   - Decreases stock at source
   - Increases stock at destination
   - Creates ledger entries for both
   - Updates dashboard KPIs

### Flow 4: Stock Adjustment
1. User clicks "Adjustments" → "New Adjustment"
2. Selects warehouse and location
3. Selects product and enters physical count
4. System shows current stock vs physical count
5. User enters reason
6. User clicks "Save"
7. System automatically:
   - Updates stock to physical count
   - Creates ledger entry
   - Updates dashboard KPIs

## Responsive Breakpoints

- **Desktop**: 1024px+ (Full sidebar, full table)
- **Tablet**: 768px - 1023px (Collapsible sidebar, scrollable table)
- **Mobile**: < 768px (Bottom nav, card-based layout)

## Accessibility

- Keyboard navigation support
- ARIA labels on all interactive elements
- Focus indicators visible
- Color contrast ratios meet WCAG AA
- Screen reader friendly

## Loading States

- Skeleton loaders for tables
- Spinner for buttons during API calls
- Progress indicators for long operations
- Toast notifications for success/error

