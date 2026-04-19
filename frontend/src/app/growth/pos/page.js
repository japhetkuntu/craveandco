'use client';
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GrowthPOSPage;
var react_1 = require("react");
var auth_1 = require("@/lib/auth");
var api_1 = require("@/lib/api");
var utils_1 = require("@/lib/utils");
var lucide_react_1 = require("lucide-react");
/* ─── Component ─────────────────────────────────────── */
function GrowthPOSPage() {
    var _this = this;
    var _a;
    var _b = (0, auth_1.useAuth)(), user = _b.user, token = _b.token;
    // Data
    var _c = (0, react_1.useState)([]), menuItems = _c[0], setMenuItems = _c[1];
    var _d = (0, react_1.useState)([]), categories = _d[0], setCategories = _d[1];
    var _e = (0, react_1.useState)([]), paymentTypes = _e[0], setPaymentTypes = _e[1];
    var _f = (0, react_1.useState)([]), customers = _f[0], setCustomers = _f[1];
    var _g = (0, react_1.useState)([]), openOrders = _g[0], setOpenOrders = _g[1];
    // UI state
    var _h = (0, react_1.useState)(''), activeCategory = _h[0], setActiveCategory = _h[1];
    var _j = (0, react_1.useState)(''), search = _j[0], setSearch = _j[1];
    var _k = (0, react_1.useState)([]), cart = _k[0], setCart = _k[1];
    var _l = (0, react_1.useState)(null), selectedCustomer = _l[0], setSelectedCustomer = _l[1];
    var _m = (0, react_1.useState)(null), loyaltyBalance = _m[0], setLoyaltyBalance = _m[1];
    var _o = (0, react_1.useState)(false), useLoyaltyDiscount = _o[0], setUseLoyaltyDiscount = _o[1];
    var _p = (0, react_1.useState)(''), guestName = _p[0], setGuestName = _p[1];
    var _q = (0, react_1.useState)(''), receiptReference = _q[0], setReceiptReference = _q[1];
    var _r = (0, react_1.useState)(true), printReceipt = _r[0], setPrintReceipt = _r[1];
    var _s = (0, react_1.useState)('DINE_IN'), channel = _s[0], setChannel = _s[1];
    var _t = (0, react_1.useState)(null), activeOrderId = _t[0], setActiveOrderId = _t[1];
    var _u = (0, react_1.useState)('pos'), view = _u[0], setView = _u[1];
    // Modals
    var _v = (0, react_1.useState)(false), showPayment = _v[0], setShowPayment = _v[1];
    var _w = (0, react_1.useState)(false), showCustomerSearch = _w[0], setShowCustomerSearch = _w[1];
    var _x = (0, react_1.useState)(false), showNewCustomer = _x[0], setShowNewCustomer = _x[1];
    var _y = (0, react_1.useState)(''), customerSearch = _y[0], setCustomerSearch = _y[1];
    var _z = (0, react_1.useState)(''), newCustomerName = _z[0], setNewCustomerName = _z[1];
    var _0 = (0, react_1.useState)(''), newCustomerPhone = _0[0], setNewCustomerPhone = _0[1];
    var _1 = (0, react_1.useState)(true), loading = _1[0], setLoading = _1[1];
    var _2 = (0, react_1.useState)(false), saving = _2[0], setSaving = _2[1];
    var _3 = (0, react_1.useState)(null), alert = _3[0], setAlert = _3[1];
    var _4 = (0, react_1.useState)(null), confirmAction = _4[0], setConfirmAction = _4[1];
    var searchInputRef = (0, react_1.useRef)(null);
    /* ─── Data fetching ─── */
    var fetchData = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, items, cats, pts, custs, orders, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!token)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, Promise.all([
                            (0, api_1.get)('/api/v1/menu/items', token),
                            (0, api_1.get)('/api/v1/menu/categories', token),
                            (0, api_1.get)('/api/v1/growth/payment-types', token),
                            (0, api_1.get)('/api/v1/customers', token),
                            (0, api_1.get)('/api/v1/orders', token),
                        ])];
                case 2:
                    _a = _b.sent(), items = _a[0], cats = _a[1], pts = _a[2], custs = _a[3], orders = _a[4];
                    setMenuItems(items.filter(function (i) { return i.available; }));
                    setCategories(cats);
                    setPaymentTypes(pts);
                    setCustomers(custs);
                    setOpenOrders(orders.filter(function (o) { return o.status !== 'COMPLETED' && o.status !== 'CANCELLED'; }));
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _b.sent();
                    console.error('Failed to load POS data:', err_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [token]);
    (0, react_1.useEffect)(function () { fetchData(); }, [fetchData]);
    (0, react_1.useEffect)(function () {
        if (view === 'pos' && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [view]);
    (0, react_1.useEffect)(function () {
        if (!token || !selectedCustomer) {
            setLoyaltyBalance(null);
            setUseLoyaltyDiscount(false);
            return;
        }
        (0, api_1.get)("/api/v1/loyalty/balance/".concat(selectedCustomer.id), token)
            .then(function (balance) {
            var _a;
            setLoyaltyBalance((_a = balance.balance) !== null && _a !== void 0 ? _a : 0);
        })
            .catch(function (error) {
            console.error('Failed to load loyalty balance', error);
            setLoyaltyBalance(0);
        });
    }, [token, selectedCustomer]);
    (0, react_1.useEffect)(function () {
        if (loyaltyBalance !== null && loyaltyBalance < 100) {
            setUseLoyaltyDiscount(false);
        }
    }, [loyaltyBalance]);
    /* ─── Cart operations ─── */
    var addToCart = function (item) {
        setCart(function (prev) {
            var existing = prev.find(function (c) { return c.menuItemId === item.id; });
            if (existing) {
                return prev.map(function (c) { return c.menuItemId === item.id ? __assign(__assign({}, c), { quantity: c.quantity + 1 }) : c; });
            }
            return __spreadArray(__spreadArray([], prev, true), [{ menuItemId: item.id, name: item.name, price: Number(item.price), quantity: 1 }], false);
        });
    };
    var updateQuantity = function (menuItemId, delta) {
        setCart(function (prev) {
            return prev.map(function (c) {
                if (c.menuItemId !== menuItemId)
                    return c;
                var newQty = c.quantity + delta;
                return newQty > 0 ? __assign(__assign({}, c), { quantity: newQty }) : c;
            }).filter(function (c) { return c.quantity > 0; });
        });
    };
    var removeFromCart = function (menuItemId) {
        setCart(function (prev) { return prev.filter(function (c) { return c.menuItemId !== menuItemId; }); });
    };
    var cartTotal = cart.reduce(function (sum, c) { return sum + c.price * c.quantity; }, 0);
    var cartCount = cart.reduce(function (sum, c) { return sum + c.quantity; }, 0);
    var discountRate = useLoyaltyDiscount ? 0.05 : 0;
    var discountedTotal = Number((cartTotal * (1 - discountRate)).toFixed(2));
    var discountAmount = Number((cartTotal - discountedTotal).toFixed(2));
    /* ─── Order operations ─── */
    var showAlert = function (type, message) {
        setAlert({ type: type, message: message });
        window.setTimeout(function () { return setAlert(null); }, 4500);
    };
    var discardCurrentOrder = function () {
        setActiveOrderId(null);
        setCart([]);
        setSelectedCustomer(null);
        setGuestName('');
        setReceiptReference('');
        setPrintReceipt(true);
        setConfirmAction(null);
    };
    var getReceiptHtml = function (order) {
        var _a;
        var itemsHtml = order.items.map(function (item) {
            var _a;
            return "\n      <tr>\n        <td style=\"padding: 8px;border-bottom:1px solid #ddd;\">".concat(((_a = item.menuItem) === null || _a === void 0 ? void 0 : _a.name) || '', "</td>\n        <td style=\"padding: 8px;border-bottom:1px solid #ddd;text-align:center;\">").concat(item.quantity, "</td>\n        <td style=\"padding: 8px;border-bottom:1px solid #ddd;text-align:right;\">").concat((0, utils_1.formatCurrency)(item.unitPrice), "</td>\n        <td style=\"padding: 8px;border-bottom:1px solid #ddd;text-align:right;\">").concat((0, utils_1.formatCurrency)(item.unitPrice * item.quantity), "</td>\n      </tr>");
        }).join('');
        return "<!doctype html>\n      <html>\n        <head>\n          <meta charset=\"utf-8\" />\n          <title>Crave & Co Receipt</title>\n          <style>\n            body {\n              font-family: 'Helvetica Neue', Arial, sans-serif;\n              color: #111;\n              padding: 16px;\n              width: 320px;\n              margin: 0;\n            }\n            .receipt {\n              width: 100%;\n            }\n            .header {\n              text-align: center;\n              margin-bottom: 16px;\n            }\n            .brand {\n              font-size: 22px;\n              font-weight: 900;\n              letter-spacing: 1px;\n              margin: 0;\n            }\n            .subtitle {\n              font-size: 12px;\n              margin: 6px 0 0;\n              color: #555;\n            }\n            .divider {\n              border-bottom: 1px dashed #999;\n              margin: 12px 0;\n            }\n            .section {\n              margin-bottom: 12px;\n            }\n            .section div {\n              display: flex;\n              justify-content: space-between;\n              font-size: 12px;\n              line-height: 1.5;\n            }\n            table {\n              width: 100%;\n              border-collapse: collapse;\n              font-size: 12px;\n            }\n            th, td {\n              padding: 4px 0;\n            }\n            th {\n              text-align: left;\n              font-size: 12px;\n            }\n            td.qty,\n            td.price,\n            td.total {\n              text-align: right;\n            }\n            .totals {\n              margin-top: 12px;\n              font-size: 13px;\n              font-weight: 700;\n            }\n            .totals div {\n              display: flex;\n              justify-content: space-between;\n              margin-top: 4px;\n            }\n            .footer {\n              text-align: center;\n              font-size: 11px;\n              color: #555;\n              margin-top: 18px;\n              line-height: 1.5;\n            }\n            .small { font-size: 11px; }\n            .receipt-note { margin-top: 10px; }\n          </style>\n        </head>\n        <body>\n          <div class=\"receipt\">\n            <div class=\"header\">\n              <p class=\"brand\">CRAVE & CO.</p>\n              <p class=\"subtitle\">Restaurant \u00B7 Taste the comfort</p>\n              <p class=\"subtitle\">Accra, Ghana \u00B7 +233 24 000 0000</p>\n              <p class=\"subtitle\">hello@craveandco.com</p>\n            </div>\n            <div class=\"divider\"></div>\n            <div class=\"section\">\n              <div><span>Order</span><span>".concat(order.id.slice(-6).toUpperCase(), "</span></div>\n              <div><span>Date</span><span>").concat(new Date().toLocaleString('en-GH'), "</span></div>\n              <div><span>Type</span><span>").concat(order.channel.replace('_', ' '), "</span></div>\n              <div><span>Name</span><span>").concat(((_a = order.customer) === null || _a === void 0 ? void 0 : _a.name) || order.guestName || 'Guest', "</span></div>\n              ").concat(order.receiptUrl ? "<div><span>Receipt</span><span>Yes</span></div>" : '', "\n            </div>\n            <div class=\"divider\"></div>\n            <table>\n              <thead>\n                <tr>\n                  <th>Item</th>\n                  <th class=\"qty\">Qty</th>\n                  <th class=\"price\">Price</th>\n                  <th class=\"total\">Total</th>\n                </tr>\n              </thead>\n              <tbody>\n                ").concat(itemsHtml, "\n              </tbody>\n            </table>\n            <div class=\"divider\"></div>\n            <div class=\"totals\">\n              <div><span>Subtotal</span><span>").concat((0, utils_1.formatCurrency)(order.total), "</span></div>\n              <div><span>Status</span><span>").concat(order.status, "</span></div>\n              <div><span>Paid at</span><span>").concat(order.paidAt ? new Date(order.paidAt).toLocaleString('en-GH') : 'N/A', "</span></div>\n            </div>\n            <div class=\"divider\"></div>\n            <div class=\"footer\">\n              <div class=\"receipt-note\">Thank you for dining with Crave & Co. Visit us again!</div>\n              <div class=\"small\">Powered by Crave & Co. Restaurant | www.craveandco.com</div>\n            </div>\n          </div>\n        </body>\n      </html>");
    };
    var printReceiptForOrder = function (order) {
        var printWindow = window.open('', '_blank');
        if (!printWindow) {
            showAlert('error', 'Unable to open receipt printer.');
            return;
        }
        printWindow.document.write(getReceiptHtml(order));
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };
    var loadOrderInternal = function (order) {
        setActiveOrderId(order.id);
        setCart(order.items.map(function (i) {
            var _a;
            return ({
                menuItemId: i.menuItemId,
                name: ((_a = i.menuItem) === null || _a === void 0 ? void 0 : _a.name) || '',
                price: Number(i.unitPrice),
                quantity: i.quantity,
                notes: i.notes,
            });
        }));
        setSelectedCustomer(order.customer || null);
        setGuestName(order.guestName || '');
        setView('pos');
        setConfirmAction(null);
    };
    var createOrder = function () { return __awaiter(_this, void 0, void 0, function () {
        var order, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!token || !user || cart.length === 0)
                        return [2 /*return*/];
                    setSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, (0, api_1.post)('/api/v1/orders', {
                            branchId: user.branchId,
                            channel: channel,
                            customerId: selectedCustomer === null || selectedCustomer === void 0 ? void 0 : selectedCustomer.id,
                            guestName: selectedCustomer ? undefined : guestName.trim() || undefined,
                            items: cart.map(function (c) { return ({ menuItemId: c.menuItemId, quantity: c.quantity, notes: c.notes }); }),
                        }, token)];
                case 2:
                    order = _a.sent();
                    setActiveOrderId(order.id);
                    setCart([]);
                    setSelectedCustomer(null);
                    setGuestName('');
                    return [4 /*yield*/, fetchData()];
                case 3:
                    _a.sent();
                    showAlert('success', 'Order created. Ready for payment.');
                    return [3 /*break*/, 6];
                case 4:
                    err_2 = _a.sent();
                    console.error('Failed to create order', err_2);
                    showAlert('error', 'Failed to create order. Please try again.');
                    return [3 /*break*/, 6];
                case 5:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var payOrder = function (paymentType) { return __awaiter(_this, void 0, void 0, function () {
        var paidOrder, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!token || !activeOrderId)
                        return [2 /*return*/];
                    setSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, (0, api_1.post)("/api/v1/orders/".concat(activeOrderId, "/pay"), {
                            paymentMethod: paymentType.method,
                            paymentLabel: paymentType.name,
                            receiptUrl: receiptReference.trim() || undefined,
                            redeemPoints: useLoyaltyDiscount ? 100 : undefined,
                        }, token)];
                case 2:
                    paidOrder = _a.sent();
                    setShowPayment(false);
                    setActiveOrderId(null);
                    setCart([]);
                    setReceiptReference('');
                    setUseLoyaltyDiscount(false);
                    return [4 /*yield*/, fetchData()];
                case 3:
                    _a.sent();
                    showAlert('success', 'Payment recorded. Order complete.');
                    if (printReceipt) {
                        printReceiptForOrder(paidOrder);
                    }
                    return [3 /*break*/, 6];
                case 4:
                    err_3 = _a.sent();
                    console.error('Failed to pay order', err_3);
                    showAlert('error', 'Failed to process payment. Please retry.');
                    return [3 /*break*/, 6];
                case 5:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var cancelOrder = function (orderId) { return __awaiter(_this, void 0, void 0, function () {
        var err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!token)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, (0, api_1.post)("/api/v1/orders/".concat(orderId, "/cancel"), {}, token)];
                case 2:
                    _a.sent();
                    if (activeOrderId === orderId)
                        setActiveOrderId(null);
                    return [4 /*yield*/, fetchData()];
                case 3:
                    _a.sent();
                    showAlert('info', 'Order cancelled.');
                    return [3 /*break*/, 6];
                case 4:
                    err_4 = _a.sent();
                    console.error('Failed to cancel order', err_4);
                    showAlert('error', 'Unable to cancel order.');
                    return [3 /*break*/, 6];
                case 5:
                    setConfirmAction(null);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var loadOrder = function (order) {
        if (cart.length > 0 && order.id !== activeOrderId) {
            setConfirmAction({ type: 'loadOrder', order: order });
            return;
        }
        loadOrderInternal(order);
    };
    var confirmLoadOrder = function () {
        if ((confirmAction === null || confirmAction === void 0 ? void 0 : confirmAction.type) === 'loadOrder' && confirmAction.order) {
            loadOrderInternal(confirmAction.order);
        }
    };
    var confirmDiscardOrder = function () {
        if ((confirmAction === null || confirmAction === void 0 ? void 0 : confirmAction.type) === 'discard') {
            discardCurrentOrder();
        }
    };
    var confirmCancelOrder = function () {
        if ((confirmAction === null || confirmAction === void 0 ? void 0 : confirmAction.type) === 'cancelOrder' && confirmAction.orderId) {
            cancelOrder(confirmAction.orderId);
        }
    };
    var createCustomer = function () { return __awaiter(_this, void 0, void 0, function () {
        var customer_1, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!token || !newCustomerName.trim())
                        return [2 /*return*/];
                    setSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, api_1.post)('/api/v1/customers', {
                            name: newCustomerName.trim(),
                            phone: newCustomerPhone.trim() || undefined,
                        }, token)];
                case 2:
                    customer_1 = _a.sent();
                    setSelectedCustomer(customer_1);
                    setCustomers(function (prev) { return __spreadArray(__spreadArray([], prev, true), [customer_1], false); });
                    setShowNewCustomer(false);
                    setShowCustomerSearch(false);
                    setNewCustomerName('');
                    setNewCustomerPhone('');
                    showAlert('success', 'Customer added to order.');
                    return [3 /*break*/, 5];
                case 3:
                    err_5 = _a.sent();
                    console.error('Failed to create customer', err_5);
                    showAlert('error', 'Failed to add customer.');
                    return [3 /*break*/, 5];
                case 4:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /* ─── Filtering ─── */
    var filteredItems = menuItems.filter(function (item) {
        var _a;
        if (activeCategory && ((_a = item.category) === null || _a === void 0 ? void 0 : _a.id) !== activeCategory)
            return false;
        if (search && !item.name.toLowerCase().includes(search.toLowerCase()))
            return false;
        return true;
    });
    var filteredCustomers = customers.filter(function (c) {
        return c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            (c.phone && c.phone.includes(customerSearch));
    });
    /* ─── Render ─── */
    if (loading) {
        return (<div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold"/>
      </div>);
    }
    return (<div className="h-[calc(100vh-5rem)] lg:h-[calc(100vh-3rem)] flex flex-col min-h-0 pb-20 lg:pb-0">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-surface-base/95 backdrop-blur-sm flex items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-text-primary hidden sm:block">POS</h1>
          <div className="flex bg-surface-elevated rounded-xl p-0.5">
            <button onClick={function () { return setView('pos'); }} className={"px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ".concat(view === 'pos' ? 'bg-surface-raised text-gold shadow-sm' : 'text-text-secondary')}>
              New Order
            </button>
            <button onClick={function () { return setView('orders'); }} className={"px-3 py-1.5 text-xs font-semibold rounded-lg transition-all relative ".concat(view === 'orders' ? 'bg-surface-raised text-gold shadow-sm' : 'text-text-secondary')}>
              Open Orders
              {openOrders.length > 0 && (<span className="absolute -top-1 -right-1 bg-gold text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {openOrders.length}
                </span>)}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Channel selector */}
          <select value={channel} onChange={function (e) { return setChannel(e.target.value); }} className="rounded-xl border border-border-default bg-surface-raised px-3 py-2 text-xs font-medium text-text-secondary focus:border-gold focus:ring-2 focus:ring-gold outline-none">
            <option value="DINE_IN">Dine-In</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DELIVERY">Delivery</option>
            <option value="PHONE">Phone</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>
      </div>

      {alert && (<div className={"px-4 py-3 rounded-2xl mb-3 mx-4 text-sm font-semibold ".concat(alert.type === 'success' ? 'bg-success-muted text-success border border-success' :
                alert.type === 'error' ? 'bg-error-muted text-error border border-error' :
                    'bg-info-muted text-info border border-info')}>
          {alert.message}
        </div>)}

      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface-raised/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={function () { return setView('pos'); }} className={"flex-1 min-w-[110px] rounded-2xl border px-3 py-2 text-xs font-semibold transition-all ".concat(view === 'pos' ? 'bg-gold text-white shadow-sm' : 'bg-surface-elevated text-text-secondary')}>
            New Order
          </button>
          <button onClick={function () { return setView('orders'); }} className={"flex-1 min-w-[110px] rounded-2xl border px-3 py-2 text-xs font-semibold transition-all relative ".concat(view === 'orders' ? 'bg-gold text-white shadow-sm' : 'bg-surface-elevated text-text-secondary')}>
            Open Orders
            {openOrders.length > 0 && (<span className="absolute -top-1 -right-2 bg-white text-gold text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                {openOrders.length}
              </span>)}
          </button>
        </div>
      </div>

      {view === 'orders' ? (
        /* ─── Open Orders View ─── */
        <div className="flex-1 overflow-y-auto py-4 lg:pb-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {openOrders.map(function (order) { return (<div key={order.id} className="bg-surface-raised rounded-2xl border border-border-subtle shadow-sm p-4 hover:shadow-md transition-all cursor-pointer" onClick={function () { return loadOrder(order); }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-gold-muted text-gold text-[10px] font-bold px-2 py-0.5 rounded-full">
                      #{order.id.slice(-4).toUpperCase()}
                    </span>
                    <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full ".concat(order.status === 'NEW' ? 'bg-info-muted text-info'
                    : order.status === 'PREPARING' ? 'bg-amber-100 text-amber-700'
                        : order.status === 'READY' ? 'bg-success-muted text-success'
                            : 'bg-surface-elevated text-text-secondary')}>
                      {order.status}
                    </span>
                    <span className="text-[10px] text-text-tertiary">
                      {order.channel.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-text-tertiary">{(0, utils_1.formatTime)(order.createdAt)}</span>
                </div>
                {(order.customer || order.guestName || order.receiptUrl) && (<p className="text-xs text-text-secondary mb-2 flex flex-wrap items-center gap-1">
                    <lucide_react_1.User size={12}/> {order.customer ? order.customer.name : order.guestName || 'Guest'}
                    {order.receiptUrl && (<span className="rounded-full bg-success-muted px-2 py-0.5 text-[10px] font-semibold text-success">
                        Receipt available
                      </span>)}
                  </p>)}
                <div className="space-y-1 mb-3">
                  {order.items.slice(0, 3).map(function (item, idx) {
                    var _a;
                    return (<p key={idx} className="text-xs text-text-secondary">
                      {item.quantity}× {(_a = item.menuItem) === null || _a === void 0 ? void 0 : _a.name}
                    </p>);
                })}
                  {order.items.length > 3 && (<p className="text-xs text-text-tertiary">+{order.items.length - 3} more</p>)}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                  <span className="text-sm font-bold text-gold">{(0, utils_1.formatCurrency)(Number(order.total))}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={function (e) { e.stopPropagation(); setConfirmAction({ type: 'cancelOrder', orderId: order.id }); }} className="text-error hover:text-error p-1">
                      <lucide_react_1.Trash2 size={14}/>
                    </button>
                    <lucide_react_1.ChevronRight size={14} className="text-text-tertiary"/>
                  </div>
                </div>
              </div>); })}
            {openOrders.length === 0 && (<div className="col-span-full text-center py-16 text-text-tertiary">
                <lucide_react_1.Receipt size={48} className="mx-auto mb-3 opacity-30"/>
                <p className="text-sm">No open orders</p>
              </div>)}
          </div>
        </div>) : (
        /* ─── POS View ─── */
        <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden min-h-0 lg:pb-0">
          {/* Menu Section */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Search + Categories */}
            <div className="py-3 space-y-2">
              <div className="relative">
                <lucide_react_1.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"/>
                <input ref={searchInputRef} type="text" value={search} onChange={function (e) { return setSearch(e.target.value); }} placeholder="Search menu..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"/>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button onClick={function () { return setActiveCategory(''); }} className={"px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ".concat(!activeCategory ? 'bg-gold text-white shadow-sm' : 'bg-surface-elevated text-text-secondary')}>
                  All
                </button>
                {categories.map(function (c) { return (<button key={c.id} onClick={function () { return setActiveCategory(c.id); }} className={"px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ".concat(activeCategory === c.id ? 'bg-gold text-white shadow-sm' : 'bg-surface-elevated text-text-secondary')}>
                    {c.name}
                  </button>); })}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 content-start pb-4">
              {filteredItems.map(function (item) {
                var _a;
                var inCart = cart.find(function (c) { return c.menuItemId === item.id; });
                return (<button key={item.id} onClick={function () { return addToCart(item); }} className={"relative flex min-h-[100px] sm:min-h-[115px] md:min-h-[125px] flex-col justify-between overflow-hidden bg-surface-raised rounded-[22px] border border-border-subtle p-3 sm:p-4 text-left transition-all duration-200 hover:border-gold hover:shadow-lg active:-translate-y-0.5 ".concat(inCart ? 'border-gold shadow-sm ring-1 ring-gold' : '')}>
                    {inCart && (<span className="absolute top-3 right-3 z-10 bg-gold text-white text-[11px] font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-white">
                        {inCart.quantity}
                      </span>)}
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-text-primary leading-tight line-clamp-3">{item.name}</p>
                      <p className="text-[11px] text-text-tertiary">{(_a = item.category) === null || _a === void 0 ? void 0 : _a.name}</p>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-gold">{(0, utils_1.formatCurrency)(Number(item.price))}</p>
                  </button>);
            })}
              {filteredItems.length === 0 && (<div className="col-span-full text-center py-12 text-text-tertiary text-sm">
                  No items found
                </div>)}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:w-80 xl:w-96 bg-surface-raised lg:border-l border-t lg:border-t-0 border-border-subtle flex flex-col min-h-0 max-h-[45vh] lg:max-h-none overflow-hidden">
            {/* Cart Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <lucide_react_1.ShoppingCart size={16} className="text-gold"/>
                <span className="text-sm font-semibold text-text-primary">
                  Cart {cartCount > 0 && <span className="text-gold">({cartCount})</span>}
                </span>
              </div>
              {activeOrderId && (<span className="bg-info-muted text-info text-[10px] font-bold px-2 py-0.5 rounded-full">
                  #{activeOrderId.slice(-4).toUpperCase()}
                </span>)}
            </div>

            {/* Customer */}
            <div className="px-4 py-2 border-b border-border-subtle">
              {selectedCustomer ? (<div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gold-muted flex items-center justify-center">
                      <lucide_react_1.User size={12} className="text-gold"/>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{selectedCustomer.name}</p>
                      {selectedCustomer.phone && <p className="text-[10px] text-text-tertiary">{selectedCustomer.phone}</p>}
                      <p className="text-[10px] text-text-tertiary">{(_a = selectedCustomer.loyaltyPoints) !== null && _a !== void 0 ? _a : 0} pts</p>
                    </div>
                  </div>
                  <button onClick={function () { return setSelectedCustomer(null); }} className="text-text-tertiary hover:text-text-secondary">
                    <lucide_react_1.X size={14}/>
                  </button>
                </div>) : (<div className="space-y-2">
                  <input type="text" value={guestName} onChange={function (e) { return setGuestName(e.target.value); }} placeholder="Order name or guest name" className="w-full px-3 py-2 rounded-xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"/>
                  <button onClick={function () { return setShowCustomerSearch(true); }} className="flex items-center gap-2 text-xs text-text-tertiary hover:text-gold py-1 w-full">
                    <lucide_react_1.User size={14}/>
                    <span>Assign customer to order (optional)</span>
                  </button>
                  <p className="text-[10px] text-text-tertiary">
                    You can give the order a name even without a registered customer.
                  </p>
                </div>)}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (<div className="flex flex-col items-center justify-center py-8 text-text-tertiary">
                  <lucide_react_1.ShoppingCart size={32} className="mb-2 opacity-30"/>
                  <p className="text-xs">Tap items to add</p>
                </div>) : (<div className="py-2">
                  {cart.map(function (item) { return (<div key={item.menuItemId} className="flex items-center gap-2 px-4 py-2 hover:bg-surface-base transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{item.name}</p>
                        <p className="text-[10px] text-text-tertiary">{(0, utils_1.formatCurrency)(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={function () { return updateQuantity(item.menuItemId, -1); }} className="w-6 h-6 rounded-lg bg-surface-elevated hover:bg-surface-elevated flex items-center justify-center transition-colors">
                          <lucide_react_1.Minus size={12}/>
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-text-primary">{item.quantity}</span>
                        <button onClick={function () { return updateQuantity(item.menuItemId, 1); }} className="w-6 h-6 rounded-lg bg-gold-muted hover:bg-gold-muted text-gold flex items-center justify-center transition-colors">
                          <lucide_react_1.Plus size={12}/>
                        </button>
                      </div>
                      <p className="text-xs font-bold text-text-primary w-16 text-right">{(0, utils_1.formatCurrency)(item.price * item.quantity)}</p>
                      <button onClick={function () { return removeFromCart(item.menuItemId); }} className="text-text-tertiary hover:text-error transition-colors">
                        <lucide_react_1.Trash2 size={12}/>
                      </button>
                    </div>); })}
                </div>)}
            </div>

            {/* Cart Footer */}
            <div className="border-t border-border-subtle px-4 py-3 space-y-2 bg-surface-base/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-secondary">Total</span>
                <span className="text-lg font-bold text-text-primary">{(0, utils_1.formatCurrency)(cartTotal)}</span>
              </div>

              {!activeOrderId ? (<button onClick={createOrder} disabled={cart.length === 0 || saving} className="w-full py-3 rounded-xl bg-gold text-white font-semibold text-sm hover:bg-gold-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                  {saving ? (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"/>) : (<>
                      <lucide_react_1.Receipt size={16}/>
                      Place Order
                    </>)}
                </button>) : (<div className="flex gap-2">
                  <button onClick={function () { return setShowPayment(true); }} className="flex-1 py-3 rounded-xl bg-success text-white font-semibold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2">
                    <lucide_react_1.CreditCard size={16}/>
                    Pay
                  </button>
                  <button onClick={function () { return setConfirmAction({ type: 'discard' }); }} className="px-4 py-3 rounded-xl bg-surface-elevated text-text-secondary font-semibold text-sm hover:bg-surface-elevated transition-all">
                    Start new order
                  </button>
                </div>)}
            </div>
          </div>
        </div>)}

      {confirmAction && (<div className="fixed inset-0 bg-white/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-surface-raised rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Start new order</h2>
                <p className="text-sm text-text-secondary mt-1">
                  {confirmAction.type === 'discard' && 'Clear the current cart and begin a fresh order?'}
                  {confirmAction.type === 'loadOrder' && 'Load this open order? Your current cart will be replaced.'}
                  {confirmAction.type === 'cancelOrder' && 'Cancel this open order? This cannot be undone.'}
                </p>
              </div>
              <button onClick={function () { return setConfirmAction(null); }} className="text-text-tertiary hover:text-text-secondary p-2">
                <lucide_react_1.X size={20}/>
              </button>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={function () { return setConfirmAction(null); }} className="flex-1 py-3 rounded-xl bg-surface-elevated text-text-secondary font-semibold text-sm">
                Cancel
              </button>
              <button onClick={function () {
                if (confirmAction.type === 'discard')
                    confirmDiscardOrder();
                if (confirmAction.type === 'loadOrder')
                    confirmLoadOrder();
                if (confirmAction.type === 'cancelOrder')
                    confirmCancelOrder();
            }} className="flex-1 py-3 rounded-xl bg-gold text-white font-semibold text-sm hover:bg-gold-dark">
                Confirm
              </button>
            </div>
          </div>
        </div>)}

      {/* ─── Payment Modal ─── */}
      {showPayment && (<div className="fixed inset-0 bg-white/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-surface-raised rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Select Payment</h2>
                <p className="text-sm text-text-tertiary mt-0.5">
                  Total: {(0, utils_1.formatCurrency)(cartTotal || 0)}
                  {useLoyaltyDiscount && (<span className="block text-success">Final: {(0, utils_1.formatCurrency)(discountedTotal)}</span>)}
                </p>
              </div>
              <button onClick={function () { return setShowPayment(false); }} className="text-text-tertiary hover:text-text-secondary p-2">
                <lucide_react_1.X size={20}/>
              </button>
            </div>
            <div className="px-6 space-y-3 pb-4">
              <input type="text" value={receiptReference} onChange={function (e) { return setReceiptReference(e.target.value); }} placeholder="Receipt link / reference (optional)" className="w-full px-4 py-3 rounded-2xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"/>
              <label className="flex items-center gap-3 text-sm text-text-secondary">
                <input type="checkbox" checked={printReceipt} onChange={function (e) { return setPrintReceipt(e.target.checked); }} className="w-4 h-4 rounded border border-border-default text-gold focus:ring-gold"/>
                Print receipt after payment
              </label>

              <div className="rounded-3xl border border-border-default bg-surface-base p-4 text-sm text-text-secondary">
                {selectedCustomer ? (<>
                    <p className="font-semibold text-text-primary">Loyalty points</p>
                    <p>{loyaltyBalance !== null && loyaltyBalance !== void 0 ? loyaltyBalance : 0} points available for {selectedCustomer.name}</p>
                    {loyaltyBalance !== null && loyaltyBalance >= 100 ? (<label className="flex items-center gap-3 mt-3">
                        <input type="checkbox" checked={useLoyaltyDiscount} onChange={function (e) { return setUseLoyaltyDiscount(e.target.checked); }} className="w-4 h-4 rounded border border-border-default text-gold focus:ring-gold"/>
                        <span>
                          Redeem 100 points for 5% off this order
                          {useLoyaltyDiscount && (<strong className="text-text-primary"> (save {(0, utils_1.formatCurrency)(discountAmount)})</strong>)}
                        </span>
                      </label>) : (<p className="mt-2 text-xs text-text-tertiary">
                        {loyaltyBalance === null ? 'Loading loyalty balance...' : 'Customer needs at least 100 points to redeem.'}
                      </p>)}
                  </>) : (<p>Select a customer to enable loyalty discounts.</p>)}
              </div>
            </div>
            <div className="px-6 pb-6 grid grid-cols-2 gap-3">
              {paymentTypes.map(function (pt) { return (<button key={pt.id} onClick={function () { return payOrder(pt); }} disabled={saving} className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border-subtle hover:border-gold hover:bg-gold-muted transition-all active:scale-95">
                  <lucide_react_1.CreditCard size={24} className="text-gold"/>
                  <span className="text-sm font-semibold text-text-primary">{pt.name}</span>
                </button>); })}
              {paymentTypes.length === 0 && (<div className="col-span-2 text-center py-8 text-text-tertiary text-sm">
                  No payment types configured.<br />Ask admin to set up payment types.
                </div>)}
            </div>
          </div>
        </div>)}

      {/* ─── Customer Search Modal ─── */}
      {showCustomerSearch && (<div className="fixed inset-0 bg-white/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-surface-raised rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <h2 className="text-lg font-bold text-text-primary">Select Customer</h2>
              <button onClick={function () { setShowCustomerSearch(false); setCustomerSearch(''); }} className="text-text-tertiary hover:text-text-secondary p-2">
                <lucide_react_1.X size={20}/>
              </button>
            </div>
            <div className="px-6 pb-3">
              <div className="relative">
                <lucide_react_1.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"/>
                <input autoFocus type="text" value={customerSearch} onChange={function (e) { return setCustomerSearch(e.target.value); }} placeholder="Search by name or phone..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"/>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 space-y-1 pb-3">
              {filteredCustomers.slice(0, 20).map(function (c) {
                var _a;
                return (<button key={c.id} onClick={function () { setSelectedCustomer(c); setShowCustomerSearch(false); setCustomerSearch(''); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gold-muted transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center">
                    <lucide_react_1.User size={14} className="text-text-secondary"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{c.name}</p>
                    <div className="text-xs text-text-tertiary flex flex-wrap gap-2">
                      {c.phone && <span>{c.phone}</span>}
                      <span>{(_a = c.loyaltyPoints) !== null && _a !== void 0 ? _a : 0} pts</span>
                    </div>
                  </div>
                </button>);
            })}
            </div>
            <div className="px-6 pb-6 border-t border-border-subtle pt-3">
              <button onClick={function () { return setShowNewCustomer(true); }} className="w-full py-2.5 rounded-xl border-2 border-dashed border-border-default text-gold font-semibold text-sm hover:bg-gold-muted transition-all flex items-center justify-center gap-2">
                <lucide_react_1.Plus size={16}/> New Customer
              </button>
            </div>
          </div>
        </div>)}

      {/* ─── New Customer Modal ─── */}
      {showNewCustomer && (<div className="fixed inset-0 bg-white/50 z-[60] flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-surface-raised rounded-t-3xl lg:rounded-3xl w-full lg:max-w-sm p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">New Customer</h2>
            <div className="space-y-3">
              <input autoFocus type="text" value={newCustomerName} onChange={function (e) { return setNewCustomerName(e.target.value); }} placeholder="Customer name *" className="w-full px-4 py-2.5 rounded-xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"/>
              <input type="tel" value={newCustomerPhone} onChange={function (e) { return setNewCustomerPhone(e.target.value); }} placeholder="Phone number" className="w-full px-4 py-2.5 rounded-xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"/>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={function () { setShowNewCustomer(false); setNewCustomerName(''); setNewCustomerPhone(''); }} className="flex-1 py-2.5 rounded-xl bg-surface-elevated text-text-secondary font-semibold text-sm">
                Cancel
              </button>
              <button onClick={createCustomer} disabled={!newCustomerName.trim() || saving} className="flex-1 py-2.5 rounded-xl bg-gold text-white font-semibold text-sm hover:bg-gold-dark disabled:opacity-40 transition-all">
                Save
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
