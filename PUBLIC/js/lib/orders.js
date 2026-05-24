// ================================
// FOODHUB - Orders Module
// Order creation and management
// ================================

window.orders = {
    // Create new order
    async createOrder(orderData) {
        try {
            showLoader('Placing order...');

            // Validate order data
            if (!orderData.items || orderData.items.length === 0) {
                throw new Error('Invalid order data: No items selected');
            }

            // Calculate totals
            const totals = calculateOrderTotal(orderData.items, orderData.delivery_fee || DELIVERY_FEE);

            // Check minimum order amount
            if (totals.subtotal < MIN_ORDER_AMOUNT) {
                throw new Error(`Minimum order amount is ${formatCurrency(MIN_ORDER_AMOUNT)}`);
            }

            // Generate order number
            const orderNumber = generateOrderNumber();

            // Create order object
            const order = {
                order_number: orderNumber,
                customer_id: orderData.customer_id || null, // Optional for guest
                // Guest Info (if no customer_id)
                customer_name: orderData.customer_name,
                customer_phone: orderData.customer_phone,
                delivery_address: typeof orderData.delivery_address === 'object'
                    ? JSON.stringify(orderData.delivery_address)
                    : orderData.delivery_address, // Handle structured or string address

                subtotal: totals.subtotal,
                tax: totals.tax,
                delivery_fee: totals.deliveryFee,
                total: totals.total,
                payment_method: orderData.payment_method || PAYMENT_METHODS.CASH,
                payment_status: PAYMENT_STATUS.PENDING,
                status: ORDER_STATUS.PENDING,
                special_instructions: orderData.special_instructions || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const createdOrder = await db.insert('orders', order);

            // Create order items
            for (const item of orderData.items) {
                await db.insert('order_items', {
                    order_id: createdOrder.id,
                    menu_item_id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity,
                    created_at: new Date().toISOString()
                });
            }

            hideLoader();
            logInfo('Order created', createdOrder);
            return createdOrder;
        } catch (error) {
            hideLoader();
            logError(error, 'createOrder');
            showToast(error.message || 'Failed to create order', 'error');
            throw error;
        }
    },

    // Get customer's orders
    async getOrders(customerId, status = null) {
        try {
            const options = {
                filters: { customer_id: customerId },
                orderBy: { column: 'created_at', ascending: false }
            };

            if (status) {
                options.filters.status = status;
            }

            const customerOrders = await db.query('orders', options);
            return customerOrders || [];
        } catch (error) {
            logError(error, 'getOrders');
            return [];
        }
    },

    // Get single order with details
    async getOrder(orderId) {
        try {
            showLoader('Loading order...');

            // Get order
            const order = await db.get('orders', orderId);

            if (!order) {
                throw new Error('Order not found');
            }

            // Get order items
            const orderItems = await db.query('order_items', {
                filters: { order_id: orderId }
            });

            // Get menu item details for each order item
            const itemsWithDetails = await Promise.all(
                orderItems.map(async (orderItem) => {
                    const menuItem = await db.get('menu_items', orderItem.menu_item_id);
                    return {
                        ...orderItem,
                        item: menuItem
                    };
                })
            );

            // Get restaurant details
            const restaurant = await db.get('restaurants', order.restaurant_id);

            // Get address details
            let address = null;
            if (order.address_id) {
                address = await db.get('addresses', order.address_id);
            }

            hideLoader();

            return {
                ...order,
                items: itemsWithDetails,
                restaurant,
                address
            };
        } catch (error) {
            hideLoader();
            logError(error, 'getOrder');
            showToast('Failed to load order', 'error');
            throw error;
        }
    },

    // Update order status (for admin/restaurant)
    async updateOrderStatus(orderId, status) {
        try {
            const updatedOrder = await db.update('orders', orderId, {
                status,
                updated_at: new Date().toISOString()
            });

            logInfo(`Order ${orderId} status updated to ${status}`);
            return updatedOrder;
        } catch (error) {
            logError(error, 'updateOrderStatus');
            throw error;
        }
    },

    // Cancel order
    async cancelOrder(orderId, customerId) {
        try {
            showLoader('Cancelling order...');

            // Get order
            const order = await db.get('orders', orderId);

            // Verify ownership
            if (order.customer_id !== customerId) {
                throw new Error('Unauthorized');
            }

            // Check if order can be cancelled
            if ([ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(order.status)) {
                throw new Error('Order cannot be cancelled');
            }

            // Update status
            const updatedOrder = await this.updateOrderStatus(orderId, ORDER_STATUS.CANCELLED);

            hideLoader();
            showToast('Order cancelled successfully', 'success');
            return updatedOrder;
        } catch (error) {
            hideLoader();
            logError(error, 'cancelOrder');
            showToast(error.message || 'Failed to cancel order', 'error');
            throw error;
        }
    },

    // Track order
    async trackOrder(orderId) {
        try {
            const order = await this.getOrder(orderId);

            // Return tracking information
            return {
                order_number: order.order_number,
                status: order.status,
                created_at: order.created_at,
                estimated_delivery: this.calculateEstimatedDelivery(order),
                timeline: this.getOrderTimeline(order)
            };
        } catch (error) {
            logError(error, 'trackOrder');
            throw error;
        }
    },

    // Calculate estimated delivery time
    calculateEstimatedDelivery(order) {
        const createdAt = new Date(order.created_at);
        const estimatedMinutes = 45; // Default 45 minutes
        const estimatedTime = new Date(createdAt.getTime() + estimatedMinutes * 60000);
        return estimatedTime;
    },

    // Get order timeline
    getOrderTimeline(order) {
        const timeline = [
            {
                status: ORDER_STATUS.PENDING,
                label: 'Order Placed',
                completed: true,
                timestamp: order.created_at
            },
            {
                status: ORDER_STATUS.CONFIRMED,
                label: 'Order Confirmed',
                completed: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.ON_THE_WAY, ORDER_STATUS.DELIVERED].includes(order.status)
            },
            {
                status: ORDER_STATUS.PREPARING,
                label: 'Preparing',
                completed: [ORDER_STATUS.PREPARING, ORDER_STATUS.ON_THE_WAY, ORDER_STATUS.DELIVERED].includes(order.status)
            },
            {
                status: ORDER_STATUS.ON_THE_WAY,
                label: 'On the Way',
                completed: [ORDER_STATUS.ON_THE_WAY, ORDER_STATUS.DELIVERED].includes(order.status)
            },
            {
                status: ORDER_STATUS.DELIVERED,
                label: 'Delivered',
                completed: order.status === ORDER_STATUS.DELIVERED
            }
        ];

        return timeline;
    },

    // Get active orders (not delivered or cancelled)
    async getActiveOrders(customerId) {
        try {
            const allOrders = await this.getOrders(customerId);
            return allOrders.filter(order =>
                ![ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(order.status)
            );
        } catch (error) {
            logError(error, 'getActiveOrders');
            return [];
        }
    },

    // Get order history (delivered or cancelled)
    async getOrderHistory(customerId) {
        try {
            const allOrders = await this.getOrders(customerId);
            return allOrders.filter(order =>
                [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(order.status)
            );
        } catch (error) {
            logError(error, 'getOrderHistory');
            return [];
        }
    },

    // Reorder (create new order from previous order)
    async reorder(orderId, customerId) {
        try {
            showLoader('Creating order...');

            // Get original order
            const originalOrder = await this.getOrder(orderId);

            // Verify ownership
            if (originalOrder.customer_id !== customerId) {
                throw new Error('Unauthorized');
            }

            // Create new order with same items
            const newOrderData = {
                customer_id: customerId,
                restaurant_id: originalOrder.restaurant_id,
                address_id: originalOrder.address_id,
                items: originalOrder.items.map(orderItem => ({
                    id: orderItem.menu_item_id,
                    price: orderItem.price,
                    quantity: orderItem.quantity
                })),
                payment_method: originalOrder.payment_method
            };

            const newOrder = await this.createOrder(newOrderData);

            hideLoader();
            showToast('Order created successfully!', 'success');
            return newOrder;
        } catch (error) {
            hideLoader();
            logError(error, 'reorder');
            showToast(error.message || 'Failed to create order', 'error');
            throw error;
        }
    }
};
