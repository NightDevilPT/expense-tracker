Here's the complete API documentation for ALL 71 endpoints with tables involved:

---

# Complete Expense Tracker API Documentation

---

## PRIORITY 1: Authentication & User (Week 1) - ✅ COMPLETED

### Tables Used: `User`, `OTPSession`

| Priority | API Endpoint            | Method | Description              | Tables Used      | Auth Required | Status  |
| -------- | ----------------------- | ------ | ------------------------ | ---------------- | ------------- | ------- |
| 1        | `/api/auth/request-otp` | POST   | Request OTP for login    | OTPSession       | No            | ✅ DONE |
| 2        | `/api/auth/login`       | POST   | Verify OTP and login     | OTPSession, User | No            | ✅ DONE |
| 3        | `/api/auth/me`          | GET    | Get current user profile | User             | Yes           | ✅ DONE |
| 4        | `/api/user/:id`         | PUT    | Update user profile      | User             | Yes           | ✅ DONE |
| 5        | `/api/auth/logout`      | POST   | Logout user              | None             | Yes           | ✅ DONE |

---

## PRIORITY 2: Categories, Accounts & Tags (Week 2) - ✅ COMPLETED

### 2.1 Categories - Tables Used: `Category`

| Priority | API Endpoint              | Method | Description                   | Tables Used | Auth Required | Status  |
| -------- | ------------------------- | ------ | ----------------------------- | ----------- | ------------- | ------- |
| 7        | `/api/categories`         | GET    | Get all categories            | Category    | Yes           | ✅ DONE |
| 8        | `/api/categories`         | POST   | Create new category           | Category    | Yes           | ✅ DONE |
| 9        | `/api/categories/:id`     | PUT    | Update category               | Category    | Yes           | ✅ DONE |
| 10       | `/api/categories/:id`     | DELETE | Delete category               | Category    | Yes           | ✅ DONE |
| 11       | `/api/categories/default` | GET    | Get default system categories | Category    | Yes           | ✅ DONE |

### 2.2 Accounts - Tables Used: `Account`, `AccountBalanceHistory`

| Priority | API Endpoint                    | Method | Description                | Tables Used                    | Auth Required | Status  |
| -------- | ------------------------------- | ------ | -------------------------- | ------------------------------ | ------------- | ------- |
| 12       | `/api/accounts`                 | GET    | Get all accounts           | Account                        | Yes           | ✅ DONE |
| 13       | `/api/accounts`                 | POST   | Create new account         | Account, AccountBalanceHistory | Yes           | ✅ DONE |
| 14       | `/api/accounts/:id`             | GET    | Get account details        | Account                        | Yes           | ✅ DONE |
| 15       | `/api/accounts/:id`             | PUT    | Update account info        | Account                        | Yes           | ✅ DONE |
| 16       | `/api/accounts/:id`             | DELETE | Delete account             | Account                        | Yes           | ✅ DONE |
| 17       | `/api/accounts/:id/add-balance` | PUT    | Add/Subtract balance       | Account, AccountBalanceHistory | Yes           | ✅ DONE |
| 18       | `/api/accounts/:id/history`     | GET    | Get balance change history | AccountBalanceHistory          | Yes           | ✅ DONE |

### 2.3 Tags - Tables Used: `Tag`, `TransactionTag`

| Priority | API Endpoint        | Method | Description        | Tables Used         | Auth Required | Status  |
| -------- | ------------------- | ------ | ------------------ | ------------------- | ------------- | ------- |
| 19       | `/api/tags`         | GET    | Get all tags       | Tag, TransactionTag | Yes           | ✅ DONE |
| 20       | `/api/tags`         | POST   | Create tag         | Tag                 | Yes           | ✅ DONE |
| 21       | `/api/tags/:id`     | PUT    | Update tag         | Tag                 | Yes           | ✅ DONE |
| 22       | `/api/tags/:id`     | DELETE | Delete tag         | Tag, TransactionTag | Yes           | ✅ DONE |
| 23       | `/api/tags/popular` | GET    | Get most used tags | Tag, TransactionTag | Yes           | ✅ DONE |

---

## PRIORITY 3: Transactions (Week 3) - ⏳ IN PROGRESS

### Tables Used: `Transaction`, `TransactionTag`, `Category`, `Account`, `AccountBalanceHistory`, `Attachment`

