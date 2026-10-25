# Felix Legal Chatbot

### A Simple and Accessible Legal Information Assistant

Felix Legal Chatbot is a web-based application designed to make legal information easier to explore and understand. It gives users a conversational way to ask legal questions, learn about legal concepts, and find useful information for further research.

The project focuses on making legal information more approachable through a clean interface, organised conversations, account management, and online research support.

Whether someone is beginning to explore a legal topic or looking for a starting point for further research, Felix Legal Chatbot aims to provide a straightforward and convenient experience.

**Project website:** https://felixlawai.com

**GitHub repository:** https://github.com/felixogunz/felix-legal-chatbot

**Important notice:** Felix Legal Chatbot is intended for general legal information and research support. It does not replace a qualified legal practitioner, provide a guarantee of legal accuracy, or establish a lawyer-client relationship. Always verify relevant laws and legal authorities, and seek professional advice when necessary.

---

## Contents

- About the Project
- Why I Built This Project
- Main Features
- How It Works
- Technologies Used
- Project Structure
- Getting Started
- Environment Configuration
- Running the Application
- Database and Information Storage
- User Accounts and Password Recovery
- Security and Privacy
- Deployment
- Testing and Troubleshooting
- Future Improvements
- Contributing
- License
- Contact

---

## About the Project

Legal information can sometimes feel difficult to understand, especially when a person is unfamiliar with legal terminology or does not know where to begin.

Felix Legal Chatbot was created to make that first step easier.

The application provides a conversational interface where users can submit legal questions and explore the information returned to them. Its research functionality can also present relevant online sources when they are available.

Behind the interface, the application uses Python and Flask to handle requests, manage user accounts, process conversations, and communicate with other services. A database layer supports the storage and retrieval of user and conversation information.

The project brings together several practical areas of software development:

- Building a web application with Python and Flask.
- Creating a clean and responsive user interface.
- Managing user registration and login.
- Organising conversations and messages in a database.
- Supporting password recovery.
- Validating user input and protecting application routes.
- Working with uploaded documents.
- Configuring and deploying an application to a cloud hosting platform.

Together, these components provide the foundation for a functional legal information application.

## Why I Built This Project

Finding useful legal information can take time. People may have to search through different websites, read unfamiliar terminology, and determine which information is relevant to their situation.

I wanted to build an application that makes exploring legal questions more approachable and gives users a convenient place to begin their research.

The main goals of the project are to:

- Make legal information easier to explore.
- Allow users to ask questions in ordinary language.
- Provide a straightforward conversational experience.
- Help users discover relevant online information.
- Allow registered users to manage their conversations.
- Provide a simple account registration and login experience.
- Make password recovery available when users lose access to their accounts.
- Build a maintainable application that can be improved over time.

The project is also an opportunity to apply practical backend development, database management, application security, and deployment skills to a real-world use case.

## Main Features

### 1. Legal question and answer interface

- Users can submit legal questions through a conversational interface.
- Responses are presented in a format designed to be easy to read.
- Users can continue exploring a topic by asking follow-up questions.
- The application is intended to support legal information gathering, rather than replace professional legal advice.

### 2. Online research support

- The application includes web-search functionality to help retrieve relevant online information.
- Available source details can include titles, links, and short descriptions.
- Users can follow relevant links to explore information further.
- Online information should always be checked for reliability, relevance, and currency.

### 3. Conversation management

- The application supports creating conversations.
- Messages can be associated with their respective conversations.
- Conversation history can be retrieved from the database.
- Conversation titles can be renamed.
- Conversations can be deleted through the available application functionality.
- Conversation ownership is represented in the database.

### 4. User registration and login

- Users can create accounts using the registration interface.
- Registered users can log in with their credentials.
- Password length is validated during registration.
- Password hashes are stored instead of intentionally storing plain-text passwords.
- User sessions allow the application to recognise authenticated users.

### 5. Password recovery

