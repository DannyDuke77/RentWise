# RENTWISE – Rental Management System #

- RentWise is a full-stack rental management platform designed to help landlords manage properties, tenants, rent payments, and rental workflows in a centralized system. It digitizes key rental operations such as tenant tracking, payment monitoring, and property management.

### FEATURES ###
  - Tenant and property management
  - Rent tracking and payment status monitoring
  - Structured rental records per property
  - Role-based access control (admin, landlord, tenant)
  - RESTful API backend for scalable integration
  - Responsive frontend interface
    
### TECH STACK ###
1. **Backend**
  - Django
  - Django REST Framework (DRF)
2. **Frontend**
  - Next.js
  - Tailwind CSS
3. **Database**
  - PostgreSQL
4. **Tools**
  - Docker
  - Git & GitHub
    
### ARCHITECTURE OVERVIEW ###

*RentWise follows a modular full-stack architecture:*
 - Backend API handles authentication, tenants, properties, and payments
 - Frontend consumes APIs and provides user interfaces for users
 - Relational database models represent real-world landlord-tenant relationships
 - Docker ensures consistent development and deployment environments
   
*Core Modules*
 - User Management – authentication and role handling
 - Property Management – CRUD operations for properties
 - Tenant Management – tenant tracking and assignments
 - Payments – rent tracking and arrears monitoring
   
### API OVERVIEW ###
 *A.) Base URL:*
  - /api/
 
 *B.) Endpoints:*
  - /api/auth/ – authentication
  - /api/properties/ – property management
  - /api/tenants/ – tenant management
  - /api/payments/ – rent payments
    
#### What I Learned ####
  - Designing REST APIs using Django REST Framework
  - Structuring relational databases for real-world systems
  - Full-stack integration between Django and Next.js
  - Implementing authentication and role-based access control
  - Using Docker for development consistency

#### Future Improvements ####
  - Payment reminders and notifications
  - Analytics dashboard for landlords
  - Mobile money integration
    
## Author ##
Gitau Daniel Ngige
GitHub: https://github.com/DannyDuke77

LinkedIn: www.linkedin.com/in/daniel-g-76ab1b246
