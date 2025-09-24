## Assignment 3: To-Do List (Conor McCoy)
A full-stack to-do list application built with Node.js, Express, and a persistent MongoDB database. The application supports user registration and login, ensuring that each user can only view and manage their own tasks. New tasks are assigned a suggested deadline based on their priority level. The entire application is a responsive, single-page experience styled with Pico.css.

One of the main challenges was coordinating the full-stack authentication. Ensuring the server correctly created and managed user sessions with express-session, while also making the client-side JavaScript securely handle the login state, required careful planning. Specifically, creating a dedicated /api/session/status endpoint was a key step to reliably check the user's login status on page load without triggering console errors, which was necessary to achieve a perfect Lighthouse score.

PUT VERCEL LINK HERE

## Login Guide
- **To test the application, you will first need to register a new account using the registration form.**
- **Once you've created an account, you can then log in using the same credentials you just registered with.**

## Achievements
- **Deployment on Vercel**: This project was deployed using Vercel. The setup process was very straightforward due to its clean interface and strong integration with GitHub. Connecting the repository was simple, and the dashboard made it easy to configure the necessary environment variables for the MongoDB connection.
- **100% on all Lighthouse Tests**: The application achieved a perfect 100% score across all four tested Lighthouse categories (Performance, Accessibility, Best Practices, and SEO) for both the logged-in and logged-out views. Achieving this required several specific optimizations. For accessibility, aria-label attributes were added to all interactive elements within the task table (like the priority dropdown and completion checkbox) to ensure they were understandable to screen readers. The heading structure was also corrected to be sequentially-descending (h1 followed by h2), fixing an accessibility issue. For Best Practices, a dedicated session/status endpoint was created to check the user's login status on page load. This prevented the browser from logging an expected 401 Unauthorized error to the console, which allowed the site to pass the "no browser errors" check and achieve a perfect score.
- **Welcome message with username**: A dynamic "Welcome, [username]!" message is displayed to the user upon logging in. While a small feature, this was a challenging addition that improves the user experience by personalizing the application. Implementing it required a new endpoint (session/status) had to be created on the server to fetch the logged-in user's details without exposing sensitive information. On the client side, the main.js file was updated to call this endpoint upon page load and after a successful login. The client-side logic then dynamically updates to display the username, confirming to the user that they are successfully authenticated.

