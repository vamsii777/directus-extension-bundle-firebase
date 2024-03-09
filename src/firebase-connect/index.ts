import { defineEndpoint } from '@directus/extensions-sdk';
import { createError } from "@directus/errors";
import admin from 'firebase-admin';
import { nanoid } from 'nanoid';
import { addSeconds } from 'date-fns'

const endpoint = process.env.FIREBASE_ENDPOINT || "firebase";

const InvalidRoleError = createError(
    "INVALID_ROLE_ERROR",
    "You have not configured a valid role for this extension.",
    400
);

const InvalidTokenError = createError(
    "INVALID_TOKEN_ERROR",
    "Invalid or incomplete ID token.",
    400
);

export default defineEndpoint({
	id: endpoint,

	handler: (router, context) => {
		const { env, database, logger, services, getSchema } = context;
		const { UsersService } = services;

		router.post('/link', (req, res) => handleUserLinkRequest(req, res));
		router.post('/auth', (req, res) => handleTokenAuthRequest(req, res));
	
		async function handleUserLinkRequest(req: any, res: any) {
			try {
				logger.debug('Received request for /link endpoint.');

				const idToken = req.body.id_token;
				if (!idToken) {
					logger.warn('Missing ID token in request body.');
					return res.status(400).json({ error: 'Missing ID token' });
				}

				const decodedToken = await admin.auth().verifyIdToken(idToken);
				if (!decodedToken || !decodedToken.email || !decodedToken.uid) {
					throw InvalidTokenError;
				}

				const accountability = {
					ip: req.ip,
					userAgent: req.get('user-agent'),
					role: null,
				};

				const usersService = new UsersService({
					schema: await getSchema(),
					accountability: accountability
				});

				let role = await database('directus_roles').where({ name: env.FIREBASE_ROLE_NAME }).first();
				if (!role) {
					throw InvalidRoleError;
				}

				let user = await database('directus_users').where({ email: decodedToken.email }).first();
				if (!user) {
					logger.info(`Creating new user with email: ${decodedToken.email}`);
					user = await usersService.createOne({
						email: decodedToken.email,
						role: role.id,
						status: 'active',
						first_name: decodedToken.name?.split(' ')[0],
						last_name: decodedToken.name?.split(' ')[1],
						auth_data: {
							firebase: {
								data: decodedToken.firebase,
								aud: decodedToken.aud,
								auth_time: decodedToken.auth_time,
								sub: decodedToken.sub,
								iat: decodedToken.iat,
								exp: decodedToken.exp,
								iss: decodedToken.iss,
							}
						},
						email_verified: decodedToken.email_verified,
						provider: 'default',
						phone_number_verified: false,
						external_identifier: decodedToken.uid, // Save Firebase UID if needed
					});
				} else {
					logger.debug(`User found with email: ${decodedToken.email}`);
				} 
				res.json({ user });
			} catch (error: any) {
				logger.error(`Error in /link: ${error.message}`, error as Error);
				return res.status(error.status || 500).json({ error: error.message });
			}
		}

		// Token Route
		async function handleTokenAuthRequest(req: any, res: any) {
			try {
				const { AuthenticationService } = services;
				
				const userId = req.body.uid;
		
				let user = await database('directus_users').where({ external_identifier: userId }).first();
		
				// Create one time session token (OTST) with 30s lifetime
				const otst = nanoid(64);
				const expiration = addSeconds(new Date(), 30);
		
				await database.insert({
				  token: otst,
				  user: user.id,
				  expires: expiration,
				  ip: req.ip,
				  user_agent: req.get('user-agent')
				}).into('directus_sessions');
		
				// Try to authenticate by refreshing (OTST)
				const accountability = {
				  ip: req.ip,
				  userAgent: req.get('user-agent'),
				  role: user.role,
				};
		
				const authenticationService = new AuthenticationService({
				  accountability: accountability,
				  schema: await getSchema(),
				});
		
				logger.debug(`Generated tokens for user ID: ${user.id}`);
		
				const { accessToken, refreshToken, expires } = await authenticationService.refresh(otst);
		
				const data = {
				  access_token: accessToken,
				  refresh_token: refreshToken,
				  expires
				};
		
				res.json({data});
		
			  } catch (error) {
				logger.error(`Error generating token: ${error}`, error);
				return res.status(500).json({ error: error });
			  }
		}
	}
});

