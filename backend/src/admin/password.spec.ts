import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const stored = await hashPassword('hana1234');
    expect(stored).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    await expect(verifyPassword('hana1234', stored)).resolves.toBe(true);
    await expect(verifyPassword('hana12345', stored)).resolves.toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('rejects malformed stored values', async () => {
    await expect(verifyPassword('x', 'plain-text')).resolves.toBe(false);
  });
});
