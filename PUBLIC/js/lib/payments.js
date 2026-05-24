// ================================
// FOODHUB - Payments Module
// Handle Paystack payments
// ================================

window.payments = {
    // Initialize Paystack payment
    async initializePaystack(amount, email, orderId, metadata = {}) {
        try {
            showLoader('Initializing payment...');

            // Paystack expects amount in kobo (multiply by 100)
            const amountInKobo = Math.round(amount * 100);

            const handler = PaystackPop.setup({
                key: PAYSTACK_PUBLIC_KEY,
                email: email,
                amount: amountInKobo,
                currency: APP_SETTINGS.CURRENCY_CODE,
                ref: `${orderId}_${Date.now()}`,
                metadata: {
                    order_id: orderId,
                    ...metadata
                },
                callback: async (response) => {
                    hideLoader();
                    await this.handlePaystackCallback(response, orderId);
                },
                onClose: () => {
                    hideLoader();
                    showToast('Payment cancelled', 'warning');
                }
            });

            hideLoader();
            handler.openIframe();
        } catch (error) {
            hideLoader();
            logError(error, 'initializePaystack');
            showToast('Payment initialization failed', 'error');
            throw error;
        }
    },

    // Handle Paystack callback
    async handlePaystackCallback(response, orderId) {
        try {
            showLoader('Verifying payment...');

            if (response.status === 'success') {
                // Verify payment on backend
                const verified = await this.verifyPaystackPayment(response.reference);

                if (verified) {
                    // Update order payment status
                    await db.update('orders', orderId, {
                        payment_status: PAYMENT_STATUS.COMPLETED,
                        payment_reference: response.reference,
                        updated_at: new Date().toISOString()
                    });

                    // Create payment record
                    await db.insert('payments', {
                        order_id: orderId,
                        reference: response.reference,
                        amount: response.amount / 100, // Convert from kobo
                        status: PAYMENT_STATUS.COMPLETED,
                        provider: 'paystack',
                        created_at: new Date().toISOString()
                    });

                    hideLoader();
                    showToast('Payment successful!', 'success');

                    // Navigate to confirmation screen
                    if (typeof router !== 'undefined') {
                        router.goTo('confirmation', { orderId });
                    }
                } else {
                    throw new Error('Payment verification failed');
                }
            } else {
                throw new Error('Payment failed');
            }
        } catch (error) {
            hideLoader();
            logError(error, 'handlePaystackCallback');
            showToast(error.message || 'Payment verification failed', 'error');

            // Update order payment status to failed
            await db.update('orders', orderId, {
                payment_status: PAYMENT_STATUS.FAILED,
                updated_at: new Date().toISOString()
            });
        }
    },

    // Verify Paystack payment
    async verifyPaystackPayment(reference) {
        try {
            // This should be done on the backend for security
            // For now, we'll simulate verification
            if (DEV_MODE) {
                console.log(`Verifying Paystack payment: ${reference}`);
                return true;
            }

            // TODO: Call backend API to verify payment
            // const response = await fetch(`${API_ENDPOINTS.VERIFY_PAYMENT}?reference=${reference}`);
            // const data = await response.json();
            // return data.status === 'success';

            return true;
        } catch (error) {
            logError(error, 'verifyPaystackPayment');
            return false;
        }
    },

    // Get payment status
    async getPaymentStatus(orderId) {
        try {
            const payments = await db.query('payments', {
                filters: { order_id: orderId },
                orderBy: { column: 'created_at', ascending: false },
                limit: 1
            });

            if (payments && payments.length > 0) {
                return payments[0];
            }

            return null;
        } catch (error) {
            logError(error, 'getPaymentStatus');
            return null;
        }
    },

    // Get payment history for customer
    async getPaymentHistory(customerId) {
        try {
            // Get customer orders
            const customerOrders = await orders.getOrders(customerId);
            const orderIds = customerOrders.map(order => order.id);

            // Get payments for these orders
            const allPayments = [];
            for (const orderId of orderIds) {
                const payment = await this.getPaymentStatus(orderId);
                if (payment) {
                    allPayments.push(payment);
                }
            }

            return allPayments;
        } catch (error) {
            logError(error, 'getPaymentHistory');
            return [];
        }
    },

    // Process payment based on method
    async processPayment(orderId, paymentMethod, paymentData) {
        try {
            // Always use Paystack
            await this.initializePaystack(
                paymentData.amount,
                paymentData.email,
                orderId,
                paymentData.metadata
            );
        } catch (error) {
            logError(error, 'processPayment');
            throw error;
        }
    }
};
