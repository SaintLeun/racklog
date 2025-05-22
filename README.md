# Racklog

## Description

Racklog is a web application for browsing and getting quotes for racking and storage solutions. It features a product catalog, a quotation system, and direct contact options. The frontend is built with Nuxt.js for a client-side rendered experience, and the backend API is handled by PHP.

## Features

- **Product Catalog:** Browse various racking products and accessories.
- **Quotation System:** Users can select products and request a detailed quote.
- **Contact Forms:** Allows users to send inquiries.
- **Internationalization (i18n):** Supports multiple languages (English and Spanish).
- **Responsive Design:** Adapts to different screen sizes.
- **Kommo CRM Integration:** Leads from the quotation system are sent to Kommo CRM.

## Technologies Used

### Frontend
- Nuxt.js 3 (Vue.js framework)
- Pinia (State Management)
- Vue.js (Latest)
- Tailwind CSS (Utility-first CSS framework)
- Tiptap (Headless WYSIWYG editor)
- @nuxtjs/i18n (Internationalization)
- Axios (HTTP client)

### Backend
- PHP

### Build & Development Tools
- Vite
- PostCSS
- Autoprefixer
- npm

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate to the project directory (e.g., `nuxt-app`):
    ```bash
    cd nuxt-app 
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Configure the API:
    - Ensure PHP is installed and configured on your server to serve the `api/` directory.
    - Update `api/config/token.php` with the correct Kommo API bearer token.
    - Configure your mail server details in `api/utils/mailer.php` or relevant PHP mail configuration files.
5.  Run the development server:
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:3000`.

6.  For production build (static site generation):
    ```bash
    npm run build
    npm run generate
    ```
    The static files will be generated in the `.output/public` directory and can be deployed to any static hosting service.

## Usage

- Access the application through a web browser after completing the installation steps.
- Browse products, add them to a quote request, and submit the request through the quote modal.
- Use the contact form for general inquiries.

## API Endpoints

The backend API is located in the `/api` directory and is handled by PHP.

- `POST /api/create-lead`:
    - Accepts lead data (e.g., from quote requests).
    - Integrates with Kommo CRM via `api/endpoints/kommo.php`.
- `POST /api/send-email`:
    - Handles sending emails.
    - Used for contact form submissions and quote confirmations via `api/endpoints/send_email.php`.

## Contributing

We welcome contributions! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix:
    ```bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b bugfix/issue-tracker-id
    ```
3.  Make your changes and commit them with clear, descriptive messages.
4.  Push your changes to your fork:
    ```bash
    git push origin feature/your-feature-name
    ```
5.  Create a Pull Request to the main repository's `main` (or `master`) branch for review.

## License

The project license is not specified. Please add a `LICENSE` file or update this section if a license is chosen.
