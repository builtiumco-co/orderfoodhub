(function () {
    // State
    let cart = [];
    let selectedZoneFee = 0;
    let subtotal = 0;

    /**
     * Initialization - runs immediately when script is injected by router
     */
    async function initCheckout() {
        console.log('🚀 Final Checkout Initialization...');

        // 1. Load Cart
        loadCart();

        // 2. Fetch Zones
        await fetchZones();

        // 3. Set up listeners
        const zoneSelect = document.getElementById('deliveryZone');
        const placeOrderBtn = document.getElementById('placeOrderBtn');

        if (zoneSelect) {
            zoneSelect.addEventListener('change', handleZoneChange);
        }

        if (placeOrderBtn) {
            placeOrderBtn.onclick = handlePlaceOrder;
        }

        // Pre-fill user data if available
        const user = supabase.auth.user();
        if (user) {
            if (document.getElementById('userEmail')) document.getElementById('userEmail').value = user.email;
        }

        console.log('✅ Checkout Screen Ready');
    }

    function loadCart() {
        try {
            cart = typeof getCart === 'function' ? getCart() : JSON.parse(sessionStorage.getItem('cart') || '[]');

            if (!cart || cart.length === 0) {
                const localCart = JSON.parse(localStorage.getItem('cart') || localStorage.getItem('foodhub_cart') || '[]');
                if (localCart.length > 0) {
                    cart = localCart;
                }
            }

            if (!cart || cart.length === 0) {
                console.warn('Cart is empty on checkout');
            }

            renderCartSummary();
        } catch (e) {
            console.error('Checkout: Cart load error', e);
        }
    }

    function renderCartSummary() {
        const list = document.getElementById('cartItemsList');
        if (!list) return;

        list.innerHTML = '';
        subtotal = 0;

        cart.forEach(item => {
            const quantity = item.qty || item.quantity || 1;
            const itemTotal = item.price * quantity;
            subtotal += itemTotal;

            const div = document.createElement('div');
            div.className = 'cart-mini-item';
            div.innerHTML = `
                <span>${quantity}x ${item.name}</span>
                <span>₦${itemTotal.toLocaleString()}</span>
            `;
            list.appendChild(div);
        });

        document.getElementById('subtotalVal').textContent = '₦' + subtotal.toLocaleString();
        updateTotal();
    }

    async function fetchZones() {
        const select = document.getElementById('deliveryZone');
        if (!select) return;

        try {
            const { data, error } = await db.client
                .from('delivery_zones')
                .select('*')
                .order('price', { ascending: true });

            if (error) throw error;

            select.innerHTML = '<option value="" disabled selected>Select your area...</option>';

            data.forEach(zone => {
                const opt = document.createElement('option');
                opt.value = zone.id;
                opt.dataset.price = zone.price;
                opt.dataset.name = zone.zone_name;
                opt.textContent = `${zone.zone_name} - ₦${zone.price.toLocaleString()}`;
                select.appendChild(opt);
            });

        } catch (err) {
            console.error('Checkout: Zone fetch error', err);
            select.innerHTML = '<option disabled>Error loading zones</option>';
        }
    }

    function handleZoneChange(e) {
        const opt = e.target.selectedOptions[0];
        if (opt && opt.dataset.price) {
            selectedZoneFee = parseInt(opt.dataset.price) || 0;
            document.getElementById('deliveryVal').textContent = '₦' + selectedZoneFee.toLocaleString();
            updateTotal();
        }
    }

    function updateTotal() {
        const total = subtotal + selectedZoneFee;
        const fmt = '₦' + total.toLocaleString();

        const totalEl = document.getElementById('totalVal');
        const btnTotalEl = document.getElementById('btnTotal');

        if (totalEl) totalEl.textContent = fmt;
        if (btnTotalEl) btnTotalEl.textContent = fmt;
    }

    async function handlePlaceOrder() {
        const btn = document.getElementById('placeOrderBtn');

        // Validation
        const zoneId = document.getElementById('deliveryZone').value;
        const address = document.getElementById('streetAddr').value;
        const phone = document.getElementById('userPhone').value;
        const email = document.getElementById('userEmail').value;
        const name = document.getElementById('userName').value;
        const landmark = document.getElementById('landmark').value;
        const paymentMethod = 'card'; // Always Paystack

        if (!zoneId || !address || !phone || !name || !email) {
            showToast('Please fill in required fields: Zone, Address, Name, Email, Phone', 'warning');
            return;
        }

        if (cart.length === 0) {
            showToast('Your cart is empty', 'error');
            return;
        }

        btn.textContent = 'Processing...';
        btn.disabled = true;

        try {
            const selectedOpt = document.getElementById('deliveryZone').selectedOptions[0];
            const zoneName = selectedOpt ? selectedOpt.dataset.name : 'Unknown';
            const notes = document.getElementById('notes').value;
            const totalAmount = subtotal + selectedZoneFee;

            const orderCode = 'FH-' + Math.floor(1000 + Math.random() * 8999);

            const orderData = {
                order_code: orderCode,
                customer_name: name,
                phone: phone,
                address: {
                    street: address,
                    landmark: landmark,
                    zone: zoneName,
                    notes: notes,
                    zone_id: zoneId,
                    email: email
                },
                items: cart,
                total_amount: totalAmount,
                delivery_fee: selectedZoneFee,
                payment_method: paymentMethod,
                payment_status: 'pending',
                status: 'pending',
                created_at: new Date().toISOString()
            };

            // 1. Create Order
            const { data, error } = await db.client
                .from('orders')
                .insert([orderData])
                .select();

            if (error) throw error;

            console.log('✅ Order created pending payment:', data);
            const orderResult = data[0];

            // 2. Process Payment (Always Paystack)
            processPaystack(orderResult, email, totalAmount, btn);

        } catch (err) {
            console.error('Checkout: Order error', err);
            showToast('Failed to place order: ' + err.message, 'error');
            btn.textContent = 'Place Order';
            btn.disabled = false;
        }
    }

    function processPaystack(order, email, amount, btn) {
        if (typeof PaystackPop === 'undefined') {
            alert('Paystack failed to load. Please check your connection and try again.');
            btn.disabled = false;
            return;
        }

        const handler = PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: email,
            amount: amount * 100, // Kobo
            currency: 'NGN',
            ref: order.id + '_' + Date.now(),
            onClose: function () {
                showToast('Payment window closed', 'info');
                btn.disabled = false;
                btn.textContent = 'Place Order';
            },
            callback: function (response) {
                console.log('Paystack success:', response);
                updateOrderPaid(order, 'paystack', response.reference);
            }
        });
        handler.openIframe();
    }





    async function updateOrderPaid(order, provider, reference) {
        try {
            const { error } = await db.client
                .from('orders')
                .update({
                    payment_status: 'completed',
                    payment_reference: reference,
                    status: 'confirmed'
                })
                .eq('id', order.id);

            if (error) throw error;

            showToast('Payment Successful!', 'success');
            setTimeout(() => {
                finalizeOrder({ ...order, payment_status: 'completed', payment_reference: reference }, null);
            }, 1000);

        } catch (err) {
            console.error('Payment Update Error:', err);
            showToast('Payment received but failed to update order. Contact support.', 'error');
        }
    }

    function finalizeOrder(orderResult, btn) {
        if (typeof clearCart === 'function') {
            clearCart();
        } else {
            sessionStorage.removeItem('cart');
        }
        localStorage.removeItem('foodhub_cart');

        showToast('Order Received! Redirecting...', 'success');

        setTimeout(() => {
            router.goTo('confirmation', {
                orderId: orderResult.id,
                orderNumber: orderResult.order_code,
                total: orderResult.total_amount,
                displayData: {
                    guestName: orderResult.customer_name || 'Guest',
                    guestPhone: orderResult.phone || '',
                    guestAddress: (orderResult.address && orderResult.address.street) || ''
                }
            });
        }, 1500);
    }

    initCheckout();

})();
