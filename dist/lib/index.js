"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
exports.search = exports.find = exports.count = exports.parseTerms = exports.parseSort = exports.parseFilter = exports.parseLimit = exports.operators = exports.operatorMap = exports.formatValue = exports.formatData = void 0;
var arangojs_1 = require("arangojs");
/** Format scalar or scalar array data for use in AQL. */
var formatData = function (data) {
    return data instanceof Array ? "[".concat(data.map(exports.formatValue).join(','), "]") : (0, exports.formatValue)(data);
};
exports.formatData = formatData;
/** Format scalar data for use in AQL. */
var formatValue = function (data) {
    if (typeof data === 'string')
        return "\"".concat(data, "\"");
    if (data === null)
        return 'null';
    return "".concat(data);
};
exports.formatValue = formatValue;
/** Map of search operator properties to AQL equivalents. */
exports.operatorMap = {
    eq: '==',
    gt: '>',
    gte: '>=',
    "in": 'IN',
    like: 'LIKE',
    lt: '<',
    lte: '<=',
    neq: '!=',
    nin: 'NOT IN',
    nlike: 'NOT LIKE',
    nreg: '!~',
    reg: '=~'
};
/** Search operators. */
exports.operators = Object.keys(exports.operatorMap);
/**
 * Parse a search limit to a string AQL limit.
 *
 * Note: `LIMIT` is not prepended.
 */
var parseLimit = function (l) { return l.length > 1 ? "".concat(l[0], ", ").concat(l[1]) : l[0]; };
exports.parseLimit = parseLimit;
/**
 * Parse a search filter to a string of AQL filters.
 *
 * Note: `FILTER` is not prepended.
 */
var parseFilter = function (param, search) { return parseFilterOps(search)
    .map(function (_a) {
    var op = _a[0], data = _a[1];
    return "".concat(param, " ").concat(op, " ").concat((0, exports.formatData)(data));
})
    .join(" ".concat(search.mode || 'AND', " ")); };
exports.parseFilter = parseFilter;
/** Parse search parameter object to FILTER statement(s). */
var parseFilterOps = function (search) {
    return Object.keys(search).map(function (key) {
        if (key === 'mode' || search[key] === undefined)
            return undefined;
        if (exports.operatorMap[key] === undefined)
            throw new Error('unrecognised search operator');
        return [exports.operatorMap[key], search[key]];
    }).filter(Boolean);
};
/**
 * Parse query sort(s) to an array of string AQL sorts.
 *
 * Note: `SORT` is not prepended.
 */
var parseSort = function (s, parent) {
    if (s[0] instanceof Array)
        return s.map(function (ss) { return "".concat(renderSortKey(ss, parent), " ").concat(ss[1]); });
    return ["".concat(parent, ".").concat(String(s[0]), " ").concat(s[1])];
};
exports.parseSort = parseSort;
/**
 * Parse search terms to a flat array of search filters.
 * The `parent` argument refers to the current document, and is prefixed to each filter.
 */
var parseTerms = function (s, parent) { return Object.keys(s)
    .reduce(function (filters, param) {
    var f = s[param];
    if (!f)
        return filters;
    if (Object.keys(f).find(function (k) { return k !== 'mode' && !exports.operators.includes(k); })) {
        // object is nested
        filters.push.apply(filters, (0, exports.parseTerms)(f, "".concat(parent, ".").concat(String(param))));
    }
    else {
        // object resembles a search parameter
        filters.push((0, exports.parseFilter)("".concat(parent, ".").concat(String(param)), f));
    }
    return filters;
}, []); };
exports.parseTerms = parseTerms;
var renderSortKey = function (_a, parent) {
    var key = _a[0];
    if (key instanceof Object)
        return key.toAQL();
    return "".concat(parent, ".").concat(String(key));
};
/**
 * Build and execute a count query that matches documents in a single collection.
 * Returns the total number of matches.
 *
 * This example resembles the generated AQL query:
 *
 * ```aql
 * FOR {i} IN {c} {FILTER ...} COLLECT WITH COUNT INTO {n} RETURN {n}
 * ```
 */