| Priority | API Endpoint                | Method | Description                         | Tables Used                                                 | Auth Required | Status     |
| -------- | --------------------------- | ------ | ----------------------------------- | ----------------------------------------------------------- | ------------- | ---------- |
| 24       | `/api/transactions`         | POST   | Create new transaction              | Transaction, TransactionTag, Account, AccountBalanceHistory | Yes           | ⏳ PENDING |
| 25       | `/api/transactions`         | GET    | Get all transactions (with filters) | Transaction, Category, Account, TransactionTag              | Yes           | ⏳ PENDING |
| 26       | `/api/transactions/:id`     | GET    | Get transaction by ID               | Transaction, Category, Account, TransactionTag, Attachment  | Yes           | ⏳ PENDING |
| 27       | `/api/transactions/:id`     | PUT    | Update transaction                  | Transaction, TransactionTag, Account, AccountBalanceHistory | Yes           | ⏳ PENDING |
| 28       | `/api/transactions/:id`     | DELETE | Delete transaction                  | Transaction, TransactionTag, Account, AccountBalanceHistory | Yes           | ⏳ PENDING |
| 29       | `/api/transactions/summary` | GET    | Get transaction summary             | Transaction, Category                                       | Yes           | ⏳ PENDING |
| 30       | `/api/transactions/bulk`    | POST   | Bulk create transactions            | Transaction, TransactionTag, Account, AccountBalanceHistory | Yes           | ⏳ PENDING |
| 31       | `/api/transactions/bulk`    | DELETE | Bulk delete transactions            | Transaction, TransactionTag, Account, AccountBalanceHistory | Yes           | ⏳ PENDING |
| 32       | `/api/transactions/export`  | GET    | Export transactions                 | Transaction, Category, Account                              | Yes           | ⏳ PENDING |

### Transaction API Request/Response Examples:

**POST /api/transactions** - Create transaction

```json
// Request
{
  "amount": 100.50,
  "type": "EXPENSE",
  "description": "Grocery shopping",
  "date": "2026-04-18T10:00:00Z",
  "notes": "Weekly groceries",
  "categoryId": "cat_123",
  "accountId": "acc_456",
  "tagIds": ["tag_789", "tag_101"]
}

// Response
{
  "success": true,
  "data": {
    "id": "txn_111",
    "amount": 100.50,
    "type": "EXPENSE",
    "description": "Grocery shopping",
    "date": "2026-04-18T10:00:00Z",
    "notes": "Weekly groceries",
    "category": { "id": "cat_123", "name": "Food" },
    "account": { "id": "acc_456", "name": "My Wallet", "balance": 950 },
    "tags": [{ "id": "tag_789", "name": "urgent" }]
  },
  "message": "Transaction created successfully"
}
```

