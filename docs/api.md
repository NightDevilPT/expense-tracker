Here's the updated API documentation with priority order for development:

---

# Expense Tracker API Documentation

## Development Priority Order (Start from Priority 1)

---

### PRIORITY 1: Core Setup (Week 1)

#### 1. **Authentication & User**

| Priority | API Endpoint            | Method | Description              | Auth Required | Status     |
| -------- | ----------------------- | ------ | ------------------------ | ------------- | ---------- |
| 1        | `/api/auth/request-otp` | POST   | Request OTP for login    | No            | ✅ DONE    |
| 2        | `/api/auth/login`       | POST   | Verify OTP and login     | No            | ✅ DONE    |
| 3        | `/api/auth/me`          | GET    | Get current user profile | Yes           | ✅ DONE    |
| 4        | `/api/user/[userId]`    | PUT    | Update user profile      | Yes           | ✅ DONE    |
| 5        | `/api/auth/logout`      | POST   | Logout user              | Yes           | ⏳ PENDING |
---

### PRIORITY 2: Categories & Accounts (Week 2)

_Required for Transactions - Need these IDs first_

#### 2. **Categories**

| Priority | API Endpoint              | Method | Description                   | Auth Required | Status     |
| -------- | ------------------------- | ------ | ----------------------------- | ------------- | ---------- |
| 7        | `/api/categories`         | GET    | Get all categories            | Yes           | ⏳ PENDING | ✅
| 8        | `/api/categories`         | POST   | Create new category           | Yes           | ⏳ PENDING |✅
| 9        | `/api/categories/:id`     | PUT    | Update category               | Yes           | ⏳ PENDING |✅
| 10       | `/api/categories/:id`     | DELETE | Delete category               | Yes           | ⏳ PENDING |✅
| 11       | `/api/categories/default` | GET    | Get default system categories | Yes           | ⏳ PENDING |✅

## 3. **Accounts**

| Priority | API Endpoint                    | Method | Description                         | Auth Required | Status     |
| -------- | ------------------------------- | ------ | ----------------------------------- | ------------- | ---------- |
| 12       | `/api/accounts`                 | GET    | Get all accounts                    | Yes           | ⏳ PENDING |
| 13       | `/api/accounts`                 | POST   | Create new account                  | Yes           | ⏳ PENDING |
| 14       | `/api/accounts/:id`             | GET    | Get account details                 | Yes           | ⏳ PENDING |
| 15       | `/api/accounts/:id`             | PUT    | Update account                      | Yes           | ⏳ PENDING |
| 16       | `/api/accounts/:id`             | DELETE | Delete account                      | Yes           | ⏳ PENDING |
| 17       | `/api/accounts/:id/add-balance` | PUT    | Add/Subtract balance from account   | Yes           | ⏳ PENDING |
| 18       | `/api/accounts/:id/history`     | GET    | Get account balance change history  | Yes           | ⏳ PENDING |

#### 4. **Tags**

| Priority | API Endpoint        | Method | Description        | Auth Required | Status     |
| -------- | ------------------- | ------ | ------------------ | ------------- | ---------- |
| 19       | `/api/tags`         | GET    | Get all tags       | Yes           | ⏳ PENDING |
| 20       | `/api/tags`         | POST   | Create tag         | Yes           | ⏳ PENDING |
| 21       | `/api/tags/:id`     | PUT    | Update tag         | Yes           | ⏳ PENDING |
| 22       | `/api/tags/:id`     | DELETE | Delete tag         | Yes           | ⏳ PENDING |
| 23       | `/api/tags/popular` | GET    | Get most used tags | Yes           | ⏳ PENDING |

---

### PRIORITY 3: Transactions (Week 3)

_Core feature - Depends on Categories, Accounts, Tags_

#### 5. **Transactions**

| Priority | API Endpoint                | Method | Description                         | Auth Required | Status     |
| -------- | --------------------------- | ------ | ----------------------------------- | ------------- | ---------- |
| 24       | `/api/transactions`         | POST   | Create new transaction              | Yes           | ⏳ PENDING |
| 25       | `/api/transactions`         | GET    | Get all transactions (with filters) | Yes           | ⏳ PENDING |
| 26       | `/api/transactions/:id`     | GET    | Get transaction by ID               | Yes           | ⏳ PENDING |
| 27       | `/api/transactions/:id`     | PUT    | Update transaction                  | Yes           | ⏳ PENDING |
| 28       | `/api/transactions/:id`     | DELETE | Delete transaction                  | Yes           | ⏳ PENDING |
| 29       | `/api/transactions/summary` | GET    | Get transaction summary             | Yes           | ⏳ PENDING |
| 30       | `/api/transactions/bulk`    | POST   | Bulk create transactions            | Yes           | ⏳ PENDING |
| 31       | `/api/transactions/bulk`    | DELETE | Bulk delete transactions            | Yes           | ⏳ PENDING |
| 32       | `/api/transactions/export`  | GET    | Export transactions                 | Yes           | ⏳ PENDING |

