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
import { TRPCError } from "@trpc/server";
function createPermissionProtectedProcedure(protectedProcedure, requiredPermission) {
  return protectedProcedure.use(
    async ({ ctx, next }) => {
      const permKeys = await ctx.getUserPermissions();
      const PermsClass = ctx.UserPermissions;
      const hasPerm = new PermsClass(permKeys).has(requiredPermission);
      if (!hasPerm) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Missing required permission"
        });
      }
      return next();
    }
  );
}
export {
  UserPermissions,
  createPermissionProtectedProcedure
};
