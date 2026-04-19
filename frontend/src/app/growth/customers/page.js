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
exports.default = GrowthCustomersPage;
var react_1 = require("react");
var auth_1 = require("@/lib/auth");
var api_1 = require("@/lib/api");
var utils_1 = require("@/lib/utils");
var card_1 = require("@/components/ui/card");
var kpi_card_1 = require("@/components/ui/kpi-card");
var button_1 = require("@/components/ui/button");
var pagination_1 = require("@/components/ui/pagination");
var utils_2 = require("@/lib/utils");
var lucide_react_1 = require("lucide-react");
function GrowthCustomersPage() {
    var _this = this;
    var token = (0, auth_1.useAuth)().token;
    var _a = (0, react_1.useState)([]), customers = _a[0], setCustomers = _a[1];
    var _b = (0, react_1.useState)(null), dashboard = _b[0], setDashboard = _b[1];
    var _c = (0, react_1.useState)(''), search = _c[0], setSearch = _c[1];
    var _d = (0, react_1.useState)(true), loading = _d[0], setLoading = _d[1];
    var _e = (0, react_1.useState)(0), page = _e[0], setPage = _e[1];
    var _f = (0, react_1.useState)(10), limit = _f[0], setLimit = _f[1];
    var _g = (0, react_1.useState)(false), showNew = _g[0], setShowNew = _g[1];
    var _h = (0, react_1.useState)(false), saving = _h[0], setSaving = _h[1];
    var _j = (0, react_1.useState)(''), newName = _j[0], setNewName = _j[1];
    var _k = (0, react_1.useState)(''), newPhone = _k[0], setNewPhone = _k[1];
    var _l = (0, react_1.useState)(''), newEmail = _l[0], setNewEmail = _l[1];
    var _m = (0, react_1.useState)(''), error = _m[0], setError = _m[1];
    var fetchData = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, c, d, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!token)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, Promise.all([
                            (0, api_1.get)("/api/v1/customers".concat((0, utils_1.buildQueryString)({ page: page, limit: limit })), token),
                            (0, api_1.get)('/api/v1/customers/dashboard', token),
                        ])];
                case 2:
                    _a = _b.sent(), c = _a[0], d = _a[1];
                    setCustomers(c);
                    setDashboard(d);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _b.sent();
                    console.error(err_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () { fetchData(); }, [token, page, limit]);
    var handleCreate = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!token || !newName.trim())
                        return [2 /*return*/];
                    setSaving(true);
                    setError('');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, (0, api_1.post)('/api/v1/customers', {
                            name: newName.trim(),
                            phone: newPhone.trim() || undefined,
                            email: newEmail.trim() || undefined,
                        }, token)];
                case 2:
                    _a.sent();
                    setNewName('');
                    setNewPhone('');
                    setNewEmail('');
                    setShowNew(false);
                    return [4 /*yield*/, fetchData()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    err_2 = _a.sent();
                    setError(err_2.message || 'Failed to create customer');
                    return [3 /*break*/, 6];
                case 5:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var filtered = search
        ? customers.filter(function (c) {
            return c.name.toLowerCase().includes(search.toLowerCase()) ||
                (c.phone && c.phone.includes(search));
        })
        : customers;
    if (loading) {
        return (<div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"/>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <lucide_react_1.Users className="text-gold"/> Customers
        </h1>
        <button_1.Button onClick={function () { return setShowNew(true); }}>
          <lucide_react_1.Plus size={16}/> Add Customer
        </button_1.Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <kpi_card_1.KPICard title="Total" value={(dashboard === null || dashboard === void 0 ? void 0 : dashboard.total) || 0} icon={<lucide_react_1.Users size={20}/>}/>
        <kpi_card_1.KPICard title="New This Week" value={(dashboard === null || dashboard === void 0 ? void 0 : dashboard.newThisWeek) || 0} icon={<lucide_react_1.UserPlus size={20}/>} severity="healthy"/>
        <kpi_card_1.KPICard title="Active" value={(dashboard === null || dashboard === void 0 ? void 0 : dashboard.activeThisMonth) || 0} icon={<lucide_react_1.Users size={20}/>} severity="healthy"/>
        <kpi_card_1.KPICard title="At Risk" value={(dashboard === null || dashboard === void 0 ? void 0 : dashboard.churnRisk) || 0} icon={<lucide_react_1.Users size={20}/>} severity={(dashboard === null || dashboard === void 0 ? void 0 : dashboard.churnRisk) ? 'warning' : 'healthy'}/>
        <kpi_card_1.KPICard title="Total Spend" value={(dashboard === null || dashboard === void 0 ? void 0 : dashboard.totalSpend) || 0} icon={<lucide_react_1.DollarSign size={20}/>} isCurrency/>
        <kpi_card_1.KPICard title="Visits" value={(dashboard === null || dashboard === void 0 ? void 0 : dashboard.totalVisits) || 0} icon={<lucide_react_1.TrendingUp size={20}/>}/>
      </div>

      <div className="relative">
        <lucide_react_1.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"/>
        <input type="text" placeholder="Search by name or phone..." value={search} onChange={function (e) { return setSearch(e.target.value); }} className="w-full pl-10 pr-4 py-2.5 border border-border-default rounded-xl text-sm text-text-primary focus:ring-2 focus:ring-gold focus:border-gold outline-none"/>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <card_1.Card>
          <card_1.CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-text-secondary">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Visits</th>
                    <th className="px-4 py-3 font-medium">Points</th>
                    <th className="px-4 py-3 font-medium">Total Spent</th>
                    <th className="px-4 py-3 font-medium">Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(function (c) {
            var _a;
            return (<tr key={c.id} className="border-b last:border-0 hover:bg-gold-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-text-primary">{c.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{c.phone || '—'}</td>
                      <td className="px-4 py-3">{c.visitCount}</td>
                      <td className="px-4 py-3">{(_a = c.loyaltyPoints) !== null && _a !== void 0 ? _a : 0}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{(0, utils_2.formatCurrency)(Number(c.totalSpend))}</td>
                      <td className="px-4 py-3 text-text-tertiary">
                        {c.lastSeenAt ? (0, utils_2.formatDate)(c.lastSeenAt) : '—'}
                      </td>
                    </tr>);
        })}
                </tbody>
              </table>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {filtered.map(function (c) {
            var _a;
            return (<div key={c.id} className="bg-surface-raised rounded-2xl border border-border-subtle p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-text-primary">{c.name}</p>
              <span className="text-sm font-bold text-gold">{(0, utils_2.formatCurrency)(Number(c.totalSpend))}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
              {c.phone && <span className="flex items-center gap-1"><lucide_react_1.Phone size={10}/> {c.phone}</span>}
              <span>{c.visitCount} visits</span>
              <span>{(_a = c.loyaltyPoints) !== null && _a !== void 0 ? _a : 0} pts</span>
              {c.lastSeenAt && <span>Last: {(0, utils_2.formatDate)(c.lastSeenAt)}</span>}
            </div>
          </div>);
        })}
        {filtered.length === 0 && (<div className="text-center py-12 text-text-tertiary text-sm">No customers found</div>)}
      </div>

      <pagination_1.PaginationControls page={page} limit={limit} onPageChange={setPage} onLimitChange={function (value) { setLimit(value); setPage(0); }} hasMore={customers.length === limit}/>

      {/* New Customer Modal */}
      {showNew && (<div className="fixed inset-0 bg-white/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface-raised rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">New Customer</h2>
              <button onClick={function () { setShowNew(false); setError(''); }} className="text-text-tertiary hover:text-text-secondary p-1">
                <lucide_react_1.X size={20}/>
              </button>
            </div>
            {error && <div className="mb-3 rounded-xl bg-error-muted p-3 text-sm text-error">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-3">
              <input autoFocus type="text" value={newName} onChange={function (e) { return setNewName(e.target.value); }} required placeholder="Customer name *" className="w-full px-4 py-3 rounded-2xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"/>
              <input type="tel" value={newPhone} onChange={function (e) { return setNewPhone(e.target.value); }} placeholder="Phone number" className="w-full px-4 py-3 rounded-2xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"/>
              <input type="email" value={newEmail} onChange={function (e) { return setNewEmail(e.target.value); }} placeholder="Email address" className="w-full px-4 py-3 rounded-2xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"/>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={function () { setShowNew(false); setError(''); }} className="flex-1 py-3 rounded-xl bg-surface-elevated text-text-secondary font-semibold text-sm">
                  Cancel
                </button>
                <button_1.Button type="submit" loading={saving} className="flex-1">
                  Save
                </button_1.Button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