---

### PRIORITY 4: Dashboard (Week 4)

_Depends on Transactions data_

#### 6. **Dashboard & Reports**

| Priority | API Endpoint                      | Method | Description                  | Auth Required | Status     |
| -------- | --------------------------------- | ------ | ---------------------------- | ------------- | ---------- |
| 33       | `/api/dashboard/summary`          | GET    | Get dashboard summary        | Yes           | ⏳ PENDING |
| 34       | `/api/dashboard/charts`           | GET    | Get chart data               | Yes           | ⏳ PENDING |
| 35       | `/api/reports/monthly`            | GET    | Get monthly financial report | Yes           | ⏳ PENDING |
| 36       | `/api/reports/yearly`             | GET    | Get yearly financial report  | Yes           | ⏳ PENDING |
| 37       | `/api/reports/category-breakdown` | GET    | Get spending breakdown       | Yes           | ⏳ PENDING |

---

### PRIORITY 5: Budgets & Goals (Week 5)

_Depends on Transactions and Categories_

#### 7. **Budgets**

| Priority | API Endpoint           | Method | Description                     | Auth Required | Status     |
| -------- | ---------------------- | ------ | ------------------------------- | ------------- | ---------- |
| 38       | `/api/budgets`         | POST   | Create budget                   | Yes           | ⏳ PENDING |
| 39       | `/api/budgets`         | GET    | Get all budgets                 | Yes           | ⏳ PENDING |
| 40       | `/api/budgets/current` | GET    | Get current month budgets       | Yes           | ⏳ PENDING |
| 41       | `/api/budgets/:id`     | PUT    | Update budget                   | Yes           | ⏳ PENDING |
| 42       | `/api/budgets/:id`     | DELETE | Delete budget                   | Yes           | ⏳ PENDING |
| 43       | `/api/budgets/alerts`  | GET    | Get budgets exceeding threshold | Yes           | ⏳ PENDING |

#### 8. **Savings Goals**

| Priority | API Endpoint                        | Method | Description                  | Auth Required | Status     |
| -------- | ----------------------------------- | ------ | ---------------------------- | ------------- | ---------- |
| 44       | `/api/savings-goals`                | POST   | Create savings goal          | Yes           | ⏳ PENDING |
| 45       | `/api/savings-goals`                | GET    | Get all savings goals        | Yes           | ⏳ PENDING |
| 46       | `/api/savings-goals/progress`       | GET    | Get progress of active goals | Yes           | ⏳ PENDING |
| 47       | `/api/savings-goals/:id`            | PUT    | Update savings goal          | Yes           | ⏳ PENDING |
| 48       | `/api/savings-goals/:id`            | DELETE | Delete savings goal          | Yes           | ⏳ PENDING |
| 49       | `/api/savings-goals/:id/contribute` | POST   | Add contribution to goal     | Yes           | ⏳ PENDING |

---

### PRIORITY 6: Recurring & Attachments (Week 6)

#### 9. **Recurring Transactions**

| Priority | API Endpoint                | Method | Description                    | Auth Required | Status     |
| -------- | --------------------------- | ------ | ------------------------------ | ------------- | ---------- |
| 50       | `/api/recurring`            | POST   | Create recurring transaction   | Yes           | ⏳ PENDING |
| 51       | `/api/recurring`            | GET    | Get all recurring transactions | Yes           | ⏳ PENDING |
| 52       | `/api/recurring/upcoming`   | GET    | Get upcoming recurring         | Yes           | ⏳ PENDING |
| 53       | `/api/recurring/:id`        | PUT    | Update recurring transaction   | Yes           | ⏳ PENDING |
| 54       | `/api/recurring/:id`        | DELETE | Delete recurring transaction   | Yes           | ⏳ PENDING |
| 55       | `/api/recurring/:id/pause`  | POST   | Pause recurring transaction    | Yes           | ⏳ PENDING |
| 56       | `/api/recurring/:id/resume` | POST   | Resume recurring transaction   | Yes           | ⏳ PENDING |

#### 10. **Attachments**

