"use strict";
/**
 * @wizard/api-client
 * TypeScript client library for HMS API with Five-Step Wizard integration
 *
 * @version 1.0.0
 * @author HMS Team
 * @license MIT
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WizardApiClient = exports.hmsApiClient = exports.createHmsApiClient = exports.ItemsApiClient = exports.AuthApiClient = exports.BaseApiClient = void 0;
// Core API clients
var api_client_1 = require("./api-client");
Object.defineProperty(exports, "BaseApiClient", { enumerable: true, get: function () { return api_client_1.BaseApiClient; } });
Object.defineProperty(exports, "AuthApiClient", { enumerable: true, get: function () { return api_client_1.AuthApiClient; } });
Object.defineProperty(exports, "ItemsApiClient", { enumerable: true, get: function () { return api_client_1.ItemsApiClient; } });
var hms_api_client_1 = require("./api/hms-api-client");
Object.defineProperty(exports, "createHmsApiClient", { enumerable: true, get: function () { return hms_api_client_1.createHmsApiClient; } });
Object.defineProperty(exports, "hmsApiClient", { enumerable: true, get: function () { return hms_api_client_1.hmsApiClient; } });
var wizard_api_client_1 = require("./api/wizard-api-client");
Object.defineProperty(exports, "WizardApiClient", { enumerable: true, get: function () { return wizard_api_client_1.WizardApiClient; } });
// API utilities and error handling
__exportStar(require("./api/error-handling"), exports);
// Core utilities (excluding React hooks and examples with errors)
__exportStar(require("./examples/programs-example"), exports);
__exportStar(require("./examples/items-example"), exports);
__exportStar(require("./examples/auth-example"), exports);
__exportStar(require("./examples/chat-example"), exports);
//# sourceMappingURL=index.js.map