- Users can request a password-reset link.
- Reset tokens are stored as hashes.
- Reset tokens have an expiry period and support single-use tracking.
- The email delivery service must be configured correctly for reset messages to reach users.

### 6. Guest access

- The application includes configurable guest access.
- Guest access can be enabled or disabled through application settings.
- Guest sessions can have a defined lifetime.
- Guest message limits can be configured.

### 7. Document uploads

- The backend includes support for extracting text from PDF documents.
- Plain-text files can be processed.
- Word documents in DOCX format are supported by the document-processing functionality.
- File handling should be tested to confirm that uploaded content is validated and processed as intended.

### 8. Application security

- The application includes input-validation logic.
- CSRF protection is configured for supported form submissions.
- Request rate limiting is included.
- Authentication uses session-based access controls.
- Password-reset tokens are designed to expire and be used only once.

These protections form part of the application's security foundation, but they should not be considered a substitute for a complete security review.

### 9. Responsive design

- The interface uses CSS to organise the main application layout.
- Navigation and conversation areas are styled for readability.
- The message composer provides a central place to submit questions.
- Responsive styles support smaller screens.
- The stylesheet also contains styling for a dark appearance preview.

### 10. Health monitoring

- The application includes a health-check endpoint.
- This endpoint can help determine whether the web application is responding.
- Additional checks are necessary to confirm that the database, email provider, and other external services are working correctly.

---

## How It Works

The application brings together the browser interface, Flask backend, database, and external services.

The general process works as follows:

1. **The user opens the application.** They access the website and navigate to the chat interface.

2. **The user submits a question.** The browser sends the request to the Flask application.

3. **The application checks the request.** The backend processes the submitted information and applies the relevant validation and access controls.

4. **The application prepares a response.** The backend passes the question to the configured response-generation service, which can use online research functionality.

5. **The response is returned.** The backend sends the resulting answer and available source information to the browser.

6. **The interface displays the result.** The user can read the response and continue the conversation.

7. **Conversation information is managed.** The database layer supports storing and retrieving conversation and message records.

Not every request follows exactly the same path. For example, registration, password recovery, and document uploads use their own routes and processing steps.

## Technologies Used

The project uses the following technologies and tools:

- **Python:** The main programming language used for the backend.
- **Flask:** Handles application routes, incoming requests, sessions, and server-side processing.
- **HTML5:** Provides the structure of the web pages.
- **CSS3:** Controls the visual design, layout, and responsive behaviour.
- **JavaScript:** Supports browser-side interactions where implemented.
- **SQLite:** Provides a lightweight database option for local development.
- **PostgreSQL:** Provides a relational database option suitable for persistent production storage.
- **psycopg:** Enables the Python application to communicate with PostgreSQL.
- **Flask-WTF:** Provides CSRF protection and related form-security functionality.
- **Flask-Limiter:** Supports rate limiting for application requests.
- **python-dotenv:** Loads local environment variables from a `.env` file.
- **Document-processing libraries:** Support extracting text from supported document formats, depending on the installed dependencies.
- **Render:** Hosts the deployed web application.
- **Resend:** An intended option for email delivery through an API, subject to completing and verifying the integration.

The project's `requirements.txt` file contains the Python dependencies used by the application.

## Project Structure

The main project files are organised around the responsibilities they handle.

```text
felix-legal-chatbot/
│
├── app.py
├── ai.py
├── config.py
├── database.py
├── security.py
├── utils.py
├── requirements.txt
├── README.md
├── .env
├── .gitignore
│
├── templates/
│   ├── login.html
│   ├── register.html
│   ├── forgot_password.html
│   └── reset_password.html
│
└── static/
    ├── css/
    │   └── style.css
    └── auth.js
```

This is a guide to the main files, not a requirement to create every listed file if it does not already exist.

### What each file does

- **`app.py`**
  - Creates and configures the Flask application.
  - Defines the application's routes.
  - Handles registration, login, and password recovery.
  - Processes chat requests and document uploads.
  - Connects the different parts of the application.

- **`ai.py`**
  - Handles response generation.
  - Communicates with the configured external service.
  - Processes returned answers and available research sources.

