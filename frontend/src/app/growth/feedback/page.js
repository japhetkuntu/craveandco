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
exports.default = GrowthFeedbackPage;
var react_1 = require("react");
var auth_1 = require("@/lib/auth");
var api_1 = require("@/lib/api");
var utils_1 = require("@/lib/utils");
var card_1 = require("@/components/ui/card");
var status_badge_1 = require("@/components/ui/status-badge");
var button_1 = require("@/components/ui/button");
var pagination_1 = require("@/components/ui/pagination");
var lucide_react_1 = require("lucide-react");
function GrowthFeedbackPage() {
    var _this = this;
    var token = (0, auth_1.useAuth)().token;
    var _a = (0, react_1.useState)([]), tickets = _a[0], setTickets = _a[1];
    var _b = (0, react_1.useState)([]), customers = _b[0], setCustomers = _b[1];
    var _c = (0, react_1.useState)(true), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)(false), showNew = _d[0], setShowNew = _d[1];
    var _e = (0, react_1.useState)(null), showResolve = _e[0], setShowResolve = _e[1];
    var _f = (0, react_1.useState)(false), saving = _f[0], setSaving = _f[1];
    var _g = (0, react_1.useState)(''), filter = _g[0], setFilter = _g[1];
    var _h = (0, react_1.useState)(0), page = _h[0], setPage = _h[1];
    var _j = (0, react_1.useState)(10), limit = _j[0], setLimit = _j[1];
    // New ticket form
    var _k = (0, react_1.useState)(''), newCustomerId = _k[0], setNewCustomerId = _k[1];
    var _l = (0, react_1.useState)(''), newSubject = _l[0], setNewSubject = _l[1];
    var _m = (0, react_1.useState)(''), newBody = _m[0], setNewBody = _m[1];
    var _o = (0, react_1.useState)(''), resolveText = _o[0], setResolveText = _o[1];
    var fetchData = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, t, c, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!token)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, Promise.all([
                            (0, api_1.get)("/api/v1/feedback/tickets".concat((0, utils_1.buildQueryString)({ page: page, limit: limit })), token),
                            (0, api_1.get)('/api/v1/customers', token),
                        ])];
                case 2:
                    _a = _b.sent(), t = _a[0], c = _a[1];
                    setTickets(t);
                    setCustomers(c);
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
                    if (!token || !newCustomerId || !newSubject.trim())
                        return [2 /*return*/];
                    setSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, (0, api_1.post)('/api/v1/feedback/tickets', {
                            customerId: newCustomerId,
                            subject: newSubject.trim(),
                            body: newBody.trim() || undefined,
                        }, token)];
                case 2:
                    _a.sent();
                    setShowNew(false);
                    setNewCustomerId('');
                    setNewSubject('');
                    setNewBody('');
                    return [4 /*yield*/, fetchData()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    err_2 = _a.sent();
                    console.error(err_2);
                    return [3 /*break*/, 6];
                case 5:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleResolve = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!token || !resolveText.trim())
                        return [2 /*return*/];
                    setSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, (0, api_1.post)("/api/v1/feedback/tickets/".concat(id, "/resolve"), { resolution: resolveText.trim() }, token)];
                case 2:
                    _a.sent();
                    setShowResolve(null);
                    setResolveText('');
                    return [4 /*yield*/, fetchData()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    err_3 = _a.sent();
                    console.error(err_3);
                    return [3 /*break*/, 6];
                case 5:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var filtered = filter
        ? tickets.filter(function (t) { return t.status === filter; })
        : tickets;
    if (loading) {
        return (<div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"/>
      </div>);
    }
    var openCount = tickets.filter(function (t) { return t.status !== 'RESOLVED'; }).length;
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <lucide_react_1.MessageSquare className="text-gold"/> Feedback
          </h1>
          <p className="text-xs text-text-tertiary mt-0.5">{openCount} open tickets</p>
        </div>
        <button_1.Button onClick={function () { return setShowNew(true); }}>
          <lucide_react_1.Plus size={16}/> New Ticket
        </button_1.Button>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(function (f) { return (<button key={f} onClick={function () { return setFilter(f); }} className={"px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ".concat(filter === f ? 'bg-gold text-white' : 'bg-surface-elevated text-text-secondary')}>
            {f || 'All'}
          </button>); })}
      </div>

      {filtered.length === 0 ? (<div className="text-center py-16 text-text-tertiary">
          <lucide_react_1.MessageSquare size={40} className="mx-auto mb-3 opacity-30"/>
          <p className="text-sm">No feedback tickets</p>
        </div>) : (<>
          <div className="space-y-2">
            {filtered.map(function (ticket) {
                var _a, _b;
                return (<card_1.Card key={ticket.id}>
              <card_1.CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-text-primary truncate">{ticket.subject}</span>
                      <status_badge_1.StatusBadge status={ticket.status}/>
                    </div>
                    <p className="text-xs text-text-tertiary flex items-center gap-1">
                      <lucide_react_1.User size={10}/> {(_a = ticket.customer) === null || _a === void 0 ? void 0 : _a.name}
                      {((_b = ticket.customer) === null || _b === void 0 ? void 0 : _b.phone) && " \u00B7 ".concat(ticket.customer.phone)}
                    </p>
                  </div>
                </div>
                {ticket.body && (<p className="text-sm text-text-secondary mt-2 bg-surface-base rounded-xl p-3">{ticket.body}</p>)}
                {ticket.resolution && (<div className="mt-2 bg-success-muted rounded-xl p-3">
                    <p className="text-xs font-medium text-success">Resolution:</p>
                    <p className="text-sm text-success mt-0.5">{ticket.resolution}</p>
                  </div>)}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-subtle">
                  <span className="text-xs text-text-tertiary">
                    {new Date(ticket.createdAt).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {ticket.status !== 'RESOLVED' && (<button_1.Button size="sm" onClick={function () { setShowResolve(ticket.id); setResolveText(''); }}>
                      <lucide_react_1.CheckCircle size={14}/> Resolve
                    </button_1.Button>)}
                </div>
              </card_1.CardContent>
            </card_1.Card>);
            })}
        </div>
        <pagination_1.PaginationControls page={page} limit={limit} onPageChange={setPage} onLimitChange={function (value) { setLimit(value); setPage(0); }} hasMore={tickets.length === limit}/>
      </>)}

      {/* New Ticket Modal */}
      {showNew && (<div className="fixed inset-0 bg-white/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface-raised rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">New Feedback Ticket</h2>
              <button onClick={function () { return setShowNew(false); }} className="text-text-tertiary hover:text-text-secondary p-1">
                <lucide_react_1.X size={20}/>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <select value={newCustomerId} onChange={function (e) { return setNewCustomerId(e.target.value); }} required className="w-full px-4 py-3 rounded-2xl border border-border-default bg-surface-raised text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none">
                <option value="">Select customer...</option>
                {customers.map(function (c) { return (<option key={c.id} value={c.id}>
                    {c.name}{c.phone ? " (".concat(c.phone, ")") : ''}{c.loyaltyPoints != null ? " \u2014 ".concat(c.loyaltyPoints, " pts") : ''}
                  </option>); })}
              </select>
              <input type="text" value={newSubject} onChange={function (e) { return setNewSubject(e.target.value); }} required placeholder="Subject *" className="w-full px-4 py-3 rounded-2xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none"/>
              <textarea value={newBody} onChange={function (e) { return setNewBody(e.target.value); }} placeholder="Details (optional)" rows={3} className="w-full px-4 py-3 rounded-2xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none resize-none"/>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={function () { return setShowNew(false); }} className="flex-1 py-3 rounded-xl bg-surface-elevated text-text-secondary font-semibold text-sm">Cancel</button>
                <button_1.Button type="submit" loading={saving} className="flex-1">Submit</button_1.Button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Resolve Modal */}
      {showResolve && (<div className="fixed inset-0 bg-white/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface-raised rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Resolve Ticket</h2>
            <textarea autoFocus value={resolveText} onChange={function (e) { return setResolveText(e.target.value); }} placeholder="What was the resolution?" rows={3} className="w-full px-4 py-3 rounded-2xl border border-border-default text-sm text-text-primary focus:border-gold focus:ring-2 focus:ring-gold outline-none resize-none"/>
            <div className="flex gap-2 mt-4">
              <button onClick={function () { return setShowResolve(null); }} className="flex-1 py-3 rounded-xl bg-surface-elevated text-text-secondary font-semibold text-sm">Cancel</button>
              <button_1.Button onClick={function () { return handleResolve(showResolve); }} loading={saving} disabled={!resolveText.trim()} className="flex-1">
                <lucide_react_1.CheckCircle size={16}/> Resolve
              </button_1.Button>
            </div>
          </div>
        </div>)}
    </div>);
}
