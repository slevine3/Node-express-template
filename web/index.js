import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import serveStatic from 'serve-static';

import shopify from './shopify.js';
import webhooks from './webhooks.js';
import { PrismaClient } from '@prisma/client';

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);
const prisma = new PrismaClient();
const STATIC_PATH =
	process.env.NODE_ENV === 'production'
		? `${process.cwd()}/frontend/dist`
		: `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
	shopify.config.auth.callbackPath,
	shopify.auth.callback(),
	shopify.redirectToShopifyOrAppRoot()
);
app.post(
	shopify.config.webhooks.path,
	// @ts-ignore
	shopify.processWebhooks({ webhookHandlers: webhooks })
);

// All endpoints after this point will require an active session
app.use('/api/*', shopify.validateAuthenticatedSession());

app.use(express.json());

app.post('/saveCart', async (req, res) => {
	try {
		const { checkoutToken, selectedProductIds } = req.body;

		const token = JSON.stringify(checkoutToken);

		// Create a new SavedCart
		const savedCart = await prisma.savedCart.create({
			data: {
				checkoutToken: token,
				productIds: selectedProductIds,
			},
		});
		console.log('🚀 ~ file: index.js:52 ~ app.post ~ savedCart:', savedCart);

		res.json({ success: true, message: 'Cart saved successfully' });
	} catch (error) {
		console.error('Error saving cart:', error);
		res.status(500).json({ success: false, message: 'Error saving cart' });
	} finally {
		// Don't forget to disconnect from the Prisma client
		await prisma.$disconnect();
	}
});
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use('/*', shopify.ensureInstalledOnShop(), async (_req, res) => {
	return res.set('Content-Type', 'text/html').send(readFileSync(join(STATIC_PATH, 'index.html')));
});

app.listen(PORT);
