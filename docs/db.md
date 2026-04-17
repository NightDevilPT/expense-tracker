## 📚 Complete Database Table Explanation

---

## 1️⃣ **USER TABLE** (Core - Most Important)

### **What it stores:**
User account information - email, name, password, and personal preferences.

### **Why we need it:**
Without this table, you can't identify who owns which transaction. Every piece of data must belong to a user.

### **Key fields explained:**
| Field | Purpose | Example |
|-------|---------|---------|
| `email` | Login & communication | john@gmail.com |
| `passwordHash` | Security (never store plain password) | encrypted_string |
| `currency` | Show money in user's preferred format | USD, EUR, INR |
| `theme` | Light/dark mode preference | "dark" |
| `firstDayOfWeek` | Calendar start (Sunday/Monday) | 0 (Sunday) |

### **Data flow:**
```
User signs up → Create User record → User logs in → All queries filter by userId
```

### **Relationships:**
- One User has MANY Transactions
- One User has MANY Categories
- One User has MANY Budgets
- One User has MANY Savings Goals

---

## 2️⃣ **TRANSACTION TABLE** (Heart of the App)

### **What it stores:**
Every single money movement - when you spent $5 on coffee or received $3000 salary.

### **Why we need it:**
This is the core purpose of your app. Without transactions, there's nothing to track.

### **Key fields explained:**
| Field | Purpose | Example |
|-------|---------|---------|
| `amount` | How much money | 1500.00 (positive=income, negative=expense) |
| `type` | Income, Expense, or Transfer | "EXPENSE" |
| `date` | When money moved | 2026-04-15 |
| `description` | Short note | "Starbucks coffee" |
| `notes` | Long details | "Met with client, discussed project" |

### **Data flow:**
```
User clicks "Add Transaction" → Fills form → Creates Transaction record → Shows on Dashboard
```

### **Relationships:**
- MANY Transactions belong to ONE User
- MANY Transactions belong to ONE Category
- MANY Transactions belong to ONE Account
- MANY Transactions can be generated from ONE RecurringTransaction

---

## 3️⃣ **CATEGORY TABLE** (Organization)

### **What it stores:**
Labels to group similar transactions - "Food", "Transport", "Salary", "Shopping".

### **Why we need it:**
Without categories, users can't understand where money goes. "I spent $2000" vs "I spent $500 on food, $300 on transport" - second is useful.

### **Key fields explained:**
| Field | Purpose | Example |
|-------|---------|---------|
| `name` | Display name | "Groceries" |
| `type` | Income or Expense category | "EXPENSE" |
| `icon` | Visual identifier | "shopping-cart" |
| `color` | Chart color | "#FF5733" |
| `isDefault` | System category vs user-created | true/false |

### **Data flow:**
```
User creates transaction → Selects category → Reports group by category → Shows spending by category
```

### **Relationships:**
- ONE Category has MANY Transactions
- ONE Category can have ONE Budget
- ONE Category can link to ONE Savings Goal

### **Default categories provided:**
**Expense:** Food, Transport, Shopping, Bills, Entertainment, Health, Education, Travel, Rent, Insurance
**Income:** Salary, Freelance, Gift, Refund, Investment

---

## 4️⃣ **BUDGET TABLE** (Spending Control)

### **What it stores:**
Monthly limits per category - "I want to spend max $500 on food this month".

### **Why we need it:**
Users want to control spending, not just track it. Budgets create awareness and prevent overspending.

### **Key fields explained:**
| Field | Purpose | Example |
|-------|---------|---------|
| `amount` | Maximum allowed | 500.00 |
| `period` | Monthly, Weekly, Yearly | "MONTHLY" |
| `spent` | Current spending (auto-calculated) | 320.50 |
| `remaining` | Leftover budget | 179.50 |
| `alertThreshold` | When to warn user | 80 (%) |

### **Data flow:**
```
User creates budget → System calculates spent from transactions → Shows progress bar → Alert at 80%
```

### **How budget calculation works:**
```
1. User creates Budget: Food = $500 for March
2. System queries all March transactions with Category=Food
3. Sums amounts = $320 spent
4. Calculates remaining = $180
5. Shows progress bar: 64% used
6. If spent reaches $400 (80%), sends alert
```