var count = function (db, c, i, n) {
    if (i === void 0) { i = 'i'; }
    if (n === void 0) { n = 'n'; }
    return function (terms, inject) { return __awaiter(void 0, void 0, void 0, function () {
        var filters, filterStr, l, countQuery;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filters = terms && (0, exports.parseTerms)(terms, i);
                    filterStr = arangojs_1.aql.literal(filters ? filters.map(function (f) { return "FILTER ".concat(f); }).join(' ') : '');
                    l = { i: arangojs_1.aql.literal(i), n: arangojs_1.aql.literal(n) };
                    countQuery = (0, arangojs_1.aql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      FOR ", " IN ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        COLLECT WITH COUNT INTO ", "\n        RETURN ", "\n    "], ["\n      FOR ", " IN ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        COLLECT WITH COUNT INTO ", "\n        RETURN ", "\n    "])), l.i, c, (inject === null || inject === void 0 ? void 0 : inject.beforeFilter) && arangojs_1.aql.literal(inject.beforeFilter), filterStr, (inject === null || inject === void 0 ? void 0 : inject.beforeSort) && arangojs_1.aql.literal(inject.beforeSort), (inject === null || inject === void 0 ? void 0 : inject.beforeLimit) && arangojs_1.aql.literal(inject.beforeLimit), (inject === null || inject === void 0 ? void 0 : inject.after) && arangojs_1.aql.literal(inject.after), l.n, l.n);
                    return [4 /*yield*/, db.query(countQuery)];
                case 1: return [4 /*yield*/, (_a.sent()).next()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    }); };
};
exports.count = count;
/**
 * Build and execute a find query that returns the first matching document in a single collection.
 *
 * This example resembles the generated AQL query:
 *
 * ```aql
 * FOR {i} IN {collection} {FILTER ...} {SORT ...} LIMIT 1 RETURN {i}
 * ```
 */
var find = function (db, c, i) {
    if (i === void 0) { i = 'i'; }
    return function (terms, sort, inject) {
        if (sort === void 0) { sort = ['_key', 'ASC']; }
        return __awaiter(void 0, void 0, void 0, function () {
            var filters, filterStr, sortStr, l, query, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filters = terms && (0, exports.parseTerms)(terms, 'i');
                        filterStr = arangojs_1.aql.literal(filters ? filters.map(function (f) { return "FILTER ".concat(f); }).join(' ') : '');
                        sortStr = arangojs_1.aql.literal(sort ? "SORT ".concat((0, exports.parseSort)(sort, 'i').join(', ')) : '');
                        l = { i: arangojs_1.aql.literal(i) };
                        query = (0, arangojs_1.aql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      FOR ", " IN ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        LIMIT 1\n        RETURN ", "\n    "], ["\n      FOR ", " IN ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        LIMIT 1\n        RETURN ", "\n    "])), l.i, c, (inject === null || inject === void 0 ? void 0 : inject.beforeFilter) && arangojs_1.aql.literal(inject.beforeFilter), filterStr, (inject === null || inject === void 0 ? void 0 : inject.beforeSort) && arangojs_1.aql.literal(inject.beforeSort), sortStr, (inject === null || inject === void 0 ? void 0 : inject.beforeLimit) && arangojs_1.aql.literal(inject.beforeLimit), (inject === null || inject === void 0 ? void 0 : inject.after) && arangojs_1.aql.literal(inject.after), l.i);
                        return [4 /*yield*/, db.query(query)];
                    case 1: return [4 /*yield*/, (_a.sent()).next()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data];
                }
            });
        });
    };
};
exports.find = find;
/**
 * Build and execute a search query across a single collection.
 * Returns a `SearchResult` tuple containing the total number of matches (ignoring limit), all matching documents
 * (respecting limit), and the AQL query.
 *
 * This example resembles the generated AQL query:
 *
 * ```aql
 * FOR {i} IN {collection} {FILTER ...} {SORT ...} {LIMIT ...} RETURN {i}
 * ```
 */
