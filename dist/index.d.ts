declare class BitField<FLAGS extends string = string> {
    bitfield: number;
    readonly DefaultBit = 0;
    static Flags: Record<string, number>;
    constructor(bits?: BitFieldResolvable<FLAGS>);
    private resolve;
    has(flag: BitFieldResolvable<FLAGS>): boolean;
    add(flag: BitFieldResolvable<FLAGS>): void;
    remove(flag: BitFieldResolvable<FLAGS>): void;
    valueOf(): number;
}
type BitFieldResolvable<FLAG extends string = string> = number | FLAG | BitField<FLAG> | BitFieldResolvable<FLAG>[];

/**
 * Base class for permission sets.
 * Consumers must subclass and define their own `static Flags`.
 *
 *   class MyPerms extends UserPermissions<"READ"|"WRITE"> {
 *     static Flags = { READ: 1<<0, WRITE: 1<<1 } as const;
 *   }
 */
declare abstract class UserPermissions<FLAGS extends string = string> extends BitField<FLAGS> {
    static Flags: Record<string, number>;
    readonly DefaultBit = 0;
}
type PermissionsResolvable<FLAGS extends string> = BitFieldResolvable<FLAGS>;

/**
 * Wraps any authenticated tRPC procedure builder with a permission check.
 *
 * @template TProcedure  The type of your tRPC procedure builder (e.g. `protectedProcedure`).
 * @template FLAGS       The union of string flag keys your UserPermissions subclass defines.
 *
 * @param protectedProcedure  A tRPC procedure builder that already enforces authentication.
 * @param requiredPermission  A key (or bit-combination) from your Permissions.Flags.
 * @returns A new procedure builder which will throw UNAUTHORIZED if the user lacks that permission.
 */
declare function createPermissionProtectedProcedure<TProcedure extends {
    use: (middleware: any) => any;
}, FLAGS extends string>(protectedProcedure: TProcedure, requiredPermission: PermissionsResolvable<FLAGS>): ReturnType<TProcedure["use"]>;

export { type BitFieldResolvable, type PermissionsResolvable, UserPermissions, createPermissionProtectedProcedure };