### **Relationships:**
- MANY Budgets belong to ONE User
- MANY Budgets belong to ONE Category (optional - null means overall budget)

---

## 5️⃣ **SAVINGS GOAL TABLE** (Motivation)

### **What it stores:**
Future targets - "Save $5000 for vacation by December".

### **Why we need it:**
Tracking expenses is reactive. Savings goals are proactive. Users stay engaged when they see progress toward dreams.

### **Key fields explained:**
| Field | Purpose | Example |
|-------|---------|---------|
| `name` | Goal description | "Paris Vacation" |
| `targetAmount` | Desired total | 5000.00 |
| `currentAmount` | Saved so far | 1250.00 |
| `deadline` | Target date | 2026-12-31 |
| `progress` | Percentage complete | 25 (%) |
| `status` | Active/Completed/Failed | "ACTIVE" |

### **Data flow:**
```
User creates goal → Can manually add money OR auto-save from category → Progress updates → Milestone celebration at 25%, 50%, 75%, 100%
```

### **Auto-save from category example:**
```
Goal: "Emergency Fund" linked to Category "Savings Transfer"
Every time user adds transaction with category "Savings Transfer" → Adds to currentAmount
```

### **Relationships:**
- MANY SavingsGoals belong to ONE User
- ONE SavingsGoal can link to ONE Category (auto-save)

---

## 6️⃣ **RECURRING TRANSACTION TABLE** (Automation)

### **What it stores:**
Rules for transactions that repeat - rent on 1st of every month, Netflix on 15th.

### **Why we need it:**
Users have predictable money flows. Manual entry every month is tedious. Automation saves time and ensures accuracy.

### **Key fields explained:**
| Field | Purpose | Example |
|-------|---------|---------|
| `name` | Rule name | "Monthly Rent" |
| `frequency` | How often | "MONTHLY" |
| `interval` | Every X days/weeks/months | 1 |
| `nextDueDate` | When to create next transaction | 2026-05-01 |
| `isActive` | Rule enabled or paused | true |

### **Data flow:**
```
User creates recurring rule → System checks daily for nextDueDate = today → Creates actual transaction → Updates nextDueDate to next period
```

### **Example schedule:**
```
Rule: Rent $1500 on 1st of every month
- April 1: Creates transaction, nextDueDate = May 1
- May 1: Creates transaction, nextDueDate = June 1
- June 1: Creates transaction, nextDueDate = July 1
```

### **Relationships:**
- MANY RecurringTransactions belong to ONE User
- ONE RecurringTransaction generates MANY Transactions
- ONE RecurringTransaction uses ONE Category
- ONE RecurringTransaction uses ONE Account

---

## 7️⃣ **ACCOUNT TABLE** (Money Sources)

### **What it stores:**
Different places where user keeps money - Cash, Bank Account, Credit Card, PayPal.

### **Why we need it:**
Users don't keep all money in one place. They need to know "How much in checking vs savings?" and "Which card did I use?"

### **Key fields explained:**
| Field | Purpose | Example |
|-------|---------|---------|
| `name` | Account identifier | "Chase Checking" |
| `type` | Cash/Bank/Credit/Digital | "BANK_ACCOUNT" |
| `balance` | Current money in account | 3250.50 |
| `isDefault` | Pre-selected for new transactions | true/false |

### **Data flow:**
```
User creates account → Selects account when adding transaction → Balance updates automatically → Shows account-specific reports
```

### **Balance calculation:**
```
Account starts at $0
Add transaction: Salary +$3000 → Balance = $3000
Add transaction: Coffee -$5 → Balance = $2995
Add transaction: Rent -$1500 → Balance = $1495
```

### **Relationships:**
- MANY Accounts belong to ONE User
- ONE Account has MANY Transactions
- ONE Account can be used in MANY RecurringTransactions

---

## 8️⃣ **TAG TABLE** (Extra Labels)

### **What it stores:**
Custom keywords for filtering - #tax-deductible, #business, #urgent.

### **Why we need it:**
Categories are broad ("Food"). Tags are specific ("#client-dinner", "#work-from-home"). Users want both.

### **Key fields explained:**
| Field | Purpose | Example |
|-------|---------|---------|
| `name` | Tag text | "tax-deductible" |
| `color` | Visual highlight | "#FF0000" |