**GET /api/transactions?startDate=2026-04-01&endDate=2026-04-30&type=EXPENSE&categoryId=cat_123**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "message": "Transactions retrieved successfully"
}
```

**GET /api/transactions/summary?startDate=2026-04-01&endDate=2026-04-30**

```json
{
	"success": true,
	"data": {
		"totalIncome": 5000.0,
		"totalExpense": 3200.0,
		"netSavings": 1800.0,
		"byCategory": [
			{
				"categoryId": "cat_123",
				"categoryName": "Food",
				"amount": 800.0
			},
			{
				"categoryId": "cat_456",
				"categoryName": "Transport",
				"amount": 300.0
			}
		],
		"byDay": [
			{ "date": "2026-04-01", "income": 0, "expense": 50.0 },
			{ "date": "2026-04-02", "income": 5000, "expense": 0 }
		]
	},
	"message": "Summary retrieved successfully"
}
```

---

## PRIORITY 4: Dashboard & Reports (Week 4) - ⏳ PENDING

### Tables Used: `Transaction`, `Category`, `Budget`

| Priority | API Endpoint                      | Method | Description                  | Tables Used                   | Auth Required | Status     |
| -------- | --------------------------------- | ------ | ---------------------------- | ----------------------------- | ------------- | ---------- |
| 33       | `/api/dashboard/summary`          | GET    | Get dashboard summary        | Transaction, Category, Budget | Yes           | ⏳ PENDING |
| 34       | `/api/dashboard/charts`           | GET    | Get chart data               | Transaction, Category         | Yes           | ⏳ PENDING |
| 35       | `/api/reports/monthly`            | GET    | Get monthly financial report | Transaction, Category         | Yes           | ⏳ PENDING |
| 36       | `/api/reports/yearly`             | GET    | Get yearly financial report  | Transaction, Category         | Yes           | ⏳ PENDING |
| 37       | `/api/reports/category-breakdown` | GET    | Get spending breakdown       | Transaction, Category         | Yes           | ⏳ PENDING |

---

## PRIORITY 5: Budgets & Savings Goals (Week 5) - ⏳ PENDING

### 7. Budgets - Tables Used: `Budget`, `Category`, `Transaction`

| Priority | API Endpoint           | Method | Description                     | Tables Used                   | Auth Required | Status     |
| -------- | ---------------------- | ------ | ------------------------------- | ----------------------------- | ------------- | ---------- |
| 38       | `/api/budgets`         | POST   | Create budget                   | Budget, Category              | Yes           | ⏳ PENDING |
| 39       | `/api/budgets`         | GET    | Get all budgets                 | Budget, Category              | Yes           | ⏳ PENDING |
| 40       | `/api/budgets/current` | GET    | Get current month budgets       | Budget, Category, Transaction | Yes           | ⏳ PENDING |
| 41       | `/api/budgets/:id`     | PUT    | Update budget                   | Budget                        | Yes           | ⏳ PENDING |
| 42       | `/api/budgets/:id`     | DELETE | Delete budget                   | Budget                        | Yes           | ⏳ PENDING |
| 43       | `/api/budgets/alerts`  | GET    | Get budgets exceeding threshold | Budget, Transaction           | Yes           | ⏳ PENDING |

### 8. Savings Goals - Tables Used: `SavingsGoal`, `Category`

| Priority | API Endpoint                        | Method | Description                  | Tables Used | Auth Required | Status     |
| -------- | ----------------------------------- | ------ | ---------------------------- | ----------- | ------------- | ---------- |
| 44       | `/api/savings-goals`                | POST   | Create savings goal          | SavingsGoal | Yes           | ⏳ PENDING |
| 45       | `/api/savings-goals`                | GET    | Get all savings goals        | SavingsGoal | Yes           | ⏳ PENDING |
| 46       | `/api/savings-goals/progress`       | GET    | Get progress of active goals | SavingsGoal | Yes           | ⏳ PENDING |
| 47       | `/api/savings-goals/:id`            | PUT    | Update savings goal          | SavingsGoal | Yes           | ⏳ PENDING |
| 48       | `/api/savings-goals/:id`            | DELETE | Delete savings goal          | SavingsGoal | Yes           | ⏳ PENDING |
| 49       | `/api/savings-goals/:id/contribute` | POST   | Add contribution to goal     | SavingsGoal | Yes           | ⏳ PENDING |

---

## PRIORITY 6: Recurring & Attachments (Week 6) - ⏳ PENDING

### 9. Recurring Transactions - Tables Used: `RecurringTransaction`, `Category`, `Account`

| Priority | API Endpoint                | Method | Description                    | Tables Used                             | Auth Required | Status     |
| -------- | --------------------------- | ------ | ------------------------------ | --------------------------------------- | ------------- | ---------- |
| 50       | `/api/recurring`            | POST   | Create recurring transaction   | RecurringTransaction                    | Yes           | ⏳ PENDING |
| 51       | `/api/recurring`            | GET    | Get all recurring transactions | RecurringTransaction, Category, Account | Yes           | ⏳ PENDING |
| 52       | `/api/recurring/upcoming`   | GET    | Get upcoming recurring         | RecurringTransaction                    | Yes           | ⏳ PENDING |
| 53       | `/api/recurring/:id`        | PUT    | Update recurring transaction   | RecurringTransaction                    | Yes           | ⏳ PENDING |
| 54       | `/api/recurring/:id`        | DELETE | Delete recurring transaction   | RecurringTransaction                    | Yes           | ⏳ PENDING |
| 55       | `/api/recurring/:id/pause`  | POST   | Pause recurring transaction    | RecurringTransaction                    | Yes           | ⏳ PENDING |
| 56       | `/api/recurring/:id/resume` | POST   | Resume recurring transaction   | RecurringTransaction                    | Yes           | ⏳ PENDING |

### 10. Attachments - Tables Used: `Attachment`, `Transaction`

| Priority | API Endpoint                                  | Method | Description                     | Tables Used | Auth Required | Status     |
| -------- | --------------------------------------------- | ------ | ------------------------------- | ----------- | ------------- | ---------- |
| 57       | `/api/attachments`                            | POST   | Upload attachment               | Attachment  | Yes           | ⏳ PENDING |
| 58       | `/api/attachments/transaction/:transactionId` | GET    | Get attachments for transaction | Attachment  | Yes           | ⏳ PENDING |
| 59       | `/api/attachments/:id`                        | GET    | Download attachment             | Attachment  | Yes           | ⏳ PENDING |
| 60       | `/api/attachments/:id`                        | DELETE | Delete attachment               | Attachment  | Yes           | ⏳ PENDING |

---

## PRIORITY 7: Notifications & Logs (Week 7) - ⏳ PENDING

### 11. Notifications - Tables Used: `Notification`

| Priority | API Endpoint                      | Method | Description               | Tables Used  | Auth Required | Status     |
| -------- | --------------------------------- | ------ | ------------------------- | ------------ | ------------- | ---------- |
| 61       | `/api/notifications`              | GET    | Get user notifications    | Notification | Yes           | ⏳ PENDING |
| 62       | `/api/notifications/unread-count` | GET    | Get unread count          | Notification | Yes           | ⏳ PENDING |
| 63       | `/api/notifications/:id`          | PUT    | Mark notification as read | Notification | Yes           | ⏳ PENDING |
| 64       | `/api/notifications/read-all`     | PUT    | Mark all as read          | Notification | Yes           | ⏳ PENDING |
| 65       | `/api/notifications/:id`          | DELETE | Delete notification       | Notification | Yes           | ⏳ PENDING |

### 12. Audit Logs - Tables Used: `AuditLog`, `User`

| Priority | API Endpoint             | Method | Description            | Tables Used    | Auth Required | Status     |
| -------- | ------------------------ | ------ | ---------------------- | -------------- | ------------- | ---------- |
| 66       | `/api/audit-logs`        | GET    | Get user audit logs    | AuditLog, User | Yes           | ⏳ PENDING |
| 67       | `/api/audit-logs/:id`    | GET    | Get specific audit log | AuditLog       | Yes           | ⏳ PENDING |
| 68       | `/api/audit-logs/export` | GET    | Export audit logs      | AuditLog       | Yes           | ⏳ PENDING |

### 13. Export History - Tables Used: `ExportHistory`

| Priority | API Endpoint       | Method | Description            | Tables Used   | Auth Required | Status     |
| -------- | ------------------ | ------ | ---------------------- | ------------- | ------------- | ---------- |
| 69       | `/api/exports`     | GET    | Get export history     | ExportHistory | Yes           | ⏳ PENDING |
| 70       | `/api/exports/:id` | GET    | Download exported file | ExportHistory | Yes           | ⏳ PENDING |
| 71       | `/api/exports/:id` | DELETE | Delete export record   | ExportHistory | Yes           | ⏳ PENDING |

---

## Summary Table by Category

| Priority  | Category               | APIs   | Tables Used                                                                       | Status                        |
| --------- | ---------------------- | ------ | --------------------------------------------------------------------------------- | ----------------------------- |
| 1         | Authentication & User  | 5      | User, OTPSession                                                                  | ✅ COMPLETED                  |
| 2         | Categories             | 5      | Category                                                                          | ✅ COMPLETED                  |
| 2         | Accounts               | 7      | Account, AccountBalanceHistory                                                    | ✅ COMPLETED                  |
| 2         | Tags                   | 5      | Tag, TransactionTag                                                               | ✅ COMPLETED                  |
| 3         | Transactions           | 9      | Transaction, TransactionTag, Category, Account, AccountBalanceHistory, Attachment | ⏳ PENDING                    |
| 4         | Dashboard & Reports    | 5      | Transaction, Category, Budget                                                     | ⏳ PENDING                    |
| 5         | Budgets                | 6      | Budget, Category, Transaction                                                     | ⏳ PENDING                    |
| 5         | Savings Goals          | 6      | SavingsGoal, Category                                                             | ⏳ PENDING                    |
| 6         | Recurring Transactions | 7      | RecurringTransaction, Category, Account                                           | ⏳ PENDING                    |
| 6         | Attachments            | 4      | Attachment, Transaction                                                           | ⏳ PENDING                    |
| 7         | Notifications          | 5      | Notification                                                                      | ⏳ PENDING                    |
| 7         | Audit Logs             | 3      | AuditLog, User                                                                    | ⏳ PENDING                    |
| 7         | Export History         | 3      | ExportHistory                                                                     | ⏳ PENDING                    |
| **TOTAL** |                        | **71** |                                                                                   | **22 Completed / 49 Pending** |

---

## Legend

| Icon           | Meaning              |
| -------------- | -------------------- |
| ✅ DONE        | API is completed     |
| 🟡 IN PROGRESS | Currently working on |
| ⏳ PENDING     | Not started yet      |

---

**Total APIs: 71 | Completed: 22 | In Progress: 0 | Pending: 49**