- **`config.py`**
  - Reads configuration values from environment variables.
  - Defines settings used by the application and its external services.

- **`database.py`**
  - Creates database connections.
  - Manages user records.
  - Handles conversations and messages.
  - Manages password-reset tokens and guest-session records.

- **`security.py`**
  - Contains message-validation logic.

- **`utils.py`**
  - Contains shared helper functions, including conversation-title generation.

- **`requirements.txt`**
  - Lists the Python packages needed to run the project.

- **`templates/`**
  - Contains the HTML pages rendered by the Flask application.

- **`static/css/style.css`**
  - Contains the main visual styling for the application.

- **`static/auth.js`**
  - Contains browser-side authentication interactions, where implemented.

- **`.env`**
  - Holds local environment variables and development credentials.
  - Must remain private and should not be committed to GitHub.

- **`.gitignore`**
  - Identifies files and directories that Git should not track.

## Getting Started

To run the application on your computer, you will need Python, Git, and the project's required dependencies.

You will also need the relevant credentials and configuration for any external services you intend to use.

### Step 1: Clone the repository

Open your terminal and run:

```bash
git clone https://github.com/felixogunz/felix-legal-chatbot.git
cd felix-legal-chatbot
```

### Step 2: Create a virtual environment

On Linux or ChromeOS, run:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

On Windows, run:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
```

A virtual environment keeps this project's packages separate from those used by other Python projects.

### Step 3: Install the dependencies

Run:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Wait for the installation to finish before continuing.

If an installation error appears, check the Python version and the package named in the error message.

### Step 4: Configure the application

Create a `.env` file in the project's root directory.

Add the environment variables required by your local setup. The next section explains the main configuration options.

Do not copy real credentials into the README or commit them to your repository.

### Step 5: Start the application

Run:

```bash
python app.py
```

If the application starts successfully, Flask will display a local address in the terminal.

The usual development address is:

```text
http://127.0.0.1:5000
```

Open that address in your browser.

The exact startup command may change if the project's deployment configuration is updated.

## Environment Configuration

The application uses environment variables to keep configuration separate from the source code.

A local `.env` file may contain settings such as the following:

```dotenv
# Application
SECRET_KEY=replace_with_a_long_random_secret
APP_ENV=development

# External response service
OPENAI_API_KEY=replace_with_your_api_key
OPENAI_MODEL=gpt-4.1-mini

# Database
DATABASE_URL=
DATABASE_PATH=felix_legal.db

# Email configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_DEFAULT_SENDER=

# Password recovery
PASSWORD_RESET_TOKEN_MAX_AGE=1800

# Email API, if implemented
RESEND_API_KEY=

# Google sign-in, if implemented
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

This is an example configuration template. Confirm the exact environment-variable names and defaults in the current source code before using them.

Keep the following points in mind:

- Replace placeholder values with your own credentials.
- Generate a strong, random application secret.
- Do not share API keys or passwords in public repositories.
- Configure a persistent database for production use.
- Configure the email provider before relying on password recovery.
- Add Google sign-in credentials only if the complete sign-in flow has been implemented.
- Use different secrets for local development and production.

The example sets `PASSWORD_RESET_TOKEN_MAX_AGE=1800`, equivalent to 30 minutes. The current application code has a default of 172,800 seconds, or 48 hours, so the intended expiry must be configured and verified before relying on the 30-minute setting.

## Running the Application

For local development:

1. Open the project directory.
2. Activate the virtual environment.
3. Install the dependencies.
4. Configure the required environment variables.
5. Run `python app.py`.
6. Open the local address in your browser.
7. Test the main features before making changes to the deployed application.

For production, use the hosting platform's configured application server rather than relying on Flask's development server.

## Database and Information Storage

The application supports SQLite and PostgreSQL.

### SQLite

SQLite stores information in a local database file.

It is convenient for development because it does not require a separate database server.

The project can use a file such as:

```text
felix_legal.db
```