| Priority | API Endpoint                                  | Method | Description                     | Auth Required | Status     |
| -------- | --------------------------------------------- | ------ | ------------------------------- | ------------- | ---------- |
| 57       | `/api/attachments`                            | POST   | Upload attachment               | Yes           | ⏳ PENDING |
| 58       | `/api/attachments/transaction/:transactionId` | GET    | Get attachments for transaction | Yes           | ⏳ PENDING |
| 59       | `/api/attachments/:id`                        | GET    | Download attachment             | Yes           | ⏳ PENDING |
| 60       | `/api/attachments/:id`                        | DELETE | Delete attachment               | Yes           | ⏳ PENDING |

---

### PRIORITY 7: Notifications & Logs (Week 7)

#### 11. **Notifications**

| Priority | API Endpoint                      | Method | Description               | Auth Required | Status     |
| -------- | --------------------------------- | ------ | ------------------------- | ------------- | ---------- |
| 61       | `/api/notifications`              | GET    | Get user notifications    | Yes           | ⏳ PENDING |
| 62       | `/api/notifications/unread-count` | GET    | Get unread count          | Yes           | ⏳ PENDING |
| 63       | `/api/notifications/:id`          | PUT    | Mark notification as read | Yes           | ⏳ PENDING |
| 64       | `/api/notifications/read-all`     | PUT    | Mark all as read          | Yes           | ⏳ PENDING |
| 65       | `/api/notifications/:id`          | DELETE | Delete notification       | Yes           | ⏳ PENDING |

#### 12. **Audit Logs**

| Priority | API Endpoint             | Method | Description            | Auth Required | Status     |
| -------- | ------------------------ | ------ | ---------------------- | ------------- | ---------- |
| 66       | `/api/audit-logs`        | GET    | Get user audit logs    | Yes           | ⏳ PENDING |
| 67       | `/api/audit-logs/:id`    | GET    | Get specific audit log | Yes           | ⏳ PENDING |
| 68       | `/api/audit-logs/export` | GET    | Export audit logs      | Yes           | ⏳ PENDING |

#### 13. **Export History**

| Priority | API Endpoint       | Method | Description            | Auth Required | Status     |
| -------- | ------------------ | ------ | ---------------------- | ------------- | ---------- |
| 69       | `/api/exports`     | GET    | Get export history     | Yes           | ⏳ PENDING |
| 70       | `/api/exports/:id` | GET    | Download exported file | Yes           | ⏳ PENDING |
| 71       | `/api/exports/:id` | DELETE | Delete export record   | Yes           | ⏳ PENDING |

---

## Development Summary

| Priority  | Week   | Category                     | APIs   | Completed | Status         |
| --------- | ------ | ---------------------------- | ------ | --------- | -------------- |
| 1         | Week 1 | Authentication & User        | 6      | 4         | 🟡 IN PROGRESS |
| 2         | Week 2 | Categories, Accounts, Tags   | 17     | 0         | ⏳ PENDING     |
| 3         | Week 3 | Transactions                 | 9      | 0         | ⏳ PENDING     |
| 4         | Week 4 | Dashboard & Reports          | 5      | 0         | ⏳ PENDING     |
| 5         | Week 5 | Budgets & Savings Goals      | 12     | 0         | ⏳ PENDING     |
| 6         | Week 6 | Recurring & Attachments      | 11     | 0         | ⏳ PENDING     |
| 7         | Week 7 | Notifications, Logs, Exports | 11     | 0         | ⏳ PENDING     |
| **TOTAL** |        |                              | **71** | **4**     |                |

---

## Current Status Legend

| Icon           | Meaning              |
| -------------- | -------------------- |
| ✅ DONE        | API is completed     |
| 🟡 IN PROGRESS | Currently working on |
| ⏳ PENDING     | Not started yet      |

---

## Next APIs to Build (Order Wise)

**Week 1 Remaining:**

1. Priority 5: `/api/auth/logout` - POST
2. Priority 6: `/api/user/preferences` - PUT

**Week 2 (Start after Priority 6):** 3. Priority 7: `/api/categories` - GET 4. Priority 8: `/api/categories` - POST 5. Priority 9: `/api/categories/:id` - PUT 6. Priority 10: `/api/categories/:id` - DELETE 7. Priority 11: `/api/categories/default` - GET 8. Priority 12: `/api/accounts` - GET 9. Priority 13: `/api/accounts` - POST 10. Priority 14: `/api/accounts/:id` - GET

---

**Total APIs: 71 | Completed: 4 | Remaining: 67**
