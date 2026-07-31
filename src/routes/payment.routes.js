import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import {
  createGatewayOrderRules,
  verifyPaymentRules,
  walletPayRules,
  refundRules,
} from '../validators/payment.validator.js';
import { validate } from '../validators/index.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Protect ALL Payment endpoints with JWT
router.use(verifyJWT);

router.post('/create-order', createGatewayOrderRules, validate, paymentController.createOrder);
router.post('/verify', verifyPaymentRules, validate, paymentController.verifyPayment);
router.post('/wallet-pay', walletPayRules, validate, paymentController.walletPay);
router.post('/:id/refund', refundRules, validate, paymentController.processRefund);
router.get('/history', paymentController.getTransactionHistory);
router.get('/:id/invoice', paymentController.getInvoice);

export default router;
