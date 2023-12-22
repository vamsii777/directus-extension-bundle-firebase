import { defineHook } from '@directus/extensions-sdk';
import { cert } from "firebase-admin/app";
import admin from "firebase-admin";

export default defineHook(({ init }, { env, logger }) => {
	init('cli.before', async () => {
		try {
			// Decode your base64 credentials
			const base64Credentials = env.FIREBASE_CREDENTIALS_BASE64;
			const credentialsJson = Buffer.from(base64Credentials, 'base64').toString('utf-8');
			const credentials = JSON.parse(credentialsJson);
			// Initialize Firebase Admin with the service account credentials
			admin.initializeApp({
				credential: cert(credentials)
			});
			logger.info("Firebase initialized successfully.");
		} catch (error) {
			logger.error("Firebase initialization failed", error);
			throw error;
		}
	});
});
