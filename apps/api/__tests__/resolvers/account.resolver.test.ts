import { describe, it, expect, beforeEach } from "vitest";
import { AccountResolver } from "../../src/resolvers/mutation/AccountResolver";
import { InMemoryAccountRepository } from "./helpers/InMemoryAccountRepository";

describe("Resolver: Account", () => {
  let repo: InMemoryAccountRepository;
  let resolver: AccountResolver;

  beforeEach(() => {
    repo = new InMemoryAccountRepository();
    resolver = new AccountResolver(repo);
  });

  describe("Mutation: registerPlayer", () => {
    it("should create an account and return a usable token", async () => {
      const auth = await resolver.registerPlayer({
        displayName: "FunkMaster",
        password: "groove123",
      });

      expect(auth.displayName).toBe("FunkMaster");
      expect(auth.playerId).toBeDefined();
      expect(auth.token).toBeDefined();

      const resolved = await repo.resolveToken(auth.token);
      expect(resolved?.playerId).toBe(auth.playerId);
    });

    it("should reject a name that is already taken", async () => {
      await resolver.registerPlayer({ displayName: "Groover", password: "abcd1234" });

      await expect(
        resolver.registerPlayer({ displayName: "Groover", password: "different" }),
      ).rejects.toThrow(/already taken/i);
    });

    it("should reject a name that is already taken regardless of case", async () => {
      await resolver.registerPlayer({ displayName: "Groover", password: "abcd1234" });

      await expect(
        resolver.registerPlayer({ displayName: "GROOVER", password: "different" }),
      ).rejects.toThrow(/already taken/i);
    });

    it("should reject a password that is too short", async () => {
      await expect(
        resolver.registerPlayer({ displayName: "ShortPass", password: "ab" }),
      ).rejects.toThrow(/password/i);
    });

    it("should reject a name that is too short", async () => {
      await expect(
        resolver.registerPlayer({ displayName: "A", password: "abcd1234" }),
      ).rejects.toThrow(/name/i);
    });
  });

  describe("Mutation: loginPlayer", () => {
    it("should return a fresh token for correct credentials", async () => {
      await resolver.registerPlayer({ displayName: "Encore", password: "supersecret" });

      const auth = await resolver.loginPlayer({
        displayName: "Encore",
        password: "supersecret",
      });

      expect(auth.displayName).toBe("Encore");
      const resolved = await repo.resolveToken(auth.token);
      expect(resolved?.displayName).toBe("Encore");
    });

    it("should reject an unknown display name", async () => {
      await expect(
        resolver.loginPlayer({ displayName: "Ghost", password: "whatever" }),
      ).rejects.toThrow(/invalid name or password/i);
    });

    it("should reject an incorrect password", async () => {
      await resolver.registerPlayer({ displayName: "Locked", password: "correct-horse" });

      await expect(
        resolver.loginPlayer({ displayName: "Locked", password: "wrong-password" }),
      ).rejects.toThrow(/invalid name or password/i);
    });
  });
});