However, a local database file stored on an ephemeral hosting filesystem may be lost when the hosting service restarts or redeploys the application.

### PostgreSQL

PostgreSQL is a suitable option for persistent application data.

When `DATABASE_URL` is configured, the database layer can connect to PostgreSQL through `psycopg`.

For a deployed application, check that:

- The database is accessible from the web service.
- The database connection string is correct.
- The required tables are present.
- User records can be created and retrieved.
- Conversations and messages are saved correctly.
- Records remain available after a service restart.
- Backups and recovery procedures are in place.

### Information managed by the database

The current database design includes records for:

- User accounts.
- Conversations.
- Messages.
- Password-reset tokens.
- Guest sessions.

Changes to the database schema should be handled carefully, particularly when existing accounts or conversations must be preserved.

## User Accounts and Password Recovery

### Registration and login

Users can register and log in through the authentication pages.

The application applies password-length checks and uses password hashes for account storage. After a successful login, the session can associate subsequent activity with the authenticated account.

These flows should be tested for valid credentials, incorrect passwords, duplicate accounts, and session handling.

### Password recovery

The intended password-recovery process works as follows:

1. The user enters their email address.
2. The application responds with a general message.
3. If the account is eligible, a reset token is generated.
4. The token is sent through the configured email service.
5. The user opens the reset link.
6. The application checks the token and its expiry.
7. The user chooses a new password.
8. The token is marked as used so it cannot be reused.

The email provider must be configured and tested for this workflow to operate reliably.

### Email delivery

The application has used Gmail SMTP for password-reset messages. Render's free web-service tier restricts outbound SMTP connections on commonly used ports, which can prevent that delivery method from working.

An email API such as Resend can be an alternative because it sends requests over HTTPS. The integration, sending domain, API key, and sender address must be configured and verified before real password-reset emails can be delivered reliably.

Creating an account with an email provider or adding DNS records alone does not confirm that email delivery is working.

### Google sign-in

Google sign-in should be considered available only after its full authentication flow has been implemented and tested.

A complete implementation needs appropriate credentials, a correctly configured callback URL, validation of the returned identity, and protection against forged authentication requests.

Installing an authentication package alone is not enough.

## Security and Privacy

Protecting accounts and application data is an important part of maintaining Felix Legal Chatbot.

The project includes several security-related mechanisms:

- Password-length validation.
- Password hashing.
- CSRF protection for supported form submissions.
- Request rate limiting.
- Message-validation logic.
- Session-based authentication.
- Hashed password-reset tokens.
- Password-reset expiry and single-use tracking.
- Environment variables for application credentials.

Before production use, further checks should confirm that:

- The application uses a strong secret key.
- HTTPS is enforced.
- Session cookies use appropriate security settings.
- Users cannot access another user's private conversations.
- Guest access limits are correctly enforced.
- Password-reset links expire as intended.
- Uploaded files are checked for size and valid content.
- Logs do not expose passwords, API keys, reset tokens, or sensitive information.
- Database access is restricted.
- Backups are available.
- Dependencies are kept up to date.

Users should avoid uploading confidential legal documents or sensitive personal information unless the application has been assessed and approved for that use.

These measures help establish a security foundation, but they do not guarantee that an application is free from vulnerabilities.

## Deployment

Felix Legal Chatbot is configured for deployment through Render.

### Deployment steps

1. Push the latest application code to GitHub.
2. Create or open the relevant Render web service.
3. Connect the service to the correct GitHub repository and branch.
4. Configure the build and start commands.
5. Add the required environment variables in Render.
6. Configure a persistent database.
7. Deploy the application.
8. Review the build logs and runtime logs.
9. Test registration, login, conversation storage, and password recovery.
10. Confirm the new deployment works before changing the custom domain.

### Build command

A typical build command for this project is:

```bash
pip install -r requirements.txt
```

### Start command

A common production start command for a Flask application is:

```bash
gunicorn app:app
```

This assumes Gunicorn is installed and that `app.py` exposes a Flask application named `app`. Verify both conditions before using this command.

