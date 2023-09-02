"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncMethods = void 0;
const index_1 = require("../index");
let AsyncMethods = class AsyncMethods {
    asyncMethod(body) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    asyncMethodNoExplicitReturn(body) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    promiseReturnMethod(body) {
        return Promise.resolve(true);
    }
    asyncOverride(body) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    promiseOrOtherReturnMethod(body) {
        return Promise.resolve(true);
    }
};
__decorate([
    __param(0, index_1.AssertType(object => { var path = ["body"]; function _string(object) { ; if (typeof object !== "string")
        return { message: "validation failed at " + path.join(".") + ": expected a string", path: path.slice(), reason: { type: "string" } };
    else
        return null; } function _0(object) { ; if (typeof object !== "object" || object === null || Array.isArray(object))
        return { message: "validation failed at " + path.join(".") + ": expected an object", path: path.slice(), reason: { type: "object" } }; {
        if ("test" in object) {
            path.push("test");
            var error = _string(object["test"]);
            path.pop();
            if (error)
                return error;
        }
        else
            return { message: "validation failed at " + path.join(".") + ": expected 'test' in object", path: path.slice(), reason: { type: "missing-property", property: "test" } };
    } return null; } return _0(object); })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AsyncMethods.prototype, "asyncMethod", null);
__decorate([
    __param(0, index_1.AssertType(object => { var path = ["body"]; function _string(object) { ; if (typeof object !== "string")
        return { message: "validation failed at " + path.join(".") + ": expected a string", path: path.slice(), reason: { type: "string" } };
    else
        return null; } function _0(object) { ; if (typeof object !== "object" || object === null || Array.isArray(object))
        return { message: "validation failed at " + path.join(".") + ": expected an object", path: path.slice(), reason: { type: "object" } }; {
        if ("test" in object) {
            path.push("test");
            var error = _string(object["test"]);
            path.pop();
            if (error)
                return error;
        }
        else
            return { message: "validation failed at " + path.join(".") + ": expected 'test' in object", path: path.slice(), reason: { type: "missing-property", property: "test" } };
    } return null; } return _0(object); })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AsyncMethods.prototype, "asyncMethodNoExplicitReturn", null);
__decorate([
    __param(0, index_1.AssertType(object => { var path = ["body"]; function _string(object) { ; if (typeof object !== "string")
        return { message: "validation failed at " + path.join(".") + ": expected a string", path: path.slice(), reason: { type: "string" } };
    else
        return null; } function _0(object) { ; if (typeof object !== "object" || object === null || Array.isArray(object))
        return { message: "validation failed at " + path.join(".") + ": expected an object", path: path.slice(), reason: { type: "object" } }; {
        if ("test" in object) {
            path.push("test");
            var error = _string(object["test"]);
            path.pop();
            if (error)
                return error;
        }
        else
            return { message: "validation failed at " + path.join(".") + ": expected 'test' in object", path: path.slice(), reason: { type: "missing-property", property: "test" } };
    } return null; } return _0(object); })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AsyncMethods.prototype, "promiseReturnMethod", null);
__decorate([
    __param(0, index_1.AssertType(object => { var path = ["body"]; function _string(object) { ; if (typeof object !== "string")
        return { message: "validation failed at " + path.join(".") + ": expected a string", path: path.slice(), reason: { type: "string" } };
    else
        return null; } function _0(object) { ; if (typeof object !== "object" || object === null || Array.isArray(object))
        return { message: "validation failed at " + path.join(".") + ": expected an object", path: path.slice(), reason: { type: "object" } }; {
        if ("test" in object) {
            path.push("test");
            var error = _string(object["test"]);
            path.pop();
            if (error)
                return error;
        }
        else
            return { message: "validation failed at " + path.join(".") + ": expected 'test' in object", path: path.slice(), reason: { type: "missing-property", property: "test" } };
    } return null; } return _0(object); }, { async: false })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AsyncMethods.prototype, "asyncOverride", null);
__decorate([
    __param(0, index_1.AssertType(object => { var path = ["body"]; function _string(object) { ; if (typeof object !== "string")
        return { message: "validation failed at " + path.join(".") + ": expected a string", path: path.slice(), reason: { type: "string" } };
    else
        return null; } function _0(object) { ; if (typeof object !== "object" || object === null || Array.isArray(object))
        return { message: "validation failed at " + path.join(".") + ": expected an object", path: path.slice(), reason: { type: "object" } }; {
        if ("test" in object) {
            path.push("test");
            var error = _string(object["test"]);
            path.pop();
            if (error)
                return error;
        }
        else
            return { message: "validation failed at " + path.join(".") + ": expected 'test' in object", path: path.slice(), reason: { type: "missing-property", property: "test" } };
    } return null; } return _0(object); })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AsyncMethods.prototype, "promiseOrOtherReturnMethod", null);
AsyncMethods = __decorate([
    index_1.ValidateClass()
], AsyncMethods);
exports.AsyncMethods = AsyncMethods;
