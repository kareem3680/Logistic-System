# Styles Dispatch Management - API Documentation

## Overview

This API is designed for the **Styles Dispatch Management Platform**.  
It is built using a **modular monolith architecture** for managing drivers, trucks, loads, maintenance, and chat functionality.

---

# Common Features

All list endpoints support the following features:

| Feature         | Description                   | Example                            |
| --------------- | ----------------------------- | ---------------------------------- |
| Pagination      | Split results into pages      | `?page=2&limit=20`                 |
| Sorting         | Sort results by a field       | `?sort=-createdAt` or `?sort=name` |
| Field Selection | Return only specific fields   | `?fields=name,email,phone`         |
| Filtering       | Filter results by exact match | `?status=delivered&active=true`    |
| Range Filtering | Filter by numeric ranges      | `?pricePerMile[gte]=0.1`           |
| Date Range      | Filter by date interval       | `?from=2025-01-01&to=2025-12-31`   |
| Search          | Text search in string fields  | `?keyword=john`                    |

---

# Identity Module

| Endpoint                                | Method | Description                          |
| --------------------------------------- | ------ | ------------------------------------ |
| `/api/v1/auth/signUp`                   | POST   | Register a new user                  |
| `/api/v1/auth/logIn`                    | POST   | Login                                |
| `/api/v1/userDashboard/getMyData`       | GET    | Get current user data                |
| `/api/v1/userDashboard/updateMyData`    | PATCH  | Update current user data             |
| `/api/v1/updatePassword`                | PATCH  | Change password                      |

---

# Forget Password Module

| Endpoint                                    | Method | Description                       |
| ------------------------------------------- | ------ | --------------------------------- |
| `/api/v1/forgetPassword/sendResetCode`      | POST   | Send reset code to email          |
| `/api/v1/forgetPassword/resendResetCode`    | POST   | Resend reset code                 |
| `/api/v1/forgetPassword/verifyResetCode`    | POST   | Verify reset code                 |
| `/api/v1/forgetPassword/resetPassword`      | PUT    | Reset password after verification |

---

# UI Settings Module

## Palette Endpoints

| Endpoint                              | Method | Description                    |
| ------------------------------------- | ------ | ------------------------------ |
| `/api/v1/ui-settings/palette`         | GET    | Get all palettes               |
| `/api/v1/ui-settings/palette`         | POST   | Create a new palette           |
| `/api/v1/ui-settings/palette/{id}`    | GET    | Get specific palette           |
| `/api/v1/ui-settings/palette/{id}`    | PATCH  | Update palette                 |
| `/api/v1/ui-settings/palette/{id}`    | DELETE | Delete palette                 |

---

# Chat Module

| Endpoint                                      | Method | Description                           |
| --------------------------------------------- | ------ | ------------------------------------- |
| `/api/v1/chat/conversations/start`            | POST   | Create or get conversation with user  |
| `/api/v1/chat/conversations`                  | GET    | Get user conversations                |
| `/api/v1/chat/messages/{conversationId}`      | POST   | Add message to conversation           |
| `/api/v1/chat/messages/{conversationId}`      | GET    | Get conversation messages             |
| `/api/v1/chat/messages/seen/{conversationId}` | PUT    | Mark messages as seen                 |

---

# Admin Dashboard Module

| Endpoint                                      | Method | Description                          |
| --------------------------------------------- | ------ | ------------------------------------ |
| `/api/v1/adminDashboard`                      | POST   | Create a new user                    |
| `/api/v1/adminDashboard`                      | GET    | Get all users                        |
| `/api/v1/adminDashboard/{userId}`             | GET    | Get specific user                    |
| `/api/v1/adminDashboard/{userId}`             | PATCH  | Update user role                     |
| `/api/v1/adminDashboard/deactivate/{userId}`  | PATCH  | Deactivate user                      |
| `/api/v1/adminDashboard/activate/{userId}`    | PATCH  | Activate user                        |

---

# Companies Module

