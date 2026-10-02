import { describe, expect, it } from 'vitest';
import * as store from '../src/core/store';
import { saleNet } from '../src/core/sales';

const { getDB } = store;
const idOf = (role: string) => getDB().users.find((u) => u.role === role)!.id;

describe('store flows (in-memory storage fallback)', () => {
  it('rejects wrong passwords and locks after 5 attempts', () => {
    const id = idOf('deputy');
    for (let i = 0; i < 4; i++) expect(store.login(id, 'nope').ok).toBe(false);
    const fifth = store.login(id, 'nope');
    expect(fifth.ok).toBe(false);
    const locked = store.login(id, '222222');
    expect(locked.ok).toBe(false);
  });

  it('cashier: forced password change, shift, checkout, change returned', () => {
    const id = getDB().users.find((u) => u.id === 'u-cashier-1')!.id;
    const res = store.login(id, '333333');
    expect(res).toEqual({ ok: true, mustChange: true });
    expect(() => store.changeOwnPassword('333333', '333333')).toThrow();
    store.changeOwnPassword('333333', 'cash-9988');
    expect(store.currentUser()!.mustChangePassword).toBe(false);

    const p = getDB().products.find((x) => x.stock > 3)!;
    expect(() => store.checkout({ lines: [{ productId: p.id, qty: 1 }], discount: 0, pointsRedeem: 0, customerId: null, consultantId: null, payments: [{ method: 'cash', amount: p.price }] })).toThrow(/شیفت/);
    store.openShift(1_000_000);

    // discount over the 10% cashier limit is refused
    expect(() =>
      store.checkout({ lines: [{ productId: p.id, qty: 1 }], discount: p.price * 0.5, pointsRedeem: 0, customerId: null, consultantId: null, payments: [{ method: 'card', amount: p.price }] }),
    ).toThrow(/سقف تخفیف/);

    const before = p.stock;
    const sale = store.checkout({ lines: [{ productId: p.id, qty: 2 }], discount: 0, pointsRedeem: 0, customerId: 'c-1', consultantId: 'u-cons-1', payments: [{ method: 'cash', amount: p.price * 2 + 50_000 }] });
    expect(sale.payments[0].amount).toBe(p.price * 2);
    expect(getDB().products.find((x) => x.id === p.id)!.stock).toBe(before - 2);
    expect(sale.pointsEarned).toBeGreaterThan(0);

    // cashiers cannot refund
    expect(() => store.refundSale(sale.id, [{ productId: p.id, qty: 1 }], '')).toThrow(/مجوز/);

    const shift = store.openShiftOf(getDB(), id)!;
    expect(store.expectedCash(getDB(), shift)).toBe(1_000_000 + p.price * 2);
    store.closeShift(1_000_000 + p.price * 2, '');
    expect(getDB().shifts.find((s) => s.id === shift.id)!.closedAt).not.toBeNull();
    store.logout();
    expect(store.currentUser()).toBeNull();
  });

  it('manager: refunds restock and respect remaining quantity', () => {
    store.login(idOf('manager'), '111111');
    const s = getDB().sales.find((x) => x.refunds.length === 0 && x.items[0].qty >= 1)!;
    const pid = s.items[0].productId;
    const stock = getDB().products.find((p) => p.id === pid)!.stock;
    store.refundSale(s.id, [{ productId: pid, qty: 1 }], 'test');
    const after = getDB().sales.find((x) => x.id === s.id)!;
    expect(saleNet(after)).toBeLessThan(after.total);
    expect(getDB().products.find((p) => p.id === pid)!.stock).toBe(stock + 1);
    expect(() => store.refundSale(s.id, [{ productId: pid, qty: s.items[0].qty }], '')).toThrow();
    // manager cannot touch the license or create an owner
    expect(() => store.renewLicense('yearly')).toThrow();
    expect(() => store.saveUser({ name: 'x', role: 'owner', active: true, monthlyTarget: 0, commissionPct: 0, password: 'abcdef' })).toThrow();
    store.saveUser({ name: 'صندوقدار ۳', role: 'cashier', active: true, monthlyTarget: 0, commissionPct: 0, password: 'abcdef' });
    expect(getDB().users.some((u) => u.name === 'صندوقدار ۳' && u.mustChangePassword)).toBe(true);
    store.logout();
  });

  it('consultant: holds a cart for the cashier queue but cannot sell', () => {
    store.login('u-cons-2', '444444');
    const p = getDB().products[0];
    expect(() => store.checkout({ lines: [{ productId: p.id, qty: 1 }], discount: 0, pointsRedeem: 0, customerId: null, consultantId: null, payments: [] })).toThrow(/مجوز/);
    store.holdCart({ label: 'پرو ۲', customerId: null, items: [{ productId: p.id, qty: 1 }] });
    expect(getDB().heldCarts.length).toBe(1);
    store.logout();
  });

  it('owner: license renewal, backup round-trip and clean start', () => {
    store.login('u-owner', 'fjcod1405');
    const exp = getDB().license.expiresAt;
    store.renewLicense('monthly');
    expect(getDB().license.expiresAt).toBeGreaterThan(exp);
    const json = store.exportBackup();
    expect(() => store.importBackup('{"bad":1}')).toThrow();
    store.startClean();
    expect(getDB().sales.length).toBe(0);
    store.importBackup(json);
    expect(getDB().sales.length).toBeGreaterThan(0);
    expect(store.currentUser()?.role).toBe('owner');
    expect(store.licenseState(getDB()).state).toBe('active');
  });
});