### Production environment variables

Review the following settings in the Render dashboard:

- `SECRET_KEY`
- `OPENAI_API_KEY`
- `DATABASE_URL`
- Email-provider settings
- Any additional configuration required by the current application code

Store production credentials in Render's environment settings rather than committing them to GitHub.

### Custom domain

The project uses the `felixlawai.com` domain.

Before connecting or changing DNS records, make sure the new Render deployment works correctly using its provided Render URL.

Then verify the custom-domain configuration and follow the DNS instructions provided by Render. Avoid changing unrelated records that are already needed by the website.

### Do I need a `render.yaml` file?

No. A `render.yaml` file is optional if the service is configured through the Render dashboard.

It can be useful when you want deployment settings defined in a file and managed alongside the source code. However, it is not necessary simply to host a Flask application on Render.

## Testing and Troubleshooting

After running or deploying the application, test the main user journeys.

### Application startup

- Confirm that the application starts without import errors.
- Check whether all required dependencies are installed.
- Review the runtime logs for configuration errors.

### Registration and login

- Register a new account.
- Attempt to register the same email address again.
- Test a successful login.
- Test an incorrect password.
- Confirm that logging out ends the authenticated session.

### Password recovery

- Submit a password-reset request.
- Check whether the email provider accepts the message.
- Confirm that the message reaches the intended test account.
- Test the reset link.
- Confirm that expired and previously used tokens are rejected.

### Conversations

- Create a conversation.
- Submit a message.
- Confirm that the message is stored.
- Retrieve the conversation.
- Rename and delete a conversation.
- Test that one account cannot access another account's private records.

### Document uploads

- Test a supported PDF file.
- Test a TXT file.
- Test a DOCX file.
- Check how invalid and oversized files are handled.

### Deployment and persistence

- Open the health endpoint.
- Review the deployment logs.
- Restart the service and check whether data remains available.
- Confirm that the application uses the intended database.
- Test the website on both desktop and mobile screens.

### Common problems

**The application works locally but fails on Render.**

Check the build logs, Python version, start command, installed dependencies, and required environment variables.

**Responses cannot be generated.**

Check the configured API key, model name, service availability, usage limits, and runtime logs.

**Password-reset emails are not arriving.**

Check the email integration, provider credentials, sender address, domain verification, and delivery status.

**Accounts or conversations disappear after redeployment.**

Check whether the application is using a database file on an ephemeral filesystem rather than a persistent database.

**The custom domain does not open the expected application.**

Check the Render custom-domain configuration and compare its required DNS records with those configured at the domain provider.

## Future Improvements

There are several areas where the project could continue to grow.

### Account management

- Complete and test Google sign-in.
- Improve account-recovery feedback.
- Add automated tests for authentication.
- Review session expiry and account-security behaviour.

### Database reliability

- Use persistent PostgreSQL in production.
- Introduce structured database migrations.
- Improve backup and recovery procedures.
- Expand tests for conversation ownership and data isolation.

### Email delivery

- Complete the email API integration.
- Verify the sending domain.
- Confirm the intended password-reset expiry period.
- Test expired, invalid, and previously used reset links.
- Monitor message-delivery failures.

### Application reliability

- Improve error handling.
- Add tests for external-service failures.
- Improve health monitoring.
- Avoid logging sensitive user information.
- Review dependency versions regularly.

### User experience

- Refine loading and error messages.
- Improve accessibility and keyboard navigation.
- Make authentication pages consistent with the main interface.
- Improve the experience on smaller screens.
- Continue simplifying the interface so users can focus on their legal questions.

## Contributing

Suggestions, bug reports, and improvements are welcome.

If you would like to work on the project:

1. Fork or clone the repository.
2. Create a separate branch for your changes.
3. Set up the development environment.
4. Configure the required environment variables.
5. Make your changes.
6. Test the affected functionality.
7. Commit your changes with a clear message.
8. Submit a pull request explaining what you changed and why.

Please do not include passwords, API