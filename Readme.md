# Directus Firebase Bundle Extension

The Directus Firebase Bundle Extension facilitates seamless integration between Directus CMS and Firebase services. This extension is designed to overcome the limitations of Directus's native OpenID Connect support by handling Firebase's custom JWTs (JSON Web Tokens) for authentication. It validates Firebase JWTs and, upon successful validation, creates and manages Directus user accounts. This approach ensures enhanced compatibility and robust security for integrating Directus with Firebase authentication mechanisms.

## Setup

Install the extension via npm or pnpm or bun:

For npm:
```bash
npm i directus-extension-bundle-firebase
```

For pnpm:
```bash
pnpm add directus-extension-bundle-firebase
```

For Bun:
```bash
bun add directus-extension-bundle-firebase
```

### Prerequisites

Before using this extension, ensure you have the following:

- A Directus Instance set up and running.
- A Firebase Project with configured service accounts.
- The following environment variables set:
  - `FIREBASE_CREDENTIALS_BASE64`: Your Firebase credentials encoded in Base64.
  - `FIREBASE_ROLE_NAME`: The role name specified in Directus for Firebase users.
 - `FIREBASE_ENDPOINT`: The endpoint URL for Firebase services (defaults to 'firebase' if not specified).

### Firebase Initialization

The Firebase integration is automatically initialized by a hook within the extension. Simply add your Firebase credentials encoded in Base64 to the environment variable:

- `FIREBASE_CREDENTIALS_BASE64`: Your Firebase credentials encoded in Base64.

This ensures that Firebase is properly configured and ready to be used with your Directus project.

### Endpoints

The extension offers two primary endpoints:

- **POST `/firebase/link`**: 
  - **Purpose**: Validate a Firebase `id_token` and create a Directus user.
  - **Request Body**: `{ "id_token": "<Firebase_ID_Token>" }`
  - **Response**: Information about the created or existing Directus user.

- **POST `/firebase/auth`**: 
  - **Purpose**: Generate Directus access tokens using a Firebase `uid`.
  - **Request Body**: `{ "uid": "<Firebase_User_ID>" }`
  - **Response**: `{ "access_token": "<token>", "refresh_token": "<token>", "expires": "<expiration_time>" }`

#### Example Usage

POST `/firebase/link`:

Content-Type: application/json

```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
}

```

POST `/firebase/auth`:

Content-Type: application/json
```json
{
  "uid": "some-unique-firebase-uid"
}
```

## Usage

After setting up the environment variables, you can use the provided endpoints to link Firebase authentication with Directus user management.