| Endpoint                                 | Method | Description                    |
| ---------------------------------------- | ------ | ------------------------------ |
| `/api/v1/companies`                      | POST   | Create a new company           |
| `/api/v1/companies`                      | GET    | Get all companies              |
| `/api/v1/companies/{companyId}`          | GET    | Get specific company           |
| `/api/v1/companies/{companyId}`          | PATCH  | Update company                 |
| `/api/v1/companies/deactivate/{companyId}` | PATCH | Deactivate company              |
| `/api/v1/companies/activate/{companyId}`   | PATCH | Activate company                |

---

# Maintenance Module

| Endpoint                          | Method | Description                      |
| --------------------------------- | ------ | -------------------------------- |
| `/api/v1/maintenances`            | POST   | Create a new maintenance record  |
| `/api/v1/maintenances`            | GET    | Get all maintenances             |
| `/api/v1/maintenances/{id}`       | GET    | Get specific maintenance         |
| `/api/v1/maintenances/{id}`       | PATCH  | Update maintenance               |
| `/api/v1/maintenances/{id}`       | DELETE | Delete maintenance               |

---

# Service Centers Module

| Endpoint                               | Method | Description                       |
| -------------------------------------- | ------ | --------------------------------- |
| `/api/v1/service-centers`              | POST   | Create a new service center       |
| `/api/v1/service-centers`              | GET    | Get all service centers           |
| `/api/v1/service-centers/{id}`         | GET    | Get specific service center       |
| `/api/v1/service-centers/{id}`         | PATCH  | Update service center             |
| `/api/v1/service-centers/{id}`         | DELETE | Delete service center             |

---

# Driver Dashboard Module

| Endpoint                                                | Method | Description                         |
| ------------------------------------------------------- | ------ | ----------------------------------- |
| `/api/v1/driver-dashboard/driver-load`                  | GET    | Get all driver loads                |
| `/api/v1/driver-dashboard/save-fcm-token`               | POST   | Save FCM token for notifications    |
| `/api/v1/driver-dashboard/driver-load/add-documents/{loadId}` | POST | Add documents to load         |
| `/api/v1/driver-dashboard/pay-check`                    | GET    | Get driver pay check                |
| `/api/v1/driver-dashboard/time-off`                     | POST   | Create time off request             |
| `/api/v1/driver-dashboard/time-off/my`                  | GET    | Get my time off requests            |
| `/api/v1/driver-dashboard/time-off/cancel/{id}`         | PATCH  | Cancel time off request             |
| `/api/v1/driver-dashboard/driver-load/update-appointment/{loadId}` | PATCH | Update load appointment times |
| `/api/v1/comments/{loadId}`                             | POST   | Add comment to load                 |

---

# Job Applications Module

| Endpoint                                  | Method | Description                          |
| ----------------------------------------- | ------ | ------------------------------------ |
| `/api/v1/job-applications`                | POST   | Create a new job application         |
| `/api/v1/job-applications`                | GET    | Get all job applications             |
| `/api/v1/job-applications/status/{id}`    | PATCH  | Update application status            |

---

# Customers Module

| Endpoint                       | Method | Description                   |
| ------------------------------ | ------ | ----------------------------- |
| `/api/v1/customers`            | POST   | Create a new customer         |
| `/api/v1/customers`            | GET    | Get all customers             |
| `/api/v1/customers/{id}`       | GET    | Get specific customer         |
| `/api/v1/customers/{id}`       | PATCH  | Update customer               |
| `/api/v1/customers/{id}`       | DELETE | Delete customer               |

---

# Notifications Module

| Endpoint                                      | Method | Description                          |
| --------------------------------------------- | ------ | ------------------------------------ |
| `/api/v1/notifications`                       | POST   | Create notification in database only |
| `/api/v1/notifications/send`                  | POST   | Create and send notification         |
| `/api/v1/notifications`                       | GET    | Get all notifications                |
| `/api/v1/notifications/mark-all`              | PATCH  | Mark all notifications as read       |
| `/api/v1/notifications/mark/{notificationId}` | PATCH  | Mark specific notification as read   |

---

# Settings Module

