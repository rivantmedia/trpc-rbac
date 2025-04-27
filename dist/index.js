"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  UserPermissions: () => UserPermissions,
  createPermissionProtectedProcedure: () => createPermissionProtectedProcedure
});
module.exports = __toCommonJS(index_exports);

// src/BitField.ts
var _BitField = class _BitField {
  constructor(bits = 0) {
    this.DefaultBit = 0;
    this.bitfield = this.resolve(bits);
  }
  resolve(bit) {
    if (bit instanceof _BitField) return bit.bitfield;
    if (Array.isArray(bit))
      return bit.map((b) => this.resolve(b)).reduce((a, b) => a | b, 0);
    if (typeof bit === "string") {
      const value = this.constructor.Flags[bit];
      if (value === void 0) throw new Error(`Invalid flag: ${bit}`);
      return value;
    }
    return bit;
  }
  has(flag) {
    const f = this.resolve(flag);
    return (this.bitfield & f) === f;
  }
  add(flag) {
    this.bitfield |= this.resolve(flag);
  }
  remove(flag) {
    this.bitfield &= ~this.resolve(flag);
  }
  valueOf() {
    return this.bitfield;
  }
};
_BitField.Flags = {};
var BitField = _BitField;

// src/UserPermissions.ts
var UserPermissions = class extends BitField {
  constructor() {
    super(...arguments);
    this.DefaultBit = 0;
  }
};

// src/trpc.ts
var import_server = require("@trpc/server");
function createPermissionProtectedProcedure(protectedProcedure, requiredPermission) {
  return protectedProcedure.use(
    async ({ ctx, next }) => {
      const permKeys = await ctx.getUserPermissions();
      const PermsClass = ctx.UserPermissions;
      const hasPerm = new PermsClass(permKeys).has(requiredPermission);
      if (!hasPerm) {
        throw new import_server.TRPCError({
          code: "UNAUTHORIZED",
          message: "Missing required permission"
        });
      }
      return next();
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserPermissions,
  createPermissionProtectedProcedure
});