### **Data flow:**
```
User creates tag → Adds tags to transactions → Can filter/search by tag → Generate reports for specific tags
```

### **Example use:**
- Tax season: Filter all #tax-deductible transactions
- Business expense report: Show all #client-meeting tags
- Year review: See all #impulse-purchase spending

### **Relationships:**
- MANY Tags belong to ONE User
- MANY Tags can link to MANY Transactions (via TransactionTag junction table)

---

## 9️⃣ **TRANSACTION TAG TABLE** (Junction/Linker)

### **What it stores:**
Links between Transactions and Tags (many-to-many relationship).

### **Why we need it:**
One transaction can have multiple tags (#business AND #tax-deductible). One tag can apply to multiple transactions. This junction table makes that possible.

### **Key fields explained:**
| Field | Purpose | Example |
|-------|---------|---------|
| `transactionId` | Links to Transaction | "txn_123" |
| `tagId` | Links to Tag | "tag_456" |

### **Data flow:**
```
User adds tags to transaction → Creates records in this table → Querying finds all tags for a transaction OR all transactions for a tag
```

### **Example scenario:**
```
Transaction: "Dinner with client" - $150
Tags attached: #business, #tax-deductible, #client-meeting

TransactionTag table gets 3 rows:
- (txn_123, tag_business)
- (txn_123, tag_tax)
- (txn_123, tag_client)
```

---

## 🔟 **ATTACHMENT TABLE** (Receipts)

### **What it stores:**
Receipt photos, bill scans, invoice PDFs attached to transactions.

### **Why we need it:**
Users want proof of spending. "I need to remember what I bought at Amazon" - receipt image solves this.

### **Key fields explained:**
| Field | Purpose | Example |
|-------|---------|---------|
| `filename` | Stored file name | "receipt_123.jpg" |
| `originalName` | User's original file | "amazon_order.pdf" |
| `url` | Cloud storage location | "https://cloud.com/..." |
| `thumbnailUrl` | Small preview | "https://cloud.com/thumb_..." |

### **Data flow:**
```
User adds transaction → Uploads receipt image → Saves to Cloudinary/S3 → Stores URL in Attachment table → Shows thumbnail in transaction list
```

### **Storage note:**
Images are NOT stored in database. Only URLs. Actual files go to cloud storage (Cloudinary free tier: 25GB).

### **Relationships:**
- MANY Attachments belong to ONE Transaction
- MANY Attachments belong to ONE User

---

## 1️⃣1️⃣ **AUDIT LOG TABLE** (Activity Tracking)

### **What it stores:**
Every action user takes - created transaction, edited budget, deleted category.

### **Why we need it:**
Accountability and debugging. "Who changed my rent amount?" or "I accidentally deleted something - can I see what?"

### **Key fields explained:**
| Field | Purpose | Example |
|-------|---------|---------|
| `action` | What happened | "UPDATE", "DELETE", "CREATE" |
| `entityType` | What type of record | "Transaction", "Budget" |
| `entityId` | Which record | "txn_123" |
| `oldValue` | Before the change | {amount: 1500} |
| `newValue` | After the change | {amount: 1600} |

### **Data flow:**
```
User edits transaction → Before saving, capture old data → After saving, capture new data → Create AuditLog record → User can view history
```

### **Example audit trail:**
```
April 1: User CREATED transaction "Rent $1500"
April 5: User UPDATED transaction amount to $1550 (old: 1500, new: 1550)
April 10: User DELETED transaction "Coffee $5"
```

### **Relationships:**
- MANY AuditLogs belong to ONE User
- MANY AuditLogs can track ONE Transaction

---

## 1️⃣2️⃣ **EXPORT HISTORY TABLE** (Data Portability)

### **What it stores:**
Log of when user exported their data and what they exported.

### **Why we need it:**
Trust. Users need to know they can leave with their data. Also helps track feature usage.

### **Key fields explained:**
| Field | Purpose | Example |
|-------|---------|---------|
| `format` | Export type | "PDF", "EXCEL", "CSV" |
| `dateRange` | What period | {start: Jan 1, end: Dec 31} |
| `filters` | Applied filters | {category: "Food", minAmount: 10} |

### **Data flow:**
```
User clicks Export → Selects format and filters → System generates file → Creates ExportHistory record → User downloads file
```

### **Why track exports:**
- Understand user needs ("80% export to Excel for taxes")
- Compliance (GDPR - prove user accessed their data)
- Usage patterns (power users vs casual)

---

## 🔄 **COMPLETE DATA FLOW DIAGRAM**

Here's how data moves through your app:

```
1. USER CREATES ACCOUNT
   ↓
   User table: Creates record
   ↓
   Default categories: Created automatically (Food, Transport, etc.)
   ↓
   Default account: Created (Cash account with $0)

2. USER ADDS TRANSACTION ($5 Coffee)
   ↓
   Transaction table: Creates record
   ↓
   Category: Links to "Food" category
   ↓
   Account: Links to "Cash" account, balance decreases by $5
   ↓
   Budget: If exists for Food category, spent increases by $5
   ↓
   Savings Goal: If linked to Food category, no change (only income affects goals)
   ↓
   Audit Log: Records "CREATE" action

3. USER SETS BUDGET ($500 for Food)
   ↓
   Budget table: Creates record
   ↓
   System calculates spent: Queries all Food transactions this month
   ↓
   Shows progress: $5 spent of $500 (1%)

4. USER CREATES SAVINGS GOAL ($2000 Vacation)
   ↓
   SavingsGoal table: Creates record
   ↓
   User can manually add progress OR link to category
   ↓
   When user adds income, can allocate to goal

5. RECURRING TRANSACTION (Rent $1500 on 1st)
   ↓
   RecurringTransaction table: Creates rule
   ↓
   Daily cron job: Checks nextDueDate
   ↓
   When date matches: Creates actual Transaction
   ↓
   Updates nextDueDate to next month
   ↓
   Audit Log: Records auto-creation

6. USER EXPORTS DATA
   ↓
   ExportHistory table: Creates record
   ↓
   System generates file (PDF/Excel/CSV)
   ↓
   User downloads file

7. USER EDITS TRANSACTION
   ↓
   Audit Log: Records old values BEFORE change
   ↓
   Transaction table: Updates record
   ↓
   Budget: Recalculates spent
   ↓
   Account: Adjusts balance (if account changed)
   ↓
   Audit Log: Records new values AFTER change

8. USER DELETES TRANSACTION
   ↓
   Audit Log: Records deletion with all values
   ↓
   Attachment: Deletes associated receipt images
   ↓
   TransactionTag: Removes tag links
   ↓
   Transaction: Deletes record
   ↓
   Budget: Recalculates spent
   ↓
   Account: Adjusts balance
```

---

## 📊 **TABLE SIZE ESTIMATES (For Planning)**

| Table | Average rows per user | Storage per row | Total for 1000 users |
|-------|---------------------|----------------|---------------------|
| User | 1 | 500 bytes | 0.5 MB |
| Transaction | 500/year | 200 bytes | 100 MB |
| Category | 15 | 150 bytes | 2.25 MB |
| Budget | 10 | 200 bytes | 2 MB |
| SavingsGoal | 5 | 200 bytes | 1 MB |
| RecurringTransaction | 8 | 250 bytes | 2 MB |
| Account | 4 | 200 bytes | 0.8 MB |
| Tag | 20 | 150 bytes | 3 MB |
| TransactionTag | 1000 | 50 bytes | 50 MB |
| Attachment | 200 | 300 bytes | 60 MB (URLs only) |
| AuditLog | 2000 | 500 bytes | 1000 MB (1 GB) |
| ExportHistory | 20 | 300 bytes | 6 MB |

**Total for 1000 users after 1 year:** ~1.2 GB (mostly audit logs)

---

## ✅ **QUICK REFERENCE: WHEN TO USE EACH TABLE**

| User action | Tables used |
|-------------|-------------|
| Sign up | User |
| Add expense | Transaction, Category, Account, Budget, AuditLog |
| Add income | Transaction, Category, Account, SavingsGoal, AuditLog |
| Set budget | Budget, Category |
| Create goal | SavingsGoal, Category |
| Setup recurring | RecurringTransaction, Category, Account |
| Upload receipt | Attachment, Transaction |
| Add tags | Tag, TransactionTag, Transaction |
| View reports | Transaction, Category, Account |
| Export data | ExportHistory, Transaction, Category |
| View history | AuditLog |
| Switch accounts | Account, Transaction |
