// ====================================
// FOODHUB - Configuration & Constants
// ====================================

/**
 * CORE CONFIGURATION
 */
const SUPABASE_URL = 'https://eipokhqnemfzuwertewt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcG9raHFuZW1menV3ZXJ0ZXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDA2NTYsImV4cCI6MjA4MzgxNjY1Nn0.WNTvbflRCmd2QDkCTl0b90yUota9NQMOSzF0TD3w2_o';
const PAYSTACK_PUBLIC_KEY = 'pk_live_1c0e761a96b9bcffd70e6e072271dd5560be3723'; // Replace with your Paystack Public Key

/**
 * APP IDENTITY
 */
const APP_NAME = 'FoodHub';
const COUNTRY_CODE = '+234';
const BUSINESS_WHATSAPP = '+2349027762670';

/**
 * DELIVERY SETTINGS
 */
const DEFAULT_DELIVERY_FEE = 500;
const DEFAULT_DELIVERY_TIME = 30; // minutes

/**
 * VALIDATION CONSTRAINTS
 */
const PHONE_MIN_LENGTH = 10;
const PHONE_MAX_LENGTH = 11;
const PASSWORD_MIN_LENGTH = 6;
const NAME_MIN_LENGTH = 2;

/**
 * LOCALIZATION & UI
 */
const CURRENCY = '₦';
const CURRENCY_CODE = 'NGN';

const PAYMENT_METHODS = {
    CASH: 'cash',
    CARD: 'card',
    BANK_TRANSFER: 'bank_transfer'
};

const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    ON_THE_WAY: 'on_the_way',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};
const DEBUG_MODE = false;
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

console.log(`🚀 ${APP_NAME} Configured (Password-Auth Mode)`);