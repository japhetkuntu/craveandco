'use client';
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GrowthLoyaltyPage;
var react_1 = require("react");
var auth_1 = require("@/lib/auth");
var api_1 = require("@/lib/api");
var utils_1 = require("@/lib/utils");
var card_1 = require("@/components/ui/card");
var kpi_card_1 = require("@/components/ui/kpi-card");
var pagination_1 = require("@/components/ui/pagination");
var input_1 = require("@/components/ui/input");
var modal_1 = require("@/components/ui/modal");
var button_1 = require("@/components/ui/button");
var lucide_react_1 = require("lucide-react");
function GrowthLoyaltyPage() {
    var _this = this;
    var token = (0, auth_1.useAuth)().token;
    var _a = (0, react_1.useState)(null), summary = _a[0], setSummary = _a[1];
    var _b = (0, react_1.useState)([]), transactions = _b[0], setTransactions = _b[1];
    var _c = (0, react_1.useState)([]), customers = _c[0], setCustomers = _c[1];
    var _d = (0, react_1.useState)(true), loading = _d[0], setLoading = _d[1];
    var _e = (0, react_1.useState)(0), page = _e[0], setPage = _e[1];
    var _f = (0, react_1.useState)(10), limit = _f[0], setLimit = _f[1];
    var _g = (0, react_1.useState)(false), showTransactionModal = _g[0], setShowTransactionModal = _g[1];
    var _h = (0, react_1.useState)(''), transactionCustomerId = _h[0], setTransactionCustomerId = _h[1];
    var _j = (0, react_1.useState)('EARN'), transactionType = _j[0], setTransactionType = _j[1];
    var _k = (0, react_1.useState)(0), transactionPoints = _k[0], setTransactionPoints = _k[1];
    var _l = (0, react_1.useState)(''), transactionReference = _l[0], setTransactionReference = _l[1];
    var _m = (0, react_1.useState)(''), transactionError = _m[0], setTransactionError = _m[1];
    var _o = (0, react_1.useState)(false), creatingTransaction = _o[0], setCreatingTransaction = _o[1];
    (0, react_1.useEffect)(function () {
        if (!token)
            return;
        setLoading(true);
        Promise.all([
            (0, api_1.get)('/api/v1/loyalty/summary', token),
            (0, api_1.get)("/api/v1/loyalty/transactions".concat((0, utils_1.buildQueryString)({ page: page, limit: limit })), token),
            (0, api_1.get)('/api/v1/customers?limit=50', token),
        ])
            .then(function (_a) {
            var s = _a[0], t = _a[1], c = _a[2];
            setSummary(s);
            setTransactions(t);
            setCustomers(c || []);
            if (!transactionCustomerId && Array.isArray(c) && c.length > 0) {
                setTransactionCustomerId(c[0].id);
            }
        })
            .catch(console.error)
            .finally(function () { return setLoading(false); });
    }, [token, page, limit]);
    (0, react_1.useEffect)(function () {
        if (!token)
            return;
        (0, api_1.get)('/api/v1/customers?limit=50', token)
            .then(function (c) {
            var customerOptions = Array.isArray(c)
                ? c.map(function (customer) { return ({ id: customer.id, name: customer.name, loyaltyPoints: customer.loyaltyPoints }); })
                : [];
            setCustomers(customerOptions);
            if (!transactionCustomerId && customerOptions.length > 0) {
                setTransactionCustomerId(customerOptions[0].id);
            }
        })
            .catch(console.error);
    }, [token, transactionCustomerId]);
    var fetchData = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, s, t, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!token)
                        return [2 /*return*/];
                    setLoading(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, Promise.all([
                            (0, api_1.get)('/api/v1/loyalty/summary', token),
                            (0, api_1.get)("/api/v1/loyalty/transactions".concat((0, utils_1.buildQueryString)({ page: page, limit: limit })), token),
                        ])];
                case 2:
                    _a = _b.sent(), s = _a[0], t = _a[1];
                    setSummary(s);
                    setTransactions(t);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _b.sent();
                    console.error(error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleCreateTransaction = function (event) { return __awaiter(_this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event.preventDefault();
                    if (!token)
                        return [2 /*return*/];
                    if (!transactionCustomerId) {
                        setTransactionError('Select a customer');
                        return [2 /*return*/];
                    }
                    if (!transactionPoints || transactionPoints <= 0) {
                        setTransactionError('Enter points greater than zero');
                        return [2 /*return*/];
                    }
                    setCreatingTransaction(true);
                    setTransactionError('');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, (0, api_1.post)('/api/v1/loyalty/transactions', {
                            customerId: transactionCustomerId,
                            type: transactionType,
                            points: transactionPoints,
                            reference: transactionReference || undefined,
                        }, token)];
                case 2:
                    _a.sent();
                    setShowTransactionModal(false);
                    setTransactionPoints(0);
                    setTransactionReference('');
                    return [4 /*yield*/, fetchData()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    error_2 = _a.sent();
                    setTransactionError(error_2.message || 'Failed to create loyalty transaction');
                    return [3 /*break*/, 6];
                case 5:
                    setCreatingTransaction(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var redemptionRate = (summary === null || summary === void 0 ? void 0 : summary.totalEarned)
        ? ((summary.totalRedeemed / summary.totalEarned) * 100).toFixed(1)
        : '0';
    if (loading) {
        return (<div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"/>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <lucide_react_1.HeartHandshake className="text-gold"/> Loyalty Program
        </h1>
        <button_1.Button onClick={function () { return setShowTransactionModal(true); }}>
          Create Loyalty Transaction
        </button_1.Button>
      </div>

      <modal_1.Modal open={showTransactionModal} onClose={function () { return setShowTransactionModal(false); }} title="Create Loyalty Transaction" footer={<>
            <button_1.Button variant="secondary" onClick={function () { return setShowTransactionModal(false); }}>
              Cancel
            </button_1.Button>
            <button_1.Button loading={creatingTransaction} onClick={handleCreateTransaction}>
              Save Transaction
            </button_1.Button>
          </>}>
        <form className="space-y-4" onSubmit={handleCreateTransaction}>
          <div className="space-y-4">
            <label className="block text-sm text-text-secondary">
              Customer
              <select value={transactionCustomerId} onChange={function (e) { return setTransactionCustomerId(e.target.value); }} className="mt-2 w-full rounded-xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none">
                {customers.map(function (customer) { return (<option key={customer.id} value={customer.id}>
                    {customer.name}{customer.loyaltyPoints != null ? " (".concat(customer.loyaltyPoints, " pts)") : ''}
                  </option>); })}
              </select>
            </label>

            <label className="block text-sm text-text-secondary">
              Transaction Type
              <select value={transactionType} onChange={function (e) { return setTransactionType(e.target.value); }} className="mt-2 w-full rounded-xl border border-border-default bg-surface-input px-4 py-3 text-sm text-text-primary outline-none">
                <option value="EARN">Earn Points</option>
                <option value="REDEEM">Redeem Points</option>
              </select>
            </label>

            <input_1.Input label="Points" type="number" min={1} value={transactionPoints} onChange={function (e) { return setTransactionPoints(Number(e.target.value)); }} required/>

            <input_1.Input label="Reference" value={transactionReference} onChange={function (e) { return setTransactionReference(e.target.value); }} placeholder="Order # or campaign reference"/>
            {transactionError && (<p className="text-sm text-error">{transactionError}</p>)}
          </div>
        </form>
      </modal_1.Modal>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <kpi_card_1.KPICard title="Points Issued" value={((summary === null || summary === void 0 ? void 0 : summary.totalEarned) || 0).toLocaleString()} icon={<lucide_react_1.Gift size={20}/>} severity="healthy"/>
        <kpi_card_1.KPICard title="Points Redeemed" value={((summary === null || summary === void 0 ? void 0 : summary.totalRedeemed) || 0).toLocaleString()} icon={<lucide_react_1.Gift size={20}/>} severity="warning"/>
        <kpi_card_1.KPICard title="Outstanding Points" value={((summary === null || summary === void 0 ? void 0 : summary.netOutstanding) || 0).toLocaleString()} icon={<lucide_react_1.HeartHandshake size={20}/>}/>
        <kpi_card_1.KPICard title="Redemption Rate" value={"".concat(redemptionRate, "%")} icon={<lucide_react_1.HeartHandshake size={20}/>}/>
      </div>

      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Recent Transactions</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          {transactions.length === 0 ? (<div className="space-y-4 py-6 text-center text-sm text-text-secondary">
              <p>No loyalty transactions have been recorded yet.</p>
              <p className="text-text-tertiary">
                Loyalty points are created when customers earn or redeem points. Create a loyalty transaction or integrate points via the loyalty module to populate this section.
              </p>
            </div>) : (<>
              <div className="space-y-2">
                {transactions.map(function (tx) {
                var _a;
                return (<div key={tx.id} className="flex items-center justify-between p-3 bg-surface-base rounded-xl">
                    <div className="flex items-center gap-3">
                      {tx.type === 'EARN' ? (<lucide_react_1.ArrowUpRight size={18} className="text-success"/>) : (<lucide_react_1.ArrowDownRight size={18} className="text-gold"/>)}
                      <div>
                        <p className="text-sm font-medium text-text-primary">{(_a = tx.customer) === null || _a === void 0 ? void 0 : _a.name}</p>
                        <p className="text-xs text-text-tertiary">{tx.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={"text-sm font-bold ".concat(tx.type === 'EARN' ? 'text-success' : 'text-gold')}>
                        {tx.type === 'EARN' ? '+' : '-'}{tx.points} pts
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(tx.createdAt).toLocaleDateString('en-GH')}
                      </p>
                    </div>
                  </div>);
            })}
              </div>
              <pagination_1.PaginationControls page={page} limit={limit} onPageChange={setPage} onLimitChange={function (value) { setLimit(value); setPage(0); }} hasMore={transactions.length === limit}/>
            </>)}
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