| Endpoint                   | Method | Description                   |
| -------------------------- | ------ | ----------------------------- |
| `/api/v1/settings`         | POST   | Add a new setting             |
| `/api/v1/settings`         | GET    | Get all settings              |
| `/api/v1/settings/{id}`    | PATCH  | Update setting value          |

---

# Drivers Module

## Driver Status Flow

available -> busy -> offline -> on_leave

## Driver Endpoints

| Endpoint                            | Method | Description                       |
| ----------------------------------- | ------ | --------------------------------- |
| `/api/v1/drivers`                   | POST   | Create a new driver               |
| `/api/v1/drivers`                   | GET    | Get all drivers                   |
| `/api/v1/drivers/{id}`              | GET    | Get specific driver               |
| `/api/v1/drivers/{id}`              | PATCH  | Update driver                     |
| `/api/v1/drivers/{id}`              | DELETE | Delete driver                     |
| `/api/v1/driver-dashboard/time-off/all` | GET | Get all time off requests (admin) |
| `/api/v1/driver-dashboard/time-off/status/{id}` | PATCH | Update time off status     |

---

# Trucks Module

## Truck Types

| Type           | Description                          |
| -------------- | ------------------------------------ |
| `dry_van`      | Standard dry van trailer             |
| `reefer`       | Refrigerated trailer                 |
| `flatbed`      | Flatbed trailer                      |
| `tanker`       | Liquid tanker                        |

## Truck Endpoints

| Endpoint                   | Method | Description                       |
| -------------------------- | ------ | --------------------------------- |
| `/api/v1/trucks`           | POST   | Create a new truck                |
| `/api/v1/trucks`           | GET    | Get all trucks                    |
| `/api/v1/trucks/{id}`      | GET    | Get specific truck                |
| `/api/v1/trucks/{id}`      | PATCH  | Update truck                      |
| `/api/v1/trucks/{id}`      | DELETE | Delete truck                      |

---

# Loads Module

## Load Status Flow

pending -> assigned -> picked_up -> in_transit -> delivered -> completed -> cancelled

## Load Endpoints

| Endpoint                        | Method | Description                       |
| ------------------------------- | ------ | --------------------------------- |
| `/api/v1/loads`                 | POST   | Create a new load                 |
| `/api/v1/loads`                 | GET    | Get all loads                     |
| `/api/v1/loads/status/{id}`     | PATCH  | Update load status                |
| `/api/v1/loads/update/{id}`     | PATCH  | Update load details               |

---

# Comments Module

## Comment Types

| Type           | Description                          |
| -------------- | ------------------------------------ |
| `dispatcher`   | Comment from dispatcher              |
| `driver`       | Comment from driver                  |
| `admin`        | Comment from admin                   |
| `system`       | Auto-generated system note           |

## Comment Endpoints

| Endpoint                              | Method | Description                       |
| ------------------------------------- | ------ | --------------------------------- |
| `/api/v1/comments/{loadId}`           | GET    | Get all comments for a load       |
| `/api/v1/comments/{loadId}`           | POST   | Add comment to load               |
| `/api/v1/comments/{loadId}/{commentId}` | PATCH | Update comment                    |
| `/api/v1/comments/{loadId}/{commentId}` | DELETE | Delete comment                    |

---

# Summary Module

| Endpoint                       | Method | Description                               |
| ------------------------------ | ------ | ----------------------------------------- |
| `/api/v1/summary/truck`        | GET    | Get all trucks load summary               |
| `/api/v1/summary/truck/{id}`   | GET    | Get specific truck load summary           |
| `/api/v1/summary/driver/{id}`  | GET    | Get specific driver load summary          |

---

# Authentication

JWT is used for authentication. Most endpoints require a Bearer token in the Authorization header:
Authorization: Bearer {{JWT}}

text

---

# Notes

- All list endpoints support pagination, sorting, filtering, and search.
- Date fields should be sent in ISO 8601 format (e.g., `2025-10-09T08:00:00.000Z`).
- File uploads use `multipart/form-data`.
- The `{{MainHost}}` variable should be replaced with your API base URL.