var search = function (db, c, i, n) {
    if (i === void 0) { i = 'i'; }
    if (n === void 0) { n = 'n'; }
    return function (terms, limit, sort, inject) {
        if (sort === void 0) { sort = ['_rev', 'ASC']; }
        return __awaiter(void 0, void 0, void 0, function () {
            var filters, filterStr, limitStr, sortStr, l, count, countQuery, query, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filters = terms && (0, exports.parseTerms)(terms, 'i');
                        filterStr = arangojs_1.aql.literal(filters ? filters.map(function (f) { return "FILTER ".concat(f); }).join(' ') : '');
                        limitStr = arangojs_1.aql.literal(limit ? "LIMIT ".concat((0, exports.parseLimit)(limit)) : '');
                        sortStr = arangojs_1.aql.literal(sort ? "SORT ".concat((0, exports.parseSort)(sort, 'i').join(', ')) : '');
                        l = { i: arangojs_1.aql.literal(i), n: arangojs_1.aql.literal(n) };
                        count = 0;
                        if (!limit) return [3 /*break*/, 3];
                        countQuery = (0, arangojs_1.aql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n        FOR ", " IN ", "\n          ", "\n          ", "\n          ", "\n          ", "\n          ", "\n          COLLECT WITH COUNT INTO ", "\n          RETURN ", "\n      "], ["\n        FOR ", " IN ", "\n          ", "\n          ", "\n          ", "\n          ", "\n          ", "\n          COLLECT WITH COUNT INTO ", "\n          RETURN ", "\n      "])), l.i, c, (inject === null || inject === void 0 ? void 0 : inject.beforeFilter) && arangojs_1.aql.literal(inject.beforeFilter), filterStr, (inject === null || inject === void 0 ? void 0 : inject.beforeSort) && arangojs_1.aql.literal(inject.beforeSort), (inject === null || inject === void 0 ? void 0 : inject.beforeLimit) && arangojs_1.aql.literal(inject.beforeLimit), (inject === null || inject === void 0 ? void 0 : inject.after) && arangojs_1.aql.literal(inject.after), l.n, l.n);
                        return [4 /*yield*/, db.query(countQuery)];
                    case 1: return [4 /*yield*/, (_a.sent()).next()];
                    case 2:
                        count = _a.sent();
                        _a.label = 3;
                    case 3:
                        query = (0, arangojs_1.aql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n      FOR ", " IN ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        RETURN ", "\n    "], ["\n      FOR ", " IN ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        ", "\n        RETURN ", "\n    "])), l.i, c, (inject === null || inject === void 0 ? void 0 : inject.beforeFilter) && arangojs_1.aql.literal(inject.beforeFilter), filterStr, (inject === null || inject === void 0 ? void 0 : inject.beforeSort) && arangojs_1.aql.literal(inject.beforeSort), sortStr, (inject === null || inject === void 0 ? void 0 : inject.beforeLimit) && arangojs_1.aql.literal(inject.beforeLimit), limitStr, (inject === null || inject === void 0 ? void 0 : inject.after) && arangojs_1.aql.literal(inject.after), l.i);
                        return [4 /*yield*/, db.query(query)];
                    case 4: return [4 /*yield*/, (_a.sent()).all()];
                    case 5:
                        data = _a.sent();
                        if (data.length > count)
                            count = data.length;
                        return [2 /*return*/, [count, data, query]];
                }
            });
        });
    };
};
exports.search = search;
exports["default"] = {
    count: exports.count,
    find: exports.find,
    formatData: exports.formatData,
    formatValue: exports.formatValue,
    operatorMap: exports.operatorMap,
    operators: exports.operators,
    parseFilter: exports.parseFilter,
    parseLimit: exports.parseLimit,
    parseSort: exports.parseSort,
    parseTerms: exports.parseTerms,
    search: exports.search
};
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